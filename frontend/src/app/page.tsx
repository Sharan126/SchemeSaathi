"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import {
  CheckCircle2,
  Search,
  ShieldCheck,
  FileCheck2,
  Sparkles,
  Users,
  Building2,
  HeartHandshake,
  GraduationCap,
  Home,
  HeartPulse,
  Sprout,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  FileText,
  BadgeCheck,
  Check,
  HelpCircle,
  Clock,
  Layers,
  Lock,
} from "lucide-react";

export default function HomePage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/schemes?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/schemes");
    }
  };

  const categories = [
    {
      id: "agriculture",
      label: { en: "Agriculture & Farmers", hi: "कृषि एवं किसान", kn: "ಕೃಷಿ ಮತ್ತು ರೈತರು" },
      icon: Sprout,
      desc: { en: "Income support & crop welfare", hi: "आय सहायता एवं फसल कल्याण", kn: "ಆದಾಯ ನೆರವು ಮತ್ತು ಬೆಳೆ ಕಲ್ಯಾಣ" },
      highlight: "PM-KISAN",
    },
    {
      id: "health",
      label: { en: "Healthcare & Insurance", hi: "स्वास्थ्य एवं चिकित्सा", kn: "ಆರೋಗ್ಯ ಮತ್ತು ವೈದ್ಯಕೀಯ" },
      icon: HeartPulse,
      desc: { en: "Cashless secondary & tertiary cover", hi: "मुफ्त इलाज एवं अस्पताल कवरेज", kn: "ಉಚಿತ ನಗದು ರಹಿತ ಚಿಕಿತ್ಸೆ" },
      highlight: "PM-JAY",
    },
    {
      id: "women_and_child",
      label: { en: "Women & Child Care", hi: "महिला एवं बाल विकास", kn: "ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಕಲ್ಯಾಣ" },
      icon: HeartHandshake,
      desc: { en: "Maternity aid & girl child savings", hi: "मातृत्व सहायता एवं सुकन्या योजना", kn: "ತಾಯಂದಿರ ನೆರವು ಮತ್ತು ಉಳಿತಾಯ" },
      highlight: "PMMVY / SSY",
    },
    {
      id: "education",
      label: { en: "Education & Scholarships", hi: "शिक्षा एवं छात्रवृत्ति", kn: "ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ" },
      icon: GraduationCap,
      desc: { en: "Post-matric aid & fee support", hi: "पोस्ट मैट्रिक सहायता एवं छात्रवृत्ति", kn: "ಪದವಿಪೂರ್ವ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ" },
      highlight: "PMS-SC",
    },
    {
      id: "housing",
      label: { en: "Rural Housing", hi: "ग्रामीण आवास", kn: "ಗ್ರಾಮೀಣ ವಸತಿ" },
      icon: Home,
      desc: { en: "Pucca house financial grants", hi: "पक्का मकान निर्माण सहायता", kn: "ಪಕ್ಕಾ ಮನೆ ನಿರ್ಮಾಣ ಸಹಾಯಧನ" },
      highlight: "PMAY-G",
    },
    {
      id: "social_security",
      label: { en: "Social Security & Pension", hi: "सामाजिक सुरक्षा एवं पेंशन", kn: "ಸಾಮಾಜಿಕ ಭದ್ರತೆ ಮತ್ತು ಪಿಂಚಣಿ" },
      icon: Users,
      desc: { en: "Old age, widow & disability aid", hi: "वृद्धावस्था, विधवा एवं दिव्यांग पेंशन", kn: "ವೃದ್ಧಾಪ್ಯ ಮತ್ತು ವಿಶೇಷ ಪಿಂಚಣಿ" },
      highlight: "IGNOAPS / NSAP",
    },
  ];

  const faqs = [
    {
      q: t("home.faq_q1"),
      a: t("home.faq_a1"),
    },
    {
      q: t("home.faq_q2"),
      a: t("home.faq_a2"),
    },
    {
      q: t("home.faq_q3"),
      a: t("home.faq_a3"),
    },
    {
      q: t("home.faq_q4"),
      a: t("home.faq_a4"),
    },
  ];

  return (
    <div className="space-y-16 py-4">
      {/* 1. HERO SECTION (5-Second Value Proposition) */}
      <section className="bg-slate-900 text-white rounded-3xl p-6 sm:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Subtle decorative background accent */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-6">
          {/* Trust Badge */}
          <div className="inline-flex items-center space-x-2 bg-slate-800/90 border border-slate-700 px-3.5 py-1.5 rounded-full text-xs text-emerald-300 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>Verified Gazette Records • Multilingual Application Readiness</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {t("home.hero_title")}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed font-normal">
            {t("home.hero_subtitle")}
          </p>

          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("home.search_placeholder")}
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-xl shadow-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-normal placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gov-saffron hover:bg-orange-600 text-white font-semibold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
            >
              <span>{t("assistant.send_btn")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/wizard"
              className="px-6 py-3.5 bg-gov-green hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>{t("home.check_eligibility_btn")}</span>
            </Link>
            <Link
              href="/schemes"
              className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
            >
              <span>{t("home.browse_schemes_btn")}</span>
              <ArrowRight className="w-4 h-4 text-slate-400" />
            </Link>
          </div>
        </div>
      </section>

      {/* 2. VISUAL 4-STEP CITIZEN PROCESS */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Citizen Journey
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("home.how_it_works_title")}
          </h2>
          <p className="text-sm text-slate-600">
            {t("home.how_it_works_subtitle")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-gov-blue font-bold flex items-center justify-center text-sm border border-blue-200">
              01
            </div>
            <h3 className="font-bold text-base text-slate-900">{t("home.step1_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step1_desc")}</p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-800 font-bold flex items-center justify-center text-sm border border-emerald-200">
              02
            </div>
            <h3 className="font-bold text-base text-slate-900">{t("home.step2_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step2_desc")}</p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-900 font-bold flex items-center justify-center text-sm border border-amber-200">
              03
            </div>
            <h3 className="font-bold text-base text-slate-900">{t("home.step3_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step3_desc")}</p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-900 font-bold flex items-center justify-center text-sm border border-purple-200">
              04
            </div>
            <h3 className="font-bold text-base text-slate-900">{t("home.step4_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step4_desc")}</p>
          </div>
        </div>
      </section>

      {/* 3. EXPLORE SCHEMES BY CATEGORY */}
      <section className="space-y-6">
        <div className="flex justify-between items-end">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              {t("home.categories_heading")}
            </h2>
            <p className="text-sm text-slate-500">
              Browse welfare programs categorized by sector and target beneficiary
            </p>
          </div>
          <Link
            href="/schemes"
            className="text-sm font-semibold text-gov-blue hover:underline hidden sm:flex items-center space-x-1"
          >
            <span>{t("home.browse_schemes_btn")}</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const title = cat.label[locale] || cat.label.en;
            const desc = cat.desc[locale] || cat.desc.en;
            return (
              <Link
                key={cat.id}
                href={`/schemes?category=${cat.id}`}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex items-start space-x-4 group"
              >
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-gov-blue flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors shrink-0">
                  <Icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900 group-hover:text-blue-600 transition-colors">
                      {title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">{desc}</p>
                  <span className="inline-block text-[10px] text-slate-400 font-semibold uppercase bg-slate-100 px-2 py-0.5 rounded">
                    Key: {cat.highlight}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 4. HOW ELIGIBILITY CHECKING WORKS */}
      <section className="bg-slate-50 border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full">
            Transparent Rule Evaluation
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t("home.eligibility_explainer_title")}
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            {t("home.eligibility_explainer_desc")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
              ✓
            </div>
            <h3 className="font-bold text-sm text-slate-900">Deterministic Rule Trees</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              We compile official eligibility gazettes into auditable logic rules (e.g. landholding &lt; 2ha, income thresholds). Qualification is never guessed by an LLM.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              ?
            </div>
            <h3 className="font-bold text-sm text-slate-900">Missing Info vs Disqualification</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              If an answer is omitted, we mark it as &quot;Needs More Information&quot; rather than incorrectly rejecting you. We explain the exact condition required.
            </p>
          </div>

          <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-800 flex items-center justify-center font-bold text-xs">
              ⚖
            </div>
            <h3 className="font-bold text-sm text-slate-900">Auditable Condition Breakdown</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              For every scheme, you see a itemized ledger: satisfied conditions, unsatisfied conditions, required documents, and the official gazette reference.
            </p>
          </div>
        </div>

        <div className="pt-2">
          <Link
            href="/wizard"
            className="inline-flex items-center space-x-2 text-sm font-bold text-gov-blue hover:text-blue-800 underline"
          >
            <span>Try the Guided Eligibility Wizard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 5. MULTILINGUAL AI ASSISTANCE & CITATION TRANSPARENCY */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
        <div className="space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-gov-blue bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
            Multilingual AI Guide
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Ask Scheme Questions in English, Hindi, or Kannada
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Government welfare circulars are filled with complex legal terminology. SchemeSaathi translates rules into simple language, complete with citations to the official gazettes.
          </p>

          <div className="space-y-2.5 pt-2 text-xs text-slate-700">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Strict evidence grounding: answers only cite verified government notifications.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>Explains difficult exclusion clauses (e.g. institutional landholders, income tax payees).</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>If information is incomplete, the assistant transparently abstains and provides next steps.</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/assistant"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gov-blue hover:bg-blue-800 text-white font-semibold rounded-xl text-sm transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4 text-orange-300" />
              <span>Open Multilingual AI Assistant</span>
            </Link>
          </div>
        </div>

        {/* Assistant Preview Card */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 rounded-lg bg-gov-navy text-white flex items-center justify-center font-bold text-xs">
                यS
              </div>
              <span className="font-bold text-xs text-slate-900">Grounded Scheme Guide</span>
            </div>
            <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-semibold">
              Source Verified
            </span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-slate-100 p-3 rounded-lg text-slate-800 font-medium">
              &quot;What are the exclusion criteria for PM-KISAN?&quot;
            </div>
            <div className="bg-blue-50/70 p-3.5 rounded-lg border border-blue-100 text-slate-700 space-y-2">
              <p className="leading-relaxed">
                Under PM-KISAN operational guidelines, the following are excluded: institutional landholders, farmer families holding constitutional posts, serving or retired government officers, and persons who paid income tax in the last assessment year.
              </p>
              <div className="pt-1 text-[11px] text-gov-blue font-semibold flex items-center space-x-1">
                <span>Citation: MoA&amp;FW Circular Ref 2026-02-01</span>
                <ExternalLink className="w-3 h-3" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DOCUMENT READINESS CENTER SPOTLIGHT */}
      <section className="bg-gradient-to-br from-amber-50/70 via-white to-blue-50/50 border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-6">
        <div className="max-w-2xl space-y-2">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-3 py-1 rounded-full">
            Document Readiness Center
          </span>
          <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Prepare Your Documents Before Visiting Any Office
          </h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Most government applications are delayed due to missing or mismatched documents. Review the exact issuing authorities, acceptable alternatives, and manage your readiness checklist locally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
            <span className="font-bold text-slate-900 block">Personal Offline Checklist</span>
            <p className="text-slate-600">Track which documents you already possess and what you need to obtain from local Taluk or CSC offices.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
            <span className="font-bold text-slate-900 block">Zero Document Uploads</span>
            <p className="text-slate-600">Your checklist is stored on your device only. We never ask you to upload sensitive files or identity cards.</p>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1.5 shadow-sm">
            <span className="font-bold text-slate-900 block">Officially Accepted Alternatives</span>
            <p className="text-slate-600">See recognized alternative documents (e.g. Voter ID, Kisan Credit Card) when a specific certificate is missing.</p>
          </div>
        </div>

        <div>
          <Link
            href="/documents"
            className="inline-flex items-center space-x-2 text-sm font-bold text-gov-blue hover:text-blue-800 underline"
          >
            <span>Open Document Readiness Center &amp; Checklist</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* 7. CORE PRINCIPLES & GUARANTEES */}
      <section className="bg-slate-100/70 border border-slate-200 rounded-3xl p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("home.principles_heading")}
          </h2>
          <p className="text-sm text-slate-600">
            Engineered with strict safety guardrails for millions of Indian citizens
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t("home.rule_engine_title")}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("home.rule_engine_desc")}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t("home.privacy_title")}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("home.privacy_desc")}
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t("home.citations_title")}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("home.citations_desc")}
            </p>
          </div>
        </div>
      </section>

      {/* 8. FREQUENTLY ASKED QUESTIONS (FAQ) */}
      <section className="space-y-6 max-w-3xl mx-auto">
        <div className="text-center space-y-2">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {t("home.faq_title")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-500">
            Clear, honest answers about our platform, privacy policies, and public service standards.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 sm:p-5 text-left flex justify-between items-center space-x-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-sm text-slate-800">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 sm:p-5 pt-0 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 bg-slate-50/50">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 9. FINAL CALL TO ACTION */}
      <section className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 text-center space-y-6 shadow-xl border border-slate-800">
        <div className="max-w-xl mx-auto space-y-3">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {t("home.final_cta_title")}
          </h2>
          <p className="text-xs sm:text-sm text-slate-300">
            {t("home.final_cta_desc")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/wizard"
            className="px-6 py-3.5 bg-gov-green hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{t("home.check_eligibility_btn")}</span>
          </Link>
          <Link
            href="/schemes"
            className="px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl border border-slate-700 transition-all flex items-center justify-center space-x-2 text-sm"
          >
            <span>{t("home.browse_schemes_btn")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
