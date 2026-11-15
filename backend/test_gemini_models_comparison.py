"""Live Real-API Gemini Model Comparison & Circuit Breaker Verification

Tests:
1. gemini-3.5-flash (with thinkingBudget 0)
2. gemini-3.8-flash
3. gemini-2.5-flash-lite
4. gemini-flash-lite-latest (3.5-flash-lite)
5. Outage handling & Circuit Breaker Trip Verification
"""

import time
import httpx
from app.core.config import settings
from app.modules.rag.gemini_client import GeminiClient, mask_key

MODELS_TO_COMPARE = [
    ("gemini-3.5-flash", "Gemini 3.5 Flash (thinkingBudget 0)"),
    ("gemini-3.8-flash", "Gemini 3.8 Flash"),
    ("gemini-2.5-flash-lite", "Gemini 2.5 Flash-Lite"),
    ("gemini-flash-lite-latest", "Gemini Flash-Lite Latest (3.5-flash-lite)")
]

TEST_PROMPT = "In exactly 15 words, state the primary objective of PM-KISAN."

def run_gemini_comparison():
    print("=" * 80)
    print("SCHEMESAATHI LIVE GEMINI MODEL COMPARISON & RESILIENCE AUDIT")
    print(f"API Key: {mask_key(settings.LLM_API_KEY)}")
    print("=" * 80)

    results = []

    for model_id, display_name in MODELS_TO_COMPARE:
        print(f"\nEvaluating: {display_name} ({model_id})...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_id}:generateContent?key={settings.LLM_API_KEY}"
        payload = {
            "contents": [{"parts": [{"text": TEST_PROMPT}]}],
            "generationConfig": {
                "temperature": 0.0,
                "maxOutputTokens": 60,
                "thinkingConfig": {"thinkingBudget": 0}
            }
        }
        
        t0 = time.perf_counter()
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(url, json=payload)
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            
            status = resp.status_code
            if status == 200:
                data = resp.json()
                text = data.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "").strip()
                tokens = data.get("usageMetadata", {}).get("totalTokenCount", 0)
                model_ver = data.get("modelVersion", model_id)
                results.append((display_name, model_id, "PASS (HTTP 200)", f"{elapsed_ms:.1f}ms", text[:60] + "...", tokens, model_ver))
                print(f"  [PASS] Status: 200 | Latency: {elapsed_ms:.1f}ms | Resolved Model: {model_ver} | Tokens: {tokens}")
                print(f"         Output: \"{text}\"")
            else:
                err_data = resp.json().get("error", {})
                err_msg = err_data.get("message", "Error")[:80]
                results.append((display_name, model_id, f"FAIL (HTTP {status})", f"{elapsed_ms:.1f}ms", err_msg, 0, "N/A"))
                print(f"  [FAIL] Status: {status} | Latency: {elapsed_ms:.1f}ms | Error: {err_msg}")
        except Exception as e:
            elapsed_ms = (time.perf_counter() - t0) * 1000.0
            results.append((display_name, model_id, "ERROR (Timeout/Conn)", f"{elapsed_ms:.1f}ms", str(e)[:80], 0, "N/A"))
            print(f"  [ERROR] {str(e)[:80]} ({elapsed_ms:.1f}ms)")

    # -------------------------------------------------------------------------
    # Circuit Breaker Verification
    # -------------------------------------------------------------------------
    print("\n--- TESTING CIRCUIT BREAKER BEHAVIOUR ---")
    bad_client = GeminiClient(model="non-existent-model-xyz", timeout=2.0, max_retries=1)
    
    # Trigger consecutive failures
    print("Simulating 3 consecutive provider failures...")
    for i in range(3):
        res = bad_client.generate("Test prompt")
        assert res is None, f"Expected None on bad model, got {res}"
        print(f"  Failure {i+1} handled (consecutive_failures={GeminiClient._consecutive_failures})")

    # Verify circuit is now OPEN
    assert GeminiClient.is_circuit_open() is True, "Circuit breaker MUST be OPEN after 3 consecutive failures!"
    print(f"  [PASS] Circuit breaker TRIPPED OPEN. Cooldown active until timestamp: {GeminiClient._circuit_open_until}")

    # Verify fast-fail under open circuit
    t_fast_fail = time.perf_counter()
    fast_fail_result = bad_client.generate("Another query")
    t_fast_fail_ms = (time.perf_counter() - t_fast_fail) * 1000.0
    assert fast_fail_result is None
    assert t_fast_fail_ms < 10.0, f"Open circuit must fast-fail in < 10ms, took {t_fast_fail_ms:.2f}ms"
    print(f"  [PASS] Open circuit fast-failed in {t_fast_fail_ms:.2f}ms (< 10ms) without network calls")

    # Reset circuit breaker for production usage
    GeminiClient.record_success()
    assert GeminiClient.is_circuit_open() is False
    print("  [PASS] Circuit breaker successfully reset to CLOSED")

    print("\n" + "=" * 80)
    print("GEMINI MODEL COMPARISON SUMMARY MATRIX")
    print("=" * 80)
    print(f"{'Model Display Name':<32} | {'Status':<18} | {'Latency':<10} | {'Tokens':<8}")
    print("-" * 80)
    for name, mid, status_str, lat, out, toks, ver in results:
        print(f"{name:<32} | {status_str:<18} | {lat:<10} | {toks:<8}")
    print("=" * 80)

if __name__ == "__main__":
    run_gemini_comparison()
