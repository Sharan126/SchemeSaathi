"""Deterministic Scheme Eligibility API Endpoints"""

from typing import Dict, Any, List, Optional
from fastapi import APIRouter
from pydantic import BaseModel
from app.db.repository import SchemeRepository
from app.modules.eligibility.service import EligibilityService, CitizenProfileInput, BatchEvaluationResponse

router = APIRouter(prefix="/eligibility", tags=["Eligibility"])


class EvaluateSchemeRequest(BaseModel):
    profile: CitizenProfileInput
    scheme_id: Optional[str] = None


@router.post("/evaluate", response_model=BatchEvaluationResponse)
def evaluate_eligibility(request: EvaluateSchemeRequest):
    """
    Deterministically evaluates a citizen profile against published schemes.
    ZERO eval(), zero LLM hallucinations.
    Categorizes schemes into ELIGIBLE, POTENTIALLY_ELIGIBLE (NEEDS_MORE_INFO), and INELIGIBLE.
    """
    all_schemes = SchemeRepository.get_all_published()
    if request.scheme_id:
        target = SchemeRepository.get_by_id(request.scheme_id)
        schemes_to_eval = [target] if target else []
    else:
        schemes_to_eval = all_schemes

    return EligibilityService.evaluate_all(schemes_to_eval, request.profile)


