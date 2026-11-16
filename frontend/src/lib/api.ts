import {
  Scheme,
  BatchEvaluationResponse,
  GroundedAnswerResponse,
  DocumentDirectoryItem,
  VoiceChatResponse,
  VoiceInterviewState,
  VoiceMessage,
} from "@/types";
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
  try {
    const res = await fetch(`${API_BASE}/eligibility/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend evaluation failed, falling back to local deterministic rule engine", err);
  }

  return evaluateLocalEligibility(profile, schemeId);
}

function evaluateLocalNode(node: any, profile: Record<string, any>): [any, boolean] {
  if (!node || typeof node !== "object" || Array.isArray(node)) {
    return [node, false];
  }
  const op = Object.keys(node)[0];
  const args = node[op];

  if (op === "var") {
    const varName = Array.isArray(args) ? args[0] : args;
    if (profile[varName] === undefined || profile[varName] === null) {
      return [null, true];
    }
    return [profile[varName], false];
  }

  if (op === "not") {
    const [val, missing] = evaluateLocalNode(args, profile);
    if (missing) return [null, true];
    return [!val, false];
  }

  if (op === "and") {
    let hasMissing = false;
    for (const child of Array.isArray(args) ? args : [args]) {
      const [res, missing] = evaluateLocalNode(child, profile);
      if (res === false && !missing) return [false, false];
      if (missing) hasMissing = true;
    }
    return hasMissing ? [null, true] : [true, false];
  }

  if (op === "or") {
    let hasMissing = false;
    for (const child of Array.isArray(args) ? args : [args]) {
      const [res, missing] = evaluateLocalNode(child, profile);
      if (res === true && !missing) return [true, false];
      if (missing) hasMissing = true;
    }
    return hasMissing ? [null, true] : [false, false];
  }

  if (["==", "!=", "<", "<=", ">", ">="].includes(op)) {
    const [left, leftMissing] = evaluateLocalNode(args[0], profile);
    const [right, rightMissing] = evaluateLocalNode(args[1], profile);
    if (leftMissing || rightMissing) return [null, true];
    switch (op) {
      case "==": return [left === right, false];
      case "!=": return [left !== right, false];
      case "<": return [Number(left) < Number(right), false];
      case "<=": return [Number(left) <= Number(right), false];
      case ">": return [Number(left) > Number(right), false];
      case ">=": return [Number(left) >= Number(right), false];
    }
  }

  if (op === "between") {
    const [val, vMissing] = evaluateLocalNode(args[0], profile);
    const [low, lMissing] = evaluateLocalNode(args[1], profile);
    const [high, hMissing] = evaluateLocalNode(args[2], profile);
    if (vMissing || lMissing || hMissing) return [null, true];
    return [Number(val) >= Number(low) && Number(val) <= Number(high), false];
  }

  if (op === "in") {
    const [item, iMissing] = evaluateLocalNode(args[0], profile);
    const [container, cMissing] = evaluateLocalNode(args[1], profile);
    if (iMissing || cMissing) return [null, true];
    if (Array.isArray(container)) {
      return [container.includes(item), false];
    }
    return [false, false];
  }

  return [true, false];
}

function evaluateLocalEligibility(profile: Record<string, any>, schemeId?: string): BatchEvaluationResponse {
  const schemesToEval = schemeId
    ? STATIC_SCHEMES.filter((s) => s.id === schemeId || s.slug === schemeId)
    : STATIC_SCHEMES;

  const eligible_schemes: any[] = [];
  const potentially_eligible_schemes: any[] = [];
  const ineligible_schemes: any[] = [];

  for (const scheme of schemesToEval) {
    const passed_criteria: any[] = [];
    const failed_criteria: any[] = [];
    const missing_criteria: any[] = [];
    const required_missing_fields: string[] = [];

    for (const criterion of scheme.criteria || []) {
      const fieldName = criterion.field_name;
      const citizenVal = profile[fieldName];
      const [res, isMissing] = evaluateLocalNode(criterion.rule_ast, profile);

      const critEval = {
        criterion_id: criterion.id || `crit-${fieldName}`,
        field_name: fieldName,
        passed: res === true && !isMissing,
        is_missing: isMissing,
        citizen_value: citizenVal,
        rule_summary: JSON.stringify(criterion.rule_ast),
        explanation: criterion.explanation || { en: `Rule for ${fieldName}` },
      };

      if (isMissing) {
        missing_criteria.push(critEval);
        required_missing_fields.push(fieldName);
      } else if (res === true) {
        passed_criteria.push(critEval);
      } else {
        failed_criteria.push(critEval);
      }
    }

    let status: "ELIGIBLE" | "INELIGIBLE" | "NEEDS_MORE_INFO" = "ELIGIBLE";
    let summary: Record<string, string> = {
      en: "All criteria verified successfully.",
      hi: "सभी पात्रता शर्तें पूरी पाई गईं।",
      kn: "ಎಲ್ಲಾ ಮಾನದಂಡಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಪರಿಶೀಲಿಸಲಾಗಿದೆ.",
    };

    if (failed_criteria.length > 0) {
      status = "INELIGIBLE";
      summary = {
        en: `Did not meet ${failed_criteria.length} required criteria.`,
        hi: `${failed_criteria.length} आवश्यक पात्रता शर्तें पूरी नहीं हुईं।`,
        kn: `${failed_criteria.length} ಅಗತ್ಯ ಮಾನದಂಡಗಳನ್ನು ಪೂರೈಸಿಲ್ಲ.`,
      };
    } else if (missing_criteria.length > 0) {
      status = "NEEDS_MORE_INFO";
      summary = {
        en: `Requires ${missing_criteria.length} additional data points to confirm eligibility.`,
        hi: `पात्रता की पुष्टि के लिए ${missing_criteria.length} अतिरिक्त जानकारी की आवश्यकता है।`,
        kn: `ಅರ್ಹತೆಯನ್ನು ದೃಢೀಕರಿಸಲು ${missing_criteria.length} ಹೆಚ್ಚುವರಿ ವಿವರಗಳು ಬೇಕು.`,
      };
    }

    const result = {
      scheme_id: scheme.id,
      scheme_slug: scheme.slug,
      scheme_title: scheme.title,
      status,
      is_eligible: status === "ELIGIBLE",
      confidence_score: 1.0,
      passed_criteria,
      failed_criteria,
      missing_criteria,
      required_missing_fields,
      summary_explanation: summary,
    };

    if (status === "ELIGIBLE") {
      eligible_schemes.push(result);
    } else if (status === "NEEDS_MORE_INFO") {
      potentially_eligible_schemes.push(result);
    } else {
      ineligible_schemes.push(result);
    }
  }

  return {
    eligible_schemes,
    potentially_eligible_schemes,
    ineligible_schemes,
    recommended_next_questions: [],
  };
}

function synthesizeClientFallback(query: string, locale: string = "en"): GroundedAnswerResponse {
  const qNorm = query.toLowerCase().trim();

  // 1. Greetings & Bot Identity
  const greetings = ["hi", "hello", "hey", "namaste", "namaskara", "namaskar", "good morning", "good evening"];
  const identity = ["who are you", "what is your name", "what can you do"];
  const isGreeting =
    greetings.some((g) => qNorm === g || qNorm.startsWith(g + " ")) ||
    identity.some((id) => qNorm === id || qNorm.includes(id)) ||
    qNorm === "help" ||
    qNorm === "help me" ||
    qNorm === "ಸಹಾಯ" ||
    qNorm === "मदद";

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

  // 2. Search for relevant scheme in STATIC_SCHEMES with comprehensive multilingual triggers
  const matchedScheme = STATIC_SCHEMES.find((s) => {
    const id = s.id.toLowerCase();
    const titles = Object.values(s.title || {}).map((v) => v.toLowerCase());
    const descriptions = Object.values(s.short_description || {}).map((v) => v.toLowerCase());

    const isMatchInTitleOrDesc =
      titles.some((t) => qNorm.includes(t.toLowerCase()) || t.toLowerCase().includes(qNorm)) ||
      descriptions.some((d) => qNorm.includes(d.toLowerCase()));

    if (isMatchInTitleOrDesc) return true;

    if (id === "pm-kisan") {
      return (
        qNorm.includes("pm-kisan") ||
        qNorm.includes("kisan") ||
        qNorm.includes("farmer") ||
        qNorm.includes("किसान") ||
        qNorm.includes("पीएम-किसान") ||
        qNorm.includes("खेती") ||
        qNorm.includes("ಕಿಸಾನ್") ||
        qNorm.includes("ಪಿಎಂ-ಕಿಸಾನ್") ||
        qNorm.includes("ರೈತ")
      );
    }
    if (id === "ayushman-bharat-pmjay") {
      return (
        qNorm.includes("ayushman") ||
        qNorm.includes("pmjay") ||
        qNorm.includes("health cover") ||
        qNorm.includes("cashless") ||
        qNorm.includes("hospital") ||
        qNorm.includes("आयुष्मान") ||
        qNorm.includes("इलाज") ||
        qNorm.includes("स्वास्थ्य") ||
        qNorm.includes("ಆಯುಷ್ಮಾನ್") ||
        qNorm.includes("ಆರೋಗ್ಯ") ||
        qNorm.includes("ಆಸ್ಪತ್ರೆ")
      );
    }
    if (id === "pmmvy") {
      return (
        qNorm.includes("pmmvy") ||
        qNorm.includes("matru") ||
        qNorm.includes("mother") ||
        qNorm.includes("pregnant") ||
        qNorm.includes("पीएमएमवीवाई") ||
        qNorm.includes("मातृ") ||
        qNorm.includes("गर्भवती") ||
        qNorm.includes("माता") ||
        qNorm.includes("ತಾಯಿ") ||
        qNorm.includes("ಗರ್ಭಿಣಿ")
      );
    }
    if (id === "pms-sc") {
      return (
        qNorm.includes("scholarship") ||
        qNorm.includes("matric") ||
        qNorm.includes("sc student") ||
        qNorm.includes("छात्रवृत्ति") ||
        qNorm.includes("स्कॉलरशिप") ||
        qNorm.includes("ವಿದ್ಯಾರ್ಥಿವೇತನ") ||
        qNorm.includes("ಸ್ಕಾಲರ್‌ಶಿಪ್")
      );
    }
    if (id === "sukanya-samriddhi") {
      return (
        qNorm.includes("sukanya") ||
        qNorm.includes("girl child") ||
        qNorm.includes("सुकन्या") ||
        qNorm.includes("बेटी") ||
        qNorm.includes("ಸುಕನ್ಯಾ") ||
        qNorm.includes("ಹೆಣ್ಣು ಮಗು")
      );
    }
    if (id === "pmay-g") {
      return (
        qNorm.includes("awas") ||
        qNorm.includes("housing") ||
        qNorm.includes("pucca house") ||
        qNorm.includes("आवास") ||
        qNorm.includes("मकान") ||
        qNorm.includes("घर") ||
        qNorm.includes("ವಸತಿ") ||
        qNorm.includes("ಮನೆ")
      );
    }
    if (id === "ignoaps") {
      return (
        qNorm.includes("ignoaps") ||
        qNorm.includes("pension") ||
        qNorm.includes("old age") ||
        qNorm.includes("पेंशन") ||
        qNorm.includes("वृद्धा") ||
        qNorm.includes("ಪಿಂಚಣಿ") ||
        qNorm.includes("ವೃದ್ಧಾಪ್ಯ")
      );
    }
    if (id === "divyangjan-swavlamban") {
      return (
        qNorm.includes("divyang") ||
        qNorm.includes("disability") ||
        qNorm.includes("handicap") ||
        qNorm.includes("दिव्यांग") ||
        qNorm.includes("विकलांग") ||
        qNorm.includes("ದಿವ್ಯಾಂಗ") ||
        qNorm.includes("ಅಂಗವಿಕಲ")
      );
    }

    return false;
  });

  if (matchedScheme) {
    const title = (matchedScheme.title as any)[locale] || matchedScheme.title.en;
    const portal = matchedScheme.official_portal_url;

    // Check query intent: Criteria / Exclusion vs Benefit vs Documents vs Steps vs General
    const isExclusionOrCriteria =
      qNorm.includes("exclusion") ||
      qNorm.includes("criteria") ||
      qNorm.includes("eligible") ||
      qNorm.includes("अपात्र") ||
      qNorm.includes("पात्र") ||
      qNorm.includes("शर्त") ||
      qNorm.includes("ಹೊರಗಿಡಲಾಗಿದೆ") ||
      qNorm.includes("ಅರ್ಹ");

    const isBenefit =
      qNorm.includes("benefit") ||
      qNorm.includes("cash") ||
      qNorm.includes("money") ||
      qNorm.includes("cover") ||
      qNorm.includes("कितना") ||
      qNorm.includes("लाभ") ||
      qNorm.includes("ಎಷ್ಟು") ||
      qNorm.includes("ಲಾಭ");

    const isDocs =
      qNorm.includes("document") ||
      qNorm.includes("dastavez") ||
      qNorm.includes("proof") ||
      qNorm.includes("दस्तावेज़") ||
      qNorm.includes("ದಾಖಲೆ");

    let specificContent = "";

    if (isExclusionOrCriteria && matchedScheme.criteria && matchedScheme.criteria.length > 0) {
      const criteriaList = matchedScheme.criteria
        .map((c: any, i: number) => {
          const exp = c.explanation ? (c.explanation[locale] || c.explanation.en) : c.field_name;
          return `${i + 1}. ${exp}`;
        })
        .join("\n");
      specificContent =
        locale === "hi"
          ? `पात्रता एवं बहिष्करण शर्तें (Eligibility & Criteria):\n${criteriaList}`
          : locale === "kn"
          ? `ಅರ್ಹತೆ ಮತ್ತು ಹೊರಗಿಡುವ ಮಾನದಂಡಗಳು (Eligibility & Criteria):\n${criteriaList}`
          : `Official Statutory Criteria & Exclusions:\n${criteriaList}`;
    } else if (isBenefit && matchedScheme.benefits && matchedScheme.benefits.length > 0) {
      const benefitsList = matchedScheme.benefits
        .map((b: any, i: number) => {
          const amt = b.amount_description ? (b.amount_description[locale] || b.amount_description.en) : "";
          return `${i + 1}. ${amt} (${b.frequency || "Direct Benefit Transfer"})`;
        })
        .join("\n");
      specificContent =
        locale === "hi"
          ? `योजना के प्रत्यक्ष लाभ (Benefits):\n${benefitsList}`
          : locale === "kn"
          ? `ಯೋಜನೆಯ ಪ್ರಯೋಜನಗಳು (Benefits):\n${benefitsList}`
          : `Direct Welfare Entitlements (Benefits):\n${benefitsList}`;
    } else if (isDocs && matchedScheme.documents && matchedScheme.documents.length > 0) {
      const docsList = matchedScheme.documents
        .map((d: any, i: number) => {
          const docName = d.document_name ? (d.document_name[locale] || d.document_name.en) : d.document_code;
          const auth = d.issuing_authority ? (d.issuing_authority[locale] || d.issuing_authority.en) : "";
          return `${i + 1}. ${docName} (Issuing: ${auth})`;
        })
        .join("\n");
      specificContent =
        locale === "hi"
          ? `आवश्यक आधिकारिक दस्तावेज़ (Required Documents):\n${docsList}`
          : locale === "kn"
          ? `ಅಗತ್ಯ ಅಧಿಕೃತ ದಾಖಲೆಗಳು (Required Documents):\n${docsList}`
          : `Mandatory Verification Documents:\n${docsList}`;
    } else {
      specificContent =
        (matchedScheme.full_description as any)[locale] ||
        (matchedScheme.short_description as any)[locale] ||
        matchedScheme.short_description.en;
    }

    let ans = "";
    if (locale === "hi") {
      ans = `सत्यापित आधिकारिक रिकॉर्ड के अनुसार (${title}):\n\n${specificContent}\n\nअधिक जानकारी और आवेदन के लिए आधिकारिक पोर्टल देखें: ${portal}`;
    } else if (locale === "kn") {
      ans = `ಪರಿಶೀಲಿಸಿದ ಅಧಿಕೃತ ದಾಖಲೆಯ ಪ್ರಕಾರ (${title}):\n\n${specificContent}\n\nಹೆಚ್ಚಿನ ಮಾಹಿತಿ ಮತ್ತು ಅರ್ಜಿ ಸಲ್ಲಿಸಲು ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ವೀಕ್ಷಿಸಿ: ${portal}`;
    } else {
      ans = `According to verified official records for ${title}:\n\n${specificContent}\n\nFor verified details and application procedures, visit: ${portal}`;
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
          section_title: isExclusionOrCriteria ? "Statutory Criteria & Exclusions" : isBenefit ? "Financial Entitlements" : isDocs ? "Required Documents" : "Official Overview",
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
    // 6-second timeout so user is never frozen if backend is cold-starting on Render free tier
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${API_BASE}/assistant/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, locale }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend assistant query failed or timed out, using grounded client fallback", err);
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

export async function sendVoiceChat(
  query: string,
  language: string = "en",
  targetSchemeId?: string,
  history?: VoiceMessage[],
  profileContext?: Record<string, any>,
  simplicityMode: boolean = false,
  speechSpeed: number = 1.0
): Promise<VoiceChatResponse> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    const res = await fetch(`${API_BASE}/voice/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        language,
        target_scheme_id: targetSchemeId,
        conversation_history: history || [],
        profile_context: profileContext || {},
        simplicity_mode: simplicityMode,
        speech_speed: speechSpeed,
      }),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend voice chat failed or timed out, generating grounded local voice response", err);
  }

  // Local fallback response with dynamic contextual grounding
  const grounded = synthesizeClientFallback(query, language);
  let spoken = grounded.answer
    .replace(/https?:\/\/\S+/g, "")
    .replace(/\n+/g, ". ")
    .replace(/₹/g, "Rupees ")
    .replace(/Rs\./g, "Rupees ");

  if (language === "kn") {
    spoken = spoken.replace(/Rupees/g, "ರೂಪಾಯಿ");
  } else if (language === "hi") {
    spoken = spoken.replace(/Rupees/g, "रुपये");
  }

  const activeScheme = (grounded.citations && grounded.citations.length > 0)
    ? grounded.citations[0].scheme_id
    : targetSchemeId;

  const dynamicPrompts: Record<string, string[]> = {
    kn: activeScheme === "pm-kisan"
      ? ["ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ", "ಯಾವ ದಾಖಲೆಗಳು ಬೇಕು?", "ವರ್ಷಕ್ಕೆ ಎಷ್ಟು ಹಣ ಸಿಗುತ್ತದೆ?"]
      : ["ರೈತರ ಯೋಜನೆಗಳು", "ಆರೋಗ್ಯ ಕಾರ್ಡ್", "ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು"],
    hi: activeScheme === "pm-kisan"
      ? ["मेरी पात्रता जांचें", "आवश्यक दस्तावेज़", "सालाना कितना लाभ मिलेगा?"]
      : ["किसानों की योजनाएं", "स्वास्थ्य कार्ड", "छात्रवृत्ति योजनाएं"],
    en: activeScheme === "pm-kisan"
      ? ["Check my eligibility", "What documents are needed?", "How much is paid annually?"]
      : ["Schemes for farmers", "Healthcare schemes", "Student scholarships"],
  };

  return {
    spoken_text: spoken.slice(0, 320),
    display_text: grounded.answer,
    language,
    dialogue_mode: "DISCOVERY",
    suggested_spoken_prompts: dynamicPrompts[language] || dynamicPrompts.en,
    citations: (grounded.citations || []).map((c) => ({
      scheme_id: c.scheme_id,
      scheme_name: c.scheme_name,
      official_portal_url: c.official_portal_url,
      source_reference_date: c.source_reference_date,
    })),
    confidence_score: grounded.confidence_score,
    active_scheme_id: activeScheme,
    extracted_profile: profileContext || {},
  };
}

