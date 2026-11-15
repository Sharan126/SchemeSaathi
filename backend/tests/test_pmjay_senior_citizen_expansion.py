"""Ayushman Bharat PM-JAY Senior Citizen (70+) Expansion & Versioning Tests

Tests:
1. Senior citizen aged 70 with no BPL status and high income -> ELIGIBLE under V2.
2. Senior citizen aged 69 with no BPL status and high income -> INELIGIBLE under V2.
3. Senior citizen aged 75 in an already covered family -> ELIGIBLE under V2.
4. Senior citizen aged 70 with private health insurance -> ELIGIBLE under V2.
5. Missing date-of-birth/age information -> NEEDS_MORE_INFO under V2.
6. Conflicting or incomplete eligibility information handling.
7. Historical reproducibility: Version 1 (2018) vs Version 2 (October 2024 Vaya Vandana).
"""

import pytest
from app.db.repository import SchemeRepository
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput


class TestPMJAYSeniorCitizenExpansion:
    @classmethod
    def setup_class(cls):
        SchemeRepository.initialize_store()
        cls.scheme_v2 = SchemeRepository.get_by_id("ayushman-bharat-pmjay")
        cls.scheme_v1 = SchemeRepository.get_version("ayushman-bharat-pmjay", 1)

    # 1. Senior citizen aged 70 with no BPL status
    def test_senior_citizen_aged_70_non_bpl_eligible_v2(self):
        profile = {
            "age": 70,
            "is_bpl_card_holder": False,
            "annual_income_inr": 1200000.0,
            "has_pucca_house": True
        }
        res = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v2["id"],
            scheme_title=self.scheme_v2["title"],
            criteria_list=self.scheme_v2["criteria"],
            profile_dict=profile,
            scheme_slug=self.scheme_v2.get("slug")
        )
        assert res.status == "ELIGIBLE"
        assert res.is_eligible is True
        assert len(res.failed_criteria) == 0

    # 2. Senior citizen aged 69 with no BPL status and high income -> INELIGIBLE
    def test_senior_citizen_aged_69_non_bpl_ineligible_v2(self):
        profile = {
            "age": 69,
            "is_bpl_card_holder": False,
            "annual_income_inr": 500000.0
        }
        res = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v2["id"],
            scheme_title=self.scheme_v2["title"],
            criteria_list=self.scheme_v2["criteria"],
            profile_dict=profile,
            scheme_slug=self.scheme_v2.get("slug")
        )
        assert res.status == "INELIGIBLE"
        assert res.is_eligible is False
        assert len(res.failed_criteria) > 0

    # 3. Senior citizen aged 75 in an already covered family
    def test_senior_citizen_aged_75_covered_family_v2(self):
        profile = {
            "age": 75,
            "is_bpl_card_holder": True,
            "annual_income_inr": 100000.0
        }
        res = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v2["id"],
            scheme_title=self.scheme_v2["title"],
            criteria_list=self.scheme_v2["criteria"],
            profile_dict=profile,
            scheme_slug=self.scheme_v2.get("slug")
        )
        assert res.status == "ELIGIBLE"
        assert res.is_eligible is True

    # 4. Senior citizen aged 70 with private health insurance
    def test_senior_citizen_aged_70_with_private_insurance_v2(self):
        # Under NHA guidelines, private insurance does NOT disqualify senior citizens 70+
        profile = {
            "age": 70,
            "is_bpl_card_holder": False,
            "annual_income_inr": 800000.0,
            "has_private_insurance": True
        }
        res = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v2["id"],
            scheme_title=self.scheme_v2["title"],
            criteria_list=self.scheme_v2["criteria"],
            profile_dict=profile,
            scheme_slug=self.scheme_v2.get("slug")
        )
        assert res.status == "ELIGIBLE"
        assert res.is_eligible is True

    # 5. Missing date-of-birth / age information
    def test_missing_age_and_non_bpl_returns_needs_more_info(self):
        # Missing age and non-BPL with high income -> Needs age to know if 70+
        profile = {
            "is_bpl_card_holder": False,
            "annual_income_inr": 600000.0
        }
        res = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v2["id"],
            scheme_title=self.scheme_v2["title"],
            criteria_list=self.scheme_v2["criteria"],
            profile_dict=profile,
            scheme_slug=self.scheme_v2.get("slug")
        )
        assert res.status == "NEEDS_MORE_INFO"
        assert "age" in res.required_missing_fields

    # 6. Conflicting or incomplete eligibility information
    def test_incomplete_profile_clean_handling(self):
        # Empty profile
        res = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v2["id"],
            scheme_title=self.scheme_v2["title"],
            criteria_list=self.scheme_v2["criteria"],
            profile_dict={},
            scheme_slug=self.scheme_v2.get("slug")
        )
        assert res.status == "NEEDS_MORE_INFO"
        assert len(res.required_missing_fields) > 0

    # 7. Historical Version 1 vs Version 2 reproducibility
    def test_historical_version_1_vs_version_2_reproducibility(self):
        assert self.scheme_v1 is not None
        assert self.scheme_v1["version_number"] == 1
        assert self.scheme_v2["version_number"] == 2

        profile_senior_wealthy = {
            "age": 72,
            "is_bpl_card_holder": False,
            "annual_income_inr": 900000.0
        }

        # Under Version 1 (2018 rules): INELIGIBLE (no 70+ rule existed, non-BPL, income > 2.5L)
        res_v1 = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v1["id"],
            scheme_title=self.scheme_v1["title"],
            criteria_list=self.scheme_v1["criteria"],
            profile_dict=profile_senior_wealthy,
            scheme_slug=self.scheme_v1.get("slug")
        )
        assert res_v1.status == "INELIGIBLE"
        assert res_v1.is_eligible is False

        # Under Version 2 (2024 rules): ELIGIBLE (universal 70+ Ayushman Vaya Vandana rule)
        res_v2 = EligibilityService.evaluate_scheme(
            scheme_id=self.scheme_v2["id"],
            scheme_title=self.scheme_v2["title"],
            criteria_list=self.scheme_v2["criteria"],
            profile_dict=profile_senior_wealthy,
            scheme_slug=self.scheme_v2.get("slug")
        )
        assert res_v2.status == "ELIGIBLE"
        assert res_v2.is_eligible is True
