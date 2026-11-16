"""Unified Scheme Repository & Data Store Manager

Provides synchronized in-memory and database access for high-speed queries,
hybrid vector search, and transactional updates.
"""

from typing import List, Dict, Any, Optional
from app.db.seeds import VERIFIED_SCHEMES_SEED
from app.modules.catalogue.models import SchemeStatus


class SchemeRepository:
    _schemes_store: Dict[str, Dict[str, Any]] = {}
    _versions_store: Dict[str, List[Dict[str, Any]]] = {}
    _audit_logs: List[Dict[str, Any]] = []
    _cached_chunks: Optional[List[Dict[str, Any]]] = None

    @classmethod
    def initialize_store(cls):
        """Initializes repository with verified seed schemes."""
        if not cls._schemes_store:
            for s in VERIFIED_SCHEMES_SEED:
                scheme_copy = dict(s)
                cls._schemes_store[scheme_copy["id"]] = scheme_copy
                cls._versions_store[scheme_copy["id"]] = [dict(scheme_copy)]
            
            # Preserve historical Version 1 for Ayushman Bharat PM-JAY
            if "ayushman-bharat-pmjay" in cls._schemes_store:
                v1_copy = dict(cls._schemes_store["ayushman-bharat-pmjay"])
                v1_copy["version_number"] = 1
                v1_copy["source_reference_date"] = "2018-09-23"
                v1_copy["criteria"] = [
                    {
                        "field_name": "is_bpl_card_holder",
                        "criterion_type": "BOOLEAN",
                        "rule_ast": {
                            "or": [
                                {"==": [{"var": "is_bpl_card_holder"}, True]},
                                {"<=": [{"var": "annual_income_inr"}, 250000.0]}
                            ]
                        },
                        "explanation": {
                            "en": "Family must hold BPL ration card or annual income <= Rs. 2.5 Lakhs (Version 1 - 2018 Baseline)",
                            "hi": "परिवार के पास बीपीएल राशन कार्ड या आय 2.5 लाख से कम होनी चाहिए (संस्करण 1)",
                            "kn": "ಕುಟುಂಬವು ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ ಹೊಂದಿರಬೇಕು ಅಥವಾ ಆದಾಯ 2.5 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಬೇಕು (ಆವೃತ್ತಿ 1)"
                        },
                        "is_mandatory": True
                    }
                ]
                cls._versions_store["ayushman-bharat-pmjay"] = [v1_copy, dict(cls._schemes_store["ayushman-bharat-pmjay"])]

            cls._cached_chunks = None

    @classmethod
    def get_version(cls, scheme_id: str, version_number: int) -> Optional[Dict[str, Any]]:
        cls.initialize_store()
        norm_id = cls.ALIASES.get(scheme_id.lower(), scheme_id)
        for v in cls._versions_store.get(norm_id, []):
            if v.get("version_number") == version_number:
                return v
        return None

    @classmethod
    def get_all_versions(cls, scheme_id: str) -> List[Dict[str, Any]]:
        cls.initialize_store()
        norm_id = cls.ALIASES.get(scheme_id.lower(), scheme_id)
        return cls._versions_store.get(norm_id, [])

    @classmethod
    def get_all_with_criteria(cls) -> List[Dict[str, Any]]:
        cls.initialize_store()
        return cls.get_all_published()

    @classmethod
    def get_all_published(
        cls,
        category: Optional[str] = None,
        beneficiary: Optional[str] = None,
        search_query: Optional[str] = None,
        locale: str = "en"
    ) -> List[Dict[str, Any]]:
        cls.initialize_store()
        results = []
        for s in cls._schemes_store.values():
            if s.get("status") != SchemeStatus.PUBLISHED:
                continue
            if category and s.get("category") != category:
                continue
            if beneficiary and beneficiary not in s.get("target_beneficiaries", []):
                continue
            if search_query:
                q = search_query.lower()
                title = s.get("title", {}).get(locale, s.get("title", {}).get("en", "")).lower()
                desc = s.get("short_description", {}).get(locale, s.get("short_description", {}).get("en", "")).lower()
                ministry = s.get("ministry", "").lower()
                if q not in title and q not in desc and q not in ministry:
                    continue
            results.append(s)
        return results

    ALIASES: Dict[str, str] = {
        "pmjay": "ayushman-bharat-pmjay",
        "ab-pmjay": "ayushman-bharat-pmjay",
        "pm-jay": "ayushman-bharat-pmjay"
    }

    @classmethod
    def get_by_id(cls, scheme_id: str) -> Optional[Dict[str, Any]]:
        cls.initialize_store()
        norm_id = cls.ALIASES.get(scheme_id.lower(), scheme_id)
        if norm_id in cls._schemes_store:
            return cls._schemes_store[norm_id]
        return cls.get_by_slug(norm_id)

    @classmethod
    def get_by_slug(cls, slug: str) -> Optional[Dict[str, Any]]:
        cls.initialize_store()
        norm_slug = cls.ALIASES.get(slug.lower(), slug)
        for s in cls._schemes_store.values():
            if s.get("slug") == norm_slug or s.get("id") == norm_slug:
                return s
        return None

    @classmethod
    def get_all_chunks(cls) -> List[Dict[str, Any]]:
        cls.initialize_store()
        if cls._cached_chunks is not None:
            return cls._cached_chunks

        from app.modules.rag.embeddings import EmbeddingService
        all_chunks = []
        for s in cls._schemes_store.values():
            if s.get("status") != SchemeStatus.PUBLISHED:
                continue

            # 1. Existing explicit chunks
            for idx, ch in enumerate(s.get("chunks", [])):
                content = ch.get("content", "")
                vec = ch.get("embedding_vector") or EmbeddingService.generate_vector(content)
                all_chunks.append({
                    "id": f"{s['id']}-chunk-{idx}",
                    "scheme_id": s["id"],
                    "scheme_title": s.get("title", {}),
                    "category": s.get("category"),
                    "section_title": ch.get("section_title", "General"),
                    "language": ch.get("language", "en"),
                    "content": content,
                    "official_portal_url": s.get("official_portal_url", ""),
                    "gazette_notification_url": s.get("gazette_notification_url"),
                    "source_reference_date": s.get("source_reference_date", "2024-01-01"),
                    "embedding_vector": vec
                })

            # 2. Rich Application Steps Chunks across languages (en, hi, kn)
            app_steps = s.get("application_steps", [])
            if app_steps:
                step_section_titles = {
                    "en": "Application Steps and How to Apply",
                    "hi": "आवेदन प्रक्रिया एवं चरण",
                    "kn": "ಅರ್ಜಿ ಸಲ್ಲಿಸುವ ಅಧಿಕೃತ ವಿಧಾನ ಮತ್ತು ಹಂತಗಳು"
                }
                for lang_code in ("en", "hi", "kn"):
                    step_lines = []
                    for st in app_steps:
                        num = st.get("step", len(step_lines) + 1)
                        desc = st.get(lang_code, st.get("en", ""))
                        if desc:
                            step_lines.append(f"Step {num}: {desc}")

                    portal = s.get("official_portal_url", "")
                    if lang_code == "kn":
                        footer = f"\nಅಧಿಕೃತ ಪೋರ್ಟಲ್: {portal}\nಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ ಅಥವಾ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ."
                    elif lang_code == "hi":
                        footer = f"\nआधिकारिक पोर्टल: {portal}\nआवेदन के लिए नजदीकी सीएससी (कॉमन सर्विस सेंटर) पर जाएं।"
                    else:
                        footer = f"\nOfficial Portal: {portal}\nYou can also apply through your nearest Common Service Centre (CSC) or Grama One."

                    content_steps = f"{s.get('title', {}).get(lang_code, s['id'])} - {step_section_titles[lang_code]}:\n" + "\n".join(step_lines) + footer
                    vec = EmbeddingService.generate_vector(content_steps)
                    all_chunks.append({
                        "id": f"{s['id']}-app-steps-{lang_code}",
                        "scheme_id": s["id"],
                        "scheme_title": s.get("title", {}),
                        "category": s.get("category"),
                        "section_title": step_section_titles[lang_code],
                        "language": lang_code,
                        "content": content_steps,
                        "official_portal_url": portal,
                        "gazette_notification_url": s.get("gazette_notification_url"),
                        "source_reference_date": s.get("source_reference_date", "2024-01-01"),
                        "embedding_vector": vec
                    })

            # 3. Mandatory Verification Documents Chunks across languages (en, hi, kn)
            docs = s.get("documents", [])
            if docs:
                doc_section_titles = {
                    "en": "Mandatory Verification Documents",
                    "hi": "आवश्यक आधिकारिक सत्यापन दस्तावेज़",
                    "kn": "ಕಡ್ಡಾಯ ಪರಿಶೀಲನಾ ದಾಖಲೆಗಳು"
                }
                for lang_code in ("en", "hi", "kn"):
                    doc_lines = []
                    for d in docs:
                        dname = d.get("document_name", {}).get(lang_code, d.get("document_name", {}).get("en", d.get("document_code", "")))
                        auth = d.get("issuing_authority", {}).get(lang_code, d.get("issuing_authority", {}).get("en", ""))
                        mand = "Mandatory" if d.get("is_mandatory") else "Optional"
                        if lang_code == "kn":
                            mand = "ಕಡ್ಡಾಯ" if d.get("is_mandatory") else "ಐಚ್ಛಿಕ"
                        elif lang_code == "hi":
                            mand = "अनिवार्य" if d.get("is_mandatory") else "वैकल्पिक"
                        auth_str = f" ({auth})" if auth else ""
                        doc_lines.append(f"• {dname}{auth_str} - {mand}")

                    content_docs = f"{s.get('title', {}).get(lang_code, s['id'])} - {doc_section_titles[lang_code]}:\n" + "\n".join(doc_lines)
                    vec = EmbeddingService.generate_vector(content_docs)
                    all_chunks.append({
                        "id": f"{s['id']}-docs-{lang_code}",
                        "scheme_id": s["id"],
                        "scheme_title": s.get("title", {}),
                        "category": s.get("category"),
                        "section_title": doc_section_titles[lang_code],
                        "language": lang_code,
                        "content": content_docs,
                        "official_portal_url": s.get("official_portal_url", ""),
                        "gazette_notification_url": s.get("gazette_notification_url"),
                        "source_reference_date": s.get("source_reference_date", "2024-01-01"),
                        "embedding_vector": vec
                    })
        cls._cached_chunks = all_chunks
        return cls._cached_chunks

    @classmethod
    def get_review_queue(cls) -> List[Dict[str, Any]]:
        cls.initialize_store()
        return [s for s in cls._schemes_store.values() if s.get("status") in ("in_review", "extracted", "discovered")]

    @classmethod
    def publish_or_update(cls, scheme_id: str, verifier_user: str, notes: str) -> Optional[Dict[str, Any]]:
        cls.initialize_store()
        s = cls._schemes_store.get(scheme_id)
        if not s:
            return None
        s["status"] = SchemeStatus.PUBLISHED
        s["verified_by"] = verifier_user
        s["verification_notes"] = notes
        
        # Append to audit trail
        cls.record_audit(
            entity_type="scheme",
            entity_id=scheme_id,
            action="PUBLISHED",
            performed_by=verifier_user,
            comment=notes
        )
        return s

    @classmethod
    def record_audit(cls, entity_type: str, entity_id: str, action: str, performed_by: str, comment: Optional[str] = None):
        cls._audit_logs.append({
            "entity_type": entity_type,
            "entity_id": entity_id,
            "action": action,
            "performed_by": performed_by,
            "comment": comment
        })

    @classmethod
    def get_audit_logs(cls) -> List[Dict[str, Any]]:
        return list(reversed(cls._audit_logs))
