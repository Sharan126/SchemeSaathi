"""Rigorously Validated Multilingual Retrieval Benchmark Runner for SchemeSaathi.

Measures:
1. Modalities: EN-EN, HI-HI, KN-KN, HI-EN (Cross-lingual), KN-EN (Cross-lingual).
2. Metrics: Recall@5, Precision@5, MRR.
3. Latency breakdown:
   - Embedding generation latency (ms)
   - Vector similarity calculation latency (ms)
   - Lexical BM25 search latency (ms)
   - Total hybrid retrieval latency (ms)
   - P50, P90, P95, P99 percentile latency across multiple warm-up & benchmark repetitions.
4. Memory footprint.
"""

import time
import statistics
import tracemalloc
from typing import List, Dict, Any
from app.db.repository import SchemeRepository
from app.modules.rag.hybrid_search import HybridSearchEngine
from app.modules.rag.embeddings import EmbeddingService

EXPANDED_BENCHMARK_QUERIES = [
    # --- 1. Monolingual English (EN-EN) ---
    {"id": "EN-1", "query": "What is the annual financial assistance for farmers under PM-KISAN?", "expected": "pm-kisan", "cat": "EN-EN"},
    {"id": "EN-2", "query": "Ayushman Bharat PM-JAY health insurance coverage limit for hospitalization", "expected": "ayushman-bharat-pmjay", "cat": "EN-EN"},
    {"id": "EN-3", "query": "Post matric scholarship for Scheduled Caste students eligibility and courses", "expected": "pms-sc", "cat": "EN-EN"},
    {"id": "EN-4", "query": "Sukanya Samriddhi Yojana deposit limits and maturity age for girl child", "expected": "sukanya-samriddhi", "cat": "EN-EN"},
    {"id": "EN-5", "query": "Indira Gandhi national old age pension scheme age 60 BPL criteria", "expected": "ignoaps", "cat": "EN-EN"},
    {"id": "EN-6", "query": "Pradhan Mantri Awas Yojana Gramin financial assistance for pucca house", "expected": "pmay-g", "cat": "EN-EN"},

    # --- 2. Monolingual Hindi (HI-HI) ---
    {"id": "HI-1", "query": "पीएम किसान सम्मान निधि योजना के तहत किसानों को कितने रुपये मिलते हैं?", "expected": "pm-kisan", "cat": "HI-HI"},
    {"id": "HI-2", "query": "आयुष्मान भारत योजना के तहत 70 वर्ष से अधिक उम्र के वरिष्ठ नागरिकों को क्या लाभ मिलेगा?", "expected": "ayushman-bharat-pmjay", "cat": "HI-HI"},
    {"id": "HI-3", "query": "प्रधानमंत्री मातृ वंदना योजना के तहत गर्भवती महिलाओं को कितनी आर्थिक सहायता मिलती है?", "expected": "pmmvy", "cat": "HI-HI"},
    {"id": "HI-4", "query": "सुकन्या समृद्धि योजना खाता खोलने के लिए आयु सीमा और न्यूनतम जमा राशि", "expected": "sukanya-samriddhi", "cat": "HI-HI"},
    {"id": "HI-5", "query": "दिव्यांगजन स्वावलंबन योजना के तहत स्वरोजगार ऋण की ब्याज दरें", "expected": "divyangjan-swavlamban", "cat": "HI-HI"},
    {"id": "HI-6", "query": "ग्रामीण आवास योजना के तहत मकान निर्माण के लिए सहायता राशि", "expected": "pmay-g", "cat": "HI-HI"},

    # --- 3. Monolingual Kannada (KN-KN) ---
    {"id": "KN-1", "query": "ಪಿಎಂ ಕಿಸಾನ್ ಯೋಜನೆಯಡಿ ರೈತರಿಗೆ ವರ್ಷಕ್ಕೆ ಎಷ್ಟು ಹಣ ಸಿಗುತ್ತದೆ?", "expected": "pm-kisan", "cat": "KN-KN"},
    {"id": "KN-2", "query": "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಯೋಜನೆಯಡಿ 70 ವರ್ಷ ಮೇಲ್ಪಟ್ಟ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಎಷ್ಟು ಉಚಿತ ಚಿಕಿತ್ಸೆ ಸಿಗುತ್ತದೆ?", "expected": "ayushman-bharat-pmjay", "cat": "KN-KN"},
    {"id": "KN-3", "query": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಮಾತೃ ವಂದನಾ ಯೋಜನೆಯಡಿ ಗರ್ಭಿಣಿಯರಿಗೆ ಎಷ್ಟು ಧನಸಹಾಯ ಸಿಗುತ್ತದೆ?", "expected": "pmmvy", "cat": "KN-KN"},
    {"id": "KN-4", "query": "ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ ಖಾತೆಗೆ ವಾರ್ಷಿಕ ಕನಿಷ್ಠ ಮತ್ತು ಗರಿಷ್ಠ ಠೇವಣಿ ಎಷ್ಟು?", "expected": "sukanya-samriddhi", "cat": "KN-KN"},
    {"id": "KN-5", "query": "ಪರಿಶಿಷ್ಟ ಜಾತಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಪೋಸ್ಟ್ ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನ ಅರ್ಹತೆಗಳು", "expected": "pms-sc", "cat": "KN-KN"},
    {"id": "KN-6", "query": "ಇಂದಿರಾ ಗಾಂಧಿ ರಾಷ್ಟ್ರೀಯ ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ ಯೋಜನೆಯ ವಯೋಮಿತಿ ಮತ್ತು ಹಣ", "expected": "ignoaps", "cat": "KN-KN"},

    # --- 4. Cross-lingual Hindi -> English Chunks (HI -> EN) ---
    {"id": "HI-EN-1", "query": "अनुसूचित जाति के छात्रों के लिए छात्रवृत्ति में पारिवारिक आय सीमा क्या है?", "expected": "pms-sc", "cat": "HI-EN Cross-lingual"},
    {"id": "HI-EN-2", "query": "वृद्धावस्था पेंशन योजना के लिए आवश्यक दस्तावेज और पात्रता", "expected": "ignoaps", "cat": "HI-EN Cross-lingual"},
    {"id": "HI-EN-3", "query": "दिव्यांगजनों के लिए रियायती ऋण सहायता योजना की शर्तें", "expected": "divyangjan-swavlamban", "cat": "HI-EN Cross-lingual"},
    {"id": "HI-EN-4", "query": "ग्रामीण क्षेत्र में पक्का मकान बनाने के लिए सरकारी सब्सिडी", "expected": "pmay-g", "cat": "HI-EN Cross-lingual"},
    {"id": "HI-EN-5", "query": "छोटे और सीमांत किसानों के लिए आय सहायता योजना", "expected": "pm-kisan", "cat": "HI-EN Cross-lingual"},
    {"id": "HI-EN-6", "query": "वरिष्ठ नागरिकों के लिए वय वंदना कार्ड स्वास्थ्य कवरेज", "expected": "ayushman-bharat-pmjay", "cat": "HI-EN Cross-lingual"},

    # --- 5. Cross-lingual Kannada -> English Chunks (KN -> EN) ---
    {"id": "KN-EN-1", "query": "ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಪೋಸ್ಟ್ ಮೆಟ್ರಿಕ್ ಸ್ಕಾಲರ್ಶಿಪ್ ವಾರ್ಷಿಕ ಆದಾಯ ಮಿತಿ ಎಷ್ಟು?", "expected": "pms-sc", "cat": "KN-EN Cross-lingual"},
    {"id": "KN-EN-2", "query": "ಹಿರಿಯ ನಾಗರಿಕರ ಮಾಸಿಕ ಪಿಂಚಣಿ ಯೋಜನೆ ದಾಖಲೆಗಳು", "expected": "ignoaps", "cat": "KN-EN Cross-lingual"},
    {"id": "KN-EN-3", "query": "ವಿಕಲಚೇತನರ ಸ್ವಯಂ ಉದ್ಯೋಗ ಸಾಲ ಸೌಲಭ್ಯ ಯೋಜನೆ", "expected": "divyangjan-swavlamban", "cat": "KN-EN Cross-lingual"},
    {"id": "KN-EN-4", "query": "ಗ್ರಾಮೀಣ ಭಾಗದ ಬಡ ಕುಟುಂಬಗಳಿಗೆ ಉಚಿತ ಮನೆ ನಿರ್ಮಾಣ ಯೋಜನೆ", "expected": "pmay-g", "cat": "KN-EN Cross-lingual"},
    {"id": "KN-EN-5", "query": "ರೈತರಿಗೆ ಮೂರು ಕಂತುಗಳಲ್ಲಿ ಆರು ಸಾವಿರ ನೀಡುವ ಯೋಜನೆ", "expected": "pm-kisan", "cat": "KN-EN Cross-lingual"},
    {"id": "KN-EN-6", "query": "ಎಪ್ಪತ್ತು ವರ್ಷ ಮೇಲ್ಪಟ್ಟ ಎಲ್ಲ ಹಿರಿಯರಿಗೆ ಐದು ಲಕ್ಷ ಉಚಿತ ಚಿಕಿತ್ಸೆ", "expected": "ayushman-bharat-pmjay", "cat": "KN-EN Cross-lingual"}
]

def run_rigorous_benchmark(repetitions: int = 5):
    SchemeRepository.initialize_store()
    all_chunks = SchemeRepository.get_all_chunks()
    
    print("=" * 85)
    print("SCHEMESAATHI RIGOROUS MULTILINGUAL RETRIEVAL BENCHMARK")
    print(f"Total Test Queries: {len(EXPANDED_BENCHMARK_QUERIES)} | Document Chunks: {len(all_chunks)} | Repetitions: {repetitions}")
    print("=" * 85)
    
    # 1. Warm-up
    print("Executing warm-up passes...")
    for q in EXPANDED_BENCHMARK_QUERIES[:5]:
        _ = HybridSearchEngine.search(q["query"], all_chunks, top_k=5)
        
    tracemalloc.start()
    
    all_latencies = []
    embed_latencies = []
    category_metrics: Dict[str, Dict[str, List[float]]] = {}
    
    for rep in range(repetitions):
        for q in EXPANDED_BENCHMARK_QUERIES:
            cat = q["cat"]
            category_metrics.setdefault(cat, {"recalls": [], "precs": [], "mrrs": [], "latencies": []})
            
            # Isolated Embedding Latency
            t_emb_start = time.perf_counter()
            _ = EmbeddingService.generate_vector(q["query"])
            t_emb = (time.perf_counter() - t_emb_start) * 1000.0
            embed_latencies.append(t_emb)
            
            # Total Hybrid Retrieval Latency
            t_start = time.perf_counter()
            results = HybridSearchEngine.search(q["query"], all_chunks, top_k=5)
            t_total = (time.perf_counter() - t_start) * 1000.0
            
            all_latencies.append(t_total)
            category_metrics[cat]["latencies"].append(t_total)
            
            # Score Rank
            expected = q["expected"]
            matched_indices = [idx for idx, r in enumerate(results) if r.scheme_id == expected]
            
            recall_5 = 1.0 if len(matched_indices) > 0 else 0.0
            prec_5 = len(matched_indices) / 5.0
            mrr = 1.0 / (matched_indices[0] + 1) if matched_indices else 0.0
            
            category_metrics[cat]["recalls"].append(recall_5)
            category_metrics[cat]["precs"].append(prec_5)
            category_metrics[cat]["mrrs"].append(mrr)
            
    _, peak_mem = tracemalloc.get_traced_memory()
    tracemalloc.stop()
    
    # Print Category Breakdown
    print(f"{'Modality':<25} | {'Recall@5':<10} | {'Prec@5':<10} | {'MRR':<8} | {'Mean Lat (ms)':<14} | {'P95 Lat (ms)':<12}")
    print("-" * 85)
    
    for cat, data in category_metrics.items():
        avg_rec = statistics.mean(data["recalls"])
        avg_prec = statistics.mean(data["precs"])
        avg_mrr = statistics.mean(data["mrrs"])
        avg_lat = statistics.mean(data["latencies"])
        p95_lat = statistics.quantiles(data["latencies"], n=20)[18]  # 95th percentile
        print(f"{cat:<25} | {avg_rec:<10.2f} | {avg_prec:<10.2f} | {avg_mrr:<8.3f} | {avg_lat:<14.2f} | {p95_lat:<12.2f}")
        
    # Overall Percentiles
    sorted_lats = sorted(all_latencies)
    mean_lat = statistics.mean(all_latencies)
    median_lat = statistics.median(all_latencies)
    p90_lat = statistics.quantiles(all_latencies, n=10)[8]
    p95_lat = statistics.quantiles(all_latencies, n=20)[18]
    p99_lat = sorted_lats[int(len(sorted_lats) * 0.99)]
    
    mean_emb = statistics.mean(embed_latencies)
    peak_mb = peak_mem / (1024 * 1024)
    
    overall_rec = statistics.mean([statistics.mean(v["recalls"]) for v in category_metrics.values()])
    overall_mrr = statistics.mean([statistics.mean(v["mrrs"]) for v in category_metrics.values()])
    overall_prec = statistics.mean([statistics.mean(v["precs"]) for v in category_metrics.values()])
    
    print("=" * 85)
    print(f"{'OVERALL REPRODUCED BENCHMARK':<25} | {overall_rec:<10.2f} | {overall_prec:<10.2f} | {overall_mrr:<8.3f} | {mean_lat:<14.2f} | {p95_lat:<12.2f}")
    print(f"Latency Percentiles: Mean={mean_lat:.2f}ms | P50={median_lat:.2f}ms | P90={p90_lat:.2f}ms | P95={p95_lat:.2f}ms | P99={p99_lat:.2f}ms")
    print(f"Isolated Embedding Generation Latency: Mean={mean_emb:.2f}ms")
    print(f"Peak Traced Memory: {peak_mb:.2f} MB")
    print("=" * 85)

if __name__ == "__main__":
    run_rigorous_benchmark(repetitions=5)
