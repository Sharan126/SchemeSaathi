"""Voice Conversational Service for Low-Literacy Citizens

Connects spoken audio requests to verified government scheme knowledge.
Implements low-literacy conversation design:
- 1 to 3 short spoken sentences maximum.
- Empathetic everyday vocabulary (no bureaucratic jargon).
- Zero raw URLs spoken aloud; explains physical and digital application points.
- Trilingual support: Kannada (kn), Hindi (hi), English (en).
"""

import logging
from typing import Optional, List, Dict, Any, Tuple
from app.db.repository import SchemeRepository
from app.modules.voice.interfaces import (
    VoiceDialogueMode,
    VoiceChatResponse,
    SpokenCitation,
)
from app.modules.voice.providers import NaturalVoicePhoneticsProvider

logger = logging.getLogger(__name__)


class VoiceConversationService:
    """Manages natural voice conversations for scheme discovery and guidance."""

    @classmethod
    def answer_spoken_query(
        cls,
        query: str,
        language: str = "en",
        dialogue_mode: VoiceDialogueMode = VoiceDialogueMode.DISCOVERY,
        target_scheme_id: Optional[str] = None
    ) -> VoiceChatResponse:
        q_norm = query.lower().strip()
        lang = language if language in ("kn", "hi", "en") else "en"

        # 0. Check Greetings & Identity
        is_greeting = any(
            g in q_norm
            for g in [
                "hi", "hello", "hey", "namaste", "namaskara", "namaskar",
                "who are you", "what can you do", "help", "ಯಾರು", "ಸಹಾಯ",
                "ನಮಸ್ಕಾರ", "ಹಲೋ", "ನಮಸ್ತೆ", "नमस्ते", "मदद", "प्रणाम"
            ]
        )

        if is_greeting:
            return cls._generate_greeting_response(lang)

        # 1. Identify Intent: Category / Scheme / Documents / Apply / Eligibility
        scheme, intent = cls._detect_scheme_and_intent(q_norm, target_scheme_id)

        if not scheme:
            return cls._generate_general_discovery_response(q_norm, lang)

        return cls._synthesize_scheme_voice_response(scheme, intent, lang)

    @classmethod
    def _detect_scheme_and_intent(
        cls, query: str, target_scheme_id: Optional[str] = None
    ) -> Tuple[Optional[Dict[str, Any]], str]:
        all_schemes = SchemeRepository.get_all_published()

        # If already focused on a scheme
        if target_scheme_id:
            found = SchemeRepository.get_by_id(target_scheme_id)
            if found:
                intent = cls._detect_intent(query)
                return found, intent

        # Search matching scheme
        matched = None
        for s in all_schemes:
            sid = s["id"].lower()
            if sid in query:
                matched = s
                break

            # Keyword checks
            if sid == "pm-kisan" and any(k in query for k in ["kisan", "farmer", "ರೈತ", "ಕಿಸಾನ್", "किसान", "खेती"]):
                matched = s
                break
            if sid == "ayushman-bharat-pmjay" and any(k in query for k in ["ayushman", "pmjay", "health", "hospital", "ಆಯುಷ್ಮಾನ್", "ಆರೋಗ್ಯ", "आयुष्मान", "इलाज"]):
                matched = s
                break
            if sid == "pmmvy" and any(k in query for k in ["pmmvy", "matru", "mother", "pregnant", "ತಾಯಿ", "ಗರ್ಭಿಣಿ", "माता", "गर्भवती"]):
                matched = s
                break
            if sid == "pms-sc" and any(k in query for k in ["scholarship", "matric", "student", "ವಿದ್ಯಾರ್ಥಿ", "ಸ್ಕಾಲರ್‌ಶಿಪ್", "छात्रवृत्ति", "स्कॉलरशिप"]):
                matched = s
                break
            if sid == "sukanya-samriddhi" and any(k in query for k in ["sukanya", "girl child", "daughter", "ಸುಕನ್ಯಾ", "ಹೆಣ್ಣು ಮಗು", "सुकन्या", "बेटी"]):
                matched = s
                break
            if sid == "pmay-g" and any(k in query for k in ["awas", "housing", "house", "ವಸತಿ", "ಮನೆ", "आवास", "मकान", "घर"]):
                matched = s
                break
            if sid == "ignoaps" and any(k in query for k in ["pension", "old age", "senior", "ಪಿಂಚಣಿ", "ವೃದ್ಧಾಪ್ಯ", "पेंशन", "बुजुर्ग"]):
                matched = s
                break
            if sid == "divyangjan-swavlamban" and any(k in query for k in ["divyang", "disability", "ದಿವ್ಯಾಂಗ", "ಅಂಗವಿಕಲ", "दिव्यांग", "विकलांग"]):
                matched = s
                break

        intent = cls._detect_intent(query)
        return matched, intent

    @classmethod
    def _detect_intent(cls, query: str) -> str:
        q = query.lower()
        if any(w in q for w in ["document", "dastavez", "proof", "ದಾಖಲೆ", "ಕಾಗದ", "दस्तावेज़", "कागजात"]):
            return "DOCUMENTS"
        if any(w in q for w in ["apply", "where", "how to apply", "ಹೇಗೆ", "ಎಲ್ಲಿ", "ಅರ್ಜಿ", "कहाँ", "कैसे", "आवेदन"]):
            return "HOW_TO_APPLY"
        if any(w in q for w in ["eligible", "qualify", "am i", "ಅರ್ಹತೆ", "ಸಿಗುತ್ತಾ", "पात्र", "मिलेगा"]):
            return "ELIGIBILITY"
        if any(w in q for w in ["money", "cash", "amount", "benefit", "ಎಷ್ಟು ಹಣ", "ಲಾಭ", "कितना पैसा", "लाभ"]):
            return "BENEFITS"
        return "OVERVIEW"

    @classmethod
    def _generate_greeting_response(cls, lang: str) -> VoiceChatResponse:
        greetings = {
            "kn": {
                "spoken": "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ. ನೀವು ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಕಾರ್ಡ್, ವಿದ್ಯಾರ್ಥಿವೇತನ ಅಥವಾ ವಸತಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ನೀವು ಯಾವ ಯೋಜನೆ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುತ್ತೀರಿ?",
                "display": "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ನನಗೆ ನೇರವಾಗಿ ಮಾತನಾಡಿ ಕೇಳಬಹುದು.",
                "prompts": ["ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ ಬಗ್ಗೆ ಹೇಳಿ", "ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್ ಮಾಹಿತಿ", "ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ"]
            },
            "hi": {
                "spoken": "नमस्ते! मैं आपका स्कीमसाथी आवाज़ सहायक हूँ। आप मुझसे पीएम-किसान, आयुष्मान भारत स्वास्थ्य कार्ड, छात्रवृत्ति या आवास योजना के बारे में पूछ सकते हैं। आप किस योजना के बारे में जानना चाहते हैं?",
                "display": "नमस्ते! मैं स्कीमसाथी वॉइस असिस्टेंट हूँ। आप बोलकर सरकारी योजनाओं की जानकारी ले सकते हैं।",
                "prompts": ["पीएम-किसान योजना की जानकारी", "आयुष्मान भारत कार्ड", "मेरी पात्रता जांचें"]
            },
            "en": {
                "spoken": "Hello! I am your SchemeSaathi voice assistant. You can speak to me about farmer support like PM-KISAN, Ayushman Bharat health cover, student scholarships, or housing grants. Which scheme would you like to hear about?",
                "display": "Hello! I am your SchemeSaathi voice assistant. Just speak to discover government schemes and check your eligibility.",
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
    def _generate_general_discovery_response(cls, query: str, lang: str) -> VoiceChatResponse:
        msgs = {
            "kn": {
                "spoken": "ನಾನು ನಿಮ್ಮ ಮಾತನ್ನು ಆಲಿಸಿದೆ. ಭಾರತ ಸರ್ಕಾರದ ಪ್ರಮುಖ ಯೋಜನೆಗಳಾದ ಪಿಎಂ-ಕಿಸಾನ್ ರೈತರ ನೆರವು, ಆಯುಷ್ಮಾನ್ 5 ಲಕ್ಷ ರೂಪಾಯಿ ಉಚಿತ ಚಿಕಿತ್ಸೆ, ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು ಲಭ್ಯವಿವೆ. ನೀವು ಯಾವ ಕ್ಷೇತ್ರದ ಬಗ್ಗೆ ತಿಳಿಯಲು ಬಯಸುವಿರಿ?",
                "display": "ಕೇಂದ್ರ ಸರ್ಕಾರದ ಪ್ರಮುಖ ಯೋಜನೆಗಳು: ರೈತರ ಕಲ್ಯಾಣ, ಆರೋಗ್ಯ ವಿಮೆ, ಶಿಕ್ಷಣ ಮತ್ತು ವಸತಿ.",
                "prompts": ["ರೈತರ ಯೋಜನೆಗಳು", "ಆರೋಗ್ಯ ಚಿಕಿತ್ಸಾ ಕಾರ್ಡ್", "ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು"]
            },
            "hi": {
                "spoken": "मैंने आपका प्रश्न सुना। केंद्र सरकार की मुख्य योजनाएं जैसे किसानों के लिए पीएम-किसान, 5 लाख का मुफ्त आयुष्मान इलाज, और छात्रवृत्ति उपलब्ध हैं। आप किस क्षेत्र के बारे में जानना चाहते हैं?",
                "display": "केंद्र सरकार की मुख्य योजनाएं: कृषि कल्याण, स्वास्थ्य बीमा, शिक्षा एवं आवास।",
                "prompts": ["किसानों की योजनाएं", "आयुष्मान स्वास्थ्य कार्ड", "छात्रवृत्ति योजना"]
            },
            "en": {
                "spoken": "I heard your request. The government provides major assistance such as PM-KISAN for farmers, 5 lakh rupee Ayushman Bharat medical cover, and scholarships. Which area would you like to explore?",
                "display": "Major Central Welfare Schemes: Agriculture support, healthcare, education grants, and housing.",
                "prompts": ["Schemes for farmers", "Free health insurance", "Scholarships for students"]
            }
        }
        res = msgs.get(lang, msgs["en"])
        return VoiceChatResponse(
            spoken_text=res["spoken"],
            display_text=res["display"],
            language=lang,
            dialogue_mode=VoiceDialogueMode.DISCOVERY,
            suggested_spoken_prompts=res["prompts"],
            citations=[]
        )

    @classmethod
    def _synthesize_scheme_voice_response(
        cls, scheme: Dict[str, Any], intent: str, lang: str
    ) -> VoiceChatResponse:
        title = scheme.get("title", {}).get(lang, scheme.get("title", {}).get("en", scheme["id"]))
        sid = scheme["id"]
        portal = scheme.get("official_portal_url", "")
        ref_date = scheme.get("source_reference_date", "2024")

        spoken = ""
        display = ""
        action_type = None

        if intent == "BENEFITS":
            benefits = scheme.get("benefits", [])
            amt = ""
            if benefits:
                amt = benefits[0].get("amount_description", {}).get(lang, benefits[0].get("amount_description", {}).get("en", ""))
            
            if lang == "kn":
                spoken = f"{title} ಯೋಜನೆಯಡಿ ನಿಮಗೆ {amt} ನೇರವಾಗಿ ನಿಮ್ಮ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆಯಾಗುತ್ತದೆ. ಈ ಯೋಜನೆಗೆ ನಿಮ್ಮ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಲು ಬಯಸುವಿರಾ?"
                display = f"ನೇರ ಆರ್ಥಿಕ ನೆರವು: {amt}."
            elif lang == "hi":
                spoken = f"{title} के तहत आपको {amt} सीधे आपके बैंक खाते में प्रदान किया जाता है। क्या आप अपनी पात्रता जांचना चाहते हैं?"
                display = f"प्रत्यक्ष वित्तीय लाभ: {amt}."
            else:
                spoken = f"Under {title}, eligible beneficiaries receive {amt} directly transferred to their bank account. Would you like to check if you qualify?"
                display = f"Direct Entitlement: {amt}."
            action_type = "CHECK_ELIGIBILITY"

        elif intent == "DOCUMENTS":
            docs = scheme.get("documents", [])
            doc_names = []
            for d in docs[:3]:
                dname = d.get("document_name", {}).get(lang, d.get("document_name", {}).get("en", d.get("document_code", "")))
                doc_names.append(dname)
            joined_docs = ", ".join(doc_names)

            if lang == "kn":
                spoken = f"{title} ಯೋಜನೆಗೆ ಮುಖ್ಯವಾಗಿ {joined_docs} ಅಗತ್ಯವಿದೆ. ಇವು ನಿಮ್ಮ ಬಳಿ ಇವೆಯೇ?"
                display = f"ಅಗತ್ಯವಿರುವ ಮುಖ್ಯ ದಾಖಲೆಗಳು: {joined_docs}."
            elif lang == "hi":
                spoken = f"{title} के लिए मुख्य रूप से {joined_docs} आवश्यक हैं। क्या ये दस्तावेज़ आपके पास उपलब्ध हैं?"
                display = f"आवश्यक मुख्य दस्तावेज़: {joined_docs}."
            else:
                spoken = f"For {title}, the main required documents are {joined_docs}. Do you have these available?"
                display = f"Key Required Documents: {joined_docs}."
            action_type = "VIEW_DOCUMENTS"

        elif intent == "HOW_TO_APPLY":
            steps = scheme.get("application_steps", [])
            step1 = steps[0].get(lang, steps[0].get("en", "")) if steps else ""

            if lang == "kn":
                spoken = f"ನೀವು ನಿಮ್ಮ ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್ಸಿ ಕೇಂದ್ರದಲ್ಲಿ ಅಥವಾ ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ಮೂಲಕ ಸುಲಭವಾಗಿ ಅರ್ಜಿ ಸಲ್ಲಿಸಬಹುದು. ಮೊದಲ ಹಂತ: {step1}."
                display = f"ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ವಿಧಾನ: ಗ್ರಾಮ ಒನ್ / ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರ ಅಥವಾ ಅಧಿಕೃತ ಪೋರ್ಟಲ್. ಹಂತ 1: {step1}."
            elif lang == "hi":
                spoken = f"आप अपने नजदीकी कॉमन सर्विस सेंटर या आधिकारिक पोर्टल से आवेदन कर सकते हैं। पहला कदम: {step1}."
                display = f"आवेदन प्रक्रिया: नजदीकी सीएससी या आधिकारिक पोर्टल। पहला चरण: {step1}."
            else:
                spoken = f"You can apply easily at your nearest Common Service Centre or through the official portal. First step: {step1}."
                display = f"Application procedure: Visit your local CSC or official portal. Step 1: {step1}."
            action_type = "APPLY_GUIDE"

        else:
            # OVERVIEW / ELIGIBILITY
            short_desc = scheme.get("short_description", {}).get(lang, scheme.get("short_description", {}).get("en", ""))
            if lang == "kn":
                spoken = f"{title}. {short_desc}. ನಿಮ್ಮ ಅರ್ಹತೆಯನ್ನು ಈಗಲೇ ಧ್ವನಿ ಮೂಲಕ ಪರೀಕ್ಷಿಸಲು ನೀವು ಸಿದ್ಧರಿದ್ದೀರಾ?"
                display = f"{title}: {short_desc}."
            elif lang == "hi":
                spoken = f"{title}। {short_desc}। क्या आप अभी बोलकर अपनी पात्रता जांचना चाहते हैं?"
                display = f"{title}: {short_desc}."
            else:
                spoken = f"{title}. {short_desc}. Would you like to check if you qualify by speaking with me now?"
                display = f"{title}: {short_desc}."
            action_type = "CHECK_ELIGIBILITY"

        # Apply phonetics formatting
        spoken_clean = NaturalVoicePhoneticsProvider.prepare_spoken_ssml(spoken, lang)

        prompts = {
            "kn": ["ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ", "ಬೇಕಾಗುವ ದಾಖಲೆಗಳು", "ಅರ್ಜಿ ಸಲ್ಲಿಸುವುದು ಹೇಗೆ?"],
            "hi": ["पात्रता जांचें", "आवश्यक दस्तावेज़", "आवेदन कैसे करें?"],
            "en": ["Check my eligibility", "What documents are needed?", "How to apply?"]
        }

        citations = [
            SpokenCitation(
                scheme_id=sid,
                scheme_name=title,
                official_portal_url=portal,
                source_reference_date=ref_date
            )
        ]

        return VoiceChatResponse(
            spoken_text=spoken_clean,
            display_text=display,
            language=lang,
            dialogue_mode=VoiceDialogueMode.DISCOVERY,
            suggested_spoken_prompts=prompts.get(lang, prompts["en"]),
            citations=citations,
            action_type=action_type
        )
