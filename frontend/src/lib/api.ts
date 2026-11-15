import { Scheme, BatchEvaluationResponse, GroundedAnswerResponse, DocumentDirectoryItem } from "@/types";
import { STATIC_SCHEMES, STATIC_DOCUMENTS } from "@/data/staticFallback";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

export async function fetchSchemes(params?: {
  category?: string;
  beneficiary?: string;
  q?: string;
  locale?: string;
}): Promise<Scheme[]> {
  try {
    const url = new URL(`${API_BASE}/schemes`);
    if (params?.category) url.searchParams.set("category", params.category);
    if (params?.beneficiary) url.searchParams.set("beneficiary", params.beneficiary);
    if (params?.q) url.searchParams.set("q", params.q);
    if (params?.locale) url.searchParams.set("locale", params.locale);

    const res = await fetch(url.toString(), { next: { revalidate: 60 } });
    if (!res.ok) throw new Error("Failed to fetch schemes");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return data;
    }
  } catch (err) {
    console.warn("Backend fetch failed, using local static verified data fallback", err);
  }

  // Fallback to verified static schemes
  return STATIC_SCHEMES.filter((s) => {
    if (params?.category && s.category !== params.category) {
      return false;
    }
    if (params?.beneficiary && !s.target_beneficiaries?.includes(params.beneficiary)) {
      return false;
    }
    if (params?.q) {
      const q = params.q.toLowerCase();
      const inTitle = Object.values(s.title || {}).some((v) => v.toLowerCase().includes(q));
      const inDesc = Object.values(s.short_description || {}).some((v) => v.toLowerCase().includes(q));
      const inId = s.id.toLowerCase().includes(q) || s.slug.toLowerCase().includes(q);
      if (!inTitle && !inDesc && !inId) return false;
    }
    return true;
  });
}

export async function fetchSchemeBySlug(slug: string): Promise<Scheme | null> {
  try {
    const res = await fetch(`${API_BASE}/schemes/${slug}`, { next: { revalidate: 60 } });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend fetch failed for slug:", slug, err);
  }

  // Fallback to static verified schemes
  const found = STATIC_SCHEMES.find((s) => s.slug === slug || s.id === slug);
  return found || null;
}

