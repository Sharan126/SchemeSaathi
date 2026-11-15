"""Deterministic AST / JSONLogic Eligibility Evaluator

STRICT GUARDRAILS:
- ZERO Python eval() or exec() usage.
- Strict allowlist of operators and recursive AST node processing.
- Handles missing fields gracefully with 'NEEDS_MORE_INFO' status.
- Multilingual explanations for pass/fail/missing criteria.
"""

from typing import Any, Dict, List, Optional, Set, Tuple
from pydantic import BaseModel, Field


class CriterionEvaluation(BaseModel):
    criterion_id: str
    field_name: str
    passed: bool
    is_missing: bool = False
    citizen_value: Any = None
    rule_summary: str
    explanation: Dict[str, str]  # Localized: en, hi, kn


class EligibilityResult(BaseModel):
    scheme_id: str
    scheme_slug: Optional[str] = None
    scheme_title: Dict[str, str]
    status: str  # "ELIGIBLE" | "INELIGIBLE" | "NEEDS_MORE_INFO"
    is_eligible: bool
    confidence_score: float = 1.0  # Deterministic logic = 1.0
    passed_criteria: List[CriterionEvaluation] = Field(default_factory=list)
    failed_criteria: List[CriterionEvaluation] = Field(default_factory=list)
    missing_criteria: List[CriterionEvaluation] = Field(default_factory=list)
    required_missing_fields: List[str] = Field(default_factory=list)
    summary_explanation: Dict[str, str] = Field(default_factory=dict)


class ASTEvaluator:
    """Safe, non-eval Abstract Syntax Tree rule evaluator."""

    ALLOWED_OPERATORS = {
        "==", "!=", "<", "<=", ">", ">=",
        "and", "or", "not",
        "in", "not_in", "intersects", "between",
        "var"
    }

    @classmethod
    def extract_required_fields(cls, node: Any) -> Set[str]:
        """Inspects an AST node recursively to find all required citizen profile fields."""
        fields = set()
        if not isinstance(node, dict):
            return fields

        for op, args in node.items():
            if op == "var":
                if isinstance(args, str):
                    fields.add(args)
                elif isinstance(args, list) and args:
                    fields.add(args[0])
            elif isinstance(args, list):
                for child in args:
                    fields.update(cls.extract_required_fields(child))
            elif isinstance(args, dict):
                fields.update(cls.extract_required_fields(args))
        return fields

    @classmethod
    def evaluate_node(cls, node: Any, profile: Dict[str, Any]) -> Tuple[Optional[Any], bool]:
        """
        Recursively evaluates an AST rule node.
        Returns: (result: Optional[Any], is_missing_data: bool)
        If a variable is not provided in profile, is_missing_data is True and result is None.
        """
        # Primitive literals (strings, ints, floats, booleans, lists)
        if not isinstance(node, dict):
            return node, False

        # Extract operator and arguments
        keys = list(node.keys())
        if len(keys) != 1:
            raise ValueError(f"Malformed AST rule node with multiple operators: {keys}")

        op = keys[0]
        if op not in cls.ALLOWED_OPERATORS:
            raise ValueError(f"Disallowed operator in AST: '{op}'. Only allowlisted operators permitted.")

        args = node[op]

        # Variable resolution
        if op == "var":
            var_name = args if isinstance(args, str) else args[0]
            if var_name not in profile or profile[var_name] is None:
                return None, True
            return profile[var_name], False

        # Unary NOT
        if op == "not":
            val, missing = cls.evaluate_node(args, profile)
            if missing:
                return None, True
            return not bool(val), False

        # Logical AND (short-circuiting with missing awareness)
        if op == "and":
            if not isinstance(args, list):
                args = [args]
            has_missing = False
            for child in args:
                res, missing = cls.evaluate_node(child, profile)
                if missing:
                    has_missing = True
                elif res is False:
                    # Deterministic short-circuit: if any condition is definitively FALSE, overall AND is FALSE
                    return False, False
            if has_missing:
                return None, True
            return True, False

        # Logical OR
        if op == "or":
            if not isinstance(args, list):
                args = [args]
            has_missing = False
            for child in args:
                res, missing = cls.evaluate_node(child, profile)
                if missing:
                    has_missing = True
                elif res is True:
                    # Deterministic short-circuit: if any branch is TRUE, overall OR is TRUE
                    return True, False
            if has_missing:
                return None, True
            return False, False

        # Binary/Ternary comparison operators
        if not isinstance(args, list) or len(args) < 2:
            raise ValueError(f"Operator '{op}' requires at least 2 arguments, got {args}")

        left_node, right_node = args[0], args[1]
        left_val, left_missing = cls.evaluate_node(left_node, profile)
        right_val, right_missing = cls.evaluate_node(right_node, profile)

        if left_missing or right_missing:
            return None, True

        # Numeric comparisons
        if op in ("<", "<=", ">", ">="):
            try:
                l_num = float(left_val)
                r_num = float(right_val)
            except (ValueError, TypeError):
                return False, False

            if op == "<":
                return l_num < r_num, False
            if op == "<=":
                return l_num <= r_num, False
            if op == ">":
                return l_num > r_num, False
            if op == ">=":
                return l_num >= r_num, False

        # Equality
        if op == "==":
            if isinstance(left_val, str) and isinstance(right_val, str):
                return left_val.strip().lower() == right_val.strip().lower(), False
            return left_val == right_val, False

        if op == "!=":
            if isinstance(left_val, str) and isinstance(right_val, str):
                return left_val.strip().lower() != right_val.strip().lower(), False
            return left_val != right_val, False

        # Set / Array operations
        if op == "in":
            # Check if left_val in right_val collection
            if isinstance(right_val, (list, set, tuple)):
                if isinstance(left_val, str):
                    clean_set = {str(x).strip().lower() for x in right_val}
                    return left_val.strip().lower() in clean_set, False
                return left_val in right_val, False
            if isinstance(right_val, str) and isinstance(left_val, str):
                return left_val.lower() in right_val.lower(), False
            return False, False

        if op == "not_in":
            res, _ = cls.evaluate_node({"in": [left_node, right_node]}, profile)
            return not res, False

        if op == "intersects":
            # Set intersection between two lists
            l_set = set(left_val) if isinstance(left_val, list) else {left_val}
            r_set = set(right_val) if isinstance(right_val, list) else {right_val}
            return bool(l_set.intersection(r_set)), False

        if op == "between":
            # Ternary: between [var, min_val, max_val]
            if len(args) != 3:
                raise ValueError("Operator 'between' requires 3 arguments: [var, min, max]")
            min_val, min_missing = cls.evaluate_node(args[1], profile)
            max_val, max_missing = cls.evaluate_node(args[2], profile)
            if min_missing or max_missing:
                return None, True
            try:
                l_num = float(left_val)
                return float(min_val) <= l_num <= float(max_val), False
            except (ValueError, TypeError):
                return False, False

        raise NotImplementedError(f"Unsupported operator in AST: {op}")


