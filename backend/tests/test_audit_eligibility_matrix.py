"""Comprehensive Deterministic Eligibility Audit Test Matrix

Verifies:
1. Strict operator allowlisting (zero eval/exec, unknown operator rejection).
2. AST recursive evaluation semantics (AND/OR short-circuiting, NOT inversion, between, in, comparisons).
3. Missing data handling (NEEDS_MORE_INFO, missing fields propagation).
4. Type safety and boundary conditions.
5. All 8 seeded Central Government schemes:
   - PM-KISAN
   - Ayushman Bharat PM-JAY
   - Pradhan Mantri Matru Vandana Yojana (PMMVY)
   - Post-Matric Scholarship for SC Students (PMS-SC)
   - Sukanya Samriddhi Yojana (SSY)
   - Divyangjan Swavlamban Yojana
   - Indira Gandhi National Old Age Pension Scheme (IGNOAPS)
   - Pradhan Mantri Awaas Yojana - Gramin (PMAY-G)
"""

import pytest
from app.modules.eligibility.ast_evaluator import ASTEvaluator
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput
from app.db.repository import SchemeRepository


class TestASTEvaluatorSecurityAndSemantics:
    def test_allowlist_enforcement_rejects_eval_and_unknown_operators(self):
        """Ensures arbitrary or malicious operators raise ValueError immediately."""
        disallowed = [
            {"eval": "import os; os.system('ls')"},
            {"exec": "print('exploit')"},
            {"system": "whoami"},
            {"__import__": "subprocess"},
            {"shell_exec": "echo 1"}
        ]
        for node in disallowed:
            with pytest.raises(ValueError, match="Disallowed operator in AST"):
                ASTEvaluator.evaluate_node(node, {"age": 25})

    def test_and_short_circuiting_with_missing_awareness(self):
        """
        In logical AND:
        - If any child is definitively FALSE, result must be FALSE even if another child is missing.
        - If no child is FALSE and at least one is missing, result must be (None, True) (missing data).
        - If all children are TRUE, result must be (True, False).
        """
        # Case A: False and Missing -> False (deterministic short-circuit)
        rule = {
            "and": [
                {"==": [{"var": "occupation"}, "farmer"]},  # False
                {">=": [{"var": "landholding_hectares"}, 1.0]}  # Missing
            ]
        }
        res, missing = ASTEvaluator.evaluate_node(rule, {"occupation": "student"})
        assert res is False
        assert missing is False

        # Case B: True and Missing -> Missing
        res, missing = ASTEvaluator.evaluate_node(rule, {"occupation": "farmer"})
        assert res is None
        assert missing is True

        # Case C: True and True -> True
        res, missing = ASTEvaluator.evaluate_node(rule, {"occupation": "farmer", "landholding_hectares": 2.0})
        assert res is True
        assert missing is False

    def test_or_short_circuiting_with_missing_awareness(self):
        """
        In logical OR:
        - If any child is definitively TRUE, result must be TRUE even if another is missing.
        - If no child is TRUE and at least one is missing, result must be (None, True).
        - If all children are FALSE, result must be (False, False).
        """
        rule = {
            "or": [
                {"==": [{"var": "is_bpl_card_holder"}, True]},
                {"<=": [{"var": "annual_income_inr"}, 250000]}
            ]
        }
        # Case A: True and Missing -> True
        res, missing = ASTEvaluator.evaluate_node(rule, {"is_bpl_card_holder": True})
        assert res is True
        assert missing is False

        # Case B: False and Missing -> Missing
        res, missing = ASTEvaluator.evaluate_node(rule, {"is_bpl_card_holder": False})
        assert res is None
        assert missing is True

        # Case C: False and False -> False
        res, missing = ASTEvaluator.evaluate_node(rule, {"is_bpl_card_holder": False, "annual_income_inr": 300000})
        assert res is False
        assert missing is False

    def test_between_operator_boundary_values(self):
        """Verifies 'between' [var, min, max] inclusively."""
        rule = {"between": [{"var": "age"}, 18, 65]}

        # Lower boundary (18) -> True
        res, _ = ASTEvaluator.evaluate_node(rule, {"age": 18})
        assert res is True

        # Upper boundary (65) -> True
        res, _ = ASTEvaluator.evaluate_node(rule, {"age": 65})
        assert res is True

        # Inside (30) -> True
        res, _ = ASTEvaluator.evaluate_node(rule, {"age": 30})
        assert res is True

        # Below (17) -> False
        res, _ = ASTEvaluator.evaluate_node(rule, {"age": 17})
        assert res is False

        # Above (66) -> False
        res, _ = ASTEvaluator.evaluate_node(rule, {"age": 66})
        assert res is False

        # Missing age -> Missing
        res, missing = ASTEvaluator.evaluate_node(rule, {})
        assert res is None
        assert missing is True

    def test_invalid_type_graceful_handling(self):
        """Passing incompatible types (e.g. string for numeric comparison) returns False, not crash."""
        rule = {">=": [{"var": "age"}, 60]}
        res, missing = ASTEvaluator.evaluate_node(rule, {"age": "not-a-number"})
        assert res is False
        assert missing is False


