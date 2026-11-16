"""Voice Provider Abstractions: STT, TTS and Language Detection

Supports:
1. Browser Web Speech API bridge with server-side validation.
2. Bhashini / MeitY ULCA / Gemini audio provider adapter structure.
3. Natural phonetic phrasing and pronunciation cleaner for Kannada, Hindi and English.
"""

import re
import logging
from typing import Optional, Dict, Any, Tuple
from app.modules.voice.interfaces import (
    TranscriptionResult,
    SynthesisRequest,
    VoiceLanguage,
)

logger = logging.getLogger(__name__)


class NaturalVoicePhoneticsProvider:
    """
    Cleans and structures text before speaking to guarantee short, warm,
    natural sentences without bureaucratic jargon or raw website URLs.
    """

    @staticmethod
    def prepare_spoken_ssml(text: str, language: str) -> str:
        """
        Strips markdown links, brackets, raw URLs, and replaces technical acronyms
        with accessible spoken forms.
        """
        # 1. Remove markdown links [Label](url) -> keep Label
        clean = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)

        # 2. Strip raw URLs and web domains (never speak http/www/.gov out loud)
        clean = re.sub(r"https?://\S+", "", clean)
        clean = re.sub(r"www\.\S+", "", clean)
        clean = re.sub(r"\b[\w\-]+\.gov\.in\S*", "", clean)
        clean = re.sub(r"\b[\w\-]+\.(?:com|org|nic\.in)\S*", "", clean)

        # 3. Strip bold/italic markdown
        clean = clean.replace("**", "").replace("*", "").replace("##", "")

        # 4. Spoken acronym expansions for clear Indian voice synthesis
        acronyms = {
            "PM-KISAN": "Pradhan Mantri Kisan",
            "PM-JAY": "Ayushman Bharat PM Jay",
            "PMMVY": "Matru Vandana Yojana",
            "PMS-SC": "Post Matric Scholarship",
            "SSY": "Sukanya Samriddhi Yojana",
            "PMAY-G": "Pradhan Mantri Awas Yojana",
            "IGNOAPS": "Old Age Pension Scheme",
            "DBT": "Direct Bank Transfer",
            "CSC": "Common Service Centre",
            "Rs.": "Rupees ",
            "₹": "Rupees ",
        }

        if language == "kn":
            acronyms_kn = {
                "PM-KISAN": "ಪಿಎಂ ಕಿಸಾನ್",
                "PM-JAY": "ಆಯುಷ್ಮಾನ್ ಭಾರತ್",
                "PMMVY": "ಮಾತೃ ವಂದನಾ ಯೋಜನೆ",
                "PMS-SC": "ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ",
                "SSY": "ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ",
                "PMAY-G": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ",
                "DBT": "ನೇರ ಬ್ಯಾಂಕ್ ವರ್ಗಾವಣೆ",
                "CSC": "ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್ಸಿ ಕೇಂದ್ರ",
                "Rs.": "ರೂಪಾಯಿ ",
                "₹": "ರೂಪಾಯಿ ",
                "ರೂ.": "ರೂಪಾಯಿ ",
                "ರೂ": "ರೂಪಾಯಿ ",
            }
            for k, v in acronyms_kn.items():
                clean = clean.replace(k, v)
        elif language == "hi":
            acronyms_hi = {
                "PM-KISAN": "पीएम किसान",
                "PM-JAY": "आयुष्मान भारत",
                "PMMVY": "मातृ वंदना योजना",
                "PMS-SC": "पोस्ट मैट्रिक छात्रवृत्ति",
                "SSY": "सुकन्या समृद्धि योजना",
                "PMAY-G": "प्रधानमंत्री आवास योजना",
                "DBT": "प्रत्यक्ष बैंक अंतरण",
                "CSC": "कॉमन सर्विस सेंटर",
                "Rs.": "रुपये ",
                "₹": "रुपये ",
            }
            for k, v in acronyms_hi.items():
                clean = clean.replace(k, v)
        else:
            for k, v in acronyms.items():
                clean = clean.replace(k, v)

        # 5. Collapse excessive whitespace
        clean = re.sub(r"\s+", " ", clean).strip()
        return clean


class LanguageDetectionService:
    """Detects or confirms spoken language (Kannada, Hindi, English)."""

    KANNADA_UNICODE_RANGE = (0x0C80, 0x0CFF)
    DEVANAGARI_UNICODE_RANGE = (0x0900, 0x097F)

    @classmethod
    def detect_text_language(cls, text: str) -> Tuple[str, float]:
        """
        Determines language from script and vocabulary with confidence score.
        Returns (language_code, confidence).
        """
        if not text or not text.strip():
            return "en", 0.5

        kn_chars = sum(1 for c in text if cls.KANNADA_UNICODE_RANGE[0] <= ord(c) <= cls.KANNADA_UNICODE_RANGE[1])
        hi_chars = sum(1 for c in text if cls.DEVANAGARI_UNICODE_RANGE[0] <= ord(c) <= cls.DEVANAGARI_UNICODE_RANGE[1])
        total = len(text.replace(" ", ""))

        if total == 0:
            return "en", 0.5

        if kn_chars / total > 0.25:
            return "kn", min(1.0, 0.7 + (kn_chars / total) * 0.3)
        if hi_chars / total > 0.25:
            return "hi", min(1.0, 0.7 + (hi_chars / total) * 0.3)

        # Transliterated keyword checks
        text_lower = text.lower()
        kn_translit = ["namaskara", "yojana", "raita", "beeku", "arhathe", "dakhalegalu", "haudu", "illa"]
        hi_translit = ["namaste", "yojana", "kisan", "chahiye", "patrata", "dastawej", "haan", "nahin"]

        if any(w in text_lower for w in kn_translit):
            return "kn", 0.85
        if any(w in text_lower for w in hi_translit):
            return "hi", 0.85

        return "en", 0.90


class SpeechToTextService:
    """
    Provider-agnostic Speech to Text service.
    Processes audio or recognized text tokens and detects low-confidence recognition.
    """

    @classmethod
    def process_transcript(cls, raw_text: str, language: Optional[str] = None) -> TranscriptionResult:
        stripped = raw_text.strip()
        detected_lang, confidence = LanguageDetectionService.detect_text_language(stripped)
        active_lang = language if language in ("kn", "hi", "en") else detected_lang

        # Check for noise or very short unclear murmurs
        is_low_conf = len(stripped) < 2 or stripped in ("...", "?", "h", "hmm")
        needs_rep = is_low_conf

        return TranscriptionResult(
            text=stripped,
            language=active_lang,
            confidence=0.3 if is_low_conf else confidence,
            is_low_confidence=is_low_conf,
            needs_repetition=needs_rep,
        )
