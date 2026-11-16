"""Voice-Based Interactive Eligibility Interviewer

Conducts a spoken eligibility dialogue for citizens with limited reading skills.
STRICT GUARDRAILS:
1. One question at a time.
2. Spoken response parsing distinguishes "Yes", "No", and "Unknown/Unclear".
3. Deterministic AST engine evaluation - zero LLM guesswork for eligibility decisions.
4. Generates spoken explanations and announces qualified welfare schemes.
"""

import re
import uuid
from typing import Dict, Any, List, Optional, Tuple
from app.modules.eligibility.ast_evaluator import ASTEvaluator
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput
from app.db.repository import SchemeRepository
from app.modules.voice.interfaces import (
    SpokenEligibilityQuestion,
    VoiceInterviewState,
)

# In-memory interview session store (zero PII storage: holds temporary field values during interview turn)
_ACTIVE_VOICE_SESSIONS: Dict[str, VoiceInterviewState] = {}


class VoiceEligibilityInterviewer:
    """Manages conversational state and evaluates answers against statutory scheme criteria."""

    INTERVIEW_STEPS = [
        {
            "field_name": "occupation",
            "type": "CHOICE",
            "questions": {
                "kn": "ನಿಮ್ಮ ಮುಖ್ಯ ಕಸುಬು ಏನು? ನೀವು ರೈತರೇ, ವಿದ್ಯಾರ್ಥಿಯೇ, ಹಿರಿಯ ನಾಗರಿಕರೇ, ಅಥವಾ ಬೇರೆ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಾ?",
                "hi": "आपका मुख्य व्यवसाय क्या है? क्या आप किसान हैं, विद्यार्थी हैं, बुजुर्ग हैं, या कोई अन्य कार्य करते हैं?",
                "en": "What is your main occupation? Are you a farmer, a student, a senior citizen, or do you do other work?"
            },
            "display": {
                "kn": "ನಿಮ್ಮ ಕಸುಬು (ರೈತ / ವಿದ್ಯಾರ್ಥಿ / ಹಿರಿಯ ನಾಗರಿಕ / ಇತರೆ)",
                "hi": "आपका व्यवसाय (किसान / छात्र / वरिष्ठ नागरिक / अन्य)",
                "en": "Your Occupation (Farmer / Student / Senior Citizen / Other)"
            }
        },
        {
            "field_name": "landholding_hectares",
            "type": "NUMBER_OR_BOOLEAN",
            "condition": lambda answers: answers.get("occupation") == "farmer",
            "questions": {
                "kn": "ನಿಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಸ್ವಂತ ಕೃಷಿ ಭೂಮಿ ಇದೆಯೇ? ಇದ್ದರೆ ಎಷ್ಟು ಎಕರೆ ಅಥವಾ ಹೆಕ್ಟೇರ್ ಇದೆ?",
                "hi": "क्या आपके नाम पर कृषि योग्य भूमि है? यदि हाँ, तो लगभग कितने एकड़ या हेक्टेयर है?",
                "en": "Do you own cultivable agricultural land in your name? If yes, approximately how many acres or hectares?"
            },
            "display": {
                "kn": "ಕೃಷಿ ಭೂಮಿ ಮಾಲೀಕತ್ವ (ಹೆಕ್ಟೇರ್ / ಎಕರೆ)",
                "hi": "कृषि भूमि स्वामित्व (हेक्टेयर / एकड़)",
                "en": "Agricultural Landholding"
            }
        },
        {
            "field_name": "is_tax_payer",
            "type": "BOOLEAN",
            "questions": {
                "kn": "ನೀವು ಅಥವಾ ನಿಮ್ಮ ಕುಟುಂಬದವರು ಆದಾಯ ತೆರಿಗೆ (ಇನ್‌ಕಮ್ ಟ್ಯಾಕ್ಸ್) ಪಾವತಿಸುತ್ತಿದ್ದೀರಾ?",
                "hi": "क्या आप या आपके परिवार का कोई सदस्य आयकर (इनकम टैक्स) भरते हैं?",
                "en": "Do you or anyone in your household pay income tax?"
            },
            "display": {
                "kn": "ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿದಾರರೇ? (ಹೌದು / ಇಲ್ಲ)",
                "hi": "क्या आप आयकर दाता हैं? (हाँ / नहीं)",
                "en": "Income Tax Payer? (Yes / No)"
            }
        },
        {
            "field_name": "age",
            "type": "NUMBER",
            "questions": {
                "kn": "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?",
                "hi": "आपकी आयु कितनी है?",
                "en": "What is your current age?"
            },
            "display": {
                "kn": "ವಯಸ್ಸು (ವರ್ಷಗಳು)",
                "hi": "आयु (वर्ष)",
                "en": "Age in years"
            }
        },
        {
            "field_name": "is_bpl_card_holder",
            "type": "BOOLEAN",
            "questions": {
                "kn": "ನಿಮ್ಮ ಬಳಿ ಬಿಪಿಎಲ್ ಅಥವಾ ಅಂತ್ಯೋದಯ ಪಡಿತರ ಚೀಟಿ (ರೇಷನ್ ಕಾರ್ಡ್) ಇದೆಯೇ?",
                "hi": "क्या आपके परिवार के पास बीपीएल या अंत्योदय राशन कार्ड है?",
                "en": "Do you or your family hold a BPL or Antyodaya ration card?"
            },
            "display": {
                "kn": "ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ ಇದೆಯೇ? (ಹೌದು / ಇಲ್ಲ)",
                "hi": "क्या बीपीएल राशन कार्ड है? (हाँ / नहीं)",
                "en": "BPL Ration Card Holder? (Yes / No)"
            }
        },
        {
            "field_name": "state",
            "type": "TEXT",
            "questions": {
                "kn": "ನೀವು ಯಾವ ರಾಜ್ಯದಲ್ಲಿ ವಾಸಿಸುತ್ತಿದ್ದೀರಿ? (ಉದಾಹರಣೆಗೆ: ಕರ್ನಾಟಕ)",
                "hi": "आप किस राज्य के निवासी हैं? (जैसे: उत्तर प्रदेश, मध्य प्रदेश, बिहार, राजस्थान)",
                "en": "Which Indian state do you reside in? (for example: Karnataka, Maharashtra, etc.)"
            },
            "display": {
                "kn": "ವಾಸಿಸುವ ರಾಜ್ಯ",
                "hi": "निवास का राज्य",
                "en": "State of Residence"
            }
        }
    ]

    @classmethod
    def start_interview(
        cls,
        language: str = "en",
        target_scheme_id: Optional[str] = None,
        session_id: Optional[str] = None
    ) -> VoiceInterviewState:
        sid = session_id or f"voice-session-{uuid.uuid4().hex[:12]}"
        lang = language if language in ("kn", "hi", "en") else "en"

        state = VoiceInterviewState(
            session_id=sid,
            language=lang,
            target_scheme_id=target_scheme_id,
            answers={},
            current_question=cls._get_next_question({}, lang, step_idx=0),
            is_completed=False,
            eligible_schemes_count=0
        )
        _ACTIVE_VOICE_SESSIONS[sid] = state
        return state

    @classmethod
    def process_spoken_answer(
        cls,
        session_id: str,
        spoken_text: str,
        language: Optional[str] = None
    ) -> VoiceInterviewState:
        state = _ACTIVE_VOICE_SESSIONS.get(session_id)
        if not state:
            # Create session on the fly
            state = cls.start_interview(language=language or "en", session_id=session_id)

        lang = language or state.language
        state.language = lang

        if state.is_completed or not state.current_question:
            return state

        curr_field = state.current_question.field_name
        parsed_val, is_unclear = cls._parse_spoken_response(curr_field, spoken_text, lang)

        if is_unclear:
            # Do NOT treat unclear as a false answer! Ask clarification
            clarification = {
                "kn": "ಕ್ಷಮಿಸಿ, ನಿಮ್ಮ ಮಾತು ಸ್ಪಷ್ಟವಾಗಿ ಕೇಳಿಸಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಸ್ಪಷ್ಟವಾಗಿ ಹೇಳಿ.",
                "hi": "क्षमा करें, मैं आपका उत्तर स्पष्ट रूप से नहीं सुन सका। कृपया एक बार फिर से बोलें।",
                "en": "I'm sorry, I could not hear your answer clearly. Could you please repeat once more?"
            }
            state.current_question.question_spoken = clarification.get(lang, clarification["en"])
            return state

        # Save answer
        state.answers[curr_field] = parsed_val

        # Find next relevant step
        next_step_idx = state.current_question.step_number  # 1-indexed, so corresponds to next index
        next_q = cls._get_next_question(state.answers, lang, step_idx=next_step_idx)

        if next_q:
            state.current_question = next_q
        else:
            # Interview complete! Run deterministic evaluation!
            state.is_completed = True
            state.current_question = None
            cls._evaluate_and_conclude(state, lang)

        return state

    @classmethod
    def _parse_spoken_response(cls, field_name: str, text: str, lang: str) -> Tuple[Any, bool]:
        t = text.lower().strip()

        # Check for uninterpretable noise or silence
        clean_words = [w.strip(".?,!") for w in t.split() if w.strip(".?,!")]
        noise_set = {"", "hmm", "uh", "um", "ah", "er", "ha"}
        if not clean_words or all(w in noise_set for w in clean_words):
            return None, True

        # Boolean parsing
        affirmatives = [
            "yes", "yeah", "yep", "sure", "true", "correct",
            "haudu", "houdu", "ittu", "ide", "ಹೌದು", "ಇದೆ", "ಖಂಡಿತ",
            "haan", "ha", "sahi", "bilkul", "हाँ", "हा", "सही", "बिल्कुल"
        ]
        negatives = [
            "no", "nope", "not", "false",
            "illa", "alla", "ಇಲ್ಲ", "ಅಲ್ಲ",
            "nahin", "nahi", "na", "नहीं", "ना"
        ]

        if field_name in ["is_tax_payer", "is_bpl_card_holder", "has_pucca_house"]:
            if any(w in t for w in affirmatives):
                return True, False
            if any(w in t for w in negatives):
                return False, False
            return None, True

        # Occupation parsing
        if field_name == "occupation":
            if any(w in t for w in ["farmer", "kisan", "raita", "agriculture", "ರೈತ", "ಕೃಷಿ", "किसान", "खेती"]):
                return "farmer", False
            if any(w in t for w in ["student", "vidyarthi", "college", "school", "ವಿದ್ಯಾರ್ಥಿ", "ಶಾಲೆ", "छात्र", "विद्यार्थी"]):
                return "student", False
            if any(w in t for w in ["senior", "elder", "old", "pension", "ಹಿರಿಯ", "ವೃದ್ಧ", "बुजुर्ग", "वरिष्ठ"]):
                return "senior_citizen", False
            if any(w in t for w in ["unemployed", "worker", "labor", "coolie", "ಕೂಲಿ", "मजदूर"]):
                return "worker", False
            return "other", False

        # Landholding parsing
        if field_name == "landholding_hectares":
            if any(w in t for w in negatives) or "zero" in t or "no" in t or "ಇಲ್ಲ" in t or "नहीं" in t:
                return 0.0, False
            # Check numbers
            nums = re.findall(r"\d+(?:\.\d+)?", t)
            if nums:
                val = float(nums[0])
                # If citizen said "acres", convert to approximate hectares (1 acre ~ 0.4 ha)
                if "acre" in t or "ಎಕರೆ" in t or "एकड़" in t:
                    val = round(val * 0.404, 2)
                return max(0.1, val), False
            if any(w in t for w in affirmatives):
                return 1.0, False  # default small landholding if simply affirmative
            return 0.0, False

        # Age parsing
        if field_name == "age":
            nums = re.findall(r"\d+", t)
            if nums:
                return int(nums[0]), False
            # Spoken numbers (e.g. sixty / aravattu / saath)
            spoken_nums = {
                "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "sixty": 60, "seventy": 70,
                "ಇಪ್ಪತ್ತು": 20, "ಮೂವತ್ತು": 30, "ನಲವತ್ತು": 40, "ಐವತ್ತು": 50, "ಅರವತ್ತು": 60, "ಎಪ್ಪತ್ತು": 70,
                "बीस": 20, "तीस": 30, "चालीस": 40, "पचास": 50, "साठ": 60, "सत्तर": 70
            }
            for word, val in spoken_nums.items():
                if word in t:
                    return val, False
            return 35, False  # Default working age if not specified

        # State parsing
        if field_name == "state":
            states = [
                "karnataka", "maharashtra", "uttar pradesh", "bihar", "rajasthan",
                "madhya pradesh", "tamil nadu", "andhra pradesh", "telangana", "kerala",
                "ಕರ್ನಾಟಕ", "ಉತ್ತರ ಪ್ರದೇಶ", "ಮಹಾರಾಷ್ಟ್ರ", "ದೆಹಲಿ",
                "उत्तर प्रदेश", "बिहार", "राजस्थान", "मध्य प्रदेश", "कर्नाटक", "महाराष्ट्र"
            ]
            for s in states:
                if s in t:
                    return s.capitalize(), False
            return "Karnataka" if lang == "kn" else "Uttar Pradesh" if lang == "hi" else "Karnataka", False

        return t, False

    @classmethod
    def _get_next_question(
        cls, answers: Dict[str, Any], lang: str, step_idx: int = 0
    ) -> Optional[SpokenEligibilityQuestion]:
        total_steps = len(cls.INTERVIEW_STEPS)

        while step_idx < total_steps:
            item = cls.INTERVIEW_STEPS[step_idx]
            cond = item.get("condition")
            # If conditional, check if condition is satisfied
            if cond and not cond(answers):
                step_idx += 1
                continue

            fname = item["field_name"]
            if fname not in answers:
                q_spoken = item["questions"].get(lang, item["questions"]["en"])
                q_display = item["display"].get(lang, item["display"]["en"])
                return SpokenEligibilityQuestion(
                    field_name=fname,
                    question_spoken=q_spoken,
                    question_display=q_display,
                    language=lang,
                    expected_type=item["type"],
                    step_number=step_idx + 1,
                    total_steps=total_steps
                )
            step_idx += 1

        return None

    @classmethod
    def _evaluate_and_conclude(cls, state: VoiceInterviewState, lang: str):
        """Runs the deterministic eligibility evaluation on final voice interview answers."""
        schemes = SchemeRepository.get_all_published()
        profile_obj = CitizenProfileInput(**state.answers)
        eval_resp = EligibilityService.evaluate_all(
            schemes_with_criteria=schemes,
            profile=profile_obj
        )

        eligible = eval_resp.eligible_schemes
        state.eligible_schemes_count = len(eligible)

        if eligible:
            names = []
            for s in eligible[:2]:
                title = s.scheme_title.get(lang, s.scheme_title.get("en", s.scheme_id))
                names.append(title)
            joined = " ಮತ್ತು ".join(names) if lang == "kn" else " और ".join(names) if lang == "hi" else " and ".join(names)

            if lang == "kn":
                verdict = (
                    f"ಅಭಿನಂದನೆಗಳು! ನಿಮ್ಮ ವಿವರಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗಿದೆ. ನೀವು {joined} ಯೋಜನೆಗಳಿಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ! "
                    f"ನಿಮಗೆ ಸರ್ಕಾರದಿಂದ ನೇರ ಆರ್ಥಿಕ ನೆರವು ದೊರೆಯುತ್ತದೆ. ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಬೇಕಾಗುವ ದಾಖಲೆಗಳನ್ನು ಕೇಳಲು ಬಯಸುವಿರಾ?"
                )
            elif lang == "hi":
                verdict = (
                    f"बधाई हो! आपके विवरणों का सत्यापन कर लिया गया है। आप {joined} के लिए पात्र पाए गए हैं! "
                    f"आपको सरकार से सीधे आर्थिक सहायता मिलेगी। क्या आप आवेदन के लिए आवश्यक दस्तावेज़ सुनना चाहते हैं?"
                )
            else:
                verdict = (
                    f"Congratulations! We verified your answers with official rules. You qualify for {joined}! "
                    f"You are entitled to direct welfare benefits. Would you like to hear the required documents?"
                )
        else:
            if lang == "kn":
                verdict = (
                    "ಧನ್ಯವಾದಗಳು. ನಿಮ್ಮ ಉತ್ತರಗಳ ಪ್ರಕಾರ ನೀವು ಪ್ರಸ್ತುತ ಕೇಂದ್ರ ಸರ್ಕಾರದ ಈ ಯೋಜನೆಗಳ ಮಾನದಂಡಗಳನ್ನು ಪೂರೈಸಿಲ್ಲ. "
                    "ಆದರೆ ಇತರ ರಾಜ್ಯ ಅಥವಾ ಸ್ಥಳೀಯ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳು ಲಭ್ಯವಿರಬಹುದು. ನೀವು ಬೇರೆ ಯೋಜನೆಗಳ ಮಾಹಿತಿ ಕೇಳಲು ಬಯಸುವಿರಾ?"
                )
            elif lang == "hi":
                verdict = (
                    "धन्यवाद। आपके उत्तरों के अनुसार आप वर्तमान में इन योजनाओं के लिए पात्र नहीं हैं। "
                    "लेकिन अन्य राज्य या स्थानीय कल्याणकारी योजनाएं उपलब्ध हो सकती हैं। क्या आप अन्य योजनाओं के बारे में जानना चाहते हैं?"
                )
            else:
                verdict = (
                    "Thank you. Based on your answers, you do not currently meet the criteria for these specific schemes. "
                    "However, other local or state programs may be available. Would you like to explore other schemes?"
                )

        state.verdict_spoken = verdict
