"""Hybrid Semantic and Keyword Retrieval Engine with Reciprocal Rank Fusion (RRF)"""

import re
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.modules.rag.embeddings import EmbeddingService
from app.modules.rag.query_expansion import MultilingualQueryExpander


class RetrievedChunk(BaseModel):
    chunk_id: str
    scheme_id: str
    scheme_title: Dict[str, str]
    section_title: str
    language: str
    content: str
    official_portal_url: str
    gazette_notification_url: Optional[str] = None
    source_reference_date: str
    score: float


class HybridSearchEngine:
    RRF_K = 60

    STOPWORDS = {
        # English
        "a", "an", "the", "in", "on", "at", "to", "for", "of", "and", "or", "is", "are", "was",
        "were", "be", "been", "being", "have", "has", "had", "do", "does", "did", "how", "what",
        "which", "who", "whom", "this", "that", "these", "those", "can", "could", "will", "would",
        "shall", "should", "may", "might", "must", "with", "by", "from", "as", "about", "into",
        "through", "after", "before", "between", "under", "above", "up", "down", "out", "off", "over",
        "scheme", "yojana", "details", "rules", "pm", "pradhan", "mantri", "hi", "hello", "hey", "im", "i'm", "my", "name",
        # Hindi common particles & generic scheme terms
        "का", "के", "की", "को", "में", "से", "पर", "है", "हैं", "था", "थे", "थी", "हो", "होता", "होती",
        "और", "या", "तो", "भी", "ने", "एक", "इस", "उस", "यह", "वह", "किया", "गया", "कर", "कृपया",
        "योजना", "योजनाएं", "तहत", "विवरण", "नमस्ते", "नमस्कार", "प्रधान", "मंत्री", "प्रधानमंत्री", "पीएम",
        # Kannada common particles & generic scheme terms
        "ಮತ್ತು", "ಅಥವಾ", "ಇದು", "ಅದು", "ಈ", "ಆ", "ಇದೆ", "ಇವೆ", "ರಲ್ಲಿ", "ನಲ್ಲಿ", "ಗೆ", "ಯನ್ನು", "ಇಂದ", "ದಯವಿಟ್ಟು",
        "ಯೋಜನೆ", "ಯೋಜನೆಯ", "ಯೋಜನೆಯಡಿ", "ವಿವರಗಳು", "ನಮಸ್ಕಾರ", "ಪ್ರಧಾನ", "ಮಂತ್ರಿ", "ಪ್ರಧಾನಮಂತ್ರಿ", "ಪಿಎಂ"
    }

    @classmethod
    def search(
        cls,
        query: str,
        chunks: List[Dict[str, Any]],
        top_k: int = 4,
        category_filter: Optional[str] = None
    ) -> List[RetrievedChunk]:
        """
        Executes hybrid retrieval:
        1. Dense semantic search via cosine vector similarity.
        2. Sparse keyword BM25-style lexical matching.
        3. Reciprocal Rank Fusion combining both ranks.
        """
        if not chunks or not query.strip():
            return []

        q_clean = query.lower().strip()
        for p in "?!.,:;()[]\"'/-":
            q_clean = q_clean.replace(p, " ")
        q_tokens = [tok for tok in q_clean.split() if len(tok) >= 2 and tok not in cls.STOPWORDS]

        # Multilingual Cross-Lingual Query Expansion
        expanded_cross_tokens = MultilingualQueryExpander.expand_query(query)
        all_match_tokens = list(dict.fromkeys(q_tokens + expanded_cross_tokens))

        if expanded_cross_tokens:
            expanded_query_text = f"{query} {' '.join(expanded_cross_tokens)}"
            q_vector = EmbeddingService.generate_vector(expanded_query_text)
        else:
            q_vector = EmbeddingService.generate_vector(query)

        # 1. Vector Scoring
        vector_scores = []
        for c in chunks:
            if category_filter and c.get("category") != category_filter:
                continue
            text_to_embed = f"{c.get('scheme_id', '').replace('-', ' ')} {c.get('section_title', '')} {c.get('content', '')}"
            c_vec = c.get("embedding_vector") or EmbeddingService.generate_vector(text_to_embed)
            sim = EmbeddingService.cosine_similarity(q_vector, c_vec)
            vector_scores.append((c, sim))

        # Only consider chunks with meaningful semantic correlation
        vector_ranked = sorted([item for item in vector_scores if item[1] >= 0.10], key=lambda x: x[1], reverse=True)[:10]

        # 2. Keyword Lexical Scoring
        keyword_scores = []
        for c in chunks:
            if category_filter and c.get("category") != category_filter:
                continue
            titles_text = " ".join(str(v) for v in c.get("scheme_title", {}).values())
            raw_content = f"{c.get('content', '')} {c.get('section_title', '')} {c.get('scheme_id', '').replace('-', ' ')} {titles_text}"
            content_lower = raw_content.lower()
            content_words = set(re.findall(r"[\w]+", content_lower))

            overlap = 0.0
            matched_title_or_id = False
            for tok in all_match_tokens:
                # High bonus for exact scheme title and ID terms
                if tok in titles_text.lower() or tok in c.get("scheme_id", "").replace("-", " "):
                    overlap += 4.0
                    matched_title_or_id = True
                elif tok in c.get("section_title", "").lower():
                    overlap += 2.0
                elif tok in content_words:
                    overlap += 1.0

            # Guard against single incidental word matches in multi-word queries
            if len(all_match_tokens) >= 3 and not matched_title_or_id and overlap < 2.0:
                overlap = 0.0

            keyword_scores.append((c, overlap))

        # Only consider chunks with actual lexical matches
        keyword_ranked = sorted([item for item in keyword_scores if item[1] > 0], key=lambda x: x[1], reverse=True)

        # If neither keyword matched and vector similarity is weak, query is out of scope
        if not keyword_ranked and (not vector_ranked or vector_ranked[0][1] < 0.22):
            return []

        # 3. Reciprocal Rank Fusion (RRF)
        rrf_scores: Dict[str, float] = {}
        chunk_map: Dict[str, Dict[str, Any]] = {}

        for rank, (item, _) in enumerate(vector_ranked):
            cid = item["id"]
            chunk_map[cid] = item
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.0 / (cls.RRF_K + rank + 1))

        for rank, (item, score) in enumerate(keyword_ranked):
            cid = item["id"]
            chunk_map[cid] = item
            rrf_scores[cid] = rrf_scores.get(cid, 0.0) + (1.5 / (cls.RRF_K + rank + 1)) + (score * 0.02)

        # Sort by final RRF score
        sorted_chunks = sorted(rrf_scores.items(), key=lambda x: x[1], reverse=True)[:top_k]

        results = []
        for cid, score in sorted_chunks:
            c = chunk_map[cid]
            results.append(RetrievedChunk(
                chunk_id=cid,
                scheme_id=c.get("scheme_id", ""),
                scheme_title=c.get("scheme_title", {}),
                section_title=c.get("section_title", "General"),
                language=c.get("language", "en"),
                content=c.get("content", ""),
                official_portal_url=c.get("official_portal_url", ""),
                gazette_notification_url=c.get("gazette_notification_url"),
                source_reference_date=c.get("source_reference_date", "2024-01-01"),
                score=round(score, 4)
            ))

        return results
