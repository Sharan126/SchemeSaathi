"""Document Readiness & Issuing Authority Endpoints"""

from typing import List, Dict, Any, Optional
from fastapi import APIRouter, HTTPException
from app.db.repository import SchemeRepository
from app.modules.translation.glossary import GLOSSARY

router = APIRouter(prefix="/documents", tags=["Documents"])


@router.get("/directory")
def get_document_directory():
    """Returns directory of standard government documents, purpose, and issuing authorities."""
    docs = [
        {
            "code": "aadhaar",
            "name": {"en": "Aadhaar Card", "hi": "आधार कार्ड", "kn": "ಆಧಾರ್ ಕಾರ್ಡ್"},
            "authority": {"en": "UIDAI / Aadhaar Seva Kendra", "hi": "यूआईडीएआई / आधार सेवा केंद्र", "kn": "ಯುಐಡಿಎಐ / ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರ"},
            "description": {
                "en": "Universal 12-digit biometric identity card required for Direct Benefit Transfer (DBT).",
                "hi": "प्रत्यक्ष लाभ अंतरण (डीबीटी) के लिए आवश्यक 12 अंकों का बायोमेट्रिक पहचान पत्र।",
                "kn": "ನೇರ ನಗದು ವರ್ಗಾವಣೆಗೆ (ಡಿಬಿಟಿ) ಅಗತ್ಯವಿರುವ 12 ಅಂಕಿಯ ಬಯೋಮೆಟ್ರಿಕ್ ಗುರುತಿನ ಚೀಟಿ."
            },
            "estimated_tat_days": "1 - 15 days"
        },
        {
            "code": "land_record",
            "name": {"en": "Land Record (Patta / Khatauni / RoR)", "hi": "भूमि स्वामित्व रिकॉर्ड (खतौनी / पट्टा)", "kn": "ಭೂ ದಾಖಲೆ (ಪಹಣಿ / ಆರ್‌ಒಆರ್)"},
            "authority": {"en": "Revenue Dept / Tehsildar / Bhoomi Portal", "hi": "राजस्व विभाग / तहसीलदार", "kn": "ಕಂದಾಯ ಇಲಾಖೆ / ತಹಶೀಲ್ದಾರ್ / ಭೂಮಿ ಪೋರ್ಟಲ್"},
            "description": {
                "en": "Record of Rights certifying agricultural land ownership in farmer's name.",
                "hi": "किसान के नाम पर कृषि भूमि के स्वामित्व का प्रमाण।",
                "kn": "ರೈತರ ಹೆಸರಿನಲ್ಲಿರುವ ಕೃಷಿ ಭೂಮಿಯ ಮಾಲೀಕತ್ವದ ಅಧಿಕೃತ ದಾಖಲೆ."
            },
            "estimated_tat_days": "1 - 7 days (online via State land portal)"
        },
        {
            "code": "income_certificate",
            "name": {"en": "Income Certificate", "hi": "आय प्रमाण पत्र", "kn": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ"},
            "authority": {"en": "Revenue Inspector / Tehsildar / CSC", "hi": "राजस्व निरीक्षक / तहसीलदार / सीएससी", "kn": "ಕಂದಾಯ ನಿರೀಕ್ಷಕರು / ತಹಶೀಲ್ದಾರ್ / ಗ್ರಾಮ ಒನ್"},
            "description": {
                "en": "Annual household income verification certificate required for scholarships & subsidies.",
                "hi": "छात्रवृत्ति और सब्सिडी के लिए आवश्यक पारिवारिक वार्षिक आय प्रमाण।",
                "kn": "ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಸಬ್ಸಿಡಿಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ."
            },
            "estimated_tat_days": "7 - 14 days"
        },
        {
            "code": "caste_certificate",
            "name": {"en": "Caste Certificate (SC/ST/OBC)", "hi": "जाति प्रमाण पत्र (एससी/एसटी/ओबीसी)", "kn": "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ (ಎಸ್ ಸಿ/ಎಸ್ ಟಿ/ಒಬಿಸಿ)"},
            "authority": {"en": "Sub-Divisional Magistrate (SDM) / Tehsildar", "hi": "उपखंड मजिस्ट्रेट (एसडीएम) / तहसीलदार", "kn": "ಉಪವಿಭಾಗಾಧಿಕಾರಿ / ತಹಶೀಲ್ದಾರ್"},
            "description": {
                "en": "Affirms beneficiary's constitutional reserved category status.",
                "hi": "आरक्षित श्रेणी की पुष्टि करने वाला आधिकारिक दस्तावेज।",
                "kn": "ಮೀಸಲಾತಿ ವರ್ಗದ ಅರ್ಹತೆಯನ್ನು ದೃಢೀಕರಿಸುವ ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರ."
            },
            "estimated_tat_days": "14 - 21 days"
        },
        {
            "code": "udid_card",
            "name": {"en": "Unique Disability ID (UDID) Card", "hi": "विशिष्ट दिव्यांगता पहचान (UDID) कार्ड", "kn": "ವಿಶಿಷ್ಟ ಅಂಗವೈಕಲ್ಯ ಗುರುತಿನ (ಯುಡಿಐಡಿ) ಚೀಟಿ"},
            "authority": {"en": "District Medical Board / Chief Medical Officer", "hi": "जिला मेडिकल बोर्ड / मुख्य चिकित्सा अधिकारी", "kn": "ಜಿಲ್ಲಾ ವೈದ್ಯಕೀಯ ಮಂಡಳಿ"},
            "description": {
                "en": "National electronic ID card for persons with 40% or more permanent disability.",
                "hi": "40% या अधिक स्थायी दिव्यांगता वाले व्यक्तियों के लिए राष्ट्रीय पहचान पत्र।",
                "kn": "40% ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು ಶಾಶ್ವತ ಅಂಗವೈಕಲ್ಯ ಹೊಂದಿರುವ ವ್ಯಕ್ತಿಗಳಿಗೆ ರಾಷ್ಟ್ರೀಯ ಗುರುತಿನ ಚೀಟಿ."
            },
            "estimated_tat_days": "30 days"
        }
    ]
    return docs


@router.get("/scheme/{scheme_id}")
@router.get("/checklist/{scheme_id}")
def get_scheme_document_checklist(scheme_id: str):
    """Returns required documents checklist and alternative options for a specific scheme."""
    scheme = SchemeRepository.get_by_id(scheme_id)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return {
        "scheme_id": scheme["id"],
        "scheme_title": scheme.get("title", {}),
        "documents": scheme.get("documents", [])
    }
