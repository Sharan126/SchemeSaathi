"""Component-Level Performance and Latency Breakdown Suite

Empirically benchmarks:
1. Frontend TTFB (Homepage)
2. Catalogue Keyword & Category Filtering
3. Deterministic AST Eligibility Evaluation
4. Multilingual Vector & Lexical Hybrid Retrieval
5. Live Gemini 3.5 Flash LLM Synthesis
6. End-to-End AI Assistant Turn Latency
"""

import time
import statistics
import httpx
from app.db.repository import SchemeRepository
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput
from app.modules.rag.grounded_qa import GroundedQAService
from app.modules.rag.hybrid_search import HybridSearchEngine
from app.modules.rag.gemini_client import GeminiClient

FRONTEND_URL = "http://localhost:3000"
BACKEND_URL = "http://localhost:8001/api/v1"

def benchmark_pipeline(n_iterations=5):
    print("=" * 80)
    print(f"SCHEMESAATHI COMPONENT LATENCY BREAKDOWN (Iterations={n_iterations})")
    print("=" * 80)

    SchemeRepository.initialize_store()
    qa_service = GroundedQAService()
    gemini_client = GeminiClient()

    with httpx.Client(timeout=60.0) as client:
        # 1. Frontend Homepage TTFB
        times_fe = []
        for _ in range(n_iterations):
            t0 = time.perf_counter()
            resp = client.get(f"{FRONTEND_URL}/")
            times_fe.append((time.perf_counter() - t0) * 1000)
            assert resp.status_code == 200

        # 2. Catalogue Search
        times_cat = []
        for _ in range(n_iterations):
            t0 = time.perf_counter()
            resp = client.get(f"{BACKEND_URL}/schemes?q=farmer")
            times_cat.append((time.perf_counter() - t0) * 1000)
            assert resp.status_code == 200

        # 3. Deterministic AST Eligibility Evaluation
        profile = CitizenProfileInput(
            age=72,
            annual_income_inr=1500000.0,
            is_bpl_card_holder=False,
            residence_area="urban",
            occupation="senior_citizen"
        )
        all_schemes = SchemeRepository.get_all_published()
        times_ast = []
        for _ in range(n_iterations * 2):
            t0 = time.perf_counter()
            res = EligibilityService.evaluate_all(all_schemes, profile)
            times_ast.append((time.perf_counter() - t0) * 1000)
            assert len(res.eligible_schemes) > 0

        # 4. Multilingual Hybrid Vector & Lexical Retrieval
        test_query = "What is the cash benefit under PMMVY for mothers?"
        chunks = SchemeRepository.get_all_chunks()
        times_retrieval = []
        for _ in range(n_iterations):
            t0 = time.perf_counter()
            evidence = HybridSearchEngine.search(query=test_query, chunks=chunks, top_k=3)
            times_retrieval.append((time.perf_counter() - t0) * 1000)
            assert len(evidence) > 0

        # 5. Live Gemini 3.5 Flash LLM Call
        times_llm = []
        if gemini_client.is_configured:
            prompt = "In 20 words, state the core goal of PM-KISAN scheme."
            for i in range(2):
                t0 = time.perf_counter()
                try:
                    reply = gemini_client.generate(prompt, max_output_tokens=50)
                    elapsed = (time.perf_counter() - t0) * 1000
                    if reply is not None:
                        times_llm.append(elapsed)
                        print(f"  Live Gemini attempt {i+1} completed in {elapsed:.1f} ms")
                    else:
                        print(f"  Live Gemini attempt {i+1} returned None (fallback engaged)")
                except Exception as ex:
                    print(f"  Live Gemini exception: {ex}")

        # 6. End-to-End AI Assistant Turn Latency
        times_e2e_ai = []
        for i in range(3):
            t0 = time.perf_counter()
            resp = client.post(
                f"{BACKEND_URL}/assistant/query",
                json={"query": "How much health cover is given under Ayushman Bharat for seniors?", "locale": "en"}
            )
            elapsed = (time.perf_counter() - t0) * 1000
            times_e2e_ai.append(elapsed)
            assert resp.status_code == 200
            print(f"  E2E AI query {i+1} completed in {elapsed:.1f} ms (is_grounded={resp.json().get('is_grounded')})")

    def stats(arr):
        if not arr:
            return {"mean": 0.0, "p50": 0.0, "p95": 0.0, "min": 0.0, "max": 0.0}
        s = sorted(arr)
        return {
            "mean": statistics.mean(s),
            "p50": statistics.median(s),
            "p95": s[int(0.95 * len(s))],
            "min": s[0],
            "max": s[-1]
        }

    st_fe = stats(times_fe)
    st_cat = stats(times_cat)
    st_ast = stats(times_ast)
    st_ret = stats(times_retrieval)
    st_llm = stats(times_llm)
    st_e2e = stats(times_e2e_ai)

    print("\n" + "-" * 80)
    print(f"{'Component':<35} | {'Mean (ms)':<10} | {'P50 (ms)':<10} | {'P95 (ms)':<10}")
    print("-" * 80)
    print(f"{'1. Frontend TTFB (Next.js 15)':<35} | {st_fe['mean']:<10.2f} | {st_fe['p50']:<10.2f} | {st_fe['p95']:<10.2f}")
    print(f"{'2. Catalogue Search API':<35} | {st_cat['mean']:<10.2f} | {st_cat['p50']:<10.2f} | {st_cat['p95']:<10.2f}")
    print(f"{'3. Deterministic AST Engine':<35} | {st_ast['mean']:<10.2f} | {st_ast['p50']:<10.2f} | {st_ast['p95']:<10.2f}")
    print(f"{'4. Hybrid Vector Retrieval':<35} | {st_ret['mean']:<10.2f} | {st_ret['p50']:<10.2f} | {st_ret['p95']:<10.2f}")
    if times_llm:
        print(f"{'5. Gemini 3.5 Flash Live API':<35} | {st_llm['mean']:<10.2f} | {st_llm['p50']:<10.2f} | {st_llm['p95']:<10.2f}")
    print(f"{'6. Total E2E AI Assistant Turn':<35} | {st_e2e['mean']:<10.2f} | {st_e2e['p50']:<10.2f} | {st_e2e['p95']:<10.2f}")
    print("-" * 80)

if __name__ == "__main__":
    benchmark_pipeline()
