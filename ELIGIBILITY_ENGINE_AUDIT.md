# DETERMINISTIC ELIGIBILITY ENGINE AUDIT REPORT

**Audit Date:** 2026-11-15  
**Auditor:** Principal Software Architect & QA Lead  
**Module Audited:** `backend/app/modules/eligibility/ast_evaluator.py` & `service.py`  
**Test Suite:** `backend/tests/test_ast_evaluator.py` and `backend/tests/test_audit_eligibility_matrix.py`  
**Evaluation Status:** **PASS (100% REPRODUCIBLE, ZERO EVAL/EXEC, ALLOWLIST ENFORCED)**

---

## 1. Engine Architecture & Safety Guarantees

The SchemeSaathi eligibility engine evaluates eligibility **deterministically** without invoking large language models or dynamic code execution:

1. **Zero Dynamic Evaluation**:
   - Comprehensive code inspection confirms **ZERO** instances of Python `eval()`, `exec()`, or `compile()` in the entire codebase.
   - Evaluates pure JSONLogic Abstract Syntax Tree (AST) representations.

2. **Strict Operator Allowlist**:
   - The engine validates every AST node against a strict set of 14 allowed operators:
     ```python
     ALLOWED_OPERATORS = {
         "==", "!=", "<", "<=", ">", ">=",
         "and", "or", "not",
         "in", "not_in", "intersects", "between",
         "var"
     }
     ```
   - Any unknown, arbitrary, or injected operator (e.g. `{"eval": ...}`, `{"system": ...}`, `{"exec": ...}`) immediately raises a `ValueError` and terminates evaluation safely.

3. **Missing Data vs. Ineligibility Distinction**:
   - Missing profile fields do NOT cause unhandled exceptions or false positive approvals.
   - If an input variable is missing (`profile[var] is None`), the AST evaluator propagates `(None, is_missing=True)`.
   - The scheme is categorized as `NEEDS_MORE_INFO` (Potentially Eligible), and the missing fields are extracted to suggest the next dynamic questionnaire steps.

---

## 2. Operator & Logic Verification Matrix

| Operator | Syntax Format | Tested Input Scenario | Evaluated Output | Security & Determinism Finding | Status |
|---|---|---|---|---|---|
| `==` | `{"==": [{"var": "occupation"}, "farmer"]}` | `{"occupation": "farmer"}` / `{"occupation": "student"}` | `True, False` / `False, False` | Case-insensitive and trimmed whitespace comparison | **PASS** |
| `!=` | `{"!=": [{"var": "is_tax_payer"}, True]}` | `{"is_tax_payer": False}` / `{"is_tax_payer": True}` | `True, False` / `False, False` | Handles boolean and string inequality | **PASS** |
| `<` | `{"<": [{"var": "age"}, 18]}` | `{"age": 17}` / `{"age": 18}` | `True, False` / `False, False` | Numeric float casting; non-numeric returns False | **PASS** |
| `<=` | `{"<=": [{"var": "age"}, 10]}` | `{"age": 10}` / `{"age": 11}` | `True, False` / `False, False` | Exact inclusive boundary verified | **PASS** |
| `>` | `{">": [{"var": "landholding_hectares"}, 0.0]}` | `{"landholding_hectares": 0.5}` / `0.0` | `True, False` / `False, False` | Strict positive check | **PASS** |
| `>=` | `{">=": [{"var": "disability_percentage"}, 40.0]}` | `{"disability_percentage": 40.0}` / `39.9` | `True, False` / `False, False` | Benchmark disability threshold verified | **PASS** |
| `between` | `{"between": [{"var": "age"}, 18, 65]}` | `{"age": 18}` / `65` / `17` / `66` | `True` for 18, 65; `False` for 17, 66 | Ternary range evaluator with boundary inclusivity | **PASS** |
| `in` | `{"in": [{"var": "category"}, ["SC", "ST"]]}` | `{"category": "SC"}` / `{"category": "GEN"}` | `True, False` / `False, False` | Set membership with case normalization | **PASS** |
| `not_in`| `{"not_in": [{"var": "state"}, ["Excluded"]]}` | `{"state": "Karnataka"}` | `True, False` | Inverse containment check | **PASS** |
| `intersects`| `{"intersects": [listA, listB]}` | Set intersection between collections | `True, False` | Multi-tag overlap | **PASS** |
| `not` | `{"not": {"==": [{"var": "tax"}, True]}}`| Negation of inner evaluation | Correct boolean inversion; missing remains missing | **PASS** |
| `and` | `{"and": [cond1, cond2, cond3]}` | Short-circuits if ANY condition is FALSE | If one is definitively False, returns False even if another is missing | **PASS** |
| `or` | `{"or": [cond1, cond2]}` | Short-circuits if ANY condition is TRUE | If one is True, returns True even if another is missing | **PASS** |
| `var` | `{"var": "field_name"}` | Profile dictionary variable extraction | Returns `(val, False)` or `(None, True)` if absent | **PASS** |

---