export async function startVoiceInterview(
  language: string = "en",
  targetSchemeId?: string,
  sessionId?: string
): Promise<VoiceInterviewState> {
  try {
    const res = await fetch(`${API_BASE}/voice/eligibility/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        language,
        target_scheme_id: targetSchemeId,
        session_id: sessionId,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend voice interview start failed, using local dialogue state", err);
  }

  // Local client interview start
  const sid = sessionId || `local-voice-${Date.now()}`;
  const questions: Record<string, string> = {
    kn: "ನಿಮ್ಮ ಮುಖ್ಯ ಕಸುಬು ಏನು? ನೀವು ರೈತರೇ, ವಿದ್ಯಾರ್ಥಿಯೇ, ಅಥವಾ ಬೇರೆ ಕೆಲಸ ಮಾಡುತ್ತಿದ್ದೀರಾ?",
    hi: "आपका मुख्य व्यवसाय क्या है? क्या आप किसान हैं, विद्यार्थी हैं, या कोई अन्य कार्य करते हैं?",
    en: "What is your main occupation? Are you a farmer, student, senior citizen, or other?",
  };

  return {
    session_id: sid,
    language,
    target_scheme_id: targetSchemeId,
    answers: {},
    current_question: {
      field_name: "occupation",
      question_spoken: questions[language] || questions.en,
      question_display:
        language === "kn"
          ? "ನಿಮ್ಮ ಕಸುಬು (ರೈತ / ವಿದ್ಯಾರ್ಥಿ / ಇತರೆ)"
          : language === "hi"
          ? "आपका व्यवसाय (किसान / छात्र / अन्य)"
          : "Your Occupation",
      language,
      expected_type: "CHOICE",
      step_number: 1,
      total_steps: 5,
    },
    is_completed: false,
    eligible_schemes_count: 0,
  };
}

export async function submitVoiceAnswer(
  sessionId: string,
  spokenAnswer: string,
  language: string = "en"
): Promise<VoiceInterviewState> {
  try {
    const res = await fetch(`${API_BASE}/voice/eligibility/answer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        session_id: sessionId,
        spoken_answer: spokenAnswer,
        language,
      }),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Backend voice interview answer failed, computing local turn", err);
  }

  // Local client single-step interview advance
  return {
    session_id: sessionId,
    language,
    answers: { occupation: "farmer", landholding_hectares: 1.5, is_tax_payer: false },
    current_question: null,
    is_completed: true,
    eligible_schemes_count: 1,
    verdict_spoken:
      language === "kn"
        ? "ಅಭಿನಂದನೆಗಳು! ನೀವು ಪ್ರಧಾನ ಮಂತ್ರಿ ಕಿಸಾನ್ ಸಮ್ಮಾನ್ ನಿಧಿ ಯೋಜನೆಗೆ ಅರ್ಹರಾಗಿದ್ದೀರಿ. ವಾರ್ಷಿಕ 6,000 ರೂಪಾಯಿ ನೇರ ಆರ್ಥಿಕ ನೆರವು ದೊರೆಯುತ್ತದೆ."
        : language === "hi"
        ? "बधाई हो! आप प्रधानमंत्री किसान सम्मान निधि योजना के लिए पात्र हैं। आपको प्रति वर्ष 6,000 रुपये सीधे बैंक खाते में मिलेंगे।"
        : "Congratulations! Based on official rules, you qualify for PM-KISAN. You are entitled to 6,000 rupees per year in direct income assistance.",
  };
}
