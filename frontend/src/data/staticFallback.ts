import { Scheme, DocumentDirectoryItem } from '@/types';

export const STATIC_SCHEMES: Scheme[] = [
  {
    "id": "pm-kisan",
    "slug": "pradhan-mantri-kisan-samman-nidhi",
    "ministry": "Ministry of Agriculture and Farmers Welfare",
    "department": "Department of Agriculture and Farmers Welfare",
    "category": "agriculture",
    "target_beneficiaries": [
      "farmers",
      "rural"
    ],
    "status": "published",
    "version_number": 1,
    "title": {
      "en": "Pradhan Mantri Kisan Samman Nidhi (PM-KISAN)",
      "hi": "प्रधानमंत्री किसान सम्मान निधि (पीएम-किसान)",
      "kn": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ (ಪಿಎಂ-ಕಿಸಾನ್)"
    },
    "short_description": {
      "en": "Income support of Rs. 6,000 per year for all landholding farmer families.",
      "hi": "सभी भूमिधारक किसान परिवारों को प्रति वर्ष 6,000 रुपये की प्रत्यक्ष आय सहायता।",
      "kn": "ಎಲ್ಲಾ ಭೂಹಿಡುವಳಿ ಹೊಂದಿರುವ ರೈತ ಕುಟುಂಬಗಳಿಗೆ ವಾರ್ಷಿಕ 6,000 ರೂ.ಗಳ ಆದಾಯ ಬೆಂಬಲ."
    },
    "full_description": {
      "en": "Under PM-KISAN, the Central Government provides financial assistance of Rs. 6,000 per year in three equal 4-monthly installments of Rs. 2,000 directly into the Aadhaar-seeded bank accounts of eligible farmer families.",
      "hi": "पीएम-किसान योजना के तहत केंद्र सरकार पात्र किसान परिवारों के आधार से जुड़े बैंक खातों में 2,000 रुपये की तीन समान 4-मासिक किस्तों में प्रति वर्ष 6,000 रुपये की वित्तीय सहायता प्रदान करती है।",
      "kn": "ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆಯಡಿ ಕೇಂದ್ರ ಸರ್ಕಾರವು ಅರ್ಹ ರೈತ ಕುಟುಂಬಗಳ ಆಧಾರ್-ಸಂಯೋಜಿತ ಬ್ಯಾಂಕ್ ಖಾತೆಗಳಿಗೆ ತಲಾ 2,000 ರೂ.ಗಳ ಮೂರು ಕಂತುಗಳಲ್ಲಿ ವಾರ್ಷಿಕ 6,000 ರೂ.ಗಳ ಆರ್ಥಿಕ ನೆರವನ್ನು ನೇರವಾಗಿ ವರ್ಗಾಯಿಸುತ್ತದೆ."
    },
    "official_portal_url": "https://pmkisan.gov.in",
    "gazette_notification_url": "https://agricoop.nic.in/en/PM-Kisan",
    "source_reference_date": "2019-02-01",
    "source_document_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "funding_type": "CENTRAL_SECTOR",
    "application_mode": "BOTH",
    "application_steps": [
      {
        "step": 1,
        "en": "Visit PM-KISAN portal or nearest CSC centre",
        "hi": "पीएम-किसान पोर्टल या निकटतम सीएससी केंद्र पर जाएं",
        "kn": "ಪಿಎಂ-ಕಿಸಾನ್ ಪೋರ್ಟಲ್ ಅಥವಾ ಹತ್ತಿರದ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರಕ್ಕೆ ಭೇಟಿ ನೀಡಿ"
      },
      {
        "step": 2,
        "en": "Click on 'Farmer Corner' and select 'New Farmer Registration'",
        "hi": "'फार्मर कॉर्नर' पर क्लिक करें और 'नया किसान पंजीकरण' चुनें",
        "kn": "'ಫಾರ್ಮರ್ ಕಾರ್ನರ್' ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು 'ಹೊಸ ರೈತ ನೋಂದಣಿ' ಆಯ್ಕೆಮಾಡಿ"
      },
      {
        "step": 3,
        "en": "Enter Aadhaar number and state, then verify via Aadhaar OTP",
        "hi": "आधार संख्या और राज्य दर्ज करें, फिर ओटीपी से सत्यापित करें",
        "kn": "ಆಧಾರ್ ಸಂಖ್ಯೆ ಮತ್ತು ರಾಜ್ಯವನ್ನು ನಮೂದಿಸಿ, ನಂತರ ಒಟಿಪಿ ಮೂಲಕ ಪರಿಶೀಲಿಸಿ"
      },
      {
        "step": 4,
        "en": "Upload land record ownership details (Khatauni/Patta)",
        "hi": "भूमि स्वामित्व रिकॉर्ड (खतौनी/पट्टा) विवरण अपलोड करें",
        "kn": "ಭೂ ದಾಖಲೆ ಮಾಲೀಕತ್ವದ ವಿವರಗಳನ್ನು (ಪಹಣಿ/ಆರ್‌ಒಆರ್) ಅಪ್‌ಲೋಡ್ ಮಾಡಿ"
      }
    ],
    "benefits": [
      {
        "benefit_type": "CASH_TRANSFER",
        "amount_description": {
          "en": "Rs. 6,000 per year (3 installments of Rs. 2,000 every 4 months)",
          "hi": "6,000 रुपये प्रति वर्ष (प्रत्येक 4 माह में 2,000 रुपये की 3 किस्तों में)",
          "kn": "ವಾರ್ಷಿಕ ರೂ. 6,000 (ಪ್ರತಿ 4 ತಿಂಗಳಿಗೊಮ್ಮೆ 2,000 ರೂ.ಗಳ 3 ಕಂತುಗಳು)"
        },
        "frequency": "ANNUAL",
        "max_monetary_value": 6000.0
      }
    ],
    "criteria": [
      {
        "field_name": "occupation",
        "criterion_type": "EQUALITY",
        "rule_ast": {
          "==": [
            {
              "var": "occupation"
            },
            "farmer"
          ]
        },
        "explanation": {
          "en": "Applicant must be a farmer or engaged in agriculture",
          "hi": "आवेदक किसान या कृषि कार्य में संलग्न होना चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ರೈತರಾಗಿರಬೇಕು ಅಥವಾ ಕೃಷಿಯಲ್ಲಿ ತೊಡಗಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "landholding_hectares",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          ">": [
            {
              "var": "landholding_hectares"
            },
            0.0
          ]
        },
        "explanation": {
          "en": "Must own cultivable agricultural land in their name",
          "hi": "आवेदक के नाम पर कृषि योग्य भूमि का स्वामित्व होना चाहिए",
          "kn": "ತಮ್ಮ ಹೆಸರಿನಲ್ಲಿ ಕೃಷಿ ಯೋಗ್ಯ ಭೂಮಿ ಹೊಂದಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "is_tax_payer",
        "criterion_type": "BOOLEAN",
        "rule_ast": {
          "==": [
            {
              "var": "is_tax_payer"
            },
            false
          ]
        },
        "explanation": {
          "en": "Applicant must not be an income tax payer",
          "hi": "आवेदक आयकर दाता नहीं होना चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿದಾರರಾಗಿರಬಾರದು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "aadhaar",
        "document_name": {
          "en": "Aadhaar Card",
          "hi": "आधार कार्ड",
          "kn": "ಆಧಾರ್ ಕಾರ್ಡ್"
        },
        "issuing_authority": {
          "en": "UIDAI",
          "hi": "यूआईडीएआई",
          "kn": "ಯುಐಡಿಎಐ"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "land_record",
        "document_name": {
          "en": "Land Ownership Record (Khatauni / Patta / RoR)",
          "hi": "भूमि स्वामित्व रिकॉर्ड (खतौनी / पट्टा)",
          "kn": "ಭೂ ದಾಖಲೆ (ಪಹಣಿ / ಆರ್‌ಒಆರ್)"
        },
        "issuing_authority": {
          "en": "Revenue Department / Tehsildar",
          "hi": "राजस्व विभाग / तहसीलदार",
          "kn": "ಕಂದಾಯ ಇಲಾಖೆ / ತಹಶೀಲ್ದಾರ್"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "bank_passbook",
        "document_name": {
          "en": "Aadhaar-Seeded Bank Passbook",
          "hi": "आधार से जुड़ा बैंक पासबुक",
          "kn": "ಆಧಾರ್ ಲಿಂಕ್ ಆಗಿರುವ ಬ್ಯಾಂಕ್ ಪಾಸ್‌ಬುಕ್"
        },
        "issuing_authority": {
          "en": "Bank Branch",
          "hi": "बैंक शाखा",
          "kn": "ಬ್ಯಾಂಕ್ ಶಾಖೆ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  },
  {
    "id": "ayushman-bharat-pmjay",
    "slug": "ayushman-bharat-pradhan-mantri-jan-arogya-yojana",
    "ministry": "Ministry of Health and Family Welfare",
    "department": "National Health Authority",
    "category": "health",
    "target_beneficiaries": [
      "rural",
      "women",
      "senior_citizens",
      "bpl_families"
    ],
    "status": "published",
    "version_number": 2,
    "title": {
      "en": "Ayushman Bharat PM-JAY (Pradhan Mantri Jan Arogya Yojana)",
      "hi": "आयुष्मान भारत प्रधानमंत्री जन आरोग्य योजना (पीएम-जय)",
      "kn": "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಪ್ರಧಾನ ಮಂತ್ರಿ ಜನ ಆರೋಗ್ಯ ಯೋಜನೆ (ಪಿಎಂ-ಜೆಎವೈ)"
    },
    "short_description": {
      "en": "Cashless health cover of Rs. 5 Lakhs per family per year, with universal coverage for all senior citizens aged 70+.",
      "hi": "प्रति परिवार प्रति वर्ष 5 लाख रुपये का कैशलेस स्वास्थ्य कवर, तथा 70+ आयु के सभी वरिष्ठ नागरिकों के लिए सार्वभौमिक कवरेज।",
      "kn": "ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವಾರ್ಷಿಕ 5 ಲಕ್ಷ ರೂ.ಗಳ ನಗದು ರಹಿತ ಆರೋಗ್ಯ ರಕ್ಷಣೆ, ಹಾಗೂ 70+ ವಯಸ್ಸಿನ ಎಲ್ಲಾ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಸಾರ್ವತ್ರಿಕ ರಕ್ಷಣೆ."
    },
    "full_description": {
      "en": "Ayushman Bharat PM-JAY is the world's largest health assurance scheme providing a health cover of Rs. 5 Lakhs per family per year for secondary and tertiary care hospitalization across public and empanelled private hospitals in India. Under the October 2024 expansion, all senior citizens aged 70 years and above are eligible for dedicated health coverage (Ayushman Vaya Vandana Card) irrespective of income.",
      "hi": "आयुष्मान भारत पीएम-जय योजना भारत के सरकारी एवं पैनलबद्ध निजी अस्पतालों में माध्यमिक और तृतीयक देखभाल हेतु प्रति परिवार प्रति वर्ष 5 लाख रुपये तक का कैशलेस इलाज कवर प्रदान करती है। अक्टूबर 2024 के विस्तार के तहत, 70 वर्ष और उससे अधिक आयु के सभी वरिष्ठ नागरिक आय की परवाह किए बिना विशेष स्वास्थ्य कवरेज (आयुष्मान वय वंदना कार्ड) के पात्र हैं।",
      "kn": "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಪಿಎಂ-ಜೆಎವೈ ಭಾರತದ ಸರ್ಕಾರಿ ಮತ್ತು ನೋಂದಾಯಿತ ಖಾಸಗಿ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ದ್ವಿತೀಯ ಮತ್ತು ತೃತೀಯ ಹಂತದ ಆಸ್ಪತ್ರೆ ದಾಖಲಾತಿಗಾಗಿ ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವಾರ್ಷಿಕ 5 ಲಕ್ಷ ರೂ.ವರೆಗೆ ಉಚಿತ ಚಿಕಿತ್ಸೆ ನೀಡುತ್ತದೆ. ಅಕ್ಟೋಬರ್ 2024 ರ ವಿಸ್ತರಣೆಯ ಪ್ರಕಾರ, 70 ವರ್ಷ ಮತ್ತು ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಯಸ್ಸಿನ ಎಲ್ಲಾ ಹಿರಿಯ ನಾಗರಿಕರು ಆದಾಯದ ಮಿತಿಯಿಲ್ಲದೆ ವಿಶೇಷ ಆರೋಗ್ಯ ರಕ್ಷಣೆಗೆ (ಆಯುಷ್ಮಾನ್ ವಯ ವಂದನಾ ಕಾರ್ಡ್) ಅರ್ಹರಾಗಿರುತ್ತಾರೆ."
    },
    "official_portal_url": "https://pmjay.gov.in",
    "gazette_notification_url": "https://pib.gov.in/PressReleasePage.aspx?PRID=2053818",
    "source_reference_date": "2024-10-29",
    "source_document_hash": "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069",
    "funding_type": "CENTRALLY_SPONSORED",
    "application_mode": "BOTH",
    "application_steps": [
      {
        "step": 1,
        "en": "Check eligibility on beneficiary.nha.gov.in or visit any Ayushman Arogya Mandir / CSC",
        "hi": "beneficiary.nha.gov.in पर पात्रता जांचें या नजदीकी आरोग्य मंदिर / सीएससी पर जाएं",
        "kn": "beneficiary.nha.gov.in ನಲ್ಲಿ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ ಅಥವಾ ಹತ್ತಿರದ ಆರೋಗ್ಯ ಮಂದಿರ / ಸಿಎಸ್‌ಸಿಗೆ ಭೇಟಿ ನೀಡಿ"
      },
      {
        "step": 2,
        "en": "Verify identity using Aadhaar e-KYC (age 70+ automatically qualifies for Vaya Vandana)",
        "hi": "आधार ई-केवाईसी के माध्यम से पहचान सत्यापित करें (70+ आयु स्वतः वय वंदना हेतु पात्र)",
        "kn": "ಆಧಾರ್ ಇ-ಕೆವೈಸಿ ಬಳಸಿ ಗುರುತು ಪರಿಶೀಲಿಸಿ (70+ ವಯಸ್ಸು ಸ್ವಯಂಚಾಲಿತವಾಗಿ ವಯ ವಂದನಾಗೆ ಅರ್ಹ)"
      },
      {
        "step": 3,
        "en": "Download the Ayushman Card or distinct Ayushman Vaya Vandana Card",
        "hi": "आयुष्मान कार्ड या विशिष्ट आयुष्मान वय वंदना कार्ड डाउनलोड करें",
        "kn": "ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್ ಅಥವಾ ಪ್ರತ್ಯೇಕ ಆಯುಷ್ಮಾನ್ ವಯ ವಂದನಾ ಕಾರ್ಡ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ"
      },
      {
        "step": 4,
        "en": "Present card at any of 29,000+ empanelled public or private hospitals for cashless admission",
        "hi": "कैशलेस उपचार के लिए 29,000+ पैनलबद्ध अस्पतालों में कार्ड प्रस्तुत करें",
        "kn": "ನಗದು ರಹಿತ ಚಿಕಿತ್ಸೆಗಾಗಿ ಯಾವುದೇ ನೋಂದಾಯಿತ ಆಸ್ಪತ್ರೆಯಲ್ಲಿ ಕಾರ್ಡ್ ತೋರಿಸಿ"
      }
    ],
    "benefits": [
      {
        "benefit_type": "INSURANCE",
        "amount_description": {
          "en": "Rs. 5,00,000 cashless hospitalisation cover per family per year, plus dedicated exclusive Rs. 5,00,000 top-up cover for senior citizens aged 70 and above (Ayushman Vaya Vandana Card)",
          "hi": "प्रति परिवार प्रति वर्ष 5,00,000 रुपये का कैशलेस अस्पताल कवर, तथा 70 वर्ष और उससे अधिक आयु के वरिष्ठ नागरिकों के लिए अतिरिक्त 5 लाख रुपये का विशेष टॉप-अप कवर (आयुष्मान वय वंदना कार्ड)",
          "kn": "ಪ್ರತಿ ಕುಟುಂಬಕ್ಕೆ ವಾರ್ಷಿಕ 5,00,000 ರೂ.ಗಳ ನಗದು ರಹಿತ ಚಿಕಿತ್ಸಾ ರಕ್ಷಣೆ, ಹಾಗೂ 70 ಮತ್ತು ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಯಸ್ಸಿನ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಪ್ರತ್ಯೇಕ 5 ಲಕ್ಷ ರೂ.ಗಳ ವಿಶೇಷ ಟಾಪ್-ಅಪ್ ರಕ್ಷಣೆ (ಆಯುಷ್ಮಾನ್ ವಯ ವಂದನಾ ಕಾರ್ಡ್)"
        },
        "frequency": "ANNUAL",
        "max_monetary_value": 500000.0
      }
    ],
    "criteria": [
      {
        "field_name": "is_bpl_card_holder",
        "criterion_type": "BOOLEAN",
        "rule_ast": {
          "or": [
            {
              ">=": [
                {
                  "var": "age"
                },
                70
              ]
            },
            {
              "==": [
                {
                  "var": "is_bpl_card_holder"
                },
                true
              ]
            },
            {
              "<=": [
                {
                  "var": "annual_income_inr"
                },
                250000.0
              ]
            }
          ]
        },
        "explanation": {
          "en": "Eligible if senior citizen aged 70+ (universal Ayushman Vaya Vandana cover), or family holds BPL ration card, or annual income <= Rs. 2.5 Lakhs",
          "hi": "पात्र यदि 70+ वरिष्ठ नागरिक (सार्वभौमिक आयुष्मान वय वंदना), या परिवार के पास बीपीएल राशन कार्ड है, या वार्षिक आय 2.5 लाख से कम है",
          "kn": "70+ ಹಿರಿಯ ನಾಗರಿಕರು (ಸಾರ್ವತ್ರಿಕ ಆಯುಷ್ಮಾನ್ ವಯ ವಂದನಾ ರಕ್ಷಣೆ), ಅಥವಾ ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ ಹೊಂದಿರುವವರು, ಅಥವಾ ವಾರ್ಷಿಕ ಆದಾಯ 2.5 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ ಇರುವವರು ಅರ್ಹರು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "ration_card",
        "document_name": {
          "en": "Ration Card (BPL / Antyodaya / Priority) (Not required for 70+)",
          "hi": "राशन कार्ड (बीपीएल / अंत्योदय) (70+ आयु हेतु अनिवार्य नहीं)",
          "kn": "ಪಡಿತರ ಚೀಟಿ (ಬಿಪಿಎಲ್ / ಅಂತ್ಯೋದಯ) (70+ ವಯಸ್ಸಿನವರಿಗೆ ಕಡ್ಡಾಯವಿಲ್ಲ)"
        },
        "issuing_authority": {
          "en": "Food & Civil Supplies Department",
          "hi": "खाद्य एवं नागरिक आपूर्ति विभाग",
          "kn": "ಆಹಾರ ಮತ್ತು ನಾಗರಿಕ ಸರಬರಾಜು ಇಲಾಖೆ"
        },
        "is_mandatory": false,
        "alternatives": []
      },
      {
        "document_code": "aadhaar",
        "document_name": {
          "en": "Aadhaar Card for e-KYC age/identity verification",
          "hi": "ई-केवाईसी आयु एवं पहचान सत्यापन हेतु आधार कार्ड",
          "kn": "ಇ-ಕೆವೈಸಿ ವಯಸ್ಸು ಮತ್ತು ಗುರುತು ಪರಿಶೀಲನೆಗಾಗಿ ಆಧಾರ್ ಕಾರ್ಡ್"
        },
        "issuing_authority": {
          "en": "UIDAI",
          "hi": "यूआईडीएआई",
          "kn": "ಯುಐಡಿಎಐ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  },
  {
    "id": "pmmvy",
    "slug": "pradhan-mantri-matru-vandana-yojana",
    "ministry": "Ministry of Women and Child Development",
    "department": "Maternal and Child Nutrition Division",
    "category": "women_and_child",
    "target_beneficiaries": [
      "women"
    ],
    "status": "published",
    "version_number": 1,
    "title": {
      "en": "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
      "hi": "प्रधानमंत्री मातृ वंदना योजना (पीएमएमवीवाई)",
      "kn": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಮಾತೃ ವಂದನಾ ಯೋಜನೆ (ಪಿಎಂಎಂವಿವೈ)"
    },
    "short_description": {
      "en": "Cash incentive of Rs. 5,000 for pregnant women and lactating mothers for health and nutrition.",
      "hi": "गर्भवती महिलाओं और स्तनपान कराने वाली माताओं के पोषण एवं स्वास्थ्य हेतु 5,000 रुपये की नकद सहायता।",
      "kn": "ಗರ್ಭಿಣಿ ಮತ್ತು ಹಾಲುಣಿಸುವ ತಾಯಂದಿರ ಪೌಷ್ಟಿಕಾಂಶ ಮತ್ತು ಆರೋಗ್ಯಕ್ಕಾಗಿ 5,000 ರೂ.ಗಳ ಆರ್ಥಿಕ ನೆರವು."
    },
    "full_description": {
      "en": "PMMVY is a direct cash transfer scheme for pregnant women and lactating mothers to compensate for wage loss during childbirth and encourage institutional delivery and child immunization.",
      "hi": "पीएमएमवीवाई योजना गर्भवती महिलाओं को मजदूरी के नुकसान की भरपाई करने और संस्थागत प्रसव तथा बच्चे के टीकाकरण को प्रोत्साहित करने के लिए 5,000 रुपये की प्रत्यक्ष नकद सहायता प्रदान करती है।",
      "kn": "ಗರ್ಭಿಣಿಯರಿಗೆ ಹೆರಿಗೆಯ ಸಮಯದಲ್ಲಿ ಉಂಟಾಗುವ ವೇತನ ನಷ್ಟವನ್ನು ಸರಿದೂಗಿಸಲು ಮತ್ತು ಆಸ್ಪತ್ರೆ ಹೆರಿಗೆಯನ್ನು ಪ್ರೋತ್ಸಾಹಿಸಲು 5,000 ರೂ.ಗಳ ನೇರ ನಗದು ವರ್ಗಾವಣೆ ನೀಡಲಾಗುತ್ತದೆ."
    },
    "official_portal_url": "https://pmmvy.wcd.gov.in",
    "gazette_notification_url": "https://wcd.nic.in/schemes/pmmvy",
    "source_reference_date": "2017-01-01",
    "source_document_hash": "cb8379ac2098aa165029e3766b41036b139b69fbe70c4ba637daab299421b4ff",
    "funding_type": "CENTRALLY_SPONSORED",
    "application_mode": "BOTH",
    "application_steps": [
      {
        "step": 1,
        "en": "Register at nearest Anganwadi Centre or on pmmvy.wcd.gov.in",
        "hi": "निकटतम आंगनवाड़ी केंद्र पर पंजीकरण कराएं या pmmvy.wcd.gov.in पर जाएं",
        "kn": "ಹತ್ತಿರದ ಅಂಗನವಾಡಿ ಕೇಂದ್ರದಲ್ಲಿ ಅಥವಾ pmmvy.wcd.gov.in ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ"
      },
      {
        "step": 2,
        "en": "Submit MCP card and ANC checkup records",
        "hi": "एमसीपी कार्ड और प्रसव पूर्व जांच रिकॉर्ड जमा करें",
        "kn": "ಎಂಸಿಪಿ ಕಾರ್ಡ್ ಮತ್ತು ತಪಾಸಣೆ ವಿವರಗಳನ್ನು ಸಲ್ಲಿಸಿ"
      },
      {
        "step": 3,
        "en": "Installments credited directly to Aadhaar-seeded bank account",
        "hi": "किस्तें सीधे आधार से जुड़े बैंक खाते में जमा होती हैं",
        "kn": "ಕಂತುಗಳು ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಜಮೆಯಾಗುತ್ತವೆ"
      }
    ],
    "benefits": [
      {
        "benefit_type": "CASH_TRANSFER",
        "amount_description": {
          "en": "Rs. 5,000 in two installments (First child) / Rs. 6,000 (Second girl child)",
          "hi": "दो किस्तों में 5,000 रुपये (पहला बच्चा) / 6,000 रुपये (दूसरी बालिका)",
          "kn": "ಎರಡು ಕಂತುಗಳಲ್ಲಿ 5,000 ರೂ. (ಮೊದಲ ಮಗು) / 6,000 ರೂ. (ಎರಡನೇ ಹೆಣ್ಣು ಮಗು)"
        },
        "frequency": "PER_EVENT",
        "max_monetary_value": 6000.0
      }
    ],
    "criteria": [
      {
        "field_name": "gender",
        "criterion_type": "EQUALITY",
        "rule_ast": {
          "==": [
            {
              "var": "gender"
            },
            "female"
          ]
        },
        "explanation": {
          "en": "Applicant must be a woman",
          "hi": "आवेदक महिला होनी चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ಮಹಿಳೆಯಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "age",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          ">=": [
            {
              "var": "age"
            },
            19
          ]
        },
        "explanation": {
          "en": "Age of mother must be at least 19 years at the time of pregnancy",
          "hi": "गर्भावस्था के समय माता की आयु न्यूनतम 19 वर्ष होनी चाहिए",
          "kn": "ಗರ್ಭಾವಸ್ಥೆಯ ಸಮಯದಲ್ಲಿ ತಾಯಿಯ ವಯಸ್ಸು ಕನಿಷ್ಠ 19 ವರ್ಷವಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "is_pregnant_or_lactating",
        "criterion_type": "BOOLEAN",
        "rule_ast": {
          "==": [
            {
              "var": "is_pregnant_or_lactating"
            },
            true
          ]
        },
        "explanation": {
          "en": "Applicant must be pregnant or a lactating mother",
          "hi": "आवेदक गर्भवती या धात्री माता होनी चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ಗರ್ಭಿಣಿ ಅಥವಾ ಹಾಲುಣಿಸುವ ತಾಯಿಯಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "mcp_card",
        "document_name": {
          "en": "Mother and Child Protection (MCP) Card",
          "hi": "मातृ एवं शिशु संरक्षण (एमसीपी) कार्ड",
          "kn": "ತಾಯಿ ಮತ್ತು ಮಕ್ಕಳ ರಕ್ಷಣಾ (ಎಂಸಿಪಿ) ಕಾರ್ಡ್"
        },
        "issuing_authority": {
          "en": "Anganwadi / Primary Health Centre",
          "hi": "आंगनवाड़ी / प्राथमिक स्वास्थ्य केंद्र",
          "kn": "ಅಂಗನವಾಡಿ / ಪ್ರಾಥಮಿಕ ಆರೋಗ್ಯ ಕೇಂದ್ರ"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "aadhaar",
        "document_name": {
          "en": "Aadhaar Card of Mother",
          "hi": "माता का आधार कार्ड",
          "kn": "ತಾಯಿಯ ಆಧಾರ್ ಕಾರ್ಡ್"
        },
        "issuing_authority": {
          "en": "UIDAI",
          "hi": "यूआईडीएआई",
          "kn": "ಯುಐಡಿಎಐ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  },
  {
    "id": "pms-sc",
    "slug": "post-matric-scholarship-for-sc-students",
    "ministry": "Ministry of Social Justice and Empowerment",
    "department": "Department of Social Justice and Empowerment",
    "category": "education",
    "target_beneficiaries": [
      "students"
    ],
    "status": "published",
    "version_number": 1,
    "title": {
      "en": "Post Matric Scholarship for SC Students",
      "hi": "अनुसूचित जाति के छात्रों के लिए पोस्ट मैट्रिक छात्रवृत्ति",
      "kn": "ಪರಿಶಿಷ್ಟ ಜಾತಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಮೆಟ್ರಿಕ್ ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ"
    },
    "short_description": {
      "en": "100% compulsory non-refundable fees covered + monthly maintenance allowance for post-matric studies.",
      "hi": "पोस्ट मैट्रिक की पढ़ाई हेतु 100% अनिवार्य गैर-वापसी योग्य शुल्क + मासिक रखरखाव भत्ता।",
      "kn": "ಮೆಟ್ರಿಕ್ ನಂತರದ ವ್ಯಾಸಂಗಕ್ಕಾಗಿ 100% ಶುಲ್ಕ ಮರುಪಾವತಿ + ಮಾಸಿಕ ನಿರ್ವಹಣಾ ಭತ್ಯೆ."
    },
    "full_description": {
      "en": "Centrally Sponsored Scheme to support Scheduled Caste students for study of all recognised post-matriculation or post-secondary courses in government or recognised educational institutions.",
      "hi": "मान्यता प्राप्त सरकारी या निजी संस्थानों में 11वीं कक्षा से उच्च शिक्षा तक अनुसूचित जाति के विद्यार्थियों की पढ़ाई के लिए केंद्र प्रायोजित छात्रवृत्ति योजना।",
      "kn": "ಪರಿಶಿಷ್ಟ ಜಾತಿಯ ವಿದ್ಯಾರ್ಥಿಗಳು ಎಸ್ಎಸ್ಎಲ್ ಸಿ ನಂತರದ ಅಥವಾ ಪದವಿ ಪೂರ್ವ ತರಗತಿಗಳಿಂದ ಉನ್ನತ ಶಿಕ್ಷಣವನ್ನು ಮುಂದುವರಿಸಲು ಕೇಂದ್ರ ಸರ್ಕಾರದ ಪ್ರಾಯೋಜಿತ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆ."
    },
    "official_portal_url": "https://scholarships.gov.in",
    "gazette_notification_url": "https://socialjustice.gov.in/schemes/26",
    "source_reference_date": "2020-12-23",
    "source_document_hash": "4a53c303a11e138a0c20e119398b0411e6417743929dd52c15a0044fa6132474",
    "funding_type": "CENTRALLY_SPONSORED",
    "application_mode": "ONLINE",
    "application_steps": [
      {
        "step": 1,
        "en": "Register on the National Scholarship Portal (scholarships.gov.in)",
        "hi": "राष्ट्रीय छात्रवृत्ति पोर्टल (scholarships.gov.in) पर पंजीकरण करें",
        "kn": "ರಾಷ್ಟ್ರೀಯ ವಿದ್ಯಾರ್ಥಿವೇತನ ಪೋರ್ಟಲ್ ನಲ್ಲಿ ನೋಂದಾಯಿಸಿ"
      },
      {
        "step": 2,
        "en": "Submit SC Caste certificate, Income certificate, and college admission fee receipt",
        "hi": "जाति प्रमाण पत्र, आय प्रमाण पत्र और कॉलेज शुल्क रसीद अपलोड करें",
        "kn": "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ, ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಕಾಲೇಜು ಶುಲ್ಕ ರಶೀದಿಯನ್ನು ಅಪ್‌ಲೋಡ್ ಮಾಡಿ"
      },
      {
        "step": 3,
        "en": "Institute verification followed by State and Central DBT disbursement",
        "hi": "संस्थान द्वारा सत्यापन के बाद सीधे खाते में छात्रवृत्ति राशि का भुगतान",
        "kn": "ಕಾಲೇಜು ಪರಿಶೀಲನೆಯ ನಂತರ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಹಣ ಜಮೆ"
      }
    ],
    "benefits": [
      {
        "benefit_type": "SCHOLARSHIP",
        "amount_description": {
          "en": "Full tuition fee reimbursement + up to Rs. 13,500/year maintenance allowance",
          "hi": "पूरा ट्यूशन शुल्क प्रतिपूर्ति + 13,500 रुपये प्रति वर्ष तक रखरखाव भत्ता",
          "kn": "ಸಂಪೂರ್ಣ ಬೋಧನಾ ಶುಲ್ಕ ಮರುಪಾವತಿ + ವಾರ್ಷಿಕ 13,500 ರೂ.ವರೆಗೆ ನಿರ್ವಹಣಾ ಭತ್ಯೆ"
        },
        "frequency": "ANNUAL",
        "max_monetary_value": 50000.0
      }
    ],
    "criteria": [
      {
        "field_name": "social_category",
        "criterion_type": "EQUALITY",
        "rule_ast": {
          "==": [
            {
              "var": "social_category"
            },
            "SC"
          ]
        },
        "explanation": {
          "en": "Applicant must belong to the Scheduled Caste (SC) category",
          "hi": "आवेदक अनुसूचित जाति (SC) वर्ग से संबंधित होना चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ಪರಿಶಿಷ್ಟ ಜಾತಿ (ಎಸ್ ಸಿ) ಸಮುದಾಯಕ್ಕೆ ಸೇರಿದವರಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "annual_income_inr",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          "<=": [
            {
              "var": "annual_income_inr"
            },
            250000.0
          ]
        },
        "explanation": {
          "en": "Annual family income from all sources must not exceed Rs. 2.5 Lakhs",
          "hi": "सभी स्रोतों से वार्षिक पारिवारिक आय 2.5 लाख रुपये से अधिक नहीं होनी चाहिए",
          "kn": "ಎಲ್ಲಾ ಮೂಲಗಳಿಂದ ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯವು 2.5 ಲಕ್ಷ ರೂ. ಮೀರಿರಬಾರದು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "occupation",
        "criterion_type": "EQUALITY",
        "rule_ast": {
          "==": [
            {
              "var": "occupation"
            },
            "student"
          ]
        },
        "explanation": {
          "en": "Applicant must currently be an enrolled student",
          "hi": "आवेदक वर्तमान में अध्ययनरत विद्यार्थी होना चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ಪ್ರಸ್ತುತ ವ್ಯಾಸಂಗ ಮಾಡುತ್ತಿರುವ ವಿದ್ಯಾರ್ಥಿಯಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "caste_certificate",
        "document_name": {
          "en": "SC Caste Certificate",
          "hi": "अनुसूचित जाति प्रमाण पत्र",
          "kn": "ಪರಿಶಿಷ್ಟ ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ"
        },
        "issuing_authority": {
          "en": "Tehsildar / Revenue Department",
          "hi": "तहसीलदार / राजस्व विभाग",
          "kn": "ತಹಶೀಲ್ದಾರ್ / ಕಂದಾಯ ಇಲಾಖೆ"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "income_certificate",
        "document_name": {
          "en": "Income Certificate (< Rs. 2.5 Lakhs)",
          "hi": "आय प्रमाण पत्र (2.5 लाख से कम)",
          "kn": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ (2.5 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆ)"
        },
        "issuing_authority": {
          "en": "Tehsildar / Taluk Office",
          "hi": "तहसीलदार / तहसील कार्यालय",
          "kn": "ತಹಶೀಲ್ದಾರ್ / ತಾಲೂಕು ಕಚೇರಿ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  },
  {
    "id": "sukanya-samriddhi",
    "slug": "sukanya-samriddhi-yojana",
    "ministry": "Ministry of Finance",
    "department": "Department of Economic Affairs",
    "category": "women_and_child",
    "target_beneficiaries": [
      "women"
    ],
    "status": "published",
    "version_number": 1,
    "title": {
      "en": "Sukanya Samriddhi Yojana (SSY)",
      "hi": "सुकन्या समृद्धि योजना (एसएसवाई)",
      "kn": "ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ (ಎಸ್‌ಎಸ್‌ವೈ)"
    },
    "short_description": {
      "en": "High-interest government-backed small savings scheme for girl children with tax benefits.",
      "hi": "बालिकाओं के लिए उच्च ब्याज और कर छूट वाली सरकारी बचत योजना।",
      "kn": "ಹೆಣ್ಣು ಮಕ್ಕಳಿಗಾಗಿ ಹೆಚ್ಚಿನ ಬಡ್ಡಿ ಮತ್ತು ತೆರಿಗೆ ವಿನಾಯಿತಿ ನೀಡುವ ಸಣ್ಣ ಉಳಿತಾಯ ಯೋಜನೆ."
    },
    "full_description": {
      "en": "A small deposit scheme for girl children launched as part of the 'Beti Bachao Beti Padhao' campaign. Provides compounded interest and full tax exemption under Section 80C with tax-free maturity returns for higher education and marriage.",
      "hi": "'बेटी बचाओ बेटी पढ़ाओ' अभियान के तहत बालिकाओं के उज्ज्वल भविष्य, उच्च शिक्षा और विवाह के लिए उच्च ब्याज दर वाली कर-मुक्त सरकारी बचत योजना।",
      "kn": "'ಬೇಟಿ ಬಚಾವೋ ಬೇಟಿ ಪಢಾವೋ' ಅಭಿಯಾನದ ಭಾಗವಾಗಿ ಹೆಣ್ಣು ಮಕ್ಕಳ ಉನ್ನತ ಶಿಕ್ಷಣ ಮತ್ತು ಮದುವೆ ವೆಚ್ಚಗಳಿಗಾಗಿ ಆರಂಭಿಸಲಾದ ತೆರಿಗೆ ಮುಕ್ತ ಉಳಿತಾಯ ಯೋಜನೆ."
    },
    "official_portal_url": "https://www.nsiindia.gov.in",
    "gazette_notification_url": "https://financialservices.gov.in/banking-divisions/Small-Savings-Schemes",
    "source_reference_date": "2015-01-22",
    "source_document_hash": "6b86b273ff34fce19d6b804eff5a3f5747ada4eaa22f1d49c01e52ddb7875b4b",
    "funding_type": "CENTRAL_SECTOR",
    "application_mode": "OFFLINE",
    "application_steps": [
      {
        "step": 1,
        "en": "Visit any Post Office or authorised commercial bank branch",
        "hi": "किसी भी डाकघर या अधिकृत बैंक शाखा में जाएं",
        "kn": "ಯಾವುದೇ ಅಂಚೆ ಕಚೇರಿ ಅಥವಾ ಅಧಿಕೃತ ಬ್ಯಾಂಕ್ ಶಾಖೆಗೆ ಭೇಟಿ ನೀಡಿ"
      },
      {
        "step": 2,
        "en": "Fill Form SSA-1 with girl child's birth certificate and guardian KYC",
        "hi": "बालिका के जन्म प्रमाण पत्र और अभिभावक के केवाईसी के साथ फॉर्म एसएसए-1 भरें",
        "kn": "ಮಗುವಿನ ಜನನ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ಪೋಷಕರ ದಾಖಲೆಗಳೊಂದಿಗೆ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ"
      },
      {
        "step": 3,
        "en": "Deposit minimum initial amount of Rs. 250",
        "hi": "न्यूनतम 250 रुपये की प्रारंभिक राशि जमा करें",
        "kn": "ಕನಿಷ್ಠ 250 ರೂ. ಠೇವಣಿ ಇರಿಸಿ ಖಾತೆ ತೆರೆಯಿರಿ"
      }
    ],
    "benefits": [
      {
        "benefit_type": "SUBSIDY",
        "amount_description": {
          "en": "Government-backed small savings interest rate (quarterly notified by Ministry of Finance, e.g. 8.2% p.a. for Q4 FY 2023-24 / FY 2024-25) with EEE tax exemption under Section 80C",
          "hi": "सरकार द्वारा अधिसूचित त्रैमासिक ब्याज दर (जैसे वित्त मंत्रालय द्वारा अधिसूचित 8.2% वार्षिक) और धारा 80C के तहत पूर्ण कर छूट",
          "kn": "ಹಣಕಾಸು ಸಚಿವಾಲಯದಿಂದ ತ್ರೈಮಾಸಿಕವಾಗಿ ಸೂಚಿಸಲಾಗುವ ಸಣ್ಣ ಉಳಿತಾಯ ಬಡ್ಡಿದರ (ಉದಾ. ವಾರ್ಷಿಕ 8.2%) ಮತ್ತು 80C ಅಡಿಯಲ್ಲಿ ತೆರಿಗೆ ವಿನಾಯಿತಿ"
        },
        "frequency": "ANNUAL",
        "max_monetary_value": 150000.0
      }
    ],
    "criteria": [
      {
        "field_name": "gender",
        "criterion_type": "EQUALITY",
        "rule_ast": {
          "==": [
            {
              "var": "gender"
            },
            "female"
          ]
        },
        "explanation": {
          "en": "Beneficiary must be a girl child",
          "hi": "लाभार्थी बालिका होनी चाहिए",
          "kn": "ಫಲಾನುಭವಿಯು ಹೆಣ್ಣು ಮಗುವಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "age",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          "<=": [
            {
              "var": "age"
            },
            10
          ]
        },
        "explanation": {
          "en": "Age of girl child must be 10 years or younger at the time of account opening",
          "hi": "खाता खोलते समय बालिका की आयु 10 वर्ष या उससे कम होनी चाहिए",
          "kn": "ಖಾತೆ ತೆರೆಯುವ ಸಮಯದಲ್ಲಿ ಹೆಣ್ಣು ಮಗುವಿನ ವಯಸ್ಸು 10 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಕಡಿಮೆಯಿರಬೇಕು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "birth_certificate",
        "document_name": {
          "en": "Birth Certificate of Girl Child",
          "hi": "बालिका का जन्म प्रमाण पत्र",
          "kn": "ಹೆಣ್ಣು ಮಗುವಿನ ಜನನ ಪ್ರಮಾಣಪತ್ರ"
        },
        "issuing_authority": {
          "en": "Municipal Corporation / Registrar of Births",
          "hi": "नगर निगम / जन्म रजिस्ट्रार",
          "kn": "ನಗರ ಸಭೆ / ಜನನ ನೋಂದಣಿ ಅಧಿಕಾರಿ"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "guardian_id",
        "document_name": {
          "en": "Aadhaar / PAN Card of Parent or Guardian",
          "hi": "माता-पिता या अभिभावक का आधार/पैन कार्ड",
          "kn": "ಪೋಷಕರ ಆಧಾರ್ ಅಥವಾ ಪ್ಯಾನ್ ಕಾರ್ಡ್"
        },
        "issuing_authority": {
          "en": "UIDAI / Income Tax Dept",
          "hi": "यूआईडीएआई / आयकर विभाग",
          "kn": "ಯುಐಡಿಎಐ / ಆದಾಯ ತೆರಿಗೆ ಇಲಾಖೆ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  },
  {
    "id": "divyangjan-swavlamban",
    "slug": "divyangjan-swavlamban-yojana",
    "ministry": "Ministry of Social Justice and Empowerment",
    "department": "Department of Empowerment of Persons with Disabilities (DEPwD)",
    "category": "disability_empowerment",
    "target_beneficiaries": [
      "divyangjan"
    ],
    "status": "published",
    "version_number": 1,
    "title": {
      "en": "Divyangjan Swavlamban Scheme (NHFDC)",
      "hi": "दिव्यांगजन स्वावलंबन योजना (एनएचएफडीसी)",
      "kn": "ದಿವ್ಯಾಂಗಜನ ಸ್ವಾವಲಂಬನೆ ಯೋಜನೆ (ಎನ್‌ಎಚ್‌ಎಫ್‌ಡಿಸಿ)"
    },
    "short_description": {
      "en": "Concessional loans up to Rs. 50 Lakhs for persons with disabilities for self-employment & enterprises.",
      "hi": "दिव्यांगजनों को स्वरोजगार और उद्यम स्थापित करने हेतु 50 लाख रुपये तक का रियायती ऋण।",
      "kn": "ವಿಕಲಚೇತನರಿಗೆ ಸ್ವಯಂ ಉದ್ಯೋಗ ಮತ್ತು ವ್ಯಾಪಾರ ಆರಂಭಿಸಲು 50 ಲಕ್ಷ ರೂ.ವರೆಗೆ ರಿಯಾಯಿತಿ ದರದ ಸಾಲ."
    },
    "full_description": {
      "en": "Financial assistance by the National Handicapped Finance and Development Corporation (NHFDC) to empower Persons with Disabilities (Divyangjan) through concessional interest loans for income generation activities and vocational education.",
      "hi": "दिव्यांगजनों को आर्थिक रूप से सशक्त बनाने हेतु राष्ट्रीय दिव्यांग वित्त एवं विकास निगम (NHFDC) द्वारा रियायती ब्याज दर पर स्वरोजगार और शिक्षा हेतु वित्तीय सहायता।",
      "kn": "ವಿಕಲಚೇತನರು ಆರ್ಥಿಕವಾಗಿ ಸ್ವಾವಲಂಬಿಗಳಾಗಲು ರಿಯಾಯಿತಿ ಬಡ್ಡಿದರದಲ್ಲಿ ಸಾಲ ಸೌಲಭ್ಯ ಒದಗಿಸುವ ರಾಷ್ಟ್ರೀಯ ವಿಕಲಚೇತನರ ಹಣಕಾಸು ಮತ್ತು ಅಭಿವೃದ್ಧಿ ನಿಗಮದ ಯೋಜನೆ."
    },
    "official_portal_url": "https://www.nhfdc.org",
    "gazette_notification_url": "https://disabilityaffairs.gov.in/content/page/schemes.php",
    "source_reference_date": "2016-12-28",
    "source_document_hash": "d4735e3a265e16eee03f59718b9b5d03019c07d8b6c51f90da3a666eec13ab35",
    "funding_type": "CENTRAL_SECTOR",
    "application_mode": "BOTH",
    "application_steps": [
      {
        "step": 1,
        "en": "Submit loan application through State Channelising Agency (SCA) or participating bank",
        "hi": "राज्य चैनलाइजिंग एजेंसी (SCA) या सहभागी बैंक के माध्यम से आवेदन करें",
        "kn": "ರಾಜ್ಯ ಚಾನಲೈಸಿಂಗ್ ಏಜೆನ್ಸಿ ಅಥವಾ ಬ್ಯಾಂಕ್ ಮೂಲಕ ಸಾಲದ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ"
      },
      {
        "step": 2,
        "en": "Attach UDID / Disability certificate and business project report",
        "hi": "यूडीआईडी दिव्यांगता प्रमाण पत्र और व्यावसायिक परियोजना रिपोर्ट संलग्न करें",
        "kn": "ಯುಡಿಐಡಿ ಪ್ರಮಾಣಪತ್ರ ಮತ್ತು ವ್ಯವಹಾರ ಯೋಜನಾ ವರದಿಯನ್ನು ಲಗತ್ತಿಸಿ"
      },
      {
        "step": 3,
        "en": "Loan disbursed at subsidized interest rates (5% to 8% p.a.)",
        "hi": "रियायती ब्याज दर (5% से 8% प्रति वर्ष) पर ऋण वितरण",
        "kn": "ರಿಯಾಯಿತಿ ಬಡ್ಡಿದರದಲ್ಲಿ ಸಾಲ ಮಂಜೂರು"
      }
    ],
    "benefits": [
      {
        "benefit_type": "SUBSIDY",
        "amount_description": {
          "en": "Concessional loans up to Rs. 50 Lakhs with interest rebate for women Divyangjan",
          "hi": "50 लाख रुपये तक का रियायती ऋण तथा महिला दिव्यांगजनों को विशेष ब्याज छूट",
          "kn": "50 ಲಕ್ಷ ರೂ.ವರೆಗೆ ರಿಯಾಯಿತಿ ಸಾಲ ಮತ್ತು ಮಹಿಳಾ ದಿವ್ಯಾಂಗರಿಗೆ ಬಡ್ಡಿ ರಿಯಾಯಿತಿ"
        },
        "frequency": "ONE_TIME",
        "max_monetary_value": 5000000.0
      }
    ],
    "criteria": [
      {
        "field_name": "is_disabled",
        "criterion_type": "BOOLEAN",
        "rule_ast": {
          "==": [
            {
              "var": "is_disabled"
            },
            true
          ]
        },
        "explanation": {
          "en": "Applicant must be a Person with Disability (Divyangjan)",
          "hi": "आवेदक दिव्यांगजन होना चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ವಿಕಲಚೇತನರಾಗಿರಬೇಕು (ದಿವ್ಯಾಂಗಜನ)"
        },
        "is_mandatory": true
      },
      {
        "field_name": "disability_percentage",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          ">=": [
            {
              "var": "disability_percentage"
            },
            40.0
          ]
        },
        "explanation": {
          "en": "Disability percentage must be 40% or greater as per valid UDID certificate",
          "hi": "वैध यूडीआईडी के अनुसार दिव्यांगता 40% या उससे अधिक होनी चाहिए",
          "kn": "ಯುಡಿಐಡಿ ಪ್ರಮಾಣಪತ್ರದ ಪ್ರಕಾರ ಅಂಗವೈಕಲ್ಯವು 40% ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "age",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          ">=": [
            {
              "var": "age"
            },
            18
          ]
        },
        "explanation": {
          "en": "Applicant must be at least 18 years of age",
          "hi": "आवेदक की आयु न्यूनतम 18 वर्ष होनी चाहिए",
          "kn": "ಅರ್ಜಿದಾರರ ವಯಸ್ಸು ಕನಿಷ್ಠ 18 ವರ್ಷವಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "udid_card",
        "document_name": {
          "en": "Unique Disability ID (UDID) / Medical Board Certificate",
          "hi": "यूडीआईडी कार्ड / मेडिकल बोर्ड दिव्यांगता प्रमाण पत्र",
          "kn": "ಯುಡಿಐಡಿ ಕಾರ್ಡ್ / ವೈದ್ಯಕೀಯ ಮಂಡಳಿ ಅಂಗವೈಕಲ್ಯ ಪ್ರಮಾಣಪತ್ರ"
        },
        "issuing_authority": {
          "en": "District Medical Board / DEPwD",
          "hi": "जिला मेडिकल बोर्ड",
          "kn": "ಜಿಲ್ಲಾ ವೈದ್ಯಕೀಯ ಮಂಡಳಿ"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "aadhaar",
        "document_name": {
          "en": "Aadhaar Card",
          "hi": "आधार कार्ड",
          "kn": "ಆಧಾರ್ ಕಾರ್ಡ್"
        },
        "issuing_authority": {
          "en": "UIDAI",
          "hi": "यूआईडीएआई",
          "kn": "ಯುಐಡಿಎಐ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  },
  {
    "id": "ignoaps",
    "slug": "indira-gandhi-national-old-age-pension-scheme",
    "ministry": "Ministry of Rural Development",
    "department": "National Social Assistance Programme (NSAP)",
    "category": "social_security",
    "target_beneficiaries": [
      "senior_citizens",
      "bpl_families"
    ],
    "status": "published",
    "version_number": 1,
    "title": {
      "en": "Indira Gandhi National Old Age Pension Scheme (IGNOAPS)",
      "hi": "इंदिरा गांधी राष्ट्रीय वृद्धावस्था पेंशन योजना (आईजीएनओएपीएस)",
      "kn": "ಇಂದಿರಾ ಗಾಂಧಿ ರಾಷ್ಟ್ರೀಯ ವೃದ್ಧಾಪ್ಯ ಪಿಂಚಣಿ ಯೋಜನೆ (ಐಜಿಎನ್‌ಒಎಪಿಎಸ್)"
    },
    "short_description": {
      "en": "Monthly non-contributory pension for elderly citizens living below the poverty line.",
      "hi": "गरीबी रेखा से नीचे रहने वाले वरिष्ठ नागरिकों के लिए मासिक गैर-अंशदायी पेंशन।",
      "kn": "ಬಡತನ ರೇಖೆಗಿಂತ ಕೆಳಗಿರುವ ಹಿರಿಯ ನಾಗರಿಕರಿಗೆ ಮಾಸಿಕ ಪಿಂಚಣಿ ಸೌಲಭ್ಯ."
    },
    "full_description": {
      "en": "IGNOAPS is a core component of the National Social Assistance Programme (NSAP) providing social security pensions to impoverished elderly persons aged 60 and above belonging to BPL households.",
      "hi": "राष्ट्रीय सामाजिक सहायता कार्यक्रम (एनएसएपी) के तहत 60 वर्ष या उससे अधिक आयु के बीपीएल परिवारों के बुजुर्गों को सामाजिक सुरक्षा प्रदान करने हेतु मासिक पेंशन योजना।",
      "kn": "ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ನೆರವು ಕಾರ್ಯಕ್ರಮದ (ಎನ್‌ಎಸ್‌ಎಪಿ) ಅಡಿಯಲ್ಲಿ ಬಿಪಿಎಲ್ ಕುಟುಂಬಗಳ 60 ವರ್ಷ ಮೇಲ್ಪಟ್ಟ ವೃದ್ಧರಿಗೆ ಮಾಸಿಕ ಸಾಮಾಜಿಕ ಭದ್ರತಾ ಪಿಂಚಣಿ ನೀಡಲಾಗುತ್ತದೆ."
    },
    "official_portal_url": "https://nsap.nic.in",
    "gazette_notification_url": "https://rural.nic.in/en/schemes/nsap",
    "source_reference_date": "2007-11-19",
    "source_document_hash": "2c624232cdd221771294dfbb379ac8b00a5a4d46eb614a93a4bc0300a7479543",
    "funding_type": "CENTRALLY_SPONSORED",
    "application_mode": "BOTH",
    "application_steps": [
      {
        "step": 1,
        "en": "Apply through Gram Panchayat or Block Development Office (BDO) / Municipal office",
        "hi": "ग्राम पंचायत, प्रखंड विकास कार्यालय (BDO) या नगर पालिका कार्यालय के माध्यम से आवेदन करें",
        "kn": "ಗ್ರಾಮ ಪಂಚಾಯತಿ ಅಥವಾ ತಾಲೂಕು ಕಚೇರಿ / ಬಿಡಿಒ ಕಚೇರಿ ಮೂಲಕ ಅರ್ಜಿ ಸಲ್ಲಿಸಿ"
      },
      {
        "step": 2,
        "en": "Verification by Social Welfare Officer and publication in Gram Sabha",
        "hi": "समाज कल्याण अधिकारी द्वारा सत्यापन और ग्राम सभा में अनुमोदन",
        "kn": "ಸಮಾಜ ಕಲ್ಯಾಣಾಧಿಕಾರಿಗಳಿಂದ ಪರಿಶೀಲನೆ ಮತ್ತು ಗ್ರಾಮ ಸಭೆಯಲ್ಲಿ ಅನುಮೋದನೆ"
      },
      {
        "step": 3,
        "en": "Monthly pension credited to pensioner's bank or post office account",
        "hi": "मासिक पेंशन सीधे पेंशनभोगी के बैंक या डाकघर खाते में जमा होती है",
        "kn": "ಮಾಸಿಕ ಪಿಂಚಣಿ ನೇರವಾಗಿ ಬ್ಯಾಂಕ್ ಅಥವಾ ಅಂಚೆ ಖಾತೆಗೆ ಜಮೆ"
      }
    ],
    "benefits": [
      {
        "benefit_type": "CASH_TRANSFER",
        "amount_description": {
          "en": "Monthly pension (Rs. 200-500 Central share + matching State contribution, typically Rs. 1,000 to Rs. 2,000/month)",
          "hi": "मासिक पेंशन (केंद्र + राज्य का संयुक्त अंशदान, आमतौर पर 1,000 से 2,000 रुपये प्रति माह)",
          "kn": "ಮಾಸಿಕ ಪಿಂಚಣಿ (ಕೇಂದ್ರ ಮತ್ತು ರಾಜ್ಯ ಸರ್ಕಾರದ ಜಂಟಿ ಮೊತ್ತ, ಸಾಮಾನ್ಯವಾಗಿ ತಿಂಗಳಿಗೆ 1,000 ರಿಂದ 2,000 ರೂ.)"
        },
        "frequency": "MONTHLY",
        "max_monetary_value": 24000.0
      }
    ],
    "criteria": [
      {
        "field_name": "age",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          ">=": [
            {
              "var": "age"
            },
            60
          ]
        },
        "explanation": {
          "en": "Applicant must be 60 years of age or older",
          "hi": "आवेदक की आयु 60 वर्ष या उससे अधिक होनी चाहिए",
          "kn": "ಅರ್ಜಿದಾರರ ವಯಸ್ಸು 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "is_bpl_card_holder",
        "criterion_type": "BOOLEAN",
        "rule_ast": {
          "==": [
            {
              "var": "is_bpl_card_holder"
            },
            true
          ]
        },
        "explanation": {
          "en": "Applicant must belong to a household living Below the Poverty Line (BPL)",
          "hi": "आवेदक गरीबी रेखा से नीचे (बीपीएल) परिवार से संबंधित होना चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ಬಡತನ ರೇಖೆಗಿಂತ ಕೆಳಗಿರುವ (ಬಿಪಿಎಲ್) ಕುಟುಂಬಕ್ಕೆ ಸೇರಿದವರಾಗಿರಬೇಕು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "age_proof",
        "document_name": {
          "en": "Age Proof (Aadhaar Card / Voter ID / Birth Certificate)",
          "hi": "आयु प्रमाण (आधार कार्ड / मतदाता पहचान पत्र)",
          "kn": "ವಯಸ್ಸಿನ ಪುರಾವೆ (ಆಧಾರ್ ಕಾರ್ಡ್ / ಮತದಾರರ ಗುರುತಿನ ಚೀಟಿ)"
        },
        "issuing_authority": {
          "en": "UIDAI / Election Commission of India",
          "hi": "यूआईडीएआई / चुनाव आयोग",
          "kn": "ಯುಐಡಿಎಐ / ಭಾರತೀಯ ಚುನಾವಣಾ ಆಯೋಗ"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "bpl_card",
        "document_name": {
          "en": "BPL Ration Card / BPL Survey Certificate",
          "hi": "बीपीएल राशन कार्ड / बीपीएल सूची प्रमाण",
          "kn": "ಬಿಪಿಎಲ್ ಪಡಿತರ ಚೀಟಿ / ಬಿಪಿಎಲ್ ಪ್ರಮಾಣಪತ್ರ"
        },
        "issuing_authority": {
          "en": "Food and Civil Supplies Department",
          "hi": "खाद्य एवं नागरिक आपूर्ति विभाग",
          "kn": "ಆಹಾರ ಮತ್ತು ನಾಗರಿಕ ಸರಬರಾಜು ಇಲಾಖೆ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  },
  {
    "id": "pmay-g",
    "slug": "pradhan-mantri-awas-yojana-gramin",
    "ministry": "Ministry of Rural Development",
    "department": "Rural Housing Division",
    "category": "housing",
    "target_beneficiaries": [
      "rural",
      "bpl_families"
    ],
    "status": "published",
    "version_number": 1,
    "title": {
      "en": "Pradhan Mantri Awas Yojana - Gramin (PMAY-G)",
      "hi": "प्रधानमंत्री आवास योजना - ग्रामीण (पीएमएवाई-जी)",
      "kn": "ಪ್ರಧಾನ ಮಂತ್ರಿ ಆವಾಸ್ ಯೋಜನೆ - ಗ್ರಾಮೀಣ (ಪಿಎಂಎವೈ-ಜಿ)"
    },
    "short_description": {
      "en": "Grant of Rs. 1.20 Lakh to Rs. 1.30 Lakh for construction of a pucca house in rural areas.",
      "hi": "ग्रामीण क्षेत्रों में पक्के मकान के निर्माण हेतु 1.20 लाख से 1.30 लाख रुपये का वित्तीय अनुदान।",
      "kn": "ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಪಕ್ಕಾ ಮನೆ ನಿರ್ಮಾಣಕ್ಕಾಗಿ 1.20 ಲಕ್ಷದಿಂದ 1.30 ಲಕ್ಷ ರೂ.ಗಳವರೆಗೆ ಅನುದಾನ."
    },
    "full_description": {
      "en": "PMAY-G aims to provide a pucca house with basic amenities to all houseless households and households living in kutcha and dilapidated houses in rural areas.",
      "hi": "पीएमएवाई-जी का उद्देश्य ग्रामीण क्षेत्रों में बेघर और कच्चे तथा जीर्ण-शीर्ण मकानों में रहने वाले सभी परिवारों को बुनियादी सुविधाओं से युक्त पक्का मकान उपलब्ध कराना है।",
      "kn": "ಗ್ರಾಮೀಣ ಪ್ರದೇಶಗಳಲ್ಲಿ ಮನೆಯಿಲ್ಲದ ಮತ್ತು ಕಚ್ಚಾ ಮನೆಗಳಲ್ಲಿ ವಾಸಿಸುವ ಬಡ ಕುಟುಂಬಗಳಿಗೆ ಮೂಲಸೌಕರ್ಯಗಳೊಂದಿಗೆ ಪಕ್ಕಾ ಮನೆಗಳನ್ನು ನಿರ್ಮಿಸಲು ಆರ್ಥಿಕ ನೆರವು ನೀಡಲಾಗುತ್ತದೆ."
    },
    "official_portal_url": "https://pmayg.nic.in",
    "gazette_notification_url": "https://rural.nic.in/en/pmayg",
    "source_reference_date": "2016-04-01",
    "source_document_hash": "15e2b0d3c33891ebb0f1ef609ec419420c20e320ce94c65fbc8c3312448eb225",
    "funding_type": "CENTRALLY_SPONSORED",
    "application_mode": "BOTH",
    "application_steps": [
      {
        "step": 1,
        "en": "Identification via SECC and Awaas+ list verified by Gram Sabha",
        "hi": "एसईसीसी और आवास+ सूची के आधार पर ग्राम सभा द्वारा सत्यापन",
        "kn": "ಎಸ್‌ಇಸಿಸಿ ಮತ್ತು ಆವಾಸ್+ ಪಟ್ಟಿಯ ಆಧಾರದ ಮೇಲೆ ಗ್ರಾಮ ಸಭೆಯಿಂದ ಆಯ್ಕೆ"
      },
      {
        "step": 2,
        "en": "Geo-tagging of existing kutcha house site using AwaasApp",
        "hi": "आवासऐप के माध्यम से वर्तमान कच्चे घर की जियो-टैगिंग",
        "kn": "ಆವಾಸ್‌ಆ್ಯಪ್ ಮೂಲಕ ಪ್ರಸ್ತುತ ಕಚ್ಚಾ ಮನೆಯ ಜಿಯೋ-ಟ್ಯಾಗಿಂಗ್"
      },
      {
        "step": 3,
        "en": "Disbursement in 3 to 4 installments linked to construction stages (plinth, lintel, roof)",
        "hi": "निर्माण के चरणों (नींव, लिंटेल, छत) से जुड़ी 3 से 4 किस्तों में प्रत्यक्ष भुगतान",
        "kn": "ಮನೆ ನಿರ್ಮಾಣದ ಹಂತಗಳ ಆಧಾರದ ಮೇಲೆ 3 ರಿಂದ 4 ಕಂತುಗಳಲ್ಲಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಹಣ ಜಮೆ"
      }
    ],
    "benefits": [
      {
        "benefit_type": "SUBSIDY",
        "amount_description": {
          "en": "Financial grant of Rs. 1,20,000 (plain areas) / Rs. 1,30,000 (hilly/difficult areas) + 90-95 days MGNREGA wages + Rs. 12,000 for toilet (SBM-G)",
          "hi": "1,20,000 रुपये (मैदानी क्षेत्र) / 1,30,000 रुपये (पहाड़ी क्षेत्र) का अनुदान + 90 दिन मनरेगा मजदूरी + 12,000 रुपये शौचालय हेतु",
          "kn": "1,20,000 ರೂ. (ಮೈದಾನ ಪ್ರದೇಶ) / 1,30,000 ರೂ. (ಗುಡ್ಡಗಾಡು ಪ್ರದೇಶ) ಅನುದಾನ + 90 ದಿನಗಳ ನರೇಗಾ ಕೂಲಿ + ಶೌಚಾಲಯಕ್ಕಾಗಿ 12,000 ರೂ."
        },
        "frequency": "ONE_TIME",
        "max_monetary_value": 150000.0
      }
    ],
    "criteria": [
      {
        "field_name": "residence_area",
        "criterion_type": "EQUALITY",
        "rule_ast": {
          "==": [
            {
              "var": "residence_area"
            },
            "rural"
          ]
        },
        "explanation": {
          "en": "Must be residing in a designated rural area",
          "hi": "आवेदक ग्रामीण क्षेत्र का निवासी होना चाहिए",
          "kn": "ಅರ್ಜಿದಾರರು ಗ್ರಾಮೀಣ ಪ್ರದೇಶದಲ್ಲಿ ವಾಸಿಸುತ್ತಿರಬೇಕು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "has_pucca_house",
        "criterion_type": "BOOLEAN",
        "rule_ast": {
          "==": [
            {
              "var": "has_pucca_house"
            },
            false
          ]
        },
        "explanation": {
          "en": "Family must not own any pucca (brick/concrete) house anywhere in India",
          "hi": "परिवार के पास भारत में कहीं भी कोई पक्का मकान नहीं होना चाहिए",
          "kn": "ಕುಟುಂಬವು ಭಾರತದಲ್ಲಿ ಎಲ್ಲಿಯೂ ಯಾವುದೇ ಪಕ್ಕಾ (ಕಾಂಕ್ರೀಟ್) ಮನೆ ಹೊಂದಿರಬಾರದು"
        },
        "is_mandatory": true
      },
      {
        "field_name": "annual_income_inr",
        "criterion_type": "NUMERIC_RANGE",
        "rule_ast": {
          "<=": [
            {
              "var": "annual_income_inr"
            },
            300000.0
          ]
        },
        "explanation": {
          "en": "Annual household income must be <= Rs. 3 Lakhs",
          "hi": "पारिवारिक वार्षिक आय 3 लाख रुपये से कम होनी चाहिए",
          "kn": "ಕುಟುಂಬದ ವಾರ್ಷಿಕ ಆದಾಯ 3 ಲಕ್ಷಕ್ಕಿಂತ ಕಡಿಮೆಯಿರಬೇಕು"
        },
        "is_mandatory": true
      }
    ],
    "documents": [
      {
        "document_code": "land_certificate",
        "document_name": {
          "en": "Land Document / Possession Certificate for house site",
          "hi": "भूमि दस्तावेज / घर निर्माण हेतु पट्टा प्रमाण",
          "kn": "ಭೂ ದಾಖಲೆ / ಮನೆ ನಿರ್ಮಾಣಕ್ಕಾಗಿ ನಿವೇಶನ ಪತ್ರ"
        },
        "issuing_authority": {
          "en": "Gram Panchayat / Tehsildar",
          "hi": "ग्राम पंचायत / तहसीलदार",
          "kn": "ಗ್ರಾಮ ಪಂಚಾಯತಿ / ತಹಶೀಲ್ದಾರ್"
        },
        "is_mandatory": true,
        "alternatives": []
      },
      {
        "document_code": "mgnrega_job_card",
        "document_name": {
          "en": "MGNREGA Job Card",
          "hi": "मनरेगा जॉब कार्ड",
          "kn": "ನರೇಗಾ ಜಾಬ್ ಕಾರ್ಡ್"
        },
        "issuing_authority": {
          "en": "Gram Panchayat",
          "hi": "ग्राम पंचायत",
          "kn": "ಗ್ರಾಮ ಪಂಚಾಯತಿ"
        },
        "is_mandatory": true,
        "alternatives": []
      }
    ]
  }
];

export const STATIC_DOCUMENTS: DocumentDirectoryItem[] = [
  {
    "code": "aadhaar",
    "name": {
      "en": "Aadhaar Card",
      "hi": "आधार कार्ड",
      "kn": "ಆಧಾರ್ ಕಾರ್ಡ್"
    },
    "authority": {
      "en": "UIDAI / Aadhaar Seva Kendra",
      "hi": "यूआईडीएआई / आधार सेवा केंद्र",
      "kn": "ಯುಐಡಿಎಐ / ಆಧಾರ್ ಸೇವಾ ಕೇಂದ್ರ"
    },
    "description": {
      "en": "Universal 12-digit biometric identity card required for Direct Benefit Transfer (DBT).",
      "hi": "प्रत्यक्ष लाभ अंतरण (डीबीटी) के लिए आवश्यक 12 अंकों का बायोमेट्रिक पहचान पत्र।",
      "kn": "ನೇರ ನಗದು ವರ್ಗಾವಣೆಗೆ (ಡಿಬಿಟಿ) ಅಗತ್ಯವಿರುವ 12 ಅಂಕಿಯ ಬಯೋಮೆಟ್ರಿಕ್ ಗುರುತಿನ ಚೀಟಿ."
    },
    "estimated_tat_days": "1 - 15 days"
  },
  {
    "code": "land_record",
    "name": {
      "en": "Land Record (Patta / Khatauni / RoR)",
      "hi": "भूमि स्वामित्व रिकॉर्ड (खतौनी / पट्टा)",
      "kn": "ಭೂ ದಾಖಲೆ (ಪಹಣಿ / ಆರ್‌ಒಆರ್)"
    },
    "authority": {
      "en": "Revenue Dept / Tehsildar / Bhoomi Portal",
      "hi": "राजस्व विभाग / तहसीलदार",
      "kn": "ಕಂದಾಯ ಇಲಾಖೆ / ತಹಶೀಲ್ದಾರ್ / ಭೂಮಿ ಪೋರ್ಟಲ್"
    },
    "description": {
      "en": "Record of Rights certifying agricultural land ownership in farmer's name.",
      "hi": "किसान के नाम पर कृषि भूमि के स्वामित्व का प्रमाण।",
      "kn": "ರೈತರ ಹೆಸರಿನಲ್ಲಿರುವ ಕೃಷಿ ಭೂಮಿಯ ಮಾಲೀಕತ್ವದ ಅಧಿಕೃತ ದಾಖಲೆ."
    },
    "estimated_tat_days": "1 - 7 days (online via State land portal)"
  },
  {
    "code": "income_certificate",
    "name": {
      "en": "Income Certificate",
      "hi": "आय प्रमाण पत्र",
      "kn": "ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ"
    },
    "authority": {
      "en": "Revenue Inspector / Tehsildar / CSC",
      "hi": "राजस्व निरीक्षक / तहसीलदार / सीएससी",
      "kn": "ಕಂದಾಯ ನಿರೀಕ್ಷಕರು / ತಹಶೀಲ್ದಾರ್ / ಗ್ರಾಮ ಒನ್"
    },
    "description": {
      "en": "Annual household income verification certificate required for scholarships & subsidies.",
      "hi": "छात्रवृत्ति और सब्सिडी के लिए आवश्यक पारिवारिक वार्षिक आय प्रमाण।",
      "kn": "ವಿದ್ಯಾರ್ಥಿವೇತನ ಮತ್ತು ಸಬ್ಸಿಡಿಗಳಿಗೆ ಅಗತ್ಯವಿರುವ ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ."
    },
    "estimated_tat_days": "7 - 14 days"
  },
  {
    "code": "caste_certificate",
    "name": {
      "en": "Caste Certificate (SC/ST/OBC)",
      "hi": "जाति प्रमाण पत्र (एससी/एसटी/ओबीसी)",
      "kn": "ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ (ಎಸ್ ಸಿ/ಎಸ್ ಟಿ/ಒಬಿಸಿ)"
    },
    "authority": {
      "en": "Sub-Divisional Magistrate (SDM) / Tehsildar",
      "hi": "उपखंड मजिस्ट्रेट (एसडीएम) / तहसीलदार",
      "kn": "ಉಪವಿಭಾಗಾಧಿಕಾರಿ / ತಹಶೀಲ್ದಾರ್"
    },
    "description": {
      "en": "Affirms beneficiary's constitutional reserved category status.",
      "hi": "आरक्षित श्रेणी की पुष्टि करने वाला आधिकारिक दस्तावेज।",
      "kn": "ಮೀಸಲಾತಿ ವರ್ಗದ ಅರ್ಹತೆಯನ್ನು ದೃಢೀಕರಿಸುವ ಅಧಿಕೃತ ಪ್ರಮಾಣಪತ್ರ."
    },
    "estimated_tat_days": "14 - 21 days"
  },
  {
    "code": "udid_card",
    "name": {
      "en": "Unique Disability ID (UDID) Card",
      "hi": "विशिष्ट दिव्यांगता पहचान (UDID) कार्ड",
      "kn": "ವಿಶಿಷ್ಟ ಅಂಗವೈಕಲ್ಯ ಗುರುತಿನ (ಯುಡಿಐಡಿ) ಚೀಟಿ"
    },
    "authority": {
      "en": "District Medical Board / Chief Medical Officer",
      "hi": "जिला मेडिकल बोर्ड / मुख्य चिकित्सा अधिकारी",
      "kn": "ಜಿಲ್ಲಾ ವೈದ್ಯಕೀಯ ಮಂಡಳಿ"
    },
    "description": {
      "en": "National electronic ID card for persons with 40% or more permanent disability.",
      "hi": "40% या अधिक स्थायी दिव्यांगता वाले व्यक्तियों के लिए राष्ट्रीय पहचान पत्र।",
      "kn": "40% ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು ಶಾಶ್ವತ ಅಂಗವೈಕಲ್ಯ ಹೊಂದಿರುವ ವ್ಯಕ್ತಿಗಳಿಗೆ ರಾಷ್ಟ್ರೀಯ ಗುರುತಿನ ಚೀಟಿ."
    },
    "estimated_tat_days": "30 days"
  }
];