@router.get("/wizard-fields")
async def get_wizard_fields():
    """Returns the ordered citizen profile questionnaire fields with multilingual prompts."""
    return [
        {
            "id": "occupation",
            "type": "select",
            "label": {"en": "What is your primary occupation?", "hi": "आपका मुख्य व्यवसाय क्या है?", "kn": "ನಿಮ್ಮ ಮುಖ್ಯ ಉದ್ಯೋಗ ಯಾವುದು?"},
            "options": [
                {"value": "farmer", "label": {"en": "Farmer / Agriculture", "hi": "किसान / कृषि", "kn": "ರೈತ / ಕೃಷಿ"}},
                {"value": "student", "label": {"en": "Student", "hi": "विद्यार्थी", "kn": "ವಿದ್ಯಾರ್ಥಿ"}},
                {"value": "worker", "label": {"en": "Daily Wage / Informal Worker", "hi": "दैनिक वेतनभोगी श्रमिक", "kn": "ದಿನಗೂಲಿ ಕಾರ್ಮಿಕ"}},
                {"value": "self_employed", "label": {"en": "Self-Employed / Small Business", "hi": "स्वरोजगार / छोटा व्यवसाय", "kn": "ಸ್ವಯಂ ಉದ್ಯೋಗಿ"}},
                {"value": "senior_citizen", "label": {"en": "Senior Citizen / Retired", "hi": "वरिष्ठ नागरिक / सेवानिवृत्त", "kn": "ಹಿರಿಯ ನಾಗರಿಕ"}}
            ]
        },
        {
            "id": "gender",
            "type": "select",
            "label": {"en": "Select Gender", "hi": "लिंग चुनें", "kn": "ಲಿಂಗ ಆಯ್ಕೆಮಾಡಿ"},
            "options": [
                {"value": "female", "label": {"en": "Female", "hi": "महिला", "kn": "ಮಹಿಳೆ"}},
                {"value": "male", "label": {"en": "Male", "hi": "पुरुष", "kn": "ಪುರುಷ"}},
                {"value": "transgender", "label": {"en": "Transgender", "hi": "ट्रांसजेंडर", "kn": "ತೃತೀಯಲಿಂಗಿ"}}
            ]
        },
        {
            "id": "age",
            "type": "number",
            "label": {"en": "What is your age in years?", "hi": "आपकी आयु कितने वर्ष है?", "kn": "ನಿಮ್ಮ ವಯಸ್ಸು ಎಷ್ಟು?"},
            "placeholder": "e.g. 35"
        },
        {
            "id": "social_category",
            "type": "select",
            "label": {"en": "Social Category / Caste Group", "hi": "सामाजिक वर्ग / श्रेणी", "kn": "ಸಾಮಾಜಿಕ ವರ್ಗ / ಜಾತಿ ಗುಂಪು"},
            "options": [
                {"value": "GEN", "label": {"en": "General", "hi": "सामान्य", "kn": "ಸಾಮಾನ್ಯ"}},
                {"value": "SC", "label": {"en": "Scheduled Caste (SC)", "hi": "अनुसूचित जाति (SC)", "kn": "ಪರಿಶಿಷ್ಟ ಜಾತಿ (ಎಸ್ ಸಿ)"}},
                {"value": "ST", "label": {"en": "Scheduled Tribe (ST)", "hi": "अनुसूचित जनजाति (ST)", "kn": "ಪರಿಶಿಷ್ಟ ಪಂಗಡ (ಎಸ್ ಟಿ)"}},
                {"value": "OBC", "label": {"en": "Other Backward Classes (OBC)", "hi": "अन्य पिछड़ा वर्ग (OBC)", "kn": "ಹಿಂದುಳಿದ ವರ್ಗಗಳು (ಒಬಿಸಿ)"}},
                {"value": "EWS", "label": {"en": "Economically Weaker Section (EWS)", "hi": "आर्थिक रूप से कमजोर वर्ग (EWS)", "kn": "ಆರ್ಥಿಕವಾಗಿ ಹಿಂದುಳಿದ ವರ್ಗ (ಇಡಬ್ಲ್ಯೂಎಸ್)"}}
            ]
        },
        {
            "id": "residence_area",
            "type": "select",
            "label": {"en": "Area of Residence", "hi": "निवास का क्षेत्र", "kn": "ವಾಸಸ್ಥಳ ಪ್ರದೇಶ"},
            "options": [
                {"value": "rural", "label": {"en": "Rural (Village / Gram Panchayat)", "hi": "ग्रामीण (गांव / ग्राम पंचायत)", "kn": "ಗ್ರಾಮೀಣ (ಹಳ್ಳಿ / ಗ್ರಾಮ ಪಂಚಾಯತಿ)"}},
                {"value": "urban", "label": {"en": "Urban (Town / City)", "hi": "शहरी (कस्बा / शहर)", "kn": "ನಗರ ಪ್ರದೇಶ"}}
            ]
        },
        {
            "id": "annual_income_inr",
            "type": "number",
            "label": {"en": "Total Annual Family Income (INR)", "hi": "कुल वार्षिक पारिवारिक आय (रुपये में)", "kn": "ಒಟ್ಟು ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ (ರೂ.ಗಳಲ್ಲಿ)"},
            "placeholder": "e.g. 150000"
        },
        {
            "id": "is_bpl_card_holder",
            "type": "boolean",
            "label": {"en": "Does your family have a BPL / Antyodaya Ration Card?", "hi": "क्या आपके परिवार के पास बीपीएल / अंत्योदय राशन कार्ड है?", "kn": "ನಿಮ್ಮ ಕುಟುಂಬವು ಬಿಪಿಎಲ್ / ಅಂತ್ಯೋದಯ ಪಡಿತರ ಚೀಟಿ ಹೊಂದಿದೆಯೇ?"}
        },
        {
            "id": "landholding_hectares",
            "type": "number",
            "label": {"en": "Cultivable Landholding in Hectares (if farmer)", "hi": "कृषि योग्य भूमि का स्वामित्व (हेक्टेयर में)", "kn": "ಕೃಷಿ ಭೂಹಿಡುವಳಿ (ಹೆಕ್ಟೇರ್ ಗಳಲ್ಲಿ)"},
            "placeholder": "e.g. 1.2"
        },
        {
            "id": "is_disabled",
            "type": "boolean",
            "label": {"en": "Are you a Person with Disability (Divyangjan)?", "hi": "क्या आप दिव्यांगजन हैं?", "kn": "ನೀವು ವಿಕಲಚೇತನರೇ (ದಿವ್ಯಾಂಗಜನ)?"}
        },
        {
            "id": "is_pregnant_or_lactating",
            "type": "boolean",
            "label": {"en": "Are you currently pregnant or a lactating mother?", "hi": "क्या आप वर्तमान में गर्भवती या धात्री माता हैं?", "kn": "ನೀವು ಪ್ರಸ್ತುತ ಗರ್ಭಿಣಿ ಅಥವಾ ಹಾಲುಣಿಸುವ ತಾಯಿಯೇ?"}
        }
    ]
