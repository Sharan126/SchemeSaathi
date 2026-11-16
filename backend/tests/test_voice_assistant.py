"""Unit and Integration Tests for SchemeSaathi AI Voice Assistant

Tests:
1. Multilingual voice query comprehension (Kannada, Hindi, English).
2. Spoken response phonetic cleaning (zero raw URLs spoken aloud).
3. Stateful voice eligibility interview with deterministic AST evaluation.
4. Resilience to unclear speech (never marks unclear as a false answer).
5. Voice API REST endpoints.
"""

import pytest
from app.api.v1.endpoints.voice import (
    handle_voice_chat,
    start_voice_eligibility_interview,
    answer_voice_eligibility_question,
    get_voice_welcome,
    prepare_speech_synthesis,
    VoiceInterviewStartRequest,
    VoiceInterviewAnswerRequest,
)
from app.modules.voice.interfaces import (
    VoiceChatRequest,
    SynthesisRequest,
    VoiceDialogueMode,
)
from app.modules.voice.conversation_service import VoiceConversationService
from app.modules.voice.eligibility_interviewer import VoiceEligibilityInterviewer
from app.modules.voice.providers import NaturalVoicePhoneticsProvider, LanguageDetectionService


class TestVoiceConversationService:
    def test_kannada_farmer_voice_query(self):
        resp = VoiceConversationService.answer_spoken_query(
            query="ರೈತರಿಗೆ ಯಾವ ಯೋಜನೆಗಳಿವೆ?",
            language="kn",
            dialogue_mode=VoiceDialogueMode.DISCOVERY
        )
        assert resp.language == "kn"
        assert len(resp.spoken_text) > 10
        # Must not contain raw web links
        assert "http://" not in resp.spoken_text
        assert "https://" not in resp.spoken_text
        assert len(resp.suggested_spoken_prompts) > 0

    def test_hindi_health_voice_query(self):
        resp = VoiceConversationService.answer_spoken_query(
            query="आयुष्मान भारत योजना के तहत कितना लाभ मिलता है?",
            language="hi",
            dialogue_mode=VoiceDialogueMode.DISCOVERY
        )
        assert resp.language == "hi"
        assert len(resp.spoken_text) > 10
        assert "http" not in resp.spoken_text
        assert resp.citations is not None

    def test_english_scholarship_voice_query(self):
        resp = VoiceConversationService.answer_spoken_query(
            query="What are the required documents for Post Matric Scholarship?",
            language="en",
            dialogue_mode=VoiceDialogueMode.DISCOVERY
        )
        assert resp.language == "en"
        assert len(resp.spoken_text) > 10
        assert "http" not in resp.spoken_text

    def test_greeting_spoken_response(self):
        resp_kn = VoiceConversationService.answer_spoken_query("ನಮಸ್ಕಾರ", language="kn")
        assert "ಸ್ಕೀಮ್‌ಸಾಥಿ" in resp_kn.spoken_text

        resp_hi = VoiceConversationService.answer_spoken_query("नमस्ते", language="hi")
        assert "स्कीमसाथी" in resp_hi.spoken_text

        resp_en = VoiceConversationService.answer_spoken_query("Hello help me", language="en")
        assert "SchemeSaathi" in resp_en.spoken_text


class TestVoicePhoneticsAndLanguageDetection:
    def test_spoken_phonetics_cleaning(self):
        raw = "Check [PM-KISAN](https://pmkisan.gov.in) for ₹6,000 via DBT at your local CSC centre."
        clean = NaturalVoicePhoneticsProvider.prepare_spoken_ssml(raw, "en")
        assert "https://" not in clean
        assert "Rupees 6,000" in clean
        assert "Direct Bank Transfer" in clean

    def test_kannada_phonetics_cleaning(self):
        raw = "PM-KISAN ಯೋಜನೆಯಡಿ ₹6,000 DBT ಮೂಲಕ ಜಮೆಯಾಗುತ್ತದೆ."
        clean = NaturalVoicePhoneticsProvider.prepare_spoken_ssml(raw, "kn")
        assert "ಪಿಎಂ ಕಿಸಾನ್" in clean
        assert "ರೂಪಾಯಿ" in clean

    def test_language_detection(self):
        lang_kn, conf_kn = LanguageDetectionService.detect_text_language("ನಮಸ್ಕಾರ ರೈತ ಬಂಧುಗಳೇ")
        assert lang_kn == "kn"
        assert conf_kn > 0.7

        lang_hi, conf_hi = LanguageDetectionService.detect_text_language("नमस्ते किसान भाइयों")
        assert lang_hi == "hi"
        assert conf_hi > 0.7

        lang_en, conf_en = LanguageDetectionService.detect_text_language("Hello farmer assistance")
        assert lang_en == "en"


