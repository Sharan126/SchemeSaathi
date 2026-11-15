"""Grounded Multilingual Scheme Q&A Synthesis with Strict Citation Guardrails"""

from typing import List, Dict, Any, Optional
import httpx
from pydantic import BaseModel, Field
from app.core.config import settings
from app.modules.rag.hybrid_search import HybridSearchEngine, RetrievedChunk
from app.modules.rag.gemini_client import GeminiClient


class Citation(BaseModel):
    scheme_id: str
    scheme_name: str
    section_title: str
    official_portal_url: str
    gazette_notification_url: Optional[str] = None
    source_reference_date: str


class GroundedAnswerResponse(BaseModel):
    query: str
    locale: str
    answer: str
    is_grounded: bool
    confidence_score: float
    citations: List[Citation] = Field(default_factory=list)
    retrieved_chunks: List[RetrievedChunk] = Field(default_factory=list)


class GroundedQAService:
    @classmethod
    def answer_query(
        cls,
        query: str,
        locale: str,
        all_chunks: List[Dict[str, Any]],
        category_filter: Optional[str] = None
    ) -> GroundedAnswerResponse:
        """
        Synthesizes an answer grounded exclusively in retrieved official scheme text chunks.
        Strictly forbids hallucination and provides verifiable source citations.
        """
        # 0. Handle friendly conversational greetings, self-introductions, and bot identity
        q_norm = query.lower().strip(" .!?,;:")
        greeting_prefixes = ["hi", "hello", "hey", "namaste", "namaskara", "namaskar", "good morning", "good evening", "good afternoon"]
        identity_queries = [
            "who are you", "what is your name", "what's your name", "whats your name",
            "what is ur name", "what are you", "what can you do", "help", "who created you",
            "who built you", "who made you", "what is schemesaathi", "about you"
        ]
        self_intro_prefixes = ["i am ", "im ", "i'm ", "my name is ", "myself "]
        
        is_greeting = (
            q_norm in greeting_prefixes
            or any(q_norm.startswith(g + " ") for g in greeting_prefixes)
            or q_norm in identity_queries
            or any(q_norm.startswith(p) for p in self_intro_prefixes)
        )

        if is_greeting:
            greeting_answers = {
                "en": (
                    "Hello! I am SchemeSaathi, your digital assistant for Central Government schemes. "
                    "How can I assist you today? You can ask me about schemes for farmers (PM-KISAN), "
                    "healthcare (Ayushman Bharat PM-JAY), scholarships (PMS-SC), girl child savings "
                    "(Sukanya Samriddhi Yojana), rural housing (PMAY-G), or explore your eligibility in the Eligibility Wizard."
                ),
                "hi": (
                    "नमस्ते! मैं स्कीमसाथी हूँ, आपका केंद्र सरकार की योजनाओं का आधिकारिक डिजिटल सहायक। "
                    "आज मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे किसान सम्मान निधि (पीएम-किसान), "
                    "आयुष्मान भारत स्वास्थ्य योजना, पोस्ट-मैट्रिक छात्रवृत्ति, सुकन्या समृद्धि योजना, "
                    "या ग्रामीण आवास योजना के बारे में पूछ सकते हैं।"
                ),
                "kn": (
                    "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ, ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ನಿಮ್ಮ ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ಸಹಾಯಕ. "
                    "ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ನೀವು ರೈತರ ಯೋಜನೆಗಳು (ಪಿಎಂ-ಕಿಸಾನ್), "
                    "ಆರೋಗ್ಯ ವಿಮೆ (ಆಯುಷ್ಮಾನ್ ಭಾರತ್), ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು, ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ ಅಥವಾ "
                    "ಗ್ರಾಮೀಣ ವಸತಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು."
                )
            }
            return GroundedAnswerResponse(
                query=query,
                locale=locale,
                answer=greeting_answers.get(locale, greeting_answers["en"]),
                is_grounded=True,
                confidence_score=1.0,
                citations=[],
                retrieved_chunks=[]
            )

        # 0a. Handle gratitude and conversational closures
        gratitude_phrases = ["thank you", "thanks", "thank you so much", "dhanyawad", "dhanyavad", "dhanyavadagalu", "bye", "goodbye", "see you"]
        if q_norm in gratitude_phrases or any(q_norm.startswith(gp) for gp in ["thank you", "thanks", "dhanyawad", "dhanyavad"]):
            gratitude_msgs = {
                "en": "You're very welcome! If you have any more questions about Central Government schemes or need to check your eligibility, I am always here to help. Have a wonderful day!",
                "hi": "आपका बहुत-बहुत स्वागत है! यदि आपके पास केंद्र सरकार की योजनाओं के बारे में कोई अन्य प्रश्न हैं या पात्रता जांचना चाहते हैं, तो मैं हमेशा आपकी सहायता के लिए तैयार हूँ। आपका दिन शुभ हो!",
                "kn": "ನಿಮಗೆ ಸ್ವಾಗತ! ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ನಿಮಗೆ ಹೆಚ್ಚಿನ ಪ್ರಶ್ನೆಗಳಿದ್ದರೆ ಅಥವಾ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಲು ಬಯಸಿದರೆ, ನಾನು ಯಾವಾಗಲೂ ಸಹಾಯ ಮಾಡಲು ಇಲ್ಲಿದ್ದೇನೆ. ಶುಭ ದಿನ!"
            }
            return GroundedAnswerResponse(
                query=query,
                locale=locale,
                answer=gratitude_msgs.get(locale, gratitude_msgs["en"]),
                is_grounded=True,
                confidence_score=1.0,
                citations=[],
                retrieved_chunks=[]
            )

        # 0b. Detect viral welfare hoaxes, fraudulent giveaways, or non-existent claims
        hoax_keywords = ["free iphone", "free smartphone", "free laptop", "international flight", "flight ticket", "free flight"]
        if any(h in q_norm for h in hoax_keywords):
            hoax_msgs = {
                "en": "Warning: There are no verified Central Government schemes offering free smartphones, iPhones, or commercial flight tickets. We could not find verified official records answering your specific question. Please beware of fraudulent claims and consult official ministry portals or your nearest Common Service Centre (CSC).",
                "hi": "चेतावनी: केंद्र सरकार की ऐसी कोई सत्यापित योजना नहीं है जो मुफ्त स्मार्टफोन, आईफोन या हवाई टिकट प्रदान करती हो। हमें आपके प्रश्न से संबंधित कोई सत्यापित आधिकारिक रिकॉर्ड नहीं मिला। कृपया धोखाधड़ी से सावधान रहें और आधिकारिक मंत्रालय पोर्टल या निकटतम सीएससी से संपर्क करें।",
                "kn": "ಎಚ್ಚರಿಕೆ: ಉಚಿತ ಸ್ಮಾರ್ಟ್‌ಫೋನ್, ಐಫೋನ್ ಅಥವಾ ವಿಮಾನ ಟಿಕೆಟ್ ನೀಡುವ ಯಾವುದೇ ಅಧಿಕೃತ ಕೇಂದ್ರ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳಿಲ್ಲ. ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ಅಧಿಕೃತ ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ವಂಚನೆಗಳಿಂದ ದೂರವಿರಿ ಮತ್ತು ಅಧಿಕೃತ ಇಲಾಖಾ ಪೋರ್ಟಲ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ."
            }
            return GroundedAnswerResponse(
                query=query,
                locale=locale,
                answer=hoax_msgs.get(locale, hoax_msgs["en"]),
                is_grounded=False,
                confidence_score=0.0,
                citations=[],
                retrieved_chunks=[]
            )

        # 0c. Intercept illegal document forgery or verification bypass requests
        illegal_keywords = ["forge", "fake", "bypass aadhaar", "bypass verification", "counterfeit", "hack", "জাল"]
        if any(ik in q_norm for ik in illegal_keywords):
            illegal_msgs = {
                "en": "SchemeSaathi strictly prohibits providing instructions for document forgery, falsification, or bypassing statutory verification procedures. All welfare applications are subject to biometric and legal verification under Indian law.",
                "hi": "स्कीमसाथी दस्तावेज जालसाजी, नकली प्रमाण पत्र या वैधानिक सत्यापन प्रक्रियाओं को बायपास करने के निर्देशों को सख्ती से प्रतिबंधित करता है। सभी कल्याणकारी आवेदन भारतीय कानून के तहत बायोमेट्रिक और कानूनी सत्यापन के अधीन हैं।",
                "kn": "ದಾಖಲೆ ನಕಲಿಸುವುದು ಅಥವಾ ಪರಿಶೀಲನಾ ಪ್ರಕ್ರಿಯೆಗಳನ್ನು ಬೈಪಾಸ್ ಮಾಡುವ ಯಾವುದೇ ಮಾರ್ಗದರ್ಶನವನ್ನು ಸ್ಕೀಮ್‌ಸಾಥಿ ಕಟ್ಟುನಿಟ್ಟಾಗಿ ನಿರಾಕರಿಸುತ್ತದೆ. ಎಲ್ಲಾ ಅರ್ಜಿಗಳು ಭಾರತೀಯ ಕಾನೂನಿನಡಿ ಕಡ್ಡಾಯ ಪರಿಶೀಲನೆಗೆ ಒಳಪಟ್ಟಿರುತ್ತವೆ."
            }
            return GroundedAnswerResponse(
                query=query,
                locale=locale,
                answer=illegal_msgs.get(locale, illegal_msgs["en"]),
                is_grounded=False,
                confidence_score=0.0,
                citations=[],
                retrieved_chunks=[]
            )

        # 0d. Intercept general trivia, coding, or clearly non-welfare requests
        chitchat_or_trivia = [
            "tell me a joke", "what is the weather", "current weather", "who is the prime minister",
            "write a python", "write code", "recipe", "play music", "sing a song", "movie"
        ]
        if any(t in q_norm for t in chitchat_or_trivia):
            trivia_msgs = {
                "en": "I am SchemeSaathi, an AI assistant specifically dedicated to Indian Government Welfare Schemes (such as PM-KISAN, Ayushman Bharat PM-JAY, PMMVY, scholarships, etc.). I cannot assist with general topics or trivia, but I would be glad to help you find schemes you qualify for or answer any welfare-related questions!",
                "hi": "मैं स्कीमसाथी हूँ, एक ऐसा एआई सहायक जो विशेष रूप से भारत सरकार की कल्याणकारी योजनाओं (जैसे पीएम-किसान, आयुष्मान भारत, पीएमएमवीवाई, छात्रवृत्ति आदि) के लिए समर्पित है। मैं सामान्य विषयों में सहायता नहीं कर सकता, लेकिन सरकारी योजनाओं से संबंधित जानकारी के लिए हमेशा उपलब्ध हूँ!",
                "kn": "ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ, ಭಾರತ ಸರ್ಕಾರದ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳಿಗೆ (ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಭಾರತ್, ವಿದ್ಯಾರ್ಥಿವೇತನ ಇತ್ಯಾದಿ) ಮೀಸಲಾದ ಎಐ ಸಹಾಯಕ. ಸಾಮಾನ್ಯ ವಿಷಯಗಳಲ್ಲಿ ನಾನು ಉತ್ತರಿಸಲು ಸಾಧ್ಯವಿಲ್ಲ, ಆದರೆ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಕುರಿತು ನಿಮಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡಲು ಸಿದ್ಧನಿದ್ದೇನೆ!"
            }
            return GroundedAnswerResponse(
                query=query,
                locale=locale,
                answer=trivia_msgs.get(locale, trivia_msgs["en"]),
                is_grounded=False,
                confidence_score=0.0,
                citations=[],
                retrieved_chunks=[]
            )

        # 1. Retrieve most relevant evidence chunks
        retrieved = HybridSearchEngine.search(
            query=query,
            chunks=all_chunks,
            top_k=3,
            category_filter=category_filter
        )

        # 2. Check evidence threshold
        if not retrieved or retrieved[0].score < 0.015:
            fallback_msgs = {
                "en": "We could not find verified official records answering your specific question. Please consult the nearest Common Service Centre (CSC) or official ministry portal.",
                "hi": "हमें आपके प्रश्न से संबंधित कोई सत्यापित आधिकारिक रिकॉर्ड नहीं मिला। कृपया निकटतम कॉमन सर्विस सेंटर (सीएससी) या संबंधित मंत्रालय के पोर्टल से संपर्क करें।",
                "kn": "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ಅಧಿಕೃತ ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ / ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರ ಅಥವಾ ಅಧಿಕೃತ ಇಲಾಖಾ ಪೋರ್ಟಲ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ."
            }
            return GroundedAnswerResponse(
                query=query,
                locale=locale,
                answer=fallback_msgs.get(locale, fallback_msgs["en"]),
                is_grounded=False,
                confidence_score=0.0,
                citations=[],
                retrieved_chunks=[]
            )

        # 3. Build Citations List
        citations = []
        seen_schemes = set()
        for r in retrieved:
            if r.scheme_id not in seen_schemes:
                seen_schemes.add(r.scheme_id)
                scheme_title_str = r.scheme_title.get(locale, r.scheme_title.get("en", r.scheme_id))
                citations.append(Citation(
                    scheme_id=r.scheme_id,
                    scheme_name=scheme_title_str,
                    section_title=r.section_title,
                    official_portal_url=r.official_portal_url,
                    gazette_notification_url=r.gazette_notification_url,
                    source_reference_date=r.source_reference_date
                ))

        # 4. Synthesize Grounded Answer
        answer_text = cls._synthesize(query, locale, retrieved)

        # Detect whether the generated answer is an explicit abstention or refusal
        is_refusal = (
            "not contain information" in answer_text.lower()
            or "do not contain" in answer_text.lower()
            or "could not find verified" in answer_text.lower()
            or "i am sorry, but the provided documents" in answer_text.lower()
        )
        is_grounded = not is_refusal
        confidence_score = 0.0 if is_refusal else 0.95
        final_citations = [] if is_refusal else citations

        return GroundedAnswerResponse(
            query=query,
            locale=locale,
            answer=answer_text,
            is_grounded=is_grounded,
            confidence_score=confidence_score,
            citations=final_citations,
            retrieved_chunks=retrieved if is_grounded else []
        )

    @classmethod
    def _synthesize(cls, query: str, locale: str, chunks: List[RetrievedChunk]) -> str:
        """Generates grounded answer text from chunks using Gemini LLM if configured, or deterministic fallback."""
        if not chunks:
            return ""

        # 1. Try Gemini LLM Generation if configured and online
        if settings.LLM_PROVIDER == "gemini" and settings.LLM_API_KEY:
            try:
                lang_names = {"en": "English", "hi": "Hindi (Devanagari)", "kn": "Kannada"}
                target_lang = lang_names.get(locale, "English")

                context_blocks = []
                for idx, c in enumerate(chunks, 1):
                    scheme_t = c.scheme_title.get(locale, c.scheme_title.get("en", c.scheme_id))
                    context_blocks.append(f"--- Document {idx}: {scheme_t} ({c.section_title}) ---\n{c.content}\nOfficial Portal: {c.official_portal_url}")
                context_str = "\n\n".join(context_blocks)

                prompt = (
                    f"You are SchemeSaathi AI, a trustworthy multilingual government scheme assistant for India.\n"
                    f"The citizen has asked a question in {target_lang}.\n"
                    f"Answer the question truthfully, clearly, and empathetically in {target_lang} based ONLY on the verified official excerpts below.\n"
                    f"If the excerpts do not contain the answer, explicitly state: 'The verified records do not contain information regarding this request.'\n"
                    f"Never hallucinate or assume facts not present in the excerpts.\n"
                    f"Always include the official portal link for application.\n\n"
                    f"VERIFIED OFFICIAL EXCERPTS:\n{context_str}\n\n"
                    f"CITIZEN QUERY: {query}\n\n"
                    f"GROUNDED ANSWER ({target_lang}):"
                )

                llm_client = GeminiClient(model=settings.LLM_MODEL, timeout=5.0, max_retries=2)
                generated = llm_client.generate(
                    prompt=prompt,
                    temperature=settings.LLM_TEMPERATURE,
                    max_output_tokens=settings.LLM_MAX_TOKENS
                )
                if generated:
                    return generated
            except Exception:
                # In sandbox mode or network disconnect, smoothly fall through to deterministic synthesis
                pass

        # 2. Deterministic Grounded Synthesis (offline & secure fallback)
        lead_chunk = chunks[0]
        scheme_name = lead_chunk.scheme_title.get(locale, lead_chunk.scheme_title.get("en", lead_chunk.scheme_id))
        
        if locale == "hi":
            prefix = f"सत्यापित आधिकारिक रिकॉर्ड के अनुसार ({scheme_name}):\n\n"
            body = lead_chunk.content
            suffix = f"\n\nअधिक जानकारी और आवेदन के लिए आधिकारिक पोर्टल देखें: {lead_chunk.official_portal_url}"
        elif locale == "kn":
            prefix = f"ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ದಾಖಲೆಯ ಪ್ರಕಾರ ({scheme_name}):\n\n"
            body = lead_chunk.content
            suffix = f"\n\nಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ವೀಕ್ಷಿಸಿ: {lead_chunk.official_portal_url}"
        else:
            prefix = f"According to verified official records for {scheme_name}:\n\n"
            body = lead_chunk.content
            suffix = f"\n\nFor verified details and application procedures, visit: {lead_chunk.official_portal_url}"

        return f"{prefix}{body}{suffix}"
