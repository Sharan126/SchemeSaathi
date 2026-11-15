"""Authoritative Trilingual Indian Administrative Glossary (English, Hindi, Kannada)"""

from typing import Dict, Optional


GLOSSARY: Dict[str, Dict[str, str]] = {
    # Beneficiary Categories
    "farmer": {
        "en": "Farmer",
        "hi": "किसान",
        "kn": "ರೈತ"
    },
    "small_marginal_farmer": {
        "en": "Small & Marginal Farmer (< 2 hectares)",
        "hi": "छोटा एवं सीमांत किसान (< 2 हेक्टेयर)",
        "kn": "ಸಣ್ಣ ಮತ್ತು ಅಂಚಿನ ರೈತ (< 2 ಹೆಕ್ಟೇರ್)"
    },
    "woman": {
        "en": "Woman",
        "hi": "महिला",
        "kn": "ಮಹಿಳೆ"
    },
    "student": {
        "en": "Student",
        "hi": "विद्यार्थी / छात्र",
        "kn": "ವಿದ್ಯಾರ್ಥಿ"
    },
    "senior_citizen": {
        "en": "Senior Citizen",
        "hi": "वरिष्ठ नागरिक",
        "kn": "ಹಿರಿಯ ನಾಗರಿಕ"
    },
    "divyangjan": {
        "en": "Person with Disability (Divyangjan)",
        "hi": "दिव्यांगजन",
        "kn": "ವಿಕಲಚೇತನರು (ದಿವ್ಯಾಂಗಜನ)"
    },
    "rural_citizen": {
        "en": "Rural Resident",
        "hi": "ग्रामीण निवासी",
        "kn": "ಗ್ರಾಮೀಣ ನಿವಾಸಿ"
    },

    # Documents & Certificates
    "aadhaar_card": {
        "en": "Aadhaar Card",
        "hi": "आधार कार्ड",
        "kn": "ಆಧಾರ್ ಕಾರ್ಡ್"
    },
    "ration_card_bpl": {
        "en": "BPL Ration Card",
        "hi": "बीपीएल राशन कार्ड",
        "kn": "ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ"
    },
    "land_record_patta": {
        "en": "Land Ownership Record (Patta / RoR)",
        "hi": "भूमि स्वामित्व रिकॉर्ड (पट्टा / खतौनी)",
        "kn": "ಭೂ ದಾಖಲೆ (ಪಹಣಿ / ಆರ್‌ಒಆರ್)"
    },
    "income_certificate": {
        "en": "Income Certificate",
        "hi": "आय प्रमाण पत्र",
        "kn": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ"
    },
    "caste_certificate": {
        "en": "Caste Certificate",
        "hi": "जाति प्रमाण पत्र",
        "kn": "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ"
    },
    "bank_passbook_aadhaar_linked": {
        "en": "Aadhaar-Seeded Bank Passbook",
        "hi": "आधार से जुड़ा बैंक खाता पासबुक",
        "kn": "ಆಧಾರ್ ಜೋಡಿಸಲಾದ ಬ್ಯಾಂಕ್ ಖಾತೆ ಪುಸ್ತಕ"
    },
    "disability_certificate": {
        "en": "UDID / Disability Certificate (min 40%)",
        "hi": "यूडीआईडी / दिव्यांगता प्रमाण पत्र (न्यूनतम 40%)",
        "kn": "ಯುಡಿಐಡಿ / ಅಂಗವೈಕಲ್ಯ ಪ್ರಮಾಣಪತ್ರ (ಕನಿಷ್ಠ 40%)"
    },

    # Authorities
    "tehsildar": {
        "en": "Tehsildar / Taluk Office",
        "hi": "तहसीलदार / तहसील कार्यालय",
        "kn": "ತಹಶೀಲ್ದಾರ್ / ತಾಲೂಕು ಕಚೇರಿ"
    },
    "gram_panchayat": {
        "en": "Gram Panchayat Office",
        "hi": "ग्राम पंचायत कार्यालय",
        "kn": "ಗ್ರಾಮ ಪಂಚಾಯತಿ ಕಚೇರಿ"
    },
    "csc_centre": {
        "en": "Common Service Centre (CSC) / Digital Seva",
        "hi": "कॉमन सर्विस सेंटर (सीएससी) / डिजिटल सेवा",
        "kn": "ಗ್ರಾಮ ಒನ್ / ಸಾಮಾನ್ಯ ಸೇವಾ ಕೇಂದ್ರ (ಸಿಎಸ್‌ಸಿ)"
    },
    "bank_branch": {
        "en": "Designated Public Sector Bank Branch",
        "hi": "नामित सार्वजनिक क्षेत्र बैंक शाखा",
        "kn": "ನಿಗದಿತ ಸಾರ್ವಜನಿಕ ಬ್ಯಾಂಕ್ ಶಾಖೆ"
    }
}


def lookup_term(term_key: str, lang: str = "en") -> str:
    """Returns official administrative translation for a canonical term."""
    entry = GLOSSARY.get(term_key)
    if not entry:
        return term_key
    return entry.get(lang, entry.get("en", term_key))