class TestVoiceEligibilityInterviewer:
    def test_spoken_eligibility_interview_full_flow_kannada(self):
        # 1. Start interview
        state = VoiceEligibilityInterviewer.start_interview(language="kn")
        assert not state.is_completed
        assert state.current_question is not None
        assert state.current_question.field_name == "occupation"

        # 2. Answer occupation: "ನಾನು ರೈತ" (I am a farmer)
        state = VoiceEligibilityInterviewer.process_spoken_answer(
            session_id=state.session_id,
            spoken_text="ನಾನು ರೈತ",
            language="kn"
        )
        assert state.answers.get("occupation") == "farmer"
        assert state.current_question.field_name == "landholding_hectares"

        # 3. Answer landholding: "2 ಎಕರೆ"
        state = VoiceEligibilityInterviewer.process_spoken_answer(
            session_id=state.session_id,
            spoken_text="2 ಎಕರೆ ಭೂಮಿ ಇದೆ",
            language="kn"
        )
        assert state.answers.get("landholding_hectares") > 0.0
        assert state.current_question.field_name == "is_tax_payer"

        # 4. Answer tax: "ಇಲ್ಲ" (No)
        state = VoiceEligibilityInterviewer.process_spoken_answer(
            session_id=state.session_id,
            spoken_text="ಇಲ್ಲ, ನಾನು ತೆರಿಗೆ ಕಟ್ಟುವುದಿಲ್ಲ",
            language="kn"
        )
        assert state.answers.get("is_tax_payer") is False
        assert state.current_question.field_name == "age"

        # 5. Answer age: "42"
        state = VoiceEligibilityInterviewer.process_spoken_answer(
            session_id=state.session_id,
            spoken_text="ನಲವತ್ತೆರಡು 42 ವರ್ಷ",
            language="kn"
        )
        assert state.answers.get("age") == 42
        assert state.current_question.field_name == "is_bpl_card_holder"

        # 6. Answer BPL: "ಹೌದು" (Yes)
        state = VoiceEligibilityInterviewer.process_spoken_answer(
            session_id=state.session_id,
            spoken_text="ಹೌದು, ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಇದೆ",
            language="kn"
        )
        assert state.answers.get("is_bpl_card_holder") is True
        assert state.current_question.field_name == "state"

        # 7. Answer state: "ಕರ್ನಾಟಕ"
        state = VoiceEligibilityInterviewer.process_spoken_answer(
            session_id=state.session_id,
            spoken_text="ಕರ್ನಾಟಕ",
            language="kn"
        )
        # Should be completed and evaluated
        assert state.is_completed is True
        assert state.current_question is None
        assert state.eligible_schemes_count >= 1
        assert "ಅಭಿನಂದನೆಗಳು" in state.verdict_spoken

    def test_unclear_spoken_answer_does_not_falsely_disqualify(self):
        state = VoiceEligibilityInterviewer.start_interview(language="en")
        orig_q = state.current_question.field_name

        # Send unclear murmur / noise
        state = VoiceEligibilityInterviewer.process_spoken_answer(
            session_id=state.session_id,
            spoken_text="... hmm uh",
            language="en"
        )
        # Must not advance or assume False
        assert state.is_completed is False
        assert state.current_question.field_name == orig_q
        assert "repeat" in state.current_question.question_spoken.lower() or "sorry" in state.current_question.question_spoken.lower()


class TestVoiceEndpoints:
    def test_voice_chat_api(self):
        data = handle_voice_chat(
            VoiceChatRequest(query="Tell me about farmer schemes", language="en")
        )
        assert data.spoken_text is not None
        assert data.display_text is not None
        assert data.language == "en"

    def test_voice_eligibility_start_and_answer_api(self):
        # Start
        start_data = start_voice_eligibility_interview(
            VoiceInterviewStartRequest(language="kn")
        )
        sid = start_data.session_id
        assert start_data.current_question is not None

        # Answer
        ans_data = answer_voice_eligibility_question(
            VoiceInterviewAnswerRequest(session_id=sid, spoken_answer="ರೈತ", language="kn")
        )
        assert ans_data.answers["occupation"] == "farmer"

    def test_voice_welcome_api(self):
        data = get_voice_welcome(language="hi")
        assert "स्कीमसाथी" in data.spoken_text

    def test_voice_synthesize_api(self):
        data = prepare_speech_synthesis(
            SynthesisRequest(text="Visit PM-KISAN at https://pmkisan.gov.in for ₹6,000", language="en")
        )
        assert "https://" not in data["spoken_text"]
        assert data["suggested_voice_lang"] == "en-IN"