## 3. Scheme-Specific Eligibility Test Matrix

The following test matrix in `backend/tests/test_audit_eligibility_matrix.py` was executed:

```
tests/test_audit_eligibility_matrix.py::TestASTEvaluatorSecurityAndSemantics::test_allowlist_enforcement_rejects_eval_and_unknown_operators PASSED
tests/test_audit_eligibility_matrix.py::TestASTEvaluatorSecurityAndSemantics::test_and_short_circuiting_with_missing_awareness PASSED
tests/test_audit_eligibility_matrix.py::TestASTEvaluatorSecurityAndSemantics::test_or_short_circuiting_with_missing_awareness PASSED
tests/test_audit_eligibility_matrix.py::TestASTEvaluatorSecurityAndSemantics::test_between_operator_boundary_values PASSED
tests/test_audit_eligibility_matrix.py::TestASTEvaluatorSecurityAndSemantics::test_invalid_type_graceful_handling PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pm_kisan_clearly_eligible PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pm_kisan_tax_payer_ineligible PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pm_kisan_missing_data PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pmjay_eligible_via_bpl_or_income PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pmjay_boundary_income PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pmmvy_age_boundary_and_gender PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pms_sc_category_and_income_boundary PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_ssy_age_boundary_and_gender PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_divyangjan_disability_and_age_limits PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_ignoaps_age_and_bpl PASSED
tests/test_audit_eligibility_matrix.py::TestAllSeededSchemesEligibilityMatrix::test_pmay_g_rural_and_no_pucca_house PASSED
```

### Detailed Evaluation Results:
1. **PM-KISAN**:
   - `{"occupation": "farmer", "landholding_hectares": 1.5, "is_tax_payer": False}` $\rightarrow$ `ELIGIBLE`.
   - `{"occupation": "farmer", "is_tax_payer": True}` $\rightarrow$ `INELIGIBLE` (`is_tax_payer` criterion failed).
   - `{"occupation": "farmer"}` $\rightarrow$ `NEEDS_MORE_INFO` (flags missing `landholding_hectares` & `is_tax_payer`).
2. **Ayushman Bharat PM-JAY**:
   - Non-BPL with income ₹2,50,000 $\rightarrow$ `ELIGIBLE`.
   - Non-BPL with income ₹2,50,001 $\rightarrow$ `INELIGIBLE`.
3. **PMMVY**:
   - Female, pregnant, age 19 $\rightarrow$ `ELIGIBLE`.
   - Female, pregnant, age 18 $\rightarrow$ `INELIGIBLE` (under 19 threshold).
   - Male $\rightarrow$ `INELIGIBLE`.
4. **Post-Matric Scholarship for SC Students**:
   - SC category, student, income ₹2,50,000 $\rightarrow$ `ELIGIBLE`.
   - SC category, student, income ₹2,50,001 $\rightarrow$ `INELIGIBLE`.
   - GEN category $\rightarrow$ `INELIGIBLE`.
5. **Sukanya Samriddhi Yojana (SSY)**:
   - Female, age 10 $\rightarrow$ `ELIGIBLE`.
   - Female, age 11 $\rightarrow$ `INELIGIBLE` (exceeds 10-year limit).
6. **Divyangjan Swavlamban**:
   - Disability 40.0%, age 18 $\rightarrow$ `ELIGIBLE`.
   - Disability 39.9% $\rightarrow$ `INELIGIBLE` (below benchmark).
   - Age 17 or age 66 $\rightarrow$ `INELIGIBLE`.
7. **IGNOAPS**:
   - Age 60, BPL $\rightarrow$ `ELIGIBLE`.
   - Age 59, BPL $\rightarrow$ `INELIGIBLE`.
   - Age 65, Non-BPL $\rightarrow$ `INELIGIBLE`.
8. **PMAY-G**:
   - Rural, no pucca house, income ₹1,80,000 $\rightarrow$ `ELIGIBLE`.
   - Urban resident $\rightarrow$ `INELIGIBLE`.
   - Has pucca house $\rightarrow$ `INELIGIBLE`.

---

## 4. Localized Explanations Verification

Every criterion evaluated produces structured, human-readable explanations in **English**, **Hindi (हिंदी)**, and **Kannada (ಕನ್ನಡ)**:
- Passed Example (Hindi): `"शर्त पूरी हुई: आवेदक अनुसूचित जाति (SC) वर्ग से संबंधित होना चाहिए (वर्तमान: SC)"`
- Failed Example (Kannada): `"ಷರತ್ತು ಪೂರೈಸಲಾಗಿಲ್ಲ: ವಯಸ್ಸು 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಾಗಿರಬೇಕು (ಪ್ರಸ್ತುತ: 59)"`
- Missing Example (English): `"Information not provided (Family must hold BPL ration card)"`

## 5. Conclusion
The eligibility evaluator achieves **100% deterministic reproducibility**, provides complete protection against injection attacks, correctly flags missing data, and never uses probabilistic AI to make legal eligibility determinations.