export async function fetchCategories(): Promise<{ id: string; count: number; title: Record<string, string> }[]> {
  try {
    const res = await fetch(`${API_BASE}/schemes/categories`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    // Fall through to static
  }

  const categoryTitles: Record<string, Record<string, string>> = {
    agriculture: { en: "Agriculture & Farmers", hi: "कृषि एवं किसान", kn: "ಕೃಷಿ ಮತ್ತು ರೈತರು" },
    health: { en: "Healthcare & Insurance", hi: "स्वास्थ्य एवं बीमा", kn: "ಆರೋಗ್ಯ ಮತ್ತು ವಿಮೆ" },
    women_and_child: { en: "Women & Child Development", hi: "महिला एवं बाल विकास", kn: "ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಕಲ್ಯಾಣ" },
    education: { en: "Education & Scholarships", hi: "शिक्षा एवं छात्रवृत्ति", kn: "ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ" },
    housing: { en: "Housing & Rural Development", hi: "ग्रामीण आवास", kn: "ಗ್ರಾಮೀಣ ವಸತಿ" },
    social_security: { en: "Social Security & Pensions", hi: "सामाजिक सुरक्षा एवं पेंशन", kn: "ಸಾಮಾಜಿಕ ಭದ್ರತೆ ಮತ್ತು ಪಿಂಚಣಿ" },
    disability_empowerment: { en: "Divyangjan & Disability", hi: "दिव्यांगजन सशक्तिकरण", kn: "ದಿವ್ಯಾಂಗಜನ ಸಬಲೀಕರಣ" },
  };

  const counts: Record<string, number> = {};
  for (const s of STATIC_SCHEMES) {
    counts[s.category] = (counts[s.category] || 0) + 1;
  }

  return Object.entries(counts).map(([catId, count]) => ({
    id: catId,
    count,
    title: categoryTitles[catId] || { en: catId },
  }));
}

export async function evaluateEligibility(
  profile: Record<string, any>,
  schemeId?: string
): Promise<BatchEvaluationResponse> {
  const payload: { profile: Record<string, any>; scheme_id?: string } = { profile };
  if (schemeId) {
    payload.scheme_id = schemeId;
  }
  const res = await fetch(`${API_BASE}/eligibility/evaluate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error("Failed to evaluate eligibility");
  }
  return await res.json();
}

function synthesizeClientFallback(query: string, locale: string = "en"): GroundedAnswerResponse {
  const qNorm = query.toLowerCase().trim();

  // 1. Greetings & Bot Identity
  const greetings = ["hi", "hello", "hey", "namaste", "namaskara", "namaskar", "good morning", "good evening"];
  const identity = ["who are you", "what is your name", "what can you do", "help"];
  const isGreeting =
    greetings.some((g) => qNorm === g || qNorm.startsWith(g + " ")) ||
    identity.some((id) => qNorm.includes(id));

  if (isGreeting) {
    const msgs: Record<string, string> = {
      en: "Hello! I am SchemeSaathi, your digital assistant for Central Government schemes. How can I assist you today? You can ask me about schemes for farmers (PM-KISAN), healthcare (Ayushman Bharat PM-JAY), scholarships (PMS-SC), girl child savings (Sukanya Samriddhi Yojana), rural housing (PMAY-G), or explore your eligibility in the Eligibility Wizard.",
      hi: "नमस्ते! मैं स्कीमसाथी हूँ, आपका केंद्र सरकार की योजनाओं का आधिकारिक डिजिटल सहायक। आज मैं आपकी क्या सहायता कर सकता हूँ? आप मुझसे किसान सम्मान निधि (पीएम-किसान), आयुष्मान भारत स्वास्थ्य योजना, पोस्ट-मैट्रिक छात्रवृत्ति, सुकन्या समृद्धि योजना, या ग्रामीण आवास योजना के बारे में पूछ सकते हैं।",
      kn: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ, ಕೇಂದ್ರ ಸರ್ಕಾರದ ಯೋಜನೆಗಳ ನಿಮ್ಮ ಅಧಿಕೃತ ಡಿಜಿಟಲ್ ಸಹಾಯಕ. ನಾನು ನಿಮಗೆ ಹೇಗೆ ಸಹಾಯ ಮಾಡಬಹುದು? ನೀವು ರೈತರ ಯೋಜನೆಗಳು (ಪಿಎಂ-ಕಿಸಾನ್), ಆರೋಗ್ಯ ವಿಮೆ (ಆಯುಷ್ಮಾನ್ ಭಾರತ್), ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು, ಸುಕನ್ಯಾ ಸಮೃದ್ಧಿ ಯೋಜನೆ ಅಥವಾ ಗ್ರಾಮೀಣ ವಸತಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು.",
    };
    return {
      query,
      locale,
      answer: msgs[locale] || msgs.en,
      is_grounded: true,
      confidence_score: 1.0,
      citations: [],
    };
  }

  // 2. Search for relevant scheme in STATIC_SCHEMES
  const matchedScheme = STATIC_SCHEMES.find((s) => {
    const id = s.id.toLowerCase();
    const titles = Object.values(s.title || {}).map((v) => v.toLowerCase());
    return (
      qNorm.includes(id) ||
      titles.some((t) => qNorm.includes(t.split("(")[0].trim().toLowerCase())) ||
      (id === "pm-kisan" && (qNorm.includes("kisan") || qNorm.includes("farmer"))) ||
      (id === "ayushman-bharat-pmjay" && (qNorm.includes("ayushman") || qNorm.includes("health cover") || qNorm.includes("cashless"))) ||
      (id === "pmmvy" && (qNorm.includes("pmmvy") || qNorm.includes("mother") || qNorm.includes("pregnant"))) ||
      (id === "pms-sc" && (qNorm.includes("scholarship") || qNorm.includes("matric"))) ||
      (id === "sukanya-samriddhi" && (qNorm.includes("sukanya") || qNorm.includes("girl child"))) ||
      (id === "pmay-g" && (qNorm.includes("awas") || qNorm.includes("housing"))) ||
      (id === "ignoaps" && (qNorm.includes("pension") || qNorm.includes("old age"))) ||
      (id === "divyangjan-swavlamban" && (qNorm.includes("divyang") || qNorm.includes("disability")))
    );
  });

  if (matchedScheme) {
    const title = (matchedScheme.title as any)[locale] || matchedScheme.title.en;
    const desc =
      (matchedScheme.full_description as any)[locale] ||
      (matchedScheme.short_description as any)[locale] ||
      matchedScheme.short_description.en;
    const portal = matchedScheme.official_portal_url;

    let ans = "";
    if (locale === "hi") {
      ans = `सत्यापित आधिकारिक रिकॉर्ड के अनुसार (${title}):\n\n${desc}\n\nअधिक जानकारी और आवेदन के लिए आधिकारिक पोर्टल देखें: ${portal}`;
    } else if (locale === "kn") {
      ans = `ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ದಾಖಲೆಯ ಪ್ರಕಾರ (${title}):\n\n${desc}\n\nಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ವೀಕ್ಷಿಸಿ: ${portal}`;
    } else {
      ans = `According to verified official records for ${title}:\n\n${desc}\n\nFor verified details and application procedures, visit: ${portal}`;
    }

    return {
      query,
      locale,
      answer: ans,
      is_grounded: true,
      confidence_score: 0.95,
      citations: [
        {
          scheme_id: matchedScheme.id,
          scheme_name: title,
          section_title: "Official Scheme Overview",
          official_portal_url: portal,
          gazette_notification_url: matchedScheme.gazette_notification_url,
          source_reference_date: matchedScheme.source_reference_date || "2024-01-01",
        },
      ],
    };
  }

  // 3. Fallback abstention
  const fallbackMsgs: Record<string, string> = {
    en: "We could not find verified official records answering your specific question. Please consult the nearest Common Service Centre (CSC) or official ministry portal.",
    hi: "हमें आपके प्रश्न से संबंधित कोई सत्यापित आधिकारिक रिकॉर्ड नहीं मिला। कृपया निकटतम कॉमन सर्विस सेंटर (सीएससी) या संबंधित मंत्रालय के पोर्टल से संपर्क करें।",
    kn: "ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದ ಯಾವುದೇ ಅಧಿಕೃತ ಪರಿಶೀಲಿಸಿದ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ. ದಯವಿಟ್ಟು ಹತ್ತಿರದ ಗ್ರಾಮ ಒನ್ / ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರ ಅಥವಾ ಅಧಿಕೃತ ಇಲಾಖಾ ಪೋರ್ಟಲ್ ಅನ್ನು ಸಂಪರ್ಕಿಸಿ.",
  };

  return {
    query,
    locale,
    answer: fallbackMsgs[locale] || fallbackMsgs.en,
    is_grounded: false,
    confidence_score: 0.0,
    citations: [],
  };
}

export async function askAssistant(query: string, locale: string = "en"): Promise<GroundedAnswerResponse> {
  try {
    const res = await fetch(`${API_BASE}/assistant/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, locale }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend assistant query failed, using grounded client fallback", err);
  }

  return synthesizeClientFallback(query, locale);
}

export async function fetchDocumentDirectory(): Promise<DocumentDirectoryItem[]> {
  try {
    const res = await fetch(`${API_BASE}/documents/directory`, { next: { revalidate: 300 } });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) return data;
    }
  } catch (err) {
    // Fall through to static
  }
  return STATIC_DOCUMENTS;
}
