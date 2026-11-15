"""SchemeSaathi Production Performance, Latency & Resilience Stress Benchmark

Measures empirical P50, P95, P99 latency across:
1. Scheme Catalogue Listing & Filtering
2. Full Scheme Detail Retrieval with Versioning
3. Deterministic AST Rule Evaluation (JSONLogic)
4. Vector Cosine Similarity Search
5. Sparse Lexical BM25 Matching
6. Hybrid RAG Retrieval (Vector + Keyword + RRF)
7. Deterministic Statutory Fallback Synthesis (Circuit Breaker Tripped)
8. High-Concurrency Stress Test (50 Concurrent Workers)
"""

import time
import statistics
import tracemalloc
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Any

from app.db.repository import SchemeRepository
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput
from app.modules.rag.embeddings import EmbeddingService
from app.modules.rag.hybrid_search import HybridSearchEngine
from app.modules.rag.grounded_qa import GroundedQAService
from app.modules.rag.gemini_client import GeminiClient

def calculate_percentiles(latencies_ms: List[float]) -> Dict[str, float]:
    sorted_lats = sorted(latencies_ms)
    n = len(sorted_lats)
    p50 = sorted_lats[int(n * 0.50)]
    p90 = sorted_lats[int(n * 0.90)]
    p95 = sorted_lats[int(n * 0.95)]
    p99 = sorted_lats[min(int(n * 0.99), n - 1)]
    return {
        "mean": statistics.mean(sorted_lats),
        "p50": p50,
        "p90": p90,
        "p95": p95,
        "p99": p99,
        "min": min(sorted_lats),
        "max": max(sorted_lats)
    }

