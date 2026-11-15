import { Scheme, BatchEvaluationResponse, GroundedAnswerResponse, DocumentDirectoryItem } from "@/types";

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
    return await res.json();
  } catch (err) {
    console.warn("Backend fetch failed, using local static data fallback", err);
    return [];
  }
}

export async function fetchSchemeBySlug(slug: string): Promise<Scheme | null> {
  try {
    const res = await fetch(`${API_BASE}/schemes/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("Backend fetch failed for slug:", slug, err);
    return null;
  }
}

export async function fetchCategories(): Promise<{ id: string; count: number; title: Record<string, string> }[]> {
  try {
    const res = await fetch(`${API_BASE}/schemes/categories`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
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
    if (!res.ok) return [];
    return await res.json();
  } catch (err) {
    return [];
  }
}
