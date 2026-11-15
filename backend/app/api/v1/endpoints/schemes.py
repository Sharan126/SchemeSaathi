"""Scheme Discovery & Detail Endpoints"""

from typing import List, Optional, Dict, Any
from fastapi import APIRouter, HTTPException, Query
from app.db.repository import SchemeRepository

router = APIRouter(prefix="/schemes", tags=["Schemes"])


@router.get("", response_model=List[Dict[str, Any]])
def list_schemes(
    category: Optional[str] = None,
    beneficiary: Optional[str] = None,
    q: Optional[str] = None,
    locale: str = "en"
):
    """Returns all verified, published Central Government schemes with optional filters."""
    return SchemeRepository.get_all_published(
        category=category,
        beneficiary=beneficiary,
        search_query=q,
        locale=locale
    )


@router.get("/categories")
def get_categories():
    """Returns available scheme categories with localized titles and counts."""
    schemes = SchemeRepository.get_all_published()
    counts = {}
    for s in schemes:
        cat = s.get("category", "general")
        counts[cat] = counts.get(cat, 0) + 1

    category_labels = {
        "agriculture": {"en": "Agriculture & Farmers", "hi": "कृषि एवं किसान", "kn": "ಕೃಷಿ ಮತ್ತು ರೈತರು"},
        "health": {"en": "Health & Healthcare", "hi": "स्वास्थ्य एवं चिकित्सा", "kn": "ಆರೋಗ್ಯ ಮತ್ತು ವೈದ್ಯಕೀಯ"},
        "women_and_child": {"en": "Women & Child Care", "hi": "महिला एवं बाल विकास", "kn": "ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಕಲ್ಯಾಣ"},
        "education": {"en": "Education & Scholarships", "hi": "शिक्षा एवं छात्रवृत्ति", "kn": "ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ"},
        "disability_empowerment": {"en": "Divyangjan Empowerment", "hi": "दिव्यांगजन सशक्तिकरण", "kn": "ದಿವ್ಯಾಂಗಜನ ಸಬಲೀಕರಣ"},
        "social_security": {"en": "Social Security & Pension", "hi": "सामाजिक सुरक्षा एवं पेंशन", "kn": "ಸಾಮಾಜಿಕ ಭದ್ರತೆ ಮತ್ತು ಪಿಂಚಣಿ"},
        "housing": {"en": "Rural Housing", "hi": "ग्रामीण आवास", "kn": "ಗ್ರಾಮೀಣ ವಸತಿ"}
    }

    return [
        {
            "id": cat_id,
            "count": count,
            "title": category_labels.get(cat_id, {"en": cat_id.replace("_", " ").title(), "hi": cat_id, "kn": cat_id})
        }
        for cat_id, count in counts.items()
    ]


@router.get("/{slug}")
def get_scheme_by_slug(slug: str):
    """Retrieves full scheme details by slug, including criteria, documents, benefits, and citations."""
    scheme = SchemeRepository.get_by_slug(slug)
    if not scheme:
        raise HTTPException(status_code=404, detail="Scheme not found")
    return scheme
