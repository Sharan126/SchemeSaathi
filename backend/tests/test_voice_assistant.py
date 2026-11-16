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
    VoiceMessage,
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


class TestDiverseSpokenQuestionsAndContext:
    """
    32 Diverse, Real-World Spoken Questions across Kannada, Hindi, and English (Part 8 Validation).
    Ensures question-specific reasoning, AST eligibility evaluation, context memory, and zero repetition.
    """

    # 1. Farmer Queries
    def test_q01_kannada_farmer_schemes(self):
        resp = VoiceConversationService.answer_spoken_query("ರೈತರಿಗೆ ಯಾವ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು ಲಭ್ಯವಿವೆ?", language="kn")
        assert "ಪಿಎಂ" in resp.spoken_text or "ಕಿಸಾನ್" in resp.spoken_text or "ರೈತ" in resp.spoken_text
        assert resp.active_scheme_id == "pm-kisan"

    def test_q02_english_farmer_age_benefits(self):
        resp = VoiceConversationService.answer_spoken_query(
            "I am a 55-year-old farmer. What benefits can I receive?",
            language="en"
        )
        assert "55" in str(resp.extracted_profile.get("age"))
        assert resp.extracted_profile.get("occupation") == "farmer"
        assert len(resp.eligible_schemes) > 0
        assert "qualify" in resp.spoken_text.lower() or "scheme" in resp.spoken_text.lower()

    # 2. Education & Scholarships
    def test_q03_english_daughter_education(self):
        resp = VoiceConversationService.answer_spoken_query(
            "Can I get financial assistance for my daughter's education?",
            language="en"
        )
        assert resp.active_scheme_id in ("sukanya-samriddhi", "pms-sc")
        assert len(resp.spoken_text) > 20

    def test_q04_hindi_income_family_schemes(self):
        resp = VoiceConversationService.answer_spoken_query(
            "मेरी वार्षिक पारिवारिक आय 1.5 लाख है। मुझे कौन सी योजनाएं देखनी चाहिए?",
            language="hi"
        )
        assert resp.extracted_profile.get("annual_income_inr") == 150000
        assert len(resp.eligible_schemes) > 0

    # 3. Simple Language Explanations
    def test_q05_kannada_pm_kisan_simple_language(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆಯನ್ನು ಸರಳ ಭಾಷೆಯಲ್ಲಿ ವಿವರಿಸಿ.",
            language="kn",
            simplicity_mode=True
        )
        assert "ಪಿಎಂ" in resp.spoken_text
        assert len(resp.spoken_text) > 20

    # 4. Ineligibility Reasons
    def test_q06_english_ineligibility_reasons(self):
        resp = VoiceConversationService.answer_spoken_query(
            "Why am I not eligible for this scheme?",
            language="en",
            target_scheme_id="pm-kisan",
            profile_context={"is_tax_payer": True}
        )
        assert "not" in resp.spoken_text.lower() or "exclusion" in resp.spoken_text.lower() or "statutory" in resp.spoken_text.lower()

    # 5. Documents & Application Steps
    def test_q07_kannada_documents_needed(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ನನಗೆ ಯಾವ ದಾಖಲೆಗಳು ಬೇಕಾಗುತ್ತವೆ?",
            language="kn",
            target_scheme_id="pm-kisan"
        )
        assert "ದಾಖಲೆ" in resp.spoken_text or "ಆಧಾರ್" in resp.display_text or "ಪಾಸ್‌ಬುಕ್" in resp.display_text

    def test_q08_hindi_where_to_apply(self):
        resp = VoiceConversationService.answer_spoken_query(
            "मैं इस योजना के लिए कहाँ आवेदन कर सकता हूँ?",
            language="hi",
            target_scheme_id="ayushman-bharat-pmjay"
        )
        assert "सीएससी" in resp.spoken_text or "पोर्टल" in resp.spoken_text or "केंद्र" in resp.spoken_text

    # 6. Comparisons & Related Schemes
    def test_q09_english_similar_schemes(self):
        resp = VoiceConversationService.answer_spoken_query(
            "Are there any similar schemes for farmers?",
            language="en",
            target_scheme_id="pm-kisan"
        )
        assert "scheme" in resp.spoken_text.lower()
        assert resp.detected_intent == "COMPARISON"

    # 7. Senior Citizens
    def test_q10_hindi_senior_citizen_benefits(self):
        resp = VoiceConversationService.answer_spoken_query(
            "वरिष्ठ नागरिकों के लिए क्या लाभ उपलब्ध हैं?",
            language="hi"
        )
        assert resp.active_scheme_id == "ignoaps"
        assert "पेंशन" in resp.spoken_text or "वृद्धावस्था" in resp.display_text

    # 8. Multi-Turn Context Memory & Pronoun Resolution
    def test_q11_english_context_followup(self):
        # Turn 1: Farmer context
        history = [
            VoiceMessage(role="citizen", content="I am a farmer in Karnataka", scheme_id="pm-kisan"),
            VoiceMessage(role="assistant", content="PM-KISAN provides assistance.", scheme_id="pm-kisan"),
        ]
        # Turn 2: Follow-up with pronoun "What documents will I need for it?"
        resp = VoiceConversationService.answer_spoken_query(
            "What documents will I need for it?",
            language="en",
            conversation_history=history
        )
        assert resp.active_scheme_id == "pm-kisan"
        assert "document" in resp.spoken_text.lower() or "aadhaar" in resp.display_text.lower()

    def test_q12_kannada_context_followup_pronoun(self):
        history = [
            VoiceMessage(role="citizen", content="ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಯೋಜನೆ", scheme_id="ayushman-bharat-pmjay"),
            VoiceMessage(role="assistant", content="ಆಯುಷ್ಮಾನ್ ಭಾರತ್ 5 ಲಕ್ಷ ಉಚಿತ ಚಿಕಿತ್ಸೆ ನೀಡುತ್ತದೆ.", scheme_id="ayushman-bharat-pmjay"),
        ]
        resp = VoiceConversationService.answer_spoken_query(
            "ಅದಕ್ಕೆ ಅರ್ಜಿ ಹೇಗೆ ಸಲ್ಲಿಸುವುದು?",
            language="kn",
            conversation_history=history
        )
        assert resp.active_scheme_id == "ayushman-bharat-pmjay"
        assert "ಅರ್ಜಿ" in resp.spoken_text or "ಗ್ರಾಮ ಒನ್" in resp.spoken_text or "ಸಿಎಸ್ಸಿ" in resp.spoken_text

    def test_q13_hindi_context_eligibility_followup(self):
        history = [
            VoiceMessage(role="citizen", content="प्रधानमंत्री आवास योजना", scheme_id="pmay-g"),
            VoiceMessage(role="assistant", content="पीएमएवाई-जी पक्के मकान के लिए सहायता देती है।", scheme_id="pmay-g"),
        ]
        resp = VoiceConversationService.answer_spoken_query(
            "क्या मुझे इसके लिए लाभ मिलेगा?",
            language="hi",
            conversation_history=history,
            profile_context={"has_pucca_house": False, "is_bpl_card_holder": True}
        )
        assert resp.active_scheme_id == "pmay-g"

    # 9. Healthcare & Maternal Care
    def test_q14_english_general_scheme_knowledge(self):
        resp = VoiceConversationService.answer_spoken_query(
            "What is Ayushman Bharat PM-JAY?",
            language="en"
        )
        assert "5 lakh" in resp.display_text.lower() or "health" in resp.spoken_text.lower()

    def test_q15_kannada_pregnant_mother_benefit(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ಗರ್ಭಿಣಿ ತಾಯಂದಿರಿಗೆ ಸರ್ಕಾರದಿಂದ ಎಷ್ಟು ಹಣ ಸಿಗುತ್ತದೆ?",
            language="kn"
        )
        assert resp.active_scheme_id == "pmmvy"
        assert "ರೂಪಾಯಿ" in resp.spoken_text or "5000" in resp.display_text

    def test_q16_hindi_sc_scholarship_income_limit(self):
        resp = VoiceConversationService.answer_spoken_query(
            "अनुसूचित जाति के छात्रों के लिए छात्रवृत्ति में आय सीमा क्या है?",
            language="hi"
        )
        assert resp.active_scheme_id == "pms-sc"
        assert "2.5" in resp.display_text or "छात्रवृत्ति" in resp.display_text

    # 10. Rural Housing & Disabilities
    def test_q17_english_rural_housing_pmayg(self):
        resp = VoiceConversationService.answer_spoken_query(
            "Can I get money to construct a house in my village?",
            language="en"
        )
        assert resp.active_scheme_id == "pmay-g"

    def test_q18_kannada_disability_swavlamban(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ವಿಕಲಚೇತನರಿಗೆ ಸ್ವಾವಲಂಬನೆ ಯೋಜನೆಯಡಿ ಏನು ಸಹಾಯ ಸಿಗುತ್ತದೆ?",
            language="kn"
        )
        assert resp.active_scheme_id == "divyangjan-swavlamban"

    def test_q19_hindi_free_health_cover_amount(self):
        resp = VoiceConversationService.answer_spoken_query(
            "आयुष्मान कार्ड में कितने रुपये का मुफ्त इलाज मिलता है?",
            language="hi"
        )
        assert "5 लाख" in resp.spoken_text or "5 lakh" in resp.display_text.lower() or "500000" in resp.display_text

    # 11. Hoax & Viral Giveaway Interception
    def test_q20_english_hoax_free_iphone(self):
        resp = VoiceConversationService.answer_spoken_query(
            "Is there a government scheme giving free iPhone?",
            language="en"
        )
        assert "warning" in resp.spoken_text.lower() or "fraudulent" in resp.spoken_text.lower()

    def test_q21_kannada_hoax_free_flight(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ಸರ್ಕಾರದಿಂದ ಉಚಿತ ವಿಮಾನ ಟಿಕೆಟ್ ಸಿಗುವ ಯೋಜನೆ ಇದೆಯೇ?",
            language="kn"
        )
        assert "ಎಚ್ಚರಿಕೆ" in resp.spoken_text or "ವಂಚನೆ" in resp.spoken_text

    def test_q22_hindi_hoax_free_smartphone(self):
        resp = VoiceConversationService.answer_spoken_query(
            "क्या सरकार मुफ्त स्मार्टफोन बांट रही है?",
            language="hi"
        )
        assert "चेतावनी" in resp.spoken_text or "धोखाधड़ी" in resp.spoken_text

    # 12. Honest Abstention for Non-Existent Welfare
    def test_q23_english_unknown_scheme(self):
        resp = VoiceConversationService.answer_spoken_query(
            "Tell me about the Mars Colonization Welfare Scheme",
            language="en"
        )
        assert "could not find verified" in resp.spoken_text.lower()

    # 13. Deterministic AST Disqualification
    def test_q24_kannada_large_landholder_ineligible(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ನನ್ನ ಬಳಿ 20 ಎಕರೆ ಜಮೀನಿದೆ ಮತ್ತು ಆದಾಯ ತೆರಿಗೆ ಕಟ್ಟುತ್ತೇನೆ, ಪಿಎಂ-ಕಿಸಾನ್ ಸಿಗುತ್ತಾ?",
            language="kn"
        )
        assert resp.extracted_profile.get("is_tax_payer") is True or resp.extracted_profile.get("landholding_hectares", 0) > 2.0
        assert "ಅರ್ಹರಾಗಿಲ್ಲ" in resp.spoken_text or "ನಿಯಮ" in resp.spoken_text

    def test_q25_hindi_tax_payer_ineligible(self):
        resp = VoiceConversationService.answer_spoken_query(
            "मैं आयकर दाता हूँ, क्या मुझे पीएम-किसान मिलेगा?",
            language="hi",
            target_scheme_id="pm-kisan",
            profile_context={"is_tax_payer": True}
        )
        assert "अपात्र" in resp.spoken_text or "नहीं" in resp.spoken_text

    # 14. Dynamic Language Switching
    def test_q26_language_switching(self):
        resp_en = VoiceConversationService.answer_spoken_query("PM-KISAN overview", language="en")
        assert resp_en.language == "en"

        resp_hi = VoiceConversationService.answer_spoken_query("पीएम-किसान का विवरण", language="hi")
        assert resp_hi.language == "hi"

        resp_kn = VoiceConversationService.answer_spoken_query("ಪಿಎಂ-ಕಿಸಾನ್ ವಿವರ", language="kn")
        assert resp_kn.language == "kn"

    # 15. Simplicity Mode
    def test_q27_kannada_explain_simply(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ಪಿಎಂ ಕಿಸಾನ್ ಬಗ್ಗೆ ಸಾಮಾನ್ಯ ಜನರಿಗೆ ಅರ್ಥವಾಗುವಂತೆ ಸರಳವಾಗಿ ಹೇಳಿ",
            language="kn",
            simplicity_mode=True
        )
        assert len(resp.spoken_text) > 15
        assert "https://" not in resp.spoken_text

    # 16. Audio Quality: Zero Raw URLs & Spoken Phonetics
    def test_q28_no_raw_urls_in_spoken_output(self):
        all_schemes = ["pm-kisan", "ayushman-bharat-pmjay", "pmmvy", "pms-sc"]
        for sid in all_schemes:
            resp = VoiceConversationService.answer_spoken_query("How to apply", language="en", target_scheme_id=sid)
            assert "https://" not in resp.spoken_text
            assert "http://" not in resp.spoken_text
            assert ".gov.in" not in resp.spoken_text

    # 17. Multiple Relevant Scheme Discovery
    def test_q29_hindi_multiple_relevant_schemes(self):
        resp = VoiceConversationService.answer_spoken_query(
            "गरीब ग्रामीण परिवारों के लिए कौन-कौन सी योजनाएं हैं?",
            language="hi"
        )
        assert len(resp.suggested_spoken_prompts) > 0

    # 18. Girl Child Welfare
    def test_q30_english_girl_child_savings(self):
        resp = VoiceConversationService.answer_spoken_query(
            "How does Sukanya Samriddhi Yojana help my daughter?",
            language="en"
        )
        assert resp.active_scheme_id == "sukanya-samriddhi"

    # 19. Senior Pension Age Limit
    def test_q31_kannada_old_age_pension_age_limit(self):
        resp = VoiceConversationService.answer_spoken_query(
            "ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ ಪಡೆಯಲು ಎಷ್ಟು ವಯಸ್ಸಾಗಿರಬೇಕು?",
            language="kn"
        )
        assert resp.active_scheme_id == "ignoaps"

    # 20. Non-Repetition Verification
    def test_q32_different_queries_produce_different_answers(self):
        resp_farmer = VoiceConversationService.answer_spoken_query("Farmer support", language="en")
        resp_health = VoiceConversationService.answer_spoken_query("Health insurance", language="en")
        resp_scholarship = VoiceConversationService.answer_spoken_query("Student scholarship", language="en")
        assert resp_farmer.spoken_text != resp_health.spoken_text
        assert resp_health.spoken_text != resp_scholarship.spoken_text
        assert resp_farmer.active_scheme_id != resp_health.active_scheme_id
