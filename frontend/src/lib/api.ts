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

export async function askAssistant(query: string, locale: string = "en"): Promise<GroundedAnswerResponse> {
  const res = await fetch(`${API_BASE}/assistant/query`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, locale }),
  });
  if (!res.ok) {
    throw new Error("Failed to consult SchemeSaathi assistant");
  }
  return await res.json();
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
