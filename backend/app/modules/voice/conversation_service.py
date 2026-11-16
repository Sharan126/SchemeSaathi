"""Intelligent Voice Conversational Service for Low-Literacy Citizens

Connects spoken audio requests to verified government scheme knowledge and deterministic eligibility rules.
Implements low-literacy conversation design:
- Multi-turn conversation memory and context tracking.
- Spoken profile extraction (age, occupation, income, land, state, gender).
- Deterministic AST eligibility evaluation without LLM hallucination.
- Hybrid semantic & keyword retrieval across all published government schemes.
- Grounded dynamic voice synthesis via Gemini LLM with robust offline fallback.
- 1 to 3 short spoken sentences maximum (concise, warm, respectful, zero bureaucratic jargon).
- Zero raw URLs spoken aloud; explains physical and digital application points.
- Trilingual support: Kannada (kn), Hindi (hi), English (en).
"""

import re
import time
import logging
from typing import Optional, List, Dict, Any, Tuple
from app.core.config import settings
from app.db.repository import SchemeRepository
from app.modules.voice.interfaces import (
    VoiceDialogueMode,
    VoiceChatResponse,
    VoiceMessage,
    SpokenCitation,
)
from app.modules.voice.providers import NaturalVoicePhoneticsProvider
from app.modules.rag.hybrid_search import HybridSearchEngine, RetrievedChunk
from app.modules.rag.gemini_client import GeminiClient
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput

logger = logging.getLogger(__name__)


