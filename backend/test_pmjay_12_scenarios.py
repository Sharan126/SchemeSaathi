"""PM-JAY 70+ Comprehensive Regression Test Suite (12 Scenarios)

Executes and verifies all 12 specified scenarios covering:
- Universal 70+ expansion (irrespective of income)
- Age boundary checks
- Coexistence with private insurance and central government schemes (CGHS/ECHS)
- Missing information vs false rejection
- Historical version immutability (V1 2018 vs V2 2024)
"""

from app.db.repository import SchemeRepository
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput
from app.modules.eligibility.ast_evaluator import ASTEvaluator

def run_pmjay_regression():
    SchemeRepository.initialize_store()
    pmjay_v2 = SchemeRepository.get_by_id("ayushman-bharat-pmjay")
    pmjay_v1 = SchemeRepository.get_version("ayushman-bharat-pmjay", 1)

    assert pmjay_v2 is not None, "PM-JAY V2 must exist in store"
    assert pmjay_v1 is not None, "PM-JAY V1 must exist in store"

    print("=" * 80)
    print("AYUSHMAN BHARAT PM-JAY 70+ EXPANSION REGRESSION AUDIT (12 SCENARIOS)")
    print("=" * 80)

    results = []

    # -------------------------------------------------------------------------
    # Scenario 1: Senior aged 70, non-BPL, high income (Rs 15 Lakhs) -> ELIGIBLE
    # -------------------------------------------------------------------------
    p1 = {"age": 70, "annual_income_inr": 1500000.0, "is_bpl_card_holder": False}
    res1 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p1
    )
    assert res1.is_eligible is True, "Scenario 1 Failed: Senior 70+ must be eligible"
    assert res1.status == "ELIGIBLE"
    results.append(("Scenario 1: Senior aged 70, non-BPL, high income (Rs 15L)", "PASS", "ELIGIBLE"))
    print("[PASS] Scenario 1: Senior aged 70, non-BPL, high income -> ELIGIBLE")

    # -------------------------------------------------------------------------
    # Scenario 2: Senior aged 69, non-BPL, high income (Rs 15 Lakhs) -> INELIGIBLE
    # -------------------------------------------------------------------------
    p2 = {"age": 69, "annual_income_inr": 1500000.0, "is_bpl_card_holder": False}
    res2 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p2
    )
    assert res2.is_eligible is False
    assert res2.status == "INELIGIBLE", "Scenario 2 Failed: Age 69 non-BPL must be ineligible"
    results.append(("Scenario 2: Senior aged 69, non-BPL, high income (Rs 15L)", "PASS", "INELIGIBLE"))
    print("[PASS] Scenario 2: Senior aged 69, non-BPL, high income -> INELIGIBLE")

    # -------------------------------------------------------------------------
    # Scenario 3: Senior aged 75 in existing PM-JAY family -> ELIGIBLE (Top-Up)
    # -------------------------------------------------------------------------
    p3 = {"age": 75, "annual_income_inr": 120000.0, "is_bpl_card_holder": True, "family_already_enrolled_pmjay": True}
    res3 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p3
    )
    assert res3.is_eligible is True
    # Verify benefits description mentions dedicated exclusive Rs 5L top-up
    has_topup_mention = any("top-up" in b.get("amount_description", {}).get("en", "").lower() for b in pmjay_v2.get("benefits", []))
    assert has_topup_mention, "Scheme benefits must mention dedicated Rs 5L top-up"
    results.append(("Scenario 3: Senior aged 75 in existing PM-JAY family", "PASS", "ELIGIBLE (Exclusive Rs 5L top-up)"))
    print("[PASS] Scenario 3: Senior aged 75 in existing PM-JAY family -> ELIGIBLE (Exclusive Rs 5L top-up verified)")

    # -------------------------------------------------------------------------
    # Scenario 4: Senior aged 70 with private health insurance -> ELIGIBLE
    # -------------------------------------------------------------------------
    p4 = {"age": 70, "has_private_health_insurance": True, "annual_income_inr": 800000.0, "is_bpl_card_holder": False}
    res4 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p4
    )
    assert res4.is_eligible is True
    results.append(("Scenario 4: Senior aged 70 with private health insurance", "PASS", "ELIGIBLE (Independent of private insurance)"))
    print("[PASS] Scenario 4: Senior aged 70 with private health insurance -> ELIGIBLE")

    # -------------------------------------------------------------------------
    # Scenario 5: Senior aged 72 with existing CGHS/ECHS -> ELIGIBLE with choice
    # -------------------------------------------------------------------------
    p5 = {"age": 72, "enrolled_in_cghs_or_echs": True, "annual_income_inr": 600000.0, "is_bpl_card_holder": False}
    res5 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p5
    )
    assert res5.is_eligible is True
    # Verify statutory knowledge base specifies migration/retention choice
    chunk_contents = [c["content"] for c in pmjay_v2.get("chunks", []) if c["language"] == "en"]
    assert any("cghs" in c.lower() for c in chunk_contents), "RAG chunks must specify CGHS/ECHS choice of migration"
    results.append(("Scenario 5: Senior aged 72 with CGHS/ECHS", "PASS", "ELIGIBLE (Right to retain or migrate)"))
    print("[PASS] Scenario 5: Senior aged 72 with CGHS/ECHS -> ELIGIBLE (Choice documented)")

    # -------------------------------------------------------------------------
    # Scenario 6: Non-BPL missing age -> NEEDS_MORE_INFO (No false negative)
    # -------------------------------------------------------------------------
    p6 = {"annual_income_inr": 1500000.0, "is_bpl_card_holder": False}  # Age missing
    res6 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p6
    )
    assert res6.status == "NEEDS_MORE_INFO", f"Expected NEEDS_MORE_INFO, got {res6.status}"
    assert "age" in res6.required_missing_fields
    assert res6.is_eligible is False
    results.append(("Scenario 6: Non-BPL missing age", "PASS", "NEEDS_MORE_INFO (Missing 'age' prompted)"))
    print("[PASS] Scenario 6: Non-BPL missing age -> NEEDS_MORE_INFO (No false negative)")

    # -------------------------------------------------------------------------
    # Scenario 7: Senior aged 70 with BPL ration card -> ELIGIBLE (Both grounds)
    # -------------------------------------------------------------------------
    p7 = {"age": 70, "is_bpl_card_holder": True, "annual_income_inr": 60000.0}
    res7 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p7
    )
    assert res7.is_eligible is True
    assert res7.status == "ELIGIBLE"
    results.append(("Scenario 7: Senior aged 70 with BPL ration card", "PASS", "ELIGIBLE (Dual qualification)"))
    print("[PASS] Scenario 7: Senior aged 70 with BPL ration card -> ELIGIBLE (Dual qualification)")

    # -------------------------------------------------------------------------
    # Scenario 8: Senior aged 70, landholding farmer -> ELIGIBLE
    # -------------------------------------------------------------------------
    p8 = {"age": 70, "occupation": "farmer", "landholding_hectares": 4.5, "annual_income_inr": 500000.0, "is_bpl_card_holder": False}
    res8 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p8
    )
    assert res8.is_eligible is True
    results.append(("Scenario 8: Senior aged 70, landholding farmer", "PASS", "ELIGIBLE (Land ownership not disqualifying)"))
    print("[PASS] Scenario 8: Senior aged 70, landholding farmer -> ELIGIBLE")

    # -------------------------------------------------------------------------
    # Scenario 9: Senior aged 80 living alone -> ELIGIBLE
    # -------------------------------------------------------------------------
    p9 = {"age": 80, "household_size": 1, "residence_area": "rural", "is_bpl_card_holder": False, "annual_income_inr": 400000.0}
    res9 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p9
    )
    assert res9.is_eligible is True
    results.append(("Scenario 9: Senior aged 80 living alone", "PASS", "ELIGIBLE (No household size restriction)"))
    print("[PASS] Scenario 9: Senior aged 80 living alone -> ELIGIBLE")

    # -------------------------------------------------------------------------
    # Scenario 10: Incomplete profile with only name/occupation -> NEEDS_MORE_INFO
    # -------------------------------------------------------------------------
    p10 = {"occupation": "senior_citizen"}
    res10 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p10
    )
    assert res10.status == "NEEDS_MORE_INFO"
    assert "age" in res10.required_missing_fields
    assert "is_bpl_card_holder" in res10.required_missing_fields
    results.append(("Scenario 10: Incomplete profile (only occupation)", "PASS", "NEEDS_MORE_INFO"))
    print("[PASS] Scenario 10: Incomplete profile -> NEEDS_MORE_INFO (Prompts required attributes)")

    # -------------------------------------------------------------------------
    # Scenario 11: Historical Reproducibility (Version 1 2018 vs Version 2 2024)
    # -------------------------------------------------------------------------
    affluent_senior = {"age": 72, "annual_income_inr": 1500000.0, "is_bpl_card_holder": False}
    res11_v1 = EligibilityService.evaluate_scheme(
        pmjay_v1["id"], pmjay_v1["title"], pmjay_v1["criteria"], affluent_senior
    )
    res11_v2 = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], affluent_senior
    )
    # Under Version 1 (2018 Baseline), non-BPL with 15L income was INELIGIBLE
    assert res11_v1.is_eligible is False, "Under V1, affluent senior should be INELIGIBLE"
    assert res11_v1.status == "INELIGIBLE"
    # Under Version 2 (2024 Expansion), affluent senior is ELIGIBLE
    assert res11_v2.is_eligible is True, "Under V2, affluent senior must be ELIGIBLE"
    assert res11_v2.status == "ELIGIBLE"
    results.append(("Scenario 11: Historical Reproducibility (V1 2018 vs V2 2024)", "PASS", "V1=INELIGIBLE, V2=ELIGIBLE"))
    print("[PASS] Scenario 11: Historical Reproducibility -> V1 (2018) is INELIGIBLE, V2 (2024) is ELIGIBLE")

    # -------------------------------------------------------------------------
    # Scenario 12: Exact Boundary Age Check (69.9 vs 70.0)
    # -------------------------------------------------------------------------
    p12_under = {"age": 69.99, "annual_income_inr": 1500000.0, "is_bpl_card_holder": False}
    p12_exact = {"age": 70.0, "annual_income_inr": 1500000.0, "is_bpl_card_holder": False}
    
    res12_under = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p12_under
    )
    res12_exact = EligibilityService.evaluate_scheme(
        pmjay_v2["id"], pmjay_v2["title"], pmjay_v2["criteria"], p12_exact
    )
    assert res12_under.is_eligible is False, "Age < 70 must be ineligible when non-BPL"
    assert res12_exact.is_eligible is True, "Age >= 70 must be eligible"
    results.append(("Scenario 12: Boundary age check (69.99 vs 70.0)", "PASS", "69.99=INELIGIBLE, 70.0=ELIGIBLE"))
    print("[PASS] Scenario 12: Boundary age check -> 69.99 is INELIGIBLE, 70.0 is ELIGIBLE")

    print("\n" + "=" * 80)
    print("ALL 12 PM-JAY REGRESSION SCENARIOS PASSED WITH ZERO ERRORS.")
    print("=" * 80)

if __name__ == "__main__":
    run_pmjay_regression()
