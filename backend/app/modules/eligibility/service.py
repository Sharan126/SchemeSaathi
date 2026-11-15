"""Eligibility Evaluation Service

Provides high-performance, deterministic evaluation of multiple schemes
against a citizen profile, and computes dynamic questionnaire steps.
"""

from typing import Any, Dict, List, Set, Optional
from pydantic import BaseModel, Field
from app.modules.eligibility.ast_evaluator import (
    ASTEvaluator,
    CriterionEvaluation,
    EligibilityResult,
    format_explanation,
)


class CitizenProfileInput(BaseModel):
    # Demographics
    age: int | None = None
    gender: str | None = None  # "male", "female", "transgender"
    state: str | None = None
    residence_area: str | None = None  # "rural", "urban"
    social_category: str | None = None  # "GEN", "SC", "ST", "OBC", "EWS"
    
    # Financial & Livelihood
    occupation: str | None = None  # "farmer", "student", "unemployed", "self_employed", "worker", "senior_citizen"
    annual_income_inr: float | None = None
    is_bpl_card_holder: bool | None = None
    is_tax_payer: bool | None = None
    
    # Specific Domain Attributes
    landholding_hectares: float | None = None
    is_pregnant_or_lactating: bool | None = None
    is_disabled: bool | None = None
    disability_percentage: float | None = None
    student_class_or_course: str | None = None  # "matric", "post_matric", "higher_education"
    has_pucca_house: bool | None = None

    model_config = {"extra": "allow"}  # Allow arbitrary extra fields for custom scheme rules


class BatchEvaluationResponse(BaseModel):
    eligible_schemes: List[EligibilityResult] = Field(default_factory=list)
    potentially_eligible_schemes: List[EligibilityResult] = Field(default_factory=list)
    ineligible_schemes: List[EligibilityResult] = Field(default_factory=list)
    recommended_next_questions: List[str] = Field(default_factory=list)


class EligibilityService:
    @staticmethod
    def evaluate_scheme(
        scheme_id: str,
        scheme_title: Dict[str, str],
        criteria_list: List[Dict[str, Any]],
        profile_dict: Dict[str, Any],
        scheme_slug: Optional[str] = None
    ) -> EligibilityResult:
        """Evaluates a single scheme deterministically against the citizen profile."""
        passed = []
        failed = []
        missing = []
        missing_fields: Set[str] = set()

        for c in criteria_list:
            c_id = c.get("id", "c-0")
            field_name = c.get("field_name", "unknown")
            ast = c.get("rule_ast", {})
            template = c.get("explanation", {"en": f"Rule for {field_name}"})
            
            # Identify required profile fields
            needed = ASTEvaluator.extract_required_fields(ast)
            
            res, is_missing = ASTEvaluator.evaluate_node(ast, profile_dict)
            citizen_val = profile_dict.get(field_name)

            expl = format_explanation(template, citizen_val, passed=bool(res), is_missing=is_missing)
            eval_item = CriterionEvaluation(
                criterion_id=c_id,
                field_name=field_name,
                passed=bool(res) and not is_missing,
                is_missing=is_missing,
                citizen_value=citizen_val,
                rule_summary=str(ast),
                explanation=expl
            )

            if is_missing:
                missing.append(eval_item)
                missing_fields.update(needed)
            elif res is True:
                passed.append(eval_item)
            else:
                failed.append(eval_item)

        # Determine overall scheme status
        if failed:
            status = "INELIGIBLE"
            is_eligible = False
            summary = {
                "en": f"Did not meet {len(failed)} required criteria.",
                "hi": f"{len(failed)} आवश्यक शर्तें पूरी नहीं हुईं।",
                "kn": f"{len(failed)} ಅಗತ್ಯ ಷರತ್ತುಗಳನ್ನು ಪೂರೈಸಲಾಗಿಲ್ಲ."
            }
        elif missing:
            status = "NEEDS_MORE_INFO"
            is_eligible = False
            summary = {
                "en": f"Please answer {len(missing_fields)} more question(s) to verify eligibility.",
                "hi": f"पात्रता की पुष्टि के लिए कृपया {len(missing_fields)} और प्रश्नों के उत्तर दें।",
                "kn": f"ಅರ್ಹತೆಯನ್ನು ದೃಢೀಕರಿಸಲು ದಯವಿಟ್ಟು {len(missing_fields)} ಹೆಚ್ಚಿನ ಪ್ರಶ್ನೆಗಳಿಗೆ ಉತ್ತರಿಸಿ."
            }
        else:
            status = "ELIGIBLE"
            is_eligible = True
            summary = {
                "en": "All eligibility criteria successfully satisfied!",
                "hi": "सभी पात्रता शर्तें सफलतापूर्वक पूरी हुईं!",
                "kn": "ಎಲ್ಲಾ ಅರ್ಹತಾ ಷರತ್ತುಗಳು ಯಶಸ್ವಿಯಾಗಿ ಪೂರೈಸಲ್ಪಟ್ಟಿವೆ!"
            }

        return EligibilityResult(
            scheme_id=scheme_id,
            scheme_slug=scheme_slug,
            scheme_title=scheme_title,
            status=status,
            is_eligible=is_eligible,
            confidence_score=1.0,
            passed_criteria=passed,
            failed_criteria=failed,
            missing_criteria=missing,
            required_missing_fields=sorted(list(missing_fields)),
            summary_explanation=summary
        )

    @classmethod
    def evaluate_all(
        cls,
        schemes_with_criteria: List[Dict[str, Any]],
        profile: CitizenProfileInput
    ) -> BatchEvaluationResponse:
        """Evaluates all published schemes and categorizes them."""
        profile_dict = profile.model_dump(exclude_unset=False, exclude_none=True)
        response = BatchEvaluationResponse()
        missing_fields_freq: Dict[str, int] = {}

        for s in schemes_with_criteria:
            res = cls.evaluate_scheme(
                scheme_id=s["id"],
                scheme_title=s["title"],
                criteria_list=s["criteria"],
                profile_dict=profile_dict,
                scheme_slug=s.get("slug")
            )

            if res.status == "ELIGIBLE":
                response.eligible_schemes.append(res)
            elif res.status == "NEEDS_MORE_INFO":
                response.potentially_eligible_schemes.append(res)
                for f in res.required_missing_fields:
                    missing_fields_freq[f] = missing_fields_freq.get(f, 0) + 1
            else:
                response.ineligible_schemes.append(res)

        # Sort missing fields by frequency to prioritize highest-impact wizard questions
        sorted_fields = [k for k, _ in sorted(missing_fields_freq.items(), key=lambda x: x[1], reverse=True)]
        response.recommended_next_questions = sorted_fields[:5]
        return response