def run_performance_benchmarks():
    import logging
    logging.getLogger("app.modules.rag.gemini_client").setLevel(logging.CRITICAL)
    print("=" * 85)
    print("SCHEMESAATHI PRODUCTION PERFORMANCE & RESILIENCE BENCHMARK")
    print("=" * 85)
    
    tracemalloc.start()
    SchemeRepository.initialize_store()
    all_chunks = SchemeRepository.get_all_chunks()
    
    # -------------------------------------------------------------------------
    # 1. Scheme Catalogue Listing & Filtering (100 runs)
    # -------------------------------------------------------------------------
    lats_cat = []
    for _ in range(100):
        t0 = time.perf_counter()
        schemes = SchemeRepository.get_all_published(category="agriculture", locale="hi")
        lats_cat.append((time.perf_counter() - t0) * 1000)
    p_cat = calculate_percentiles(lats_cat)
    print(f"1. Catalogue Search & Filter   | Mean: {p_cat['mean']:6.2f} ms | P50: {p_cat['p50']:6.2f} ms | P95: {p_cat['p95']:6.2f} ms | P99: {p_cat['p99']:6.2f} ms")

    # -------------------------------------------------------------------------
    # 2. Scheme Detail Retrieval (100 runs)
    # -------------------------------------------------------------------------
    lats_det = []
    for _ in range(100):
        t0 = time.perf_counter()
        scheme = SchemeRepository.get_by_slug("ayushman-bharat-pmjay")
        lats_det.append((time.perf_counter() - t0) * 1000)
    p_det = calculate_percentiles(lats_det)
    print(f"2. Scheme Detail Retrieval     | Mean: {p_det['mean']:6.2f} ms | P50: {p_det['p50']:6.2f} ms | P95: {p_det['p95']:6.2f} ms | P99: {p_det['p99']:6.2f} ms")

    # -------------------------------------------------------------------------
    # 3. Deterministic AST Rule Evaluation (200 runs across varied profiles)
    # -------------------------------------------------------------------------
    lats_ast = []
    test_profiles = [
        CitizenProfileInput(age=72, annual_income_inr=0.0, state="Karnataka", gender="female", is_bpl_card_holder=False),
        CitizenProfileInput(age=45, annual_income_inr=500000.0, occupation="farmer", landholding_acres=2.5, has_paid_income_tax=True),
        CitizenProfileInput(age=21, annual_income_inr=150000.0, caste_category="SC", is_student=True, education_level="undergraduate"),
        CitizenProfileInput(age=8, annual_income_inr=200000.0, gender="female"),
        CitizenProfileInput(age=35, annual_income_inr=100000.0, is_differently_abled=True, disability_percentage=50.0)
    ]
    all_schemes = SchemeRepository.get_all_published()
    for i in range(200):
        prof = test_profiles[i % len(test_profiles)]
        t0 = time.perf_counter()
        res = EligibilityService.evaluate_all(all_schemes, prof)
        lats_ast.append((time.perf_counter() - t0) * 1000)
    p_ast = calculate_percentiles(lats_ast)
    print(f"3. Deterministic AST Evaluation| Mean: {p_ast['mean']:6.2f} ms | P50: {p_ast['p50']:6.2f} ms | P95: {p_ast['p95']:6.2f} ms | P99: {p_ast['p99']:6.2f} ms")

    # -------------------------------------------------------------------------
    # 4. Vector Cosine Similarity Search (100 runs)
    # -------------------------------------------------------------------------
    q_vec = EmbeddingService.generate_vector("financial assistance for marginal farmers and agriculture")
    lats_vec = []
    for _ in range(100):
        t0 = time.perf_counter()
        sims = [EmbeddingService.cosine_similarity(q_vec, c["embedding_vector"]) for c in all_chunks]
        lats_vec.append((time.perf_counter() - t0) * 1000)
    p_vec = calculate_percentiles(lats_vec)
    print(f"4. Vector Cosine Search (36-doc)| Mean: {p_vec['mean']:6.2f} ms | P50: {p_vec['p50']:6.2f} ms | P95: {p_vec['p95']:6.2f} ms | P99: {p_vec['p99']:6.2f} ms")

    # -------------------------------------------------------------------------
    # 5. Hybrid RAG Retrieval (Vector + Keyword + RRF) (100 runs)
    # -------------------------------------------------------------------------
    sample_queries = [
        "What are the benefits of PM-KISAN for farmers?",
        "70 वर्ष से अधिक उम्र के वरिष्ठ नागरिकों के लिए आयुष्मान योजना",
        "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಹತೆ",
        "Sukanya Samriddhi Yojana deposit limits and rules",
        "Disability loan assistance under Divyangjan Swavlamban"
    ]
    lats_rag = []
    for i in range(100):
        q = sample_queries[i % len(sample_queries)]
        t0 = time.perf_counter()
        retrieved = HybridSearchEngine.search(q, all_chunks, top_k=3)
        lats_rag.append((time.perf_counter() - t0) * 1000)
    p_rag = calculate_percentiles(lats_rag)
    print(f"5. Hybrid RAG Retrieval        | Mean: {p_rag['mean']:6.2f} ms | P50: {p_rag['p50']:6.2f} ms | P95: {p_rag['p95']:6.2f} ms | P99: {p_rag['p99']:6.2f} ms")

    # -------------------------------------------------------------------------
    # 6. Fallback Synthesis (Circuit Breaker Tripped) (100 runs)
    # -------------------------------------------------------------------------
    # Force circuit breaker OPEN to measure statutory deterministic synthesis latency
    GeminiClient._state = "OPEN"
    GeminiClient._cooldown_until = time.time() + 60.0
    lats_syn = []
    for i in range(100):
        q = sample_queries[i % len(sample_queries)]
        t0 = time.perf_counter()
        resp = GroundedQAService.answer_query(q, "en", all_chunks)
        lats_syn.append((time.perf_counter() - t0) * 1000)
    p_syn = calculate_percentiles(lats_syn)
    print(f"6. Fallback Statutory Synthesis| Mean: {p_syn['mean']:6.2f} ms | P50: {p_syn['p50']:6.2f} ms | P95: {p_syn['p95']:6.2f} ms | P99: {p_syn['p99']:6.2f} ms")

    # -------------------------------------------------------------------------
    # 7. Circuit Breaker Fast-Fail Latency (500 runs)
    # -------------------------------------------------------------------------
    g_client = GeminiClient()
    GeminiClient._circuit_open_until = time.time() + 60.0
    lats_cb = []
    for _ in range(500):
        t0 = time.perf_counter()
        res = g_client.generate("test prompt")
        lats_cb.append((time.perf_counter() - t0) * 1000)
    p_cb = calculate_percentiles(lats_cb)
    print(f"7. Circuit Breaker Fast-Fail   | Mean: {p_cb['mean']:6.4f} ms | P50: {p_cb['p50']:6.4f} ms | P95: {p_cb['p95']:6.4f} ms | P99: {p_cb['p99']:6.4f} ms")

    # Reset circuit breaker
    GeminiClient.record_success()

    # -------------------------------------------------------------------------
    # 8. High-Concurrency Stress Test (50 Concurrent Workers, 250 Total Requests)
    # -------------------------------------------------------------------------
    print("\n" + "-" * 85)
    print("EXECUTING 50 CONCURRENT WORKER STRESS TEST (250 Mixed Requests)...")
    print("-" * 85)
    
    def worker_task(idx: int):
        q_idx = idx % len(sample_queries)
        q = sample_queries[q_idx]
        t0 = time.perf_counter()
        
        # 1. Hybrid Search
        chunks = HybridSearchEngine.search(q, all_chunks, top_k=3)
        # 2. AST Evaluation
        prof = test_profiles[idx % len(test_profiles)]
        elig = EligibilityService.evaluate_all(all_schemes, prof)
        total_evaluated = len(elig.eligible_schemes) + len(elig.potentially_eligible_schemes) + len(elig.ineligible_schemes)
        # 3. Grounded Synthesis
        resp = GroundedQAService.answer_query(q, "en", all_chunks)
        
        elapsed = (time.perf_counter() - t0) * 1000
        return elapsed, len(chunks), total_evaluated, resp.is_grounded

    concur_latencies = []
    t_start = time.perf_counter()
    with ThreadPoolExecutor(max_workers=50) as executor:
        futures = [executor.submit(worker_task, i) for i in range(250)]
        for f in as_completed(futures):
            lat, c_len, s_len, grounded = f.result()
            concur_latencies.append(lat)
            assert c_len >= 1, "RAG retrieval failed under load"
            assert s_len == 8, "AST scheme count corrupted under load"
    t_total = time.perf_counter() - t_start
    throughput = len(concur_latencies) / t_total

    p_con = calculate_percentiles(concur_latencies)
    current_mem, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()

    print(f"Total Requests Completed: {len(concur_latencies)} in {t_total:.2f} seconds")
    print(f"System Throughput:        {throughput:.2f} requests/second")
    print(f"P50 Latency (50 workers): {p_con['p50']:6.2f} ms")
    print(f"P90 Latency (50 workers): {p_con['p90']:6.2f} ms")
    print(f"P95 Latency (50 workers): {p_con['p95']:6.2f} ms")
    print(f"P99 Latency (50 workers): {p_con['p99']:6.2f} ms")
    print(f"Max Latency:              {p_con['max']:6.2f} ms")
    print(f"Memory Footprint:         Current: {current_mem / (1024*1024):.2f} MB | Peak: {peak_mem / (1024*1024):.2f} MB")
    print("=" * 85)

if __name__ == "__main__":
    run_performance_benchmarks()