class VoiceConversationService:
    """Manages natural, context-aware voice conversations for scheme discovery and guidance."""

    # -------------------------------------------------------------------------
    # 1. Main Entrypoint
    # -------------------------------------------------------------------------
    @classmethod
    def answer_spoken_query(
        cls,
        query: str,
        language: str = "en",
        dialogue_mode: VoiceDialogueMode = VoiceDialogueMode.DISCOVERY,
        target_scheme_id: Optional[str] = None,
        conversation_history: Optional[List[VoiceMessage]] = None,
        profile_context: Optional[Dict[str, Any]] = None,
        simplicity_mode: bool = False,
        speech_speed: float = 1.0,
    ) -> VoiceChatResponse:
        start_time = time.time()
        q_norm = query.lower().strip()
        lang = language if language in ("kn", "hi", "en") else "en"
        history = conversation_history or []
        profile = dict(profile_context or {})

        # Step 0: Check viral welfare hoaxes / non-existent benefits
        hoax_response = cls._check_hoax_or_illegal_queries(q_norm, lang)
        if hoax_response:
            return hoax_response

        # Step 1: Check Friendly Greetings & Bot Identity
        if cls._is_greeting_or_identity(q_norm):
            return cls._generate_greeting_response(lang)

        # Step 2: Context Resolution — Extract Profile & Detect Active Scheme
        extracted_from_query = cls._extract_citizen_profile(query, lang)
        profile.update(extracted_from_query)

        active_scheme_id = cls._resolve_active_scheme(
            query=q_norm,
            target_scheme_id=target_scheme_id,
            history=history
        )

        intent = cls._detect_intent(q_norm, profile, active_scheme_id)

        # Step 3: Handle Profile-Based Eligibility Questions
        # e.g., "I am a 55-year-old farmer. What benefits can I receive?", "Am I eligible?"
        if intent in ("PROFILE_ELIGIBILITY", "INELIGIBILITY_REASON"):
            return cls._handle_profile_eligibility(
                query=query,
                profile=profile,
                active_scheme_id=active_scheme_id,
                lang=lang,
                history=history,
                simplicity_mode=simplicity_mode
            )

        # Step 4: Context-Aware Scheme Search & Evidence Retrieval
        retrieval_query = query
        if active_scheme_id:
            scheme_record = SchemeRepository.get_by_id(active_scheme_id)
            if scheme_record:
                s_title = scheme_record.get("title", {}).get(lang, scheme_record.get("title", {}).get("en", active_scheme_id))
                retrieval_query = f"{s_title} {active_scheme_id} {query}"

        all_chunks = SchemeRepository.get_all_chunks()
        raw_chunks = HybridSearchEngine.search(
            query=retrieval_query,
            chunks=all_chunks,
            top_k=6,
            category_filter=None
        )
        retrieved_chunks = [c for c in raw_chunks if c.score >= 0.02]

        # Match specific scheme record and ensure intent-specific chunk is prioritized
        matched_scheme = None
        if active_scheme_id:
            matched_scheme = SchemeRepository.get_by_id(active_scheme_id)
            if intent == "APPLICATION_INQUIRY":
                app_chunk = next((c for c in all_chunks if c["scheme_id"] == active_scheme_id and c["language"] == lang and "app-steps" in c["id"]), None)
                if app_chunk and not any(rc.chunk_id == app_chunk["id"] for rc in retrieved_chunks):
                    retrieved_chunks.insert(0, RetrievedChunk(
                        chunk_id=app_chunk["id"],
                        scheme_id=app_chunk["scheme_id"],
                        scheme_title=app_chunk["scheme_title"],
                        section_title=app_chunk["section_title"],
                        language=app_chunk["language"],
                        content=app_chunk["content"],
                        official_portal_url=app_chunk["official_portal_url"],
                        gazette_notification_url=app_chunk.get("gazette_notification_url"),
                        source_reference_date=app_chunk.get("source_reference_date", "2024-01-01"),
                        score=1.0
                    ))
            elif intent == "DOCUMENT_INQUIRY":
                doc_chunk = next((c for c in all_chunks if c["scheme_id"] == active_scheme_id and c["language"] == lang and "docs" in c["id"]), None)
                if doc_chunk and not any(rc.chunk_id == doc_chunk["id"] for rc in retrieved_chunks):
                    retrieved_chunks.insert(0, RetrievedChunk(
                        chunk_id=doc_chunk["id"],
                        scheme_id=doc_chunk["scheme_id"],
                        scheme_title=doc_chunk["scheme_title"],
                        section_title=doc_chunk["section_title"],
                        language=doc_chunk["language"],
                        content=doc_chunk["content"],
                        official_portal_url=doc_chunk["official_portal_url"],
                        gazette_notification_url=doc_chunk.get("gazette_notification_url"),
                        source_reference_date=doc_chunk.get("source_reference_date", "2024-01-01"),
                        score=1.0
                    ))
        elif retrieved_chunks:
            matched_scheme = SchemeRepository.get_by_id(retrieved_chunks[0].scheme_id)
            if matched_scheme:
                active_scheme_id = matched_scheme["id"]

        # Step 5: Dynamic LLM / RAG Synthesis
        response = cls._synthesize_voice_answer(
            query=query,
            intent=intent,
            lang=lang,
            scheme=matched_scheme,
            chunks=retrieved_chunks,
            profile=profile,
            history=history,
            simplicity_mode=simplicity_mode
        )

        duration_ms = round((time.time() - start_time) * 1000, 2)
        logger.info(
            "VOICE_INSPECTION_AUDIT | lang=%s | scheme=%s | intent=%s | q='%s' | retrieval_q='%s' | chunks=%s | ms=%s",
            lang,
            active_scheme_id,
            intent,
            query,
            retrieval_query,
            [c.chunk_id for c in retrieved_chunks],
            duration_ms
        )
        return response

    # -------------------------------------------------------------------------
    # 2. Context & Active Scheme Resolution
    # -------------------------------------------------------------------------
    @classmethod
    def _resolve_active_scheme(
        cls,
        query: str,
        target_scheme_id: Optional[str],
        history: List[VoiceMessage]
    ) -> Optional[str]:
        """Resolves which scheme is currently being discussed, including multi-turn pronouns."""
        # 1. Direct target passed
        if target_scheme_id:
            return target_scheme_id

        # 2. Scheme mentioned in current query
        all_schemes = SchemeRepository.get_all_published()
        q = query.lower()
        for s in all_schemes:
            sid = s["id"].lower()
            if sid in q:
                return s["id"]
            if sid == "pm-kisan" and any(k in q for k in ["kisan", "pm kisan", "farmer", "ರೈತ", "ಕಿಸಾನ್", "किसान"]):
                return s["id"]
            if sid == "ayushman-bharat-pmjay" and any(k in q for k in ["ayushman", "pmjay", "health card", "ಆಯುಷ್ಮಾನ್", "ಆರೋಗ್ಯ ಕಾರ್ಡ್", "आयुष्मान", "इलाज"]):
                return s["id"]
            if sid == "pmmvy" and any(k in q for k in ["pmmvy", "matru", "pregnant", "mother", "ತಾಯಿ", "ಗರ್ಭಿಣಿ", "माता", "गर्भवती"]):
                return s["id"]
            if sid == "pms-sc" and any(k in q for k in ["scholarship", "matric", "ವಿದ್ಯಾರ್ಥಿವೇತನ", "ಸ್ಕಾಲರ್‌ಶಿಪ್", "छात्रवृत्ति", "स्कॉलरशिप"]):
                return s["id"]
            if sid == "sukanya-samriddhi" and any(k in q for k in ["sukanya", "girl child", "daughter", "ಸುಕನ್ಯಾ", "ಹೆಣ್ಣು ಮಗು", "बेटी"]):
                return s["id"]
            if sid == "pmay-g" and any(k in q for k in ["awas", "housing", "house", "ವಸತಿ", "ಮನೆ", "आवास", "मकान"]):
                return s["id"]
            if sid == "ignoaps" and any(k in q for k in ["pension", "old age", "senior", "ಪಿಂಚಣಿ", "ವೃದ್ಧಾಪ್ಯ", "ಹಿರಿಯ", "पेंशन", "बुजुर्ग", "वरिष्ठ"]):
                return s["id"]
            if sid == "divyangjan-swavlamban" and any(k in q for k in ["divyang", "disability", "ದಿವ್ಯಾಂಗ", "ಅಂಗವಿಕಲ", "विकलांग"]):
                return s["id"]

        # 3. Follow-up inquiries or pronouns referencing previous active scheme
        follow_up_tokens = [
            "it", "this", "that", "this scheme", "that scheme", "one", "the first one",
            "ಇದು", "ಅದಕ್ಕೆ", "ಇದಕ್ಕೆ", "ಮೊದಲನೆಯದು",
            "यह", "इस", "इसके लिए", "पहला वाला"
        ]
        inquiry_tokens = [
            "apply", "procedure", "process", "document", "status", "benefit", "money",
            "rupee", "eligib", "where", "how", "list", "missing", "name",
            "ಅರ್ಜಿ", "ವಿಧಾನ", "ದಾಖಲೆ", "ಸ್ಥಿತಿ", "ಹೇಗೆ", "ಎಲ್ಲಿ", "ಪಟ್ಟಿ", "ಹೆಸರು",
            "आवेदन", "प्रक्रिया", "दस्तावेज", "कागजात", "स्थिति", "कैसे", "कहाँ", "सूची", "नाम"
        ]
        is_follow_up = (
            any(tok in q for tok in follow_up_tokens)
            or any(tok in q for tok in inquiry_tokens)
            or len(q.split()) <= 10
        )

        if is_follow_up and history:
            for msg in reversed(history):
                if msg.scheme_id:
                    return msg.scheme_id

        return None

    # -------------------------------------------------------------------------
    # 3. Profile Extraction from Spoken Natural Language
    # -------------------------------------------------------------------------
    @classmethod
    def _extract_citizen_profile(cls, query: str, lang: str) -> Dict[str, Any]:
        """Extracts citizen demographics and socioeconomic attributes from spoken Kannada, Hindi, and English."""
        extracted: Dict[str, Any] = {}
        q = query.lower()

        # Age extraction: "55 years", "55 year old", "55-year-old", "55 ವರ್ಷ", "55 साल", "ವಯಸ್ಸು 60"
        age_match = re.search(r"(\d{1,2})\s*[- ]?\s*(?:years?|year[- ]old|yr|ವರ್ಷ|ವಯಸ್ಸು|साल|वर्ष|आयु)", q)
        if age_match:
            try:
                extracted["age"] = int(age_match.group(1))
            except ValueError:
                pass
        elif re.search(r"(?:age|ವಯಸ್ಸು|उम्र)\s*(?:is\s*)?(\d{1,2})", q):
            m = re.search(r"(?:age|ವಯಸ್ಸು|उम्र)\s*(?:is\s*)?(\d{1,2})", q)
            if m:
                extracted["age"] = int(m.group(1))

        # Occupation
        if any(w in q for w in ["farmer", "farming", "agriculture", "ರೈತ", "ಕೃಷಿ", "किसान", "खेती"]):
            extracted["occupation"] = "farmer"
        elif any(w in q for w in ["student", "studying", "ವಿದ್ಯಾರ್ಥಿ", "ವಿದ್ಯಾರ್ಥಿನಿ", "छात्र", "पढ़ाई"]):
            extracted["occupation"] = "student"
        elif any(w in q for w in ["worker", "labourer", "labor", "ಕಾರ್ಮಿಕ", "ಕೂಲಿ", "मजदूर", "श्रमिक"]):
            extracted["occupation"] = "worker"
        elif any(w in q for w in ["senior citizen", "retired", "ಹಿರಿಯ ನಾಗರಿಕ", "ಬುಜುರ್ಗ್", "बुजुर्ग", "वरिष्ठ नागरिक"]):
            extracted["occupation"] = "senior_citizen"
            if "age" not in extracted:
                extracted["age"] = 62

        # Landholding (Acres / Hectares)
        land_acre = re.search(r"(\d+(?:\.\d+)?)\s*(?:acres?|acre|ಎಕರೆ|एकड़)", q)
        if land_acre:
            try:
                acres = float(land_acre.group(1))
                extracted["landholding_hectares"] = round(acres * 0.404686, 2)
            except ValueError:
                pass
        land_hec = re.search(r"(\d+(?:\.\d+)?)\s*(?:hectares?|hectare|ಹೆಕ್ಟೇರ್|हेक्टेयर)", q)
        if land_hec:
            try:
                extracted["landholding_hectares"] = float(land_hec.group(1))
            except ValueError:
                pass

        # Annual Income
        # "1.5 lakh", "1.5 ಲಕ್ಷ", "1.5 लाख", "150000"
        lakh_match = re.search(r"(\d+(?:\.\d+)?)\s*(?:lakh|lakhs|lac|ಲಕ್ಷ|लाख)", q)
        if lakh_match:
            try:
                extracted["annual_income_inr"] = int(float(lakh_match.group(1)) * 100000)
            except ValueError:
                pass
        elif re.search(r"(?:rs\.?|₹|inr|ರೂಪಾಯಿ|रुपये)?\s*(\d{5,7})", q):
            num_match = re.search(r"(?:rs\.?|₹|inr|ರೂಪಾಯಿ|रुपये)?\s*(\d{5,7})", q)
            if num_match:
                extracted["annual_income_inr"] = int(num_match.group(1))

        # State
        if any(s in q for s in ["karnataka", "ಕರ್ನಾಟಕ", "कर्नाटक"]):
            extracted["state"] = "Karnataka"
        elif any(s in q for s in ["delhi", "ದೆಹಲಿ", "दिल्ली"]):
            extracted["state"] = "Delhi"

        # Gender & Vulnerabilities
        if any(w in q for w in ["woman", "female", "mother", "daughter", "girl", "ಮಹಿಳೆ", "ತಾಯಿ", "ಹೆಣ್ಣು", "महिला", "माता", "बेटी"]):
            extracted["gender"] = "female"
        elif any(w in q for w in ["man", "male", "ಪುರುಷ", "पुरुष"]):
            extracted["gender"] = "male"

        if any(w in q for w in ["pregnant", "expecting", "lactating", "ಗರ್ಭಿಣಿ", "ಬಾಣಂತಿ", "गर्भवती"]):
            extracted["is_pregnant_or_lactating"] = True
            extracted["gender"] = "female"

        if any(w in q for w in ["disabled", "disability", "handicap", "ದಿವ್ಯಾಂಗ", "ಅಂಗವಿಕಲ", "दिव्यांग", "विकलांग"]):
            extracted["is_disabled"] = True

        if any(w in q for w in ["bpl", "ration card", "poor", "ಬಿಪಿಎಲ್", "ಪಡಿತರ ಚೀಟಿ", "ರಾಷನ್ ಕಾರ್ಡ್", "राशन कार्ड", "गरीब"]):
            extracted["is_bpl_card_holder"] = True

        if any(w in q for w in ["income tax", "tax payer", "taxpayer", "pay tax", "paying tax", "ತೆರಿಗೆ", "ಆದಾಯ ತೆರಿಗೆ", "ಆದಾಯತೆರಿಗೆ", "आयकर", "टैक्स", "इनकम टैक्स"]):
            extracted["is_tax_payer"] = True

        if any(w in q for w in ["no house", "kaccha", "ಮನೆ ಇಲ್ಲ", "ಗುಡಿಸಲು", "कच्चा मकान", "घर नहीं"]):
            extracted["has_pucca_house"] = False

        return extracted

    # -------------------------------------------------------------------------
    # 4. Intent Detection
    # -------------------------------------------------------------------------
    @classmethod
    def _detect_intent(cls, query: str, profile: Dict[str, Any], active_scheme_id: Optional[str]) -> str:
        q = query.lower()

        if any(w in q for w in ["why am i not", "why not", "reason for rejection", "not eligible", "ineligible", "ಯಾಕೆ ಸಿಗಲ್ಲ", "ಅನರ್ಹ ಏಕೆ", "ಅನರ್ಹ", "ಅರ್ಹನಲ್ಲ", "ಅರ್ಹಳಲ್ಲ", "अपात्र क्यों", "क्यों नहीं", "अपात्र"]):
            return "INELIGIBILITY_REASON"

        if any(w in q for w in [
            "status", "check status", "track", "missing from", "name is missing", "name missing", "beneficiary list",
            "ಸ್ಥಿತಿ", "ಪರಿಶೀಲನೆ", "ಹೆಸರು ಇಲ್ಲ", "ಹೆಸರು ಕಾಣುತ್ತಿಲ್ಲ", "ಫಲಾನುಭವಿ ಪಟ್ಟಿ", "ಪಟ್ಟಿ",
            "स्थिति", "स्टेटस", "नाम नहीं", "नाम छूटा", "सूची में नाम", "लाभार्थी सूची"
        ]):
            return "STATUS_OR_MISSING_INQUIRY"

        if any(w in q for w in [
            "how to apply", "how do i apply", "where to apply", "where can i apply", "application step", "apply",
            "application procedure", "application process", "steps to apply", "procedure",
            "ಹೇಗೆ ಅರ್ಜಿ", "ಎಲ್ಲಿ ಅರ್ಜಿ", "ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು", "ಅರ್ಜಿ ಹೇಗೆ", "ಅರ್ಜಿ", "ವಿಧಾನ", "ಸಲ್ಲಿಸಲು", "ಹಾಕುವುದು", "ಹಂತಗಳು",
            "आवेदन कैसे", "कहाँ आवेदन", "आवेदन", "प्रक्रिया", "तरीका", "अप्लाई"
        ]):
            return "APPLICATION_INQUIRY"

        if any(w in q for w in [
            "document", "documents", "what documents", "proof", "paper", "papers", "certificate", "dastavez",
            "ದಾಖಲೆ", "ದಾಖಲೆಗಳು", "ಯಾವ ದಾಖಲೆ", "ಕಾಗದ", "ದಸ್ತಾವೇಜು", "ಪ್ರಮಾಣ ಪತ್ರ",
            "दस्तावेज़", "कागजात", "क्या दस्तावेज़"
        ]):
            return "DOCUMENT_INQUIRY"

        first_person_tokens = ["i am", "my", "me", "ನನ್ನ", "ನಾನು", "ನನಗೆ", "मैं", "मेरी", "मेरे", "मुझे", "मुझको"]
        has_first_person = any(tok in q for tok in first_person_tokens)
        eligibility_tokens = [
            "am i eligible", "do i qualify", "can i get", "will i get", "receive", "benefits can i", "what benefits",
            "what can i get", "which schemes can i get", "schemes for me", "eligible for",
            "ನನಗೆ ಸಿಗುತ್ತಾ", "ಸಿಗುತ್ತಾ", "ನನ್ನ ಅರ್ಹತೆ", "ಅರ್ಹನೇ", "ಅರ್ಹಳೇ", "ಅರ್ಹತೆ ಇದೆಯೇ",
            "पात्र हूँ", "पात्रता", "मिलेगा", "क्या मुझे", "मुझे क्या मिलेगा", "देखनी चाहिए", "पात्र"
        ]
        if any(w in q for w in eligibility_tokens) and (has_first_person or profile):
            return "PROFILE_ELIGIBILITY"

        if any(w in q for w in [
            "money", "cash", "amount", "benefit", "benefits", "assistance", "how much", "how much assistance",
            "coverage", "cover", "installments",
            "ಎಷ್ಟು ಹಣ", "ಎಷ್ಟು ನೆರವು", "ಲಾಭ", "ವಿಮೆ", "ಸಹಾಯಧನ",
            "कितना पैसा", "कितनी सहायता", "लाभ", "रुपये", "राशि"
        ]):
            return "BENEFIT_INQUIRY"

        if any(w in q for w in ["similar scheme", "other scheme", "compare", "ಯಾವುದಾದರೂ ಇತರ", "ಇನ್ನಿತರ ಯೋಜನೆ", "अन्य योजनाएं", "जैसी दूसरी योजना"]):
            return "COMPARISON"

        if any(w in q for w in ["explain", "simple language", "what is", "tell me about", "ವಿವರಿಸಿ", "ಬಗ್ಗೆ ಹೇಳಿ", "ಏನಿದು", "के बारे में बताएं", "क्या है"]):
            return "SCHEME_EXPLANATION"
        if any(w in q for w in ["available", "list", "explore", "ಲಭ್ಯವಿರುವ", "ಯಾವ ಯೋಜನೆಗಳು", "उपलब्ध योजनाएं", "योजनाओं की सूची"]):
            return "SCHEME_DISCOVERY"

        return "GENERAL_INQUIRY"

    # -------------------------------------------------------------------------
    # 5. Deterministic Profile Eligibility Handling
    # -------------------------------------------------------------------------
    @classmethod
    def _handle_profile_eligibility(
        cls,
        query: str,
        profile: Dict[str, Any],
        active_scheme_id: Optional[str],
        lang: str,
        history: List[VoiceMessage],
        simplicity_mode: bool
    ) -> VoiceChatResponse:
        """Evaluates profile deterministically using verified AST rule engine."""
        schemes = SchemeRepository.get_all_with_criteria()
        profile_input = CitizenProfileInput(**profile)
        eval_result = EligibilityService.evaluate_all(schemes_with_criteria=schemes, profile=profile_input)

        eligible_schemes = eval_result.eligible_schemes
        potential_schemes = eval_result.potentially_eligible_schemes
        ineligible_schemes = eval_result.ineligible_schemes

        # If a specific scheme was asked about, focus on it, UNLESS the citizen asked generally for all benefits/schemes
        is_general_profile_query = any(w in query.lower() for w in [
            "what benefits", "what schemes", "which schemes", "what can i get", "benefits can i",
            "ಯಾವ ಯೋಜನೆಗಳು", "ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ", "ಎಲ್ಲಾ ಯೋಜನೆಗಳು", "ಏನೆಲ್ಲಾ ಸಿಗುತ್ತದೆ",
            "कौन सी योजना", "कौन सी योजनाएं", "क्या क्या लाभ", "योजनाओं की सूची"
        ])

        if active_scheme_id and not is_general_profile_query:
            specific_eval = next(
                (s for s in eligible_schemes + potential_schemes + ineligible_schemes if s.scheme_id == active_scheme_id),
                None
            )
            if specific_eval:
                return cls._synthesize_specific_verdict(
                    specific_eval=specific_eval,
                    lang=lang,
                    profile=profile,
                    simplicity_mode=simplicity_mode
                )

        # Overview of matching schemes (use eligible, or fall back to potential if empty)
        qualifying = eligible_schemes if eligible_schemes else potential_schemes
        eligible_count = len(qualifying)
        scheme_names = [s.scheme_title.get(lang, s.scheme_title.get("en", s.scheme_id)) for s in qualifying[:3]]
        joined_names = ", ".join(scheme_names) if scheme_names else ""

        citations: List[SpokenCitation] = []
        for s in qualifying[:3]:
            scheme_obj = SchemeRepository.get_by_id(s.scheme_id)
            if scheme_obj:
                citations.append(SpokenCitation(
                    scheme_id=s.scheme_id,
                    scheme_name=s.scheme_title.get(lang, s.scheme_title.get("en", s.scheme_id)),
                    official_portal_url=scheme_obj.get("official_portal_url", ""),
                    source_reference_date=scheme_obj.get("source_reference_date", "2024")
                ))

        if lang == "kn":
            if eligible_count > 0:
                spoken = f"ನಿಮ್ಮ ವಿವರಗಳ ಪ್ರಕಾರ, ನೀವು {joined_names} ಸೇರಿದಂತೆ ಒಟ್ಟು {eligible_count} ಯೋಜನೆಗಳಿಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ. ಇವುಗಳ ದಾಖಲೆಗಳ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?"
                display = f"ಪರಿಶೀಲಿಸಿದ ಅರ್ಹತೆ: {eligible_count} ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ.\n\nಅರ್ಹ ಯೋಜನೆಗಳು:\n" + "\n".join([f"• {n}" for n in scheme_names])
            else:
                spoken = "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ವಿವರಗಳ ಪ್ರಕಾರ ನೇರ ಅರ್ಹ ಯೋಜನೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ಹೆಚ್ಚಿನ ಪರಿಶೀಲನೆಗೆ ನಿಮ್ಮ ವಯಸ್ಸು ಅಥವಾ ಜಮೀನಿನ ವಿವರಗಳನ್ನು ತಿಳಿಸುವಿರಾ?"
                display = "ಪ್ರಸ್ತುತ ವಿವರಗಳೊಂದಿಗೆ ಯಾವುದೇ ಯೋಜನೆ ಪೂರ್ಣ ಅರ್ಹತೆ ಹೊಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹೆಚ್ಚುವರಿ ವಿವರಗಳನ್ನು ನೀಡಿ."
            prompts = ["ದಾಖಲೆಗಳೇನು?", "ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?", "ಇತರ ಯೋಜನೆಗಳು"]
        elif lang == "hi":
            if eligible_count > 0:
                spoken = f"आपके विवरण के अनुसार, आप {joined_names} सहित कुल {eligible_count} योजनाओं के लिए पात्र हैं। क्या आप आवश्यक दस्तावेज़ों के बारे में जानना चाहते हैं?"
                display = f"सत्यापित पात्रता: {eligible_count} योजनाएं उपलब्ध हैं।\n\nपात्र योजनाएं:\n" + "\n".join([f"• {n}" for n in scheme_names])
            else:
                spoken = "आपके मौजूदा विवरण के आधार पर कोई सीधी पात्र योजना नहीं मिली। क्या आप अपनी आय या जमीन का विवरण बताएंगे?"
                display = "वर्तमान विवरण से पूर्ण पात्रता नहीं मिली। कृपया अतिरिक्त जानकारी दें।"
            prompts = ["ज़रूरी दस्तावेज़ क्या हैं?", "आवेदन कैसे करें?", "अन्य योजनाएं"]
        else:
            if eligible_count > 0:
                spoken = f"Based on your details, you qualify for {eligible_count} verified schemes including {joined_names}. Would you like to hear the document requirements?"
                display = f"Verified Eligibility: Qualified for {eligible_count} schemes.\n\nEligible Schemes:\n" + "\n".join([f"• {n}" for n in scheme_names])
            else:
                spoken = "Based on the details provided, no direct matching schemes were found. Would you like to share your annual family income or landholding to explore further?"
                display = "No complete eligibility matches for the current profile. Please provide additional demographic details."
            prompts = ["What documents do I need?", "How can I apply?", "Explore other schemes"]

        spoken_clean = NaturalVoicePhoneticsProvider.prepare_spoken_ssml(spoken, lang)
        return VoiceChatResponse(
            spoken_text=spoken_clean,
            display_text=display,
            language=lang,
            dialogue_mode=VoiceDialogueMode.DISCOVERY,
            suggested_spoken_prompts=prompts,
            citations=citations,
            active_scheme_id=qualifying[0].scheme_id if qualifying else None,
            detected_intent="PROFILE_ELIGIBILITY",
            extracted_profile=profile,
            eligible_schemes=[s.scheme_id for s in qualifying]
        )

    @classmethod
    def _synthesize_specific_verdict(
        cls,
        specific_eval: Any,
        lang: str,
        profile: Dict[str, Any],
        simplicity_mode: bool
    ) -> VoiceChatResponse:
        """Explains deterministic pass/fail reasons for a specific scheme."""
        title = specific_eval.scheme_title.get(lang, specific_eval.scheme_title.get("en", specific_eval.scheme_id))
        sid = specific_eval.scheme_id
        scheme_obj = SchemeRepository.get_by_id(sid) or {}
        portal = scheme_obj.get("official_portal_url", "")
        ref_date = scheme_obj.get("source_reference_date", "2024")

        is_eligible = specific_eval.is_eligible
        failed = specific_eval.failed_criteria

        if is_eligible:
            if lang == "kn":
                spoken = f"ಅಭಿನಂದನೆಗಳು! ನೀವು {title} ಯೋಜನೆಗೆ ಸಂಪೂರ್ಣವಾಗಿ ಅರ್ಹರಾಗಿದ್ದೀರಿ. ಇದಕ್ಕೆ ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ ಅಥವಾ ದಾಖಲೆಗಳ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?"
                display = f"ಅರ್ಹತೆ ಪರಿಶೀಲನೆ: {title} ಯೋಜನೆಗೆ ನೀವು ಅರ್ಹರು. ಎಲ್ಲಾ ಶಾಸನಬದ್ಧ ಷರತ್ತುಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ."
            elif lang == "hi":
                spoken = f"बधाई हो! आप {title} के लिए पूरी तरह पात्र हैं। क्या आप आवेदन प्रक्रिया या आवश्यक दस्तावेज़ जानना चाहते हैं?"
                display = f"पात्रता सत्यापन: आप {title} के लिए पात्र हैं। सभी वैधानिक शर्तें पूरी हैं।"
            else:
                spoken = f"Great news! You fully qualify for {title}. Would you like to hear the required documents or application steps?"
                display = f"Eligibility Status: Qualified for {title}. All statutory conditions are satisfied."
        else:
            reason_en = failed[0].explanation.get("en", "Statutory exclusion rule applies") if failed else "Criteria not satisfied"
            reason_kn = failed[0].explanation.get("kn", "ಸರ್ಕಾರಿ ನಿಯಮದಂತೆ ಅರ್ಹತಾ ಷರತ್ತು ಪೂರೈಸಿಲ್ಲ") if failed else "ಅರ್ಹತೆ ಪೂರ್ಣಗೊಂಡಿಲ್ಲ"
            reason_hi = failed[0].explanation.get("hi", "सरकारी नियम के अनुसार पात्रता शर्त पूरी नहीं है") if failed else "पात्रता पूरी नहीं है"

            if lang == "kn":
                spoken = f"ಪರಿಶೀಲಿಸಿದ ನಿಯಮಗಳ ಪ್ರಕಾರ, ನೀವು {title} ಯೋಜನೆಗೆ ಅರ್ಹರಾಗಿಲ್ಲ. ಮುಖ್ಯ ಕಾರಣ: {reason_kn}. ಬೇರೆ ಸೂಕ್ತ ಯೋಜನೆಗಳನ್ನು ಹುಡುಕೋಣವೇ?"
                display = f"ಅರ್ಹತಾ ಫಲಿತಾಂಶ: ಅನರ್ಹ.\nಕಾರಣ: {reason_kn}.\nಅಧಿಕೃತ ಉಲ್ಲೇಖ ದಿನಾಂಕ: {ref_date}"
            elif lang == "hi":
                spoken = f"सत्यापित नियमों के अनुसार, आप {title} के लिए पात्र नहीं हैं। मुख्य कारण: {reason_hi}। क्या हम आपके लिए अन्य योजनाएं खोजें?"
                display = f"पात्रता परिणाम: अपात्र।\nकारण: {reason_hi}।\nआधिकारिक संदर्भ: {ref_date}"
            else:
                spoken = f"According to verified rules, you do not qualify for {title}. Reason: {reason_en}. Would you like to explore other schemes you might qualify for?"
                display = f"Eligibility Verdict: Ineligible.\nReason: {reason_en}.\nVerified reference: {ref_date}"

        spoken_clean = NaturalVoicePhoneticsProvider.prepare_spoken_ssml(spoken, lang)
        prompts = {
            "kn": ["ಬೇಕಾಗುವ ದಾಖಲೆಗಳು", "ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?", "ಇತರ ಯೋಜನೆಗಳು"],
            "hi": ["आवश्यक दस्तावेज़", "आवेदन कैसे करें?", "अन्य योजनाएं"],
            "en": ["Required documents", "How to apply", "Other schemes for me"]
        }
        return VoiceChatResponse(
            spoken_text=spoken_clean,
            display_text=display,
            language=lang,
            dialogue_mode=VoiceDialogueMode.DISCOVERY,
            suggested_spoken_prompts=prompts.get(lang, prompts["en"]),
            citations=[SpokenCitation(scheme_id=sid, scheme_name=title, official_portal_url=portal, source_reference_date=ref_date)],
            active_scheme_id=sid,
            detected_intent="SPECIFIC_VERDICT",
            extracted_profile=profile,
            eligible_schemes=[sid] if is_eligible else []
        )

    # -------------------------------------------------------------------------
    # 6. Dynamic Grounded Voice Synthesis (LLM + Strict Fallback)
    # -------------------------------------------------------------------------
    @classmethod
    def _synthesize_voice_answer(
        cls,
        query: str,
        intent: str,
        lang: str,
        scheme: Optional[Dict[str, Any]],
        chunks: List[RetrievedChunk],
        profile: Dict[str, Any],
        history: List[VoiceMessage],
        simplicity_mode: bool
    ) -> VoiceChatResponse:
        """Synthesizes dynamic question-specific voice responses using Gemini LLM with grounded fallback."""
        active_sid = scheme["id"] if scheme else (chunks[0].scheme_id if chunks else None)
        title = scheme.get("title", {}).get(lang, scheme.get("title", {}).get("en", active_sid or "Government Scheme")) if scheme else "Government Welfare"
        portal = scheme.get("official_portal_url", "") if scheme else (chunks[0].official_portal_url if chunks else "")
        ref_date = scheme.get("source_reference_date", "2024") if scheme else "2024"

        # 1. Try Gemini LLM Dynamic Generation
        if settings.LLM_PROVIDER == "gemini" and settings.LLM_API_KEY:
            try:
                lang_names = {"en": "English", "hi": "Hindi (Devanagari)", "kn": "Kannada"}
                target_lang_name = lang_names.get(lang, "English")

                context_blocks = []
                for idx, c in enumerate(chunks[:5], 1):
                    scheme_t = c.scheme_title.get(lang, c.scheme_title.get("en", c.scheme_id))
                    context_blocks.append(f"--- Document {idx}: {scheme_t} ({c.section_title}) ---\n{c.content}")
                context_str = "\n\n".join(context_blocks)

                history_context = ""
                if history:
                    history_lines = [f"{m.role.capitalize()}: {m.content}" for m in history[-3:]]
                    history_context = "PREVIOUS CONVERSATION TURNS:\n" + "\n".join(history_lines) + "\n\n"

                prompt = (
                    f"You are SchemeSaathi AI, a compassionate, trilingual Indian Government Scheme Voice Assistant.\n"
                    f"A citizen speaking {target_lang_name} asked: '{query}'.\n"
                    f"{history_context}"
                    f"VERIFIED OFFICIAL EXCERPTS:\n{context_str}\n\n"
                    f"INSTRUCTIONS FOR VOICE GENERATION:\n"
                    f"1. QUESTION UNDERSTANDING & CONTEXTUAL REASONING:\n"
                    f"   - Identify the citizen's specific new question ('{query}').\n"
                    f"   - If they ask about APPLICATION STEPS (how/where to apply, procedure), explain the exact steps and portal/centres from the excerpts.\n"
                    f"   - If they ask about DOCUMENTS, list the mandatory documents from the excerpts.\n"
                    f"   - If they ask about BENEFITS or ASSISTANCE, explain the financial/medical benefits from the excerpts.\n"
                    f"   - If they ask about STATUS or MISSING BENEFICIARY LIST, explain the tracking and nodal officer grievance process.\n"
                    f"   - DO NOT repeat the general scheme introduction or annual assistance if they are asking a specific follow-up question.\n"
                    f"2. Generate exactly TWO fields separated by '===DISPLAY_TEXT===':\n"
                    f"   Field 1 (SPOKEN_TEXT): Exactly 1 to 3 short, warm, natural spoken sentences in {target_lang_name}.\n"
                    f"   - Must answer the citizen's specific question directly.\n"
                    f"   - NEVER read raw website URLs aloud (say 'visit your local CSC, Grama One, or official portal').\n"
                    f"   - Say currency numbers as words (e.g. 6 thousand rupees / 6 ಸಾವಿರ ರೂಪಾಯಿ / 6 हजार रुपये).\n"
                    f"   - Avoid bureaucratic jargon; speak clearly for citizens with limited literacy.\n"
                    f"   Field 2 (DISPLAY_TEXT): Clean, well-structured visual explanation for the phone screen with bullet points and key facts.\n"
                    f"3. Answer ONLY using the verified official excerpts. If information is missing, clearly explain the limitation.\n\n"
                    f"RESPONSE FORMAT:\n"
                    f"SPOKEN_TEXT in {target_lang_name}\n"
                    f"===DISPLAY_TEXT===\n"
                    f"DISPLAY_TEXT in {target_lang_name}"
                )

                llm_client = GeminiClient(model=settings.LLM_MODEL, timeout=4.5, max_retries=1)
                generated = llm_client.generate(prompt=prompt, temperature=0.1, max_output_tokens=600)

                if generated and "===DISPLAY_TEXT===" in generated:
                    parts = generated.split("===DISPLAY_TEXT===", 1)
                    spoken_raw = parts[0].strip()
                    display_raw = parts[1].strip()
                    spoken_clean = NaturalVoicePhoneticsProvider.prepare_spoken_ssml(spoken_raw, lang)

                    citations = []
                    if active_sid and portal:
                        citations.append(SpokenCitation(
                            scheme_id=active_sid,
                            scheme_name=title,
                            official_portal_url=portal,
                            source_reference_date=ref_date
                        ))

                    prompts = cls._generate_dynamic_prompts(active_sid, intent, lang)
                    return VoiceChatResponse(
                        spoken_text=spoken_clean,
                        display_text=display_raw,
                        language=lang,
                        dialogue_mode=VoiceDialogueMode.DISCOVERY,
                        suggested_spoken_prompts=prompts,
                        citations=citations,
                        active_scheme_id=active_sid,
                        detected_intent=intent,
                        extracted_profile=profile
                    )
            except Exception as e:
                logger.warning("Voice LLM synthesis failed, using dynamic grounded fallback: %s", str(e))

        # 2. Dynamic Grounded Fallback (Rich, question-specific, zero repetition)
        return cls._dynamic_grounded_fallback(
            query=query,
            intent=intent,
            lang=lang,
            scheme=scheme,
            chunks=chunks,
            profile=profile,
            active_sid=active_sid,
            title=title,
            portal=portal,
            ref_date=ref_date
        )

    # -------------------------------------------------------------------------
    # 7. Dynamic Grounded Fallback Synthesizer
    # -------------------------------------------------------------------------
    @classmethod
    def _dynamic_grounded_fallback(
        cls,
        query: str,
        intent: str,
        lang: str,
        scheme: Optional[Dict[str, Any]],
        chunks: List[RetrievedChunk],
        profile: Dict[str, Any],
        active_sid: Optional[str],
        title: str,
        portal: str,
        ref_date: str
    ) -> VoiceChatResponse:
        """Constructs specific, dynamic voice answers using verified scheme chunks without static repetition."""
        spoken = ""
        display = ""

        if scheme:
            if intent == "BENEFIT_INQUIRY":
                benefits = scheme.get("benefits", [])
                amt = benefits[0].get("amount_description", {}).get(lang, benefits[0].get("amount_description", {}).get("en", "Direct financial support")) if benefits else "Financial assistance"
                if lang == "kn":
                    spoken = f"{title} ಯೋಜನೆಯಡಿ ಅರ್ಹ ಫಲಾನುಭವಿಗಳಿಗೆ {amt} ಸಿಗುತ್ತದೆ. ನಿಮ್ಮ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಲು ಬಯಸುವಿರಾ?"
                    display = f"ಆರ್ಥಿಕ ಸೌಲಭ್ಯಗಳು ({title}):\n• {amt}\n\nಅಧಿಕೃತ ಪೋರ್ಟಲ್: {portal}\nಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ."
                elif lang == "hi":
                    spoken = f"{title} के अंतर्गत पात्र नागरिकों को {amt} का प्रत्यक्ष लाभ दिया जाता है। क्या आप अपनी पात्रता जांचना चाहते हैं?"
                    display = f"वित्तीय सहायता एवं लाभ ({title}):\n• {amt}\n\nआधिकारिक पोर्टल: {portal}\nआवेदन के लिए नजदीकी सीएससी या आधिकारिक पोर्टल देखें।"
                else:
                    spoken = f"Under {title}, eligible beneficiaries receive {amt}. Would you like to check if you qualify?"
                    display = f"Financial Entitlements ({title}):\n• {amt}\n\nOfficial Portal: {portal}\nVisit your nearest Common Service Centre or official portal to apply."

            elif intent == "DOCUMENT_INQUIRY":
                docs = scheme.get("documents", [])
                doc_names = [d.get("document_name", {}).get(lang, d.get("document_name", {}).get("en", d.get("document_code", ""))) for d in docs]
                joined = ", ".join(doc_names[:3]) if doc_names else "Aadhaar Card and Bank Passbook"
                if lang == "kn":
                    spoken = f"{title} ಯೋಜನೆಗೆ ಮುಖ್ಯವಾಗಿ {joined} ಅಗತ್ಯವಿದೆ. ಈ ದಾಖಲೆಗಳು ನಿಮ್ಮ ಬಳಿ ಇವೆಯೇ?"
                    display = f"ಕಡ್ಡಾಯ ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳು ({title}):\n" + "\n".join([f"• {d}" for d in doc_names]) + f"\n\nಅಧಿಕೃತ ಪೋರ್ಟಲ್: {portal}"
                elif lang == "hi":
                    spoken = f"{title} के लिए मुख्य रूप से {joined} की आवश्यकता होती है। क्या ये आपके पास उपलब्ध हैं?"
                    display = f"आवश्यक आधिकारिक दस्तावेज़ ({title}):\n" + "\n".join([f"• {d}" for d in doc_names]) + f"\n\nआधिकारिक पोर्टल: {portal}"
                else:
                    spoken = f"For {title}, the primary verified documents needed are {joined}. Do you have these ready?"
                    display = f"Mandatory Verification Documents ({title}):\n" + "\n".join([f"• {d}" for d in doc_names]) + f"\n\nOfficial Portal: {portal}"

            elif intent == "APPLICATION_INQUIRY":
                steps = scheme.get("application_steps", [])
                step_texts = [st.get(lang, st.get("en", "")) for st in steps if st.get(lang, st.get("en", ""))]
                if lang == "kn":
                    if step_texts:
                        s1 = step_texts[0]
                        s2 = step_texts[1] if len(step_texts) > 1 else "ದಾಖಲೆಗಳನ್ನು ಸಲ್ಲಿಸಿ"
                        spoken = f"{title} ಯೋಜನೆಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಲು: ಮೊದಲ ಹಂತ {s1}, ಎರಡನೇ ಹಂತ {s2}. ನೀವು ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್ಸಿ ಕೇಂದ್ರದಲ್ಲಿ ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು."
                        display = f"ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಅಧಿಕೃತ ವಿಧಾನ ({title}):\n" + "\n".join([f"• ಹಂತ {i+1}: {t}" for i, t in enumerate(step_texts)]) + f"\n\nಅಧಿಕೃತ ಪೋರ್ಟಲ್: {portal}\nಅರ್ಜಿ ಕೇಂದ್ರ: ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರ"
                    else:
                        spoken = f"{title} ಯೋಜನೆಗೆ ನಿಮ್ಮ ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್ಸಿ ಕೇಂದ್ರದಲ್ಲಿ ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು."
                        display = f"ಅರ್ಜಿ ಪ್ರಕ್ರಿಯೆ ({title}):\n• ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.\n• ಅಧಿಕೃತ ಪೋರ್ಟಲ್: {portal}"
                elif lang == "hi":
                    if step_texts:
                        s1 = step_texts[0]
                        s2 = step_texts[1] if len(step_texts) > 1 else "दस्तावेज़ जमा करें"
                        spoken = f"{title} के लिए आवेदन करने हेतु: पहला कदम {s1}, दूसरा कदम {s2}। आप नजदीकी सीएससी या पोर्टल से आवेदन कर सकते हैं।"
                        display = f"आवेदन की आधिकारिक प्रक्रिया ({title}):\n" + "\n".join([f"• चरण {i+1}: {t}" for i, t in enumerate(step_texts)]) + f"\n\nआधिकारिक पोर्टल: {portal}\nआवेदन केंद्र: कॉमन सर्विस सेंटर (सीएससी)"
                    else:
                        spoken = f"{title} के लिए आप नजदीकी कॉमन सर्विस सेंटर या आधिकारिक पोर्टल से आवेदन कर सकते हैं।"
                        display = f"आवेदन प्रक्रिया ({title}):\n• नजदीकी सीएससी या आधिकारिक पोर्टल।\n• आधिकारिक पोर्टल: {portal}"
                else:
                    if step_texts:
                        s1 = step_texts[0]
                        s2 = step_texts[1] if len(step_texts) > 1 else "submit verification documents"
                        spoken = f"To apply for {title}: Step 1 is to {s1}, and Step 2 is to {s2}. You can complete this at your nearest Common Service Centre or official portal."
                        display = f"Official Application Steps ({title}):\n" + "\n".join([f"• Step {i+1}: {t}" for i, t in enumerate(step_texts)]) + f"\n\nOfficial Portal: {portal}\nNearest Centre: Common Service Centre (CSC) or Grama One"
                    else:
                        spoken = f"You can apply for {title} online via the official portal or visit your nearest Common Service Centre."
                        display = f"Application Process ({title}):\n• Official Portal: {portal}\n• Nearest Common Service Centre"

            elif intent == "STATUS_OR_MISSING_INQUIRY":
                if lang == "kn":
                    spoken = f"ನಿಮ್ಮ ಅರ್ಜಿಯ ಸ್ಥಿತಿಯನ್ನು ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ 'Know Your Status' ಮೂಲಕ ಪರಿಶೀಲಿಸಬಹುದು. ಹೆಸರು ಪಟ್ಟಿಯಲ್ಲಿ ಇಲ್ಲದಿದ್ದರೆ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ ನೋಡಲ್ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ."
                    display = f"ಅರ್ಜಿ ಸ್ಥಿತಿ ಮತ್ತು ಫಲಾನುಭವಿ ಪಟ್ಟಿ ಪರಿಶೀಲನೆ ({title}):\n• ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ನೋಂದಣಿ ಸಂಖ್ಯೆ ಅಥವಾ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಮೂಲಕ ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ.\n• ಹೆಸರು ಪಟ್ಟಿಯಲ್ಲಿ ಕಾಣದಿದ್ದರೆ ಗ್ರಾಮ ಪಂಚಾಯಿತಿ / ಗ್ರಾಮ ಆಡಳಿತ ಅಧಿಕಾರಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.\n• ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಆಧಾರ್ ಲಿಂಕ್ ಮತ್ತು ಇ-ಕೆವೈಸಿ ಪೂರ್ಣಗೊಂಡಿರುವುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಿ.\n• ಅಧಿಕೃತ ಪೋರ್ಟಲ್: {portal}"
                elif lang == "hi":
                    spoken = f"आप अपने आवेदन की स्थिति आधिकारिक पोर्टल पर 'Know Your Status' से जांच सकते हैं। यदि लाभार्थी सूची में नाम नहीं है, तो अपने ग्राम नोडल अधिकारी से संपर्क करें।"
                    display = f"आवेदन स्थिति एवं लाभार्थी सूची ({title}):\n• आधिकारिक पोर्टल पर रजिस्ट्रेशन नंबर या आधार नंबर दर्ज कर स्थिति जांचें।\n• सूची में नाम न होने पर ग्राम पंचायत नोडल अधिकारी से संपर्क करें।\n• बैंक खाते में आधार सीडिंग (DBT) और eKYC की पुष्टि करें।\n• आधिकारिक पोर्टल: {portal}"
                else:
                    spoken = f"You can track your application status on the official portal under 'Know Your Status'. If your name is missing from the beneficiary list, contact your Village Nodal Officer or Agriculture Office."
                    display = f"Application Status & Beneficiary List ({title}):\n• Track status on the official portal using your Registration or Aadhaar number.\n• If your name is missing, consult your Village Nodal Officer or local Agriculture Department.\n• Ensure your bank account is active with Aadhaar DBT seeding and eKYC completed.\n• Official Portal: {portal}"

            elif intent == "COMPARISON":
                cat = scheme.get("category", "")
                related = [s for s in SchemeRepository.get_all_published() if s.get("category") == cat and s["id"] != scheme["id"]]
                rel_names = [s.get("title", {}).get(lang, s.get("title", {}).get("en", s["id"])) for s in related[:2]]
                rel_joined = ", ".join(rel_names) if rel_names else "other welfare schemes"
                if lang == "kn":
                    spoken = f"{title} ಜೊತೆಗೆ ಇದೇ ವಿಭಾಗದಲ್ಲಿ {rel_joined} ಯೋಜನೆಗಳೂ ಲಭ್ಯವಿವೆ. ಇವುಗಳ ವಿವರ ತಿಳಿಯಲು ಬಯಸುವಿರಾ?"
                    display = f"ಹೋಲಿಕೆಯ ಯೋಜನೆಗಳು:\n• {title}\n" + "\n".join([f"• {r}" for r in rel_names])
                elif lang == "hi":
                    spoken = f"{title} के अलावा इसी श्रेणी में {rel_joined} भी उपलब्ध हैं। क्या आप इनके बारे में जानना चाहते हैं?"
                    display = f"समान योजनाएं:\n• {title}\n" + "\n".join([f"• {r}" for r in rel_names])
                else:
                    spoken = f"In addition to {title}, related options include {rel_joined}. Would you like to explore those?"
                    display = f"Related Welfare Schemes:\n• {title}\n" + "\n".join([f"• {r}" for r in rel_names])

            else:
                # Overview / Explanation
                short_desc = scheme.get("short_description", {}).get(lang, scheme.get("short_description", {}).get("en", ""))
                if lang == "kn":
                    spoken = f"{title}. {short_desc}. ನಿಮ್ಮ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಲು ಬಯಸುವಿರಾ?"
                    display = f"{title}\n\n{short_desc}\n\nಅಧಿಕೃತ ಪೋರ್ಟಲ್: {portal}"
                elif lang == "hi":
                    spoken = f"{title}। {short_desc}। क्या आप अपनी पात्रता जांचना चाहते हैं?"
                    display = f"{title}\n\n{short_desc}\n\nआधिकारिक पोर्टल: {portal}"
                else:
                    spoken = f"{title}. {short_desc}. Would you like to check if you qualify?"
                    display = f"{title}\n\n{short_desc}\n\nOfficial Portal: {portal}"
        elif chunks:
            lead = chunks[0]
            stitle = lead.scheme_title.get(lang, lead.scheme_title.get("en", lead.scheme_id))
            if lang == "kn":
                spoken = f"ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳ ಪ್ರಕಾರ, {stitle} ಯೋಜನೆಯಡಿ ಈ ಸೌಲಭ್ಯ ಲಭ್ಯವಿದೆ. ಹೆಚ್ಚಿನ ವಿವರ ಅಥವಾ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಲು ಬಯಸುವಿರಾ?"
                display = f"{stitle} ({lead.section_title}):\n{lead.content}\n\nಅಧಿಕೃತ ಪೋರ್ಟಲ್: {lead.official_portal_url}"
            elif lang == "hi":
                spoken = f"सत्यापित रिकॉर्ड के अनुसार, {stitle} के तहत यह प्रावधान उपलब्ध है। क्या आप पात्रता जांचना चाहते हैं?"
                display = f"{stitle} ({lead.section_title}):\n{lead.content}\n\nआधिकारिक पोर्टल: {lead.official_portal_url}"
            else:
                spoken = f"According to verified records for {stitle}, this welfare provision is available. Would you like to check if you qualify?"
                display = f"{stitle} ({lead.section_title}):\n{lead.content}\n\nOfficial Portal: {lead.official_portal_url}"
        else:
            if lang == "kn":
                spoken = "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ಅಧಿಕೃತ ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್ಸಿ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ."
                display = "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಅಧಿಕೃತ ದಾಖಲೆಗಳು ಲಭ್ಯವಿಲ್ಲ. ದಯವಿಟ್ಟು ಅಧಿಕೃತ ಸಚಿವಾಲಯದ ಪೋರ್ಟಲ್ ಅಥವಾ ಗ್ರಾಮ ಒನ್ ಕೇಂದ್ರ ಸಂಪರ್ಕಿಸಿ."
            elif lang == "hi":
                spoken = "आपके प्रश्न से संबंधित कोई सत्यापित आधिकारिक रिकॉर्ड नहीं मिला। कृपया निकटतम कॉमन सर्विस सेंटर से संपर्क करें।"
                display = "सत्यापित रिकॉर्ड में यह जानकारी उपलब्ध नहीं है। कृपया नजदीकी सीएससी या मंत्रालय पोर्टल देखें।"
            else:
                spoken = "We could not find verified official records answering your specific question. Please consult your nearest Common Service Centre or ministry portal."
                display = "No verified records found for this query. Please consult your nearest Common Service Centre (CSC) or official ministry portal."

        spoken_clean = NaturalVoicePhoneticsProvider.prepare_spoken_ssml(spoken, lang)
        citations = []
        if active_sid and portal:
            citations.append(SpokenCitation(
                scheme_id=active_sid,
                scheme_name=title,
                official_portal_url=portal,
                source_reference_date=ref_date
            ))

        prompts = cls._generate_dynamic_prompts(active_sid, intent, lang)
        confidence = 0.0 if (not active_sid and not chunks) else 1.0
        return VoiceChatResponse(
            spoken_text=spoken_clean,
            display_text=display,
            language=lang,
            dialogue_mode=VoiceDialogueMode.DISCOVERY,
            suggested_spoken_prompts=prompts,
            citations=citations,
            confidence_score=confidence,
            active_scheme_id=active_sid,
            detected_intent=intent,
            extracted_profile=profile
        )

    # -------------------------------------------------------------------------
    # 8. Dynamic Follow-Up Spoken Prompts
    # -------------------------------------------------------------------------
    @classmethod
    def _generate_dynamic_prompts(cls, scheme_id: Optional[str], intent: str, lang: str) -> List[str]:
        """Generates dynamic spoken suggestions matching the active scheme and intent."""
        if lang == "kn":
            if scheme_id == "pm-kisan":
                return ["ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ", "ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?", "ವರ್ಷಕ್ಕೆ ಎಷ್ಟು ಹಣ ಸಿಗುತ್ತದೆ?"]
            if scheme_id == "ayushman-bharat-pmjay":
                return ["5 ಲಕ್ಷ ಉಚಿತ ಚಿಕಿತ್ಸೆ ಹೇಗೆ?", "ಯಾವ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಲಭ್ಯ?", "ಕಾರ್ಡ್ ಮಾಡಿಸುವುದು ಹೇಗೆ?"]
            if scheme_id == "pms-sc":
                return ["ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಯಾರು ಅರ್ಹರು?", "ಆದಾಯ ಮಿತಿ ಎಷ್ಟು?", "ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?"]
            if intent == "DOCUMENT_INQUIRY":
                return ["ಅರ್ಜಿ ಎಲ್ಲಿ ಸಲ್ಲಿಸಬೇಕು?", "ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ", "ಇತರ ಯೋಜನೆಗಳು"]
            return ["ರೈತರ ಯೋಜನೆಗಳು", "ಆರೋಗ್ಯ ಕಾರ್ಡ್", "ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು"]
        elif lang == "hi":
            if scheme_id == "pm-kisan":
                return ["मेरी पात्रता जांचें", "आवश्यक दस्तावेज़", "सालाना कितना लाभ मिलेगा?"]
            if scheme_id == "ayushman-bharat-pmjay":
                return ["5 लाख का मुफ्त इलाज कैसे मिलेगा?", "कौन से अस्पताल शामिल हैं?", "आयुष्मान कार्ड कैसे बनाएं?"]
            if scheme_id == "pms-sc":
                return ["छात्रवृत्ति के लिए कौन पात्र है?", "आय सीमा क्या है?", "आवेदन कैसे करें?"]
            if intent == "DOCUMENT_INQUIRY":
                return ["आवेदन कहाँ करें?", "मेरी पात्रता जांचें", "अन्य योजनाएं"]
            return ["किसानों की योजनाएं", "स्वास्थ्य कार्ड", "छात्रवृत्ति योजनाएं"]
        else:
            if scheme_id == "pm-kisan":
                return ["Check my eligibility", "What documents are needed?", "How much is paid annually?"]
            if scheme_id == "ayushman-bharat-pmjay":
                return ["How does the 5 lakh cover work?", "Which hospitals are covered?", "How to get the card?"]
            if scheme_id == "pms-sc":
                return ["Who is eligible for scholarship?", "What is the income ceiling?", "How to apply?"]
            if intent == "DOCUMENT_INQUIRY":
                return ["Where do I apply?", "Check my eligibility", "Explore similar schemes"]
            return ["Schemes for farmers", "Healthcare schemes", "Student scholarships"]

    # -------------------------------------------------------------------------
    # 9. Guardrails: Greetings, Hoaxes & Illegal Requests
    # -------------------------------------------------------------------------
    @classmethod
    def _is_greeting_or_identity(cls, q_norm: str) -> bool:
        greetings = ["hi", "hello", "hey", "namaste", "namaskara", "namaskar", "good morning", "good evening", "ಹಲೋ", "ನಮಸ್ಕಾರ", "ನಮಸ್ತೆ", "नमस्ते", "प्रणाम"]
        identity = ["who are you", "what is your name", "what can you do", "who created you", "ಯಾರು ನೀವು", "ನಿಮ್ಮ ಹೆಸರೇನು", "आप कौन हैं", "तुम्हारा नाम क्या है"]
        if q_norm in greetings or any(q_norm == g or q_norm.startswith(g + " ") for g in greetings):
            return True
        if q_norm in ["help", "help me", "ಸಹಾಯ", "ಮದದ್", "मदद"]:
            return True
        if any(id_q in q_norm for id_q in identity):
            return True
        return False

    @classmethod
    def _generate_greeting_response(cls, lang: str) -> VoiceChatResponse:
        greetings = {
            "kn": {
                "spoken": "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ. ನೀವು ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಕಾರ್ಡ್, ವಿದ್ಯಾರ್ಥಿವೇತನ ಅಥವಾ ವಸತಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ನಿಮಗೆ ಯಾವ ಮಾಹಿತಿ ಬೇಕು?",
                "display": "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಮತ್ತು ನಿಮ್ಮ ಅರ್ಹತೆಯನ್ನು ತಿಳಿಯಲು ನೇರವಾಗಿ ಮಾತನಾಡಿ.",
                "prompts": ["ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ", "ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಕಾರ್ಡ್", "ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ"]
            },
            "hi": {
                "spoken": "नमस्ते! मैं स्कीमसाथी आवाज़ सहायक हूँ। आप मुझसे पीएम-किसान, आयुष्मान भारत स्वास्थ्य कार्ड, छात्रवृत्ति या आवास योजनाओं के बारे में पूछ सकते हैं। आप क्या जानना चाहते हैं?",
                "display": "नमस्ते! मैं स्कीमसाथी वॉइस असिस्टेंट हूँ। केंद्र सरकार की योजनाओं की जानकारी और पात्रता के लिए बोलें।",
                "prompts": ["पीएम-किसान योजना", "आयुष्मान भारत कार्ड", "मेरी पात्रता जांचें"]
            },
            "en": {
                "spoken": "Hello! I am your SchemeSaathi voice assistant. You can speak to me about farmer support, free healthcare, scholarships, or pensions. How can I help you today?",
                "display": "Hello! I am your SchemeSaathi voice assistant. Speak naturally to discover welfare schemes and evaluate your eligibility.",
                "prompts": ["Tell me about PM-KISAN", "How to get Ayushman Card?", "Check my eligibility"]
            }
        }
        res = greetings.get(lang, greetings["en"])
        return VoiceChatResponse(
            spoken_text=res["spoken"],
            display_text=res["display"],
            language=lang,
            dialogue_mode=VoiceDialogueMode.DISCOVERY,
            suggested_spoken_prompts=res["prompts"],
            citations=[]
        )

    @classmethod
    def _check_hoax_or_illegal_queries(cls, q_norm: str, lang: str) -> Optional[VoiceChatResponse]:
        hoaxes = ["free iphone", "free smartphone", "free laptop", "flight ticket", "free flight", "ಉಚಿತ ಐಫೋನ್", "ಉಚಿತ ಸ್ಮಾರ್ಟ್‌ಫೋನ್", "ವಿಮಾನ ಟಿಕೆಟ್", "मुफ्त आईफोन", "मुफ्त स्मार्टफोन", "हवाई टिकट"]
        if any(h in q_norm for h in hoaxes):
            msgs = {
                "kn": ("ಎಚ್ಚರಿಕೆ: ಉಚಿತ ಸ್ಮಾರ್ಟ್‌ಫೋನ್ ಅಥವಾ ವಿಮಾನ ಟಿಕೆಟ್ ನೀಡುವ ಯಾವುದೇ ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಲ್ಲ. ದಯವಿಟ್ಟು ವಂಚನೆಗಳಿಂದ ದೂರವಿರಿ.", "ಎಚ್ಚರಿಕೆ: ಉಚಿತ ಮೊಬೈಲ್ ಅಥವಾ ವಿಮಾನ ಟಿಕೆಟ್ ಕೊಡುವ ಯಾವುದೇ ಅಧಿಕೃತ ಯೋಜನೆ ಇಲ್ಲ. ವಂಚನೆಯ ಸಂದೇಶಗಳನ್ನು ನಂಬಬೇಡಿ."),
                "hi": ("चेतावनी: मुफ्त स्मार्टफोन या हवाई टिकट देने वाली कोई भी सरकारी योजना नहीं है। कृपया धोखाधड़ी से सावधान रहें।", "चेतावनी: मुफ्त स्मार्टफोन या हवाई टिकट का कोई सरकारी प्रावधान नहीं है। सतर्क रहें।"),
                "en": ("Warning: There are no verified government schemes offering free smartphones, iPhones, or commercial flight tickets. Please beware of fraudulent messages.", "Warning: No verified government schemes provide free smartphones or airline tickets. Beware of fraud.")
            }
            spoken, display = msgs.get(lang, msgs["en"])
            return VoiceChatResponse(
                spoken_text=spoken,
                display_text=display,
                language=lang,
                dialogue_mode=VoiceDialogueMode.DISCOVERY,
                suggested_spoken_prompts=["ರೈತರ ಯೋಜನೆಗಳು", "ಆರೋಗ್ಯ ಕಾರ್ಡ್", "ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು"] if lang == "kn" else ["किसान योजनाएं", "स्वास्थ्य कार्ड"] if lang == "hi" else ["PM-KISAN", "Ayushman Bharat"],
                citations=[]
            )
        return None