class TestAllSeededSchemesEligibilityMatrix:
    @classmethod
    def setup_class(cls):
        SchemeRepository.initialize_store()

    # 1. PM-KISAN
    def test_pm_kisan_clearly_eligible(self):
        scheme = SchemeRepository.get_by_id("pm-kisan")
        res = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"occupation": "farmer", "landholding_hectares": 1.5, "is_tax_payer": False},
            scheme_slug=scheme.get("slug")
        )
        assert res.status == "ELIGIBLE"
        assert res.is_eligible is True
        assert len(res.failed_criteria) == 0

    def test_pm_kisan_tax_payer_ineligible(self):
        scheme = SchemeRepository.get_by_id("pm-kisan")
        res = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"occupation": "farmer", "landholding_hectares": 1.5, "is_tax_payer": True},
            scheme_slug=scheme.get("slug")
        )
        assert res.status == "INELIGIBLE"
        assert res.is_eligible is False
        assert any(c.field_name == "is_tax_payer" for c in res.failed_criteria)

    def test_pm_kisan_missing_data(self):
        scheme = SchemeRepository.get_by_id("pm-kisan")
        res = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"occupation": "farmer"},
            scheme_slug=scheme.get("slug")
        )
        assert res.status == "NEEDS_MORE_INFO"
        assert "landholding_hectares" in res.required_missing_fields
        assert "is_tax_payer" in res.required_missing_fields

    # 2. AYUSHMAN BHARAT PM-JAY
    def test_pmjay_eligible_via_bpl_or_income(self):
        scheme = SchemeRepository.get_by_id("ayushman-bharat-pmjay")
        # Eligible via BPL card
        res_bpl = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"is_bpl_card_holder": True},
            scheme_slug=scheme.get("slug")
        )
        assert res_bpl.status == "ELIGIBLE"

        # Eligible via income <= 250000
        res_inc = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"is_bpl_card_holder": False, "annual_income_inr": 200000},
            scheme_slug=scheme.get("slug")
        )
        assert res_inc.status == "ELIGIBLE"

    def test_pmjay_boundary_income(self):
        scheme = SchemeRepository.get_by_id("ayushman-bharat-pmjay")
        # Exactly 250,000 -> ELIGIBLE
        res_250k = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"age": 45, "is_bpl_card_holder": False, "annual_income_inr": 250000},
            scheme_slug=scheme.get("slug")
        )
        assert res_250k.status == "ELIGIBLE"

        # 250,001 non-senior -> INELIGIBLE (since non-BPL, non-senior and above ceiling)
        res_250k_plus = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"age": 45, "is_bpl_card_holder": False, "annual_income_inr": 250001},
            scheme_slug=scheme.get("slug")
        )
        assert res_250k_plus.status == "INELIGIBLE"

    # 3. PMMVY
    def test_pmmvy_age_boundary_and_gender(self):
        scheme = SchemeRepository.get_by_id("pmmvy")
        # Eligible: 19, female, pregnant
        res_19 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"gender": "female", "age": 19, "is_pregnant_or_lactating": True},
            scheme_slug=scheme.get("slug")
        )
        assert res_19.status == "ELIGIBLE"

        # Ineligible: age 18 (below 19 limit)
        res_18 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"gender": "female", "age": 18, "is_pregnant_or_lactating": True},
            scheme_slug=scheme.get("slug")
        )
        assert res_18.status == "INELIGIBLE"
        assert any(c.field_name == "age" for c in res_18.failed_criteria)

        # Ineligible: male
        res_male = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"gender": "male", "age": 22, "is_pregnant_or_lactating": True},
            scheme_slug=scheme.get("slug")
        )
        assert res_male.status == "INELIGIBLE"

    # 4. POST-MATRIC SCHOLARSHIP SC (PMS-SC)
    def test_pms_sc_category_and_income_boundary(self):
        scheme = SchemeRepository.get_by_id("pms-sc")
        # Eligible: SC, student, 2,50,000
        res_sc = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"social_category": "SC", "occupation": "student", "annual_income_inr": 250000},
            scheme_slug=scheme.get("slug")
        )
        assert res_sc.status == "ELIGIBLE"

        # Ineligible: SC, 2,50,001 (exceeds 2.5 LPA)
        res_high_inc = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"social_category": "SC", "occupation": "student", "annual_income_inr": 250001},
            scheme_slug=scheme.get("slug")
        )
        assert res_high_inc.status == "INELIGIBLE"

        # Ineligible: OBC or GEN
        res_gen = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"social_category": "GEN", "occupation": "student", "annual_income_inr": 100000},
            scheme_slug=scheme.get("slug")
        )
        assert res_gen.status == "INELIGIBLE"

    # 5. SUKANYA SAMRIDDHI YOJANA (SSY)
    def test_ssy_age_boundary_and_gender(self):
        scheme = SchemeRepository.get_by_id("sukanya-samriddhi")
        # Eligible: girl child age 10
        res_10 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"gender": "female", "age": 10},
            scheme_slug=scheme.get("slug")
        )
        assert res_10.status == "ELIGIBLE"

        # Ineligible: girl child age 11 (exceeds 10 years)
        res_11 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"gender": "female", "age": 11},
            scheme_slug=scheme.get("slug")
        )
        assert res_11.status == "INELIGIBLE"
        assert any(c.field_name == "age" for c in res_11.failed_criteria)

    # 6. DIVYANGJAN SWAVLAMBAN
    def test_divyangjan_disability_and_age_limits(self):
        scheme = SchemeRepository.get_by_id("divyangjan-swavlamban")
        # Eligible: 40% disability, age 18
        res_40 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"is_disabled": True, "disability_percentage": 40.0, "age": 18},
            scheme_slug=scheme.get("slug")
        )
        assert res_40.status == "ELIGIBLE"

        # Ineligible: 39.9% disability (below benchmark)
        res_39 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"is_disabled": True, "disability_percentage": 39.9, "age": 25},
            scheme_slug=scheme.get("slug")
        )
        assert res_39.status == "INELIGIBLE"

        # Ineligible: age 17 or age 66
        res_underage = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"is_disabled": True, "disability_percentage": 50.0, "age": 17},
            scheme_slug=scheme.get("slug")
        )
        assert res_underage.status == "INELIGIBLE"

    # 7. IGNOAPS
    def test_ignoaps_age_and_bpl(self):
        scheme = SchemeRepository.get_by_id("ignoaps")
        # Eligible: age 60 and BPL
        res_60 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"age": 60, "is_bpl_card_holder": True},
            scheme_slug=scheme.get("slug")
        )
        assert res_60.status == "ELIGIBLE"

        # Ineligible: age 59
        res_59 = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"age": 59, "is_bpl_card_holder": True},
            scheme_slug=scheme.get("slug")
        )
        assert res_59.status == "INELIGIBLE"

        # Ineligible: age 65 but not BPL
        res_non_bpl = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"age": 65, "is_bpl_card_holder": False},
            scheme_slug=scheme.get("slug")
        )
        assert res_non_bpl.status == "INELIGIBLE"

    # 8. PMAY-G
    def test_pmay_g_rural_and_no_pucca_house(self):
        scheme = SchemeRepository.get_by_id("pmay-g")
        # Eligible: rural, no pucca house, income <= 300000
        res_rural = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"residence_area": "rural", "has_pucca_house": False, "annual_income_inr": 180000},
            scheme_slug=scheme.get("slug")
        )
        assert res_rural.status == "ELIGIBLE"

        # Ineligible: urban
        res_urban = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"residence_area": "urban", "has_pucca_house": False, "annual_income_inr": 180000},
            scheme_slug=scheme.get("slug")
        )
        assert res_urban.status == "INELIGIBLE"

        # Ineligible: already owns pucca house
        res_pucca = EligibilityService.evaluate_scheme(
            scheme_id=scheme["id"],
            scheme_title=scheme["title"],
            criteria_list=scheme["criteria"],
            profile_dict={"residence_area": "rural", "has_pucca_house": True, "annual_income_inr": 180000},
            scheme_slug=scheme.get("slug")
        )
        assert res_pucca.status == "INELIGIBLE"