def format_explanation(
    template: Dict[str, str],
    citizen_value: Any,
    passed: bool,
    is_missing: bool
) -> Dict[str, str]:
    """Generates localized explanations for passed, failed, or missing criteria."""
    explanations = {}
    for lang, text in template.items():
        if is_missing:
            if lang == "hi":
                explanations[lang] = f"यह जानकारी दर्ज नहीं की गई है ({text})"
            elif lang == "kn":
                explanations[lang] = f"ಈ ಮಾಹಿತಿಯನ್ನು ನಮೂದಿಸಿಲ್ಲ ({text})"
            else:
                explanations[lang] = f"Information not provided ({text})"
        elif passed:
            if lang == "hi":
                explanations[lang] = f"शर्त पूरी हुई: {text} (वर्तमान: {citizen_value})"
            elif lang == "kn":
                explanations[lang] = f"ಷರತ್ತು ಪೂರೈಸಲಾಗಿದೆ: {text} (ಪ್ರಸ್ತುತ: {citizen_value})"
            else:
                explanations[lang] = f"Criterion satisfied: {text} (Provided: {citizen_value})"
        else:
            if lang == "hi":
                explanations[lang] = f"शर्त पूरी नहीं हुई: {text} (वर्तमान: {citizen_value})"
            elif lang == "kn":
                explanations[lang] = f"ಷರತ್ತು ಪೂರೈಸಲಾಗಿಲ್ಲ: {text} (ಪ್ರಸ್ತುತ: {citizen_value})"
            else:
                explanations[lang] = f"Criterion not met: {text} (Provided: {citizen_value})"
    return explanations
