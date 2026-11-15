"""Unit tests for Safe AST Evaluator & Zero-eval verification"""

import pytest
from app.modules.eligibility.ast_evaluator import ASTEvaluator, format_explanation


def test_equality_and_inequality():
    profile = {"occupation": "farmer", "gender": "female"}
    
    # Matching
    node = {"==": [{"var": "occupation"}, "farmer"]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is True
    assert not missing

    # Case insensitivity
    node = {"==": [{"var": "gender"}, "FEMALE"]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is True

    # Inequality
    node = {"!=": [{"var": "occupation"}, "teacher"]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is True


def test_numeric_comparisons():
    profile = {"age": 25, "annual_income_inr": 180000.0, "landholding_hectares": 1.5}

    # Less than or equal
    node = {"<=": [{"var": "landholding_hectares"}, 2.0]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is True

    # Greater than
    node = {">": [{"var": "age"}, 18]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is True

    # Income limit exceeded
    node = {"<=": [{"var": "annual_income_inr"}, 100000.0]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is False


def test_between_operator():
    profile = {"age": 62}
    
    # Senior citizen age range
    node = {"between": [{"var": "age"}, 60, 100]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is True

    profile_young = {"age": 45}
    res, missing = ASTEvaluator.evaluate_node(node, profile_young)
    assert res is False


def test_set_membership_in():
    profile = {"social_category": "SC", "state": "Karnataka"}

    # SC in target groups
    node = {"in": [{"var": "social_category"}, ["SC", "ST"]]}
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is True

    # General category not in
    profile_gen = {"social_category": "GEN"}
    res, missing = ASTEvaluator.evaluate_node(node, profile_gen)
    assert res is False


def test_short_circuit_and_logic_with_missing_field():
    profile = {"is_tax_payer": True}  # Missing 'occupation' and 'landholding_hectares'

    # Scheme requires: occupation == "farmer" AND landholding <= 2.0 AND is_tax_payer == False
    node = {
        "and": [
            {"==": [{"var": "occupation"}, "farmer"]},
            {"<=": [{"var": "landholding_hectares"}, 2.0]},
            {"==": [{"var": "is_tax_payer"}, False]}
        ]
    }

    # Because is_tax_payer is True, {"==": [{"var": "is_tax_payer"}, False]} is definitively False!
    # A citizen who pays income tax is definitively disqualified regardless of missing fields!
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is False
    assert not missing


def test_missing_field_detection():
    profile = {"occupation": "farmer"}  # Missing landholding
    node = {
        "and": [
            {"==": [{"var": "occupation"}, "farmer"]},
            {"<=": [{"var": "landholding_hectares"}, 2.0]}
        ]
    }
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    assert res is None
    assert missing is True


def test_extract_required_fields():
    node = {
        "and": [
            {"==": [{"var": "occupation"}, "farmer"]},
            {"<=": [{"var": "landholding_hectares"}, 2.0]},
            {"in": [{"var": "social_category"}, ["SC", "ST"]]}
        ]
    }
    fields = ASTEvaluator.extract_required_fields(node)
    assert fields == {"occupation", "landholding_hectares", "social_category"}


def test_complex_scheme_rule_and_injection_immunity():
    # Attempting to inject Python code inside variable or value
    malicious_payload = "__import__('os').system('echo hacked')"
    profile = {
        "occupation": malicious_payload,
        "age": 28,
        "gender": "female",
        "annual_income_inr": 120000.0,
        "landholding_hectares": 1.2
    }

    # Scheme rule: female AND farmer AND land <= 2.0
    node = {
        "and": [
            {"==": [{"var": "gender"}, "female"]},
            {"==": [{"var": "occupation"}, "farmer"]},
            {"<=": [{"var": "landholding_hectares"}, 2.0]}
        ]
    }
    
    # Must evaluate safely without executing any injected code
    res, missing = ASTEvaluator.evaluate_node(node, profile)
    # occupation is malicious string, not "farmer", so it's safely False
    assert res is False
    assert missing is False


def test_batch_service_evaluation():
    from app.modules.eligibility.service import EligibilityService, CitizenProfileInput

    schemes = [
        {
            "id": "pm-kisan",
            "title": {"en": "PM-KISAN", "hi": "पीएम-किसान", "kn": "ಪಿಎಂ-ಕಿಸಾನ್"},
            "criteria": [
                {
                    "id": "c1",
                    "field_name": "occupation",
                    "rule_ast": {"==": [{"var": "occupation"}, "farmer"]},
                    "explanation": {"en": "Must be a farmer"}
                },
                {
                    "id": "c2",
                    "field_name": "landholding_hectares",
                    "rule_ast": {"<=": [{"var": "landholding_hectares"}, 2.0]},
                    "explanation": {"en": "Landholding must be <= 2.0 ha"}
                }
            ]
        },
        {
            "id": "senior-pension",
            "title": {"en": "Senior Citizen Pension", "hi": "वृद्धावस्था पेंशन", "kn": "ಹಿರಿಯ ನಾಗರಿಕರ ಪಿಂಚಣಿ"},
            "criteria": [
                {
                    "id": "c3",
                    "field_name": "age",
                    "rule_ast": {">=": [{"var": "age"}, 60]},
                    "explanation": {"en": "Age must be >= 60"}
                }
            ]
        }
    ]

    profile = CitizenProfileInput(occupation="farmer", landholding_hectares=1.5, age=35)
    result = EligibilityService.evaluate_all(schemes, profile)

    assert len(result.eligible_schemes) == 1
    assert result.eligible_schemes[0].scheme_id == "pm-kisan"
    assert len(result.ineligible_schemes) == 1
    assert result.ineligible_schemes[0].scheme_id == "senior-pension"
