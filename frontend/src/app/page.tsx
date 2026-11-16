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
  AlertTriangle,
  Coins,
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
      ministry: { en: "Min. of Agriculture & Farmers Welfare", hi: "कृषि एवं किसान कल्याण मंत्रालय", kn: "ಕೃಷಿ ಮತ್ತು ರೈತ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ" },
      benefit: "₹6,000 / year",
      highlight: "PM-KISAN",
      icon: Sprout,
    },
    {
      id: "health",
      label: { en: "Healthcare & Insurance", hi: "स्वास्थ्य एवं चिकित्सा", kn: "ಆರೋಗ್ಯ ಮತ್ತು ವೈದ್ಯಕೀಯ" },
      ministry: { en: "National Health Authority / MoHFW", hi: "राष्ट्रीय स्वास्थ्य प्राधिकरण", kn: "ರಾಷ್ಟ್ರೀಯ ಆರೋಗ್ಯ ಪ್ರಾಧಿಕಾರ" },
      benefit: "₹5,00,000 / family",
      highlight: "Ayushman PM-JAY",
      icon: HeartPulse,
    },
    {
      id: "women_and_child",
      label: { en: "Women & Child Care", hi: "महिला एवं बाल विकास", kn: "ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಕಲ್ಯಾಣ" },
      ministry: { en: "Ministry of Women & Child Development", hi: "महिला एवं बाल विकास मंत्रालय", kn: "ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಅಭಿವೃದ್ಧಿ ಸಚಿವಾಲಯ" },
      benefit: "₹5,000 direct DBT",
      highlight: "PMMVY / Sukanya",
      icon: HeartHandshake,
    },
    {
      id: "education",
      label: { en: "Education & Scholarships", hi: "शिक्षा एवं छात्रवृत्ति", kn: "ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ" },
      ministry: { en: "Ministry of Social Justice & Empowerment", hi: "सामाजिक न्याय एवं अधिकारिता मंत्रालय", kn: "ಸಾಮಾಜಿಕ ನ್ಯಾಯ ಮತ್ತು ಸಬಲೀಕರಣ ಸಚಿವಾಲಯ" },
      benefit: "100% Tuition + Maintenance",
      highlight: "PMS-SC Students",
      icon: GraduationCap,
    },
    {
      id: "housing",
      label: { en: "Rural Housing", hi: "ग्रामीण आवास", kn: "ಗ್ರಾಮೀಣ ವಸತಿ" },
      ministry: { en: "Ministry of Rural Development", hi: "ग्रामीण विकास मंत्रालय", kn: "ಗ್ರಾಮೀಣಾಭಿವೃದ್ಧಿ ಸಚಿವಾಲಯ" },
      benefit: "₹1,20,000 - ₹1,30,000",
      highlight: "PMAY-Gramin",
      icon: Home,
    },
    {
      id: "social_security",
      label: { en: "Social Security & Pension", hi: "सामाजिक सुरक्षा एवं पेंशन", kn: "ಸಾಮಾಜಿಕ ಭದ್ರತೆ ಮತ್ತು ಪಿಂಚಣಿ" },
      ministry: { en: "National Social Assistance Programme", hi: "राष्ट्रीय सामाजिक सहायता कार्यक्रम", kn: "ರಾಷ್ಟ್ರೀಯ ಸಾಮಾಜಿಕ ನೆರವು ಕಾರ್ಯಕ್ರಮ" },
      benefit: "Monthly Sovereign Pension",
      highlight: "IGNOAPS / Divyangjan",
      icon: Users,
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
    <div className="space-y-16 py-2">
      {/* 1. EDITORIAL SPLIT HERO (5-Second Value Proposition) */}
      <section className="bg-white border border-hairline rounded shadow-panel p-6 sm:p-10 lg:p-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          {/* Left Column: Authoritative Editorial Presentation */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center space-x-2 bg-slate-50 border border-hairline px-3 py-1 rounded text-xs text-forest font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-forest shrink-0" />
              <span>Gazette-Audited Records • Deterministic AST Logic • Zero PII</span>
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-[#0F1E36] leading-tight">
                {t("home.hero_title")}
              </h1>
              <p className="text-slate-600 text-sm sm:text-base leading-relaxed max-w-xl">
                {t("home.hero_subtitle")}
              </p>
            </div>

            {/* Fast Search Input */}
            <form onSubmit={handleSearchSubmit} className="space-y-2 max-w-xl">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("home.search_placeholder")}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-hairline rounded text-xs sm:text-sm text-[#0F1E36] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F1E36] focus:bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#0F1E36] hover:bg-[#162842] text-white font-bold rounded text-xs sm:text-sm transition-colors flex items-center justify-center space-x-1.5 cursor-pointer shrink-0"
                >
                  <span>{t("assistant.send_btn")}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Sector Tags */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] text-slate-500">
                <span className="font-semibold text-slate-700">Quick Searches:</span>
                {[
                  { label: "PM-KISAN", q: "PM-KISAN" },
                  { label: "Ayushman Card", q: "PM-JAY" },
                  { label: "SC Scholarship", q: "scholarship" },
                  { label: "Maternity DBT", q: "PMMVY" },
                  { label: "Rural Housing", q: "housing" },
                ].map((tag) => (
                  <button
                    key={tag.label}
                    type="button"
                    onClick={() => router.push(`/schemes?q=${encodeURIComponent(tag.q)}`)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded cursor-pointer font-medium"
                  >
                    {tag.label}
                  </button>
                ))}
              </div>
            </form>

            {/* Primary Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link
                href="/wizard"
                className="px-6 py-3 bg-terracotta hover:bg-[#98380A] text-white font-bold rounded shadow-hairline transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4 text-orange-200" />
                <span>{t("home.check_eligibility_btn")}</span>
              </Link>
              <Link
                href="/schemes"
                className="px-5 py-3 bg-slate-50 hover:bg-slate-100 text-[#0F1E36] font-semibold rounded border border-hairline transition-all flex items-center justify-center space-x-2 text-xs sm:text-sm cursor-pointer"
              >
                <span>{t("home.browse_schemes_btn")}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
              </Link>
            </div>
          </div>

          {/* Right Column: Live Scheme Dossier Snippet (Concrete Technical Evidence) */}
          <div className="lg:col-span-5">
            <div className="bg-[#FAFBFD] border border-hairline rounded p-5 space-y-4 shadow-hairline">
              <div className="flex justify-between items-start border-b border-hairline pb-3">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Live Verified Record
                  </span>
                  <h3 className="text-base font-bold text-[#0F1E36] mt-1">
                    Pradhan Mantri Kisan Samman Nidhi
                  </h3>
                  <p className="text-[11px] text-slate-500">Ministry of Agriculture &amp; Farmers Welfare</p>
                </div>
                <span className="text-xs font-mono text-slate-400">PM-KISAN</span>
              </div>

              {/* Benefit highlight in tabular numbers */}
              <div className="bg-white border border-hairline rounded p-3 flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">Sovereign Direct Benefit</span>
                  <span className="text-lg font-extrabold text-[#0F1E36] num-tabular">₹6,000 / year</span>
                </div>
                <span className="text-xs text-forest bg-emerald-50 px-2 py-1 rounded font-semibold border border-emerald-200">
                  3 Equal Installments
                </span>
              </div>

              {/* Live Rule AST Check Preview */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Audited Gazette Eligibility Rules:
                </span>
                <div className="space-y-1.5">
                  <div className="flex items-start space-x-2 text-slate-700 bg-white p-2 rounded border border-hairline">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                    <span>Must be a landholding cultivator family owning cultivable land</span>
                  </div>
                  <div className="flex items-start space-x-2 text-slate-700 bg-white p-2 rounded border border-hairline">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                    <span>Excluded if paid Income Tax in the previous assessment year</span>
                  </div>
                  <div className="flex items-start space-x-2 text-slate-700 bg-white p-2 rounded border border-hairline">
                    <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                    <span>Excluded if holding constitutional or senior government positions</span>
                  </div>
                </div>
              </div>

              <div className="pt-1 flex items-center justify-between text-[11px] border-t border-hairline">
                <span className="text-slate-400 font-mono">Gazette: 2019-02-01</span>
                <Link
                  href="/schemes/pradhan-mantri-kisan-samman-nidhi"
                  className="text-civic font-bold hover:underline inline-flex items-center space-x-1"
                >
                  <span>View Full Scheme Dossier</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. CITIZEN JOURNEY WAYFINDER (Linear 4-Step Architecture) */}
      <section className="space-y-4">
        <div className="border-b border-hairline pb-2 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold text-[#0F1E36] tracking-tight">
              {t("home.how_it_works_title")}
            </h2>
            <p className="text-xs text-slate-500">
              {t("home.how_it_works_subtitle")}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">PROCESS 1.0</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Step 1 */}
          <div className="bg-white p-5 rounded border border-hairline shadow-hairline space-y-2 relative">
            <span className="text-xs font-mono font-bold text-slate-400 block">STEP 01</span>
            <h3 className="font-bold text-sm text-[#0F1E36]">{t("home.step1_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step1_desc")}</p>
          </div>

          {/* Step 2 */}
          <div className="bg-white p-5 rounded border border-hairline shadow-hairline space-y-2 relative">
            <span className="text-xs font-mono font-bold text-slate-400 block">STEP 02</span>
            <h3 className="font-bold text-sm text-[#0F1E36]">{t("home.step2_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step2_desc")}</p>
          </div>

          {/* Step 3 */}
          <div className="bg-white p-5 rounded border border-hairline shadow-hairline space-y-2 relative">
            <span className="text-xs font-mono font-bold text-slate-400 block">STEP 03</span>
            <h3 className="font-bold text-sm text-[#0F1E36]">{t("home.step3_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step3_desc")}</p>
          </div>

          {/* Step 4 */}
          <div className="bg-white p-5 rounded border border-hairline shadow-hairline space-y-2 relative">
            <span className="text-xs font-mono font-bold text-slate-400 block">STEP 04</span>
            <h3 className="font-bold text-sm text-[#0F1E36]">{t("home.step4_title")}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t("home.step4_desc")}</p>
          </div>
        </div>
      </section>

      {/* 3. SCHEME DIRECTORY INDEX (High-Utility Public Service Catalogue) */}
      <section className="space-y-4">
        <div className="border-b border-hairline pb-2 flex justify-between items-end">
          <div>
            <h2 className="text-lg font-bold text-[#0F1E36] tracking-tight">
              {t("home.categories_heading")}
            </h2>
            <p className="text-xs text-slate-500">
              Verified Central Government welfare programs by administrative sector
            </p>
          </div>
          <Link
            href="/schemes"
            className="text-xs font-bold text-civic hover:underline flex items-center space-x-1"
          >
            <span>Browse Full Directory</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white border border-hairline rounded overflow-hidden shadow-hairline">
          <div className="divide-y divide-hairline">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const title = cat.label[locale] || cat.label.en;
              const ministry = cat.ministry[locale] || cat.ministry.en;

              return (
                <div
                  key={cat.id}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-start space-x-3.5">
                    <div className="w-9 h-9 rounded bg-slate-100 text-[#0F1E36] flex items-center justify-center shrink-0 mt-0.5 border border-slate-200">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-bold text-sm sm:text-base text-[#0F1E36]">
                          {title}
                        </h3>
                        <span className="text-[10px] font-mono text-slate-400 border border-slate-200 px-1.5 py-0.2 rounded">
                          {cat.highlight}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">{ministry}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end sm:space-x-6 pl-12 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Maximum Sovereign Benefit</span>
                      <span className="text-sm font-bold text-[#0F1E36] num-tabular">{cat.benefit}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Link
                        href={`/wizard?category=${cat.id}`}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded transition-colors"
                      >
                        Check Eligibility
                      </Link>
                      <Link
                        href={`/schemes?category=${cat.id}`}
                        className="p-1.5 text-slate-400 hover:text-[#0F1E36] transition-colors"
                        title="View Schemes"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 4. DETERMINISTIC RULE ENGINE EXPLAINER (AST Logic Safeguard Matrix) */}
      <section className="bg-white border border-hairline rounded p-6 sm:p-8 space-y-6 shadow-hairline">
        <div className="max-w-2xl space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            Civic Architecture
          </span>
          <h2 className="text-xl font-bold text-[#0F1E36] tracking-tight">
            Deterministic AST Logic vs. Black-Box AI Guesswork
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            When a citizen applies for social security or crop assistance, their eligibility must be determined by law, not an AI hallucination.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          {/* Box 1: Why generic chatbots fail */}
          <div className="bg-amber-50/40 border border-amber-200 rounded p-5 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Standard AI Chatbots (High Risk)</span>
            </div>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start space-x-2">
                <span className="text-amber-800 font-bold">•</span>
                <span>Generate subjective, unverified answers that can falsely assure or disqualify citizens.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-800 font-bold">•</span>
                <span>Cannot explain the exact mathematical condition or income threshold that led to a decision.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-amber-800 font-bold">•</span>
                <span>Susceptible to prompt manipulation and out-of-date training data.</span>
              </li>
            </ul>
          </div>

          {/* Box 2: How SchemeSaathi deterministic rules protect */}
          <div className="bg-emerald-50/40 border border-emerald-200 rounded p-5 space-y-3 text-xs">
            <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>SchemeSaathi Rule AST Engine (Guaranteed)</span>
            </div>
            <ul className="space-y-2 text-slate-700">
              <li className="flex items-start space-x-2">
                <span className="text-emerald-800 font-bold">•</span>
                <span>Official gazette guidelines are codified into strict mathematical and Boolean rule trees.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-800 font-bold">•</span>
                <span>Distinguishes missing information from disqualification: never rejects simply because an optional field was skipped.</span>
              </li>
              <li className="flex items-start space-x-2">
                <span className="text-emerald-800 font-bold">•</span>
                <span>Itemizes every satisfied, failed, and missing condition for complete administrative auditability.</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-1">
          <Link
            href="/wizard"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-civic hover:underline"
          >
            <span>Test the Guided Eligibility Wizard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 5. MULTILINGUAL AI ASSISTANT & CITATION TRANSPARENCY */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        <div className="lg:col-span-6 space-y-4">
          <span className="text-xs font-bold uppercase tracking-wider text-civic bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
            Multilingual Assistance
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-[#0F1E36] tracking-tight">
            Understand Complex Schemes in English, Hindi, or Kannada
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Government circulars are written in formal administrative jargon. SchemeSaathi translates rules into clear, respectful language and backs every factual statement with official gazette citations.
          </p>

          <div className="space-y-2 text-xs text-slate-700 pt-1">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
              <span>Strict evidence grounding: answers only cite verified government circulars.</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
              <span>Explains exclusion rules clearly (e.g. income tax criteria, institutional landholders).</span>
            </div>
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-4 h-4 text-forest shrink-0 mt-0.5" />
              <span>Transparently abstains when official data is incomplete instead of hallucinating.</span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              href="/assistant"
              className="inline-flex items-center space-x-2 px-5 py-2.5 bg-[#0F1E36] hover:bg-[#162842] text-white font-bold rounded text-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-orange-300" />
              <span>Open Multilingual AI Assistant</span>
            </Link>
          </div>
        </div>

        {/* Live Conversation Sample Card */}
        <div className="lg:col-span-6">
          <div className="bg-white border border-hairline rounded p-5 space-y-4 shadow-hairline">
            <div className="flex items-center justify-between border-b border-hairline pb-2.5">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-bold text-[#0F1E36]">Query Verification Sample</span>
              </div>
              <span className="text-[10px] text-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
                Gazette Grounded
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded text-slate-800 font-semibold border border-hairline">
                &quot;Who is excluded from PM-KISAN benefits?&quot;
              </div>

              <div className="bg-[#FAFBFD] p-3.5 rounded border border-hairline text-slate-700 space-y-2 leading-relaxed">
                <p>
                  According to official operational guidelines, institutional landholders, farmer families where any member holds constitutional posts, retired or serving government officers, professionals (doctors, lawyers, engineers), and anyone who paid income tax in the last assessment year are strictly excluded.
                </p>
                <div className="pt-1 text-[11px] text-civic font-bold flex items-center space-x-1 border-t border-hairline">
                  <span>Source: MoA&amp;FW Gazette Reference (2019-02-01)</span>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. DOCUMENT READINESS CENTER SPOTLIGHT */}
      <section className="bg-white border border-hairline rounded p-6 sm:p-8 space-y-6 shadow-hairline">
        <div className="max-w-2xl space-y-1.5">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            Application Readiness
          </span>
          <h2 className="text-xl font-bold text-[#0F1E36] tracking-tight">
            Prepare Your Documents Before Visiting Taluk Offices or CSC Centers
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Most welfare applications are delayed due to mismatched documents or missing revenue certificates. Review statutory issuing authorities, turnaround times, and keep a personal checklist locally.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="bg-[#FAFBFD] p-4 rounded border border-hairline space-y-1">
            <span className="font-bold text-[#0F1E36] block">Personal Local Checklist</span>
            <p className="text-slate-600">Track which certificates you possess and which ones you still need to obtain from local revenue or panchayat offices.</p>
          </div>
          <div className="bg-[#FAFBFD] p-4 rounded border border-hairline space-y-1">
            <span className="font-bold text-[#0F1E36] block">Zero Document Uploads</span>
            <p className="text-slate-600">Your readiness state is stored locally on your device. We never request or store sensitive Aadhaar scans or identity files.</p>
          </div>
          <div className="bg-[#FAFBFD] p-4 rounded border border-hairline space-y-1">
            <span className="font-bold text-[#0F1E36] block">Officially Accepted Alternatives</span>
            <p className="text-slate-600">See recognized alternative certificates (e.g. Kisan Credit Card, Voter ID, Ration Card) when a specific proof is unavailable.</p>
          </div>
        </div>

        <div>
          <Link
            href="/documents"
            className="inline-flex items-center space-x-1.5 text-xs font-bold text-civic hover:underline"
          >
            <span>Open Document Readiness Center &amp; Checklist</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </section>

      {/* 7. FREQUENTLY ASKED QUESTIONS (Authentic Civic Information) */}
      <section className="space-y-4 max-w-3xl mx-auto">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-[#0F1E36] tracking-tight">
            {t("home.faq_title")}
          </h2>
          <p className="text-xs text-slate-500">
            Clear, honest answers regarding data privacy, fees, and government approvals.
          </p>
        </div>

        <div className="space-y-2 pt-2">
          {faqs.map((faq, index) => {
            const isOpen = openFaq === index;
            return (
              <div
                key={index}
                className="bg-white rounded border border-hairline overflow-hidden shadow-hairline"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : index)}
                  className="w-full p-4 text-left flex justify-between items-center space-x-3 cursor-pointer hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-xs sm:text-sm text-[#0F1E36]">{faq.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-500 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <div className="p-4 pt-0 text-xs text-slate-600 leading-relaxed border-t border-hairline bg-[#FAFBFD]">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* 8. RESTRAINED PUBLIC SERVICE FINAL CTA */}
      <section className="bg-[#0F1E36] text-white rounded p-8 sm:p-10 text-center space-y-5 shadow-panel">
        <div className="max-w-xl mx-auto space-y-2">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
            {t("home.final_cta_title")}
          </h2>
          <p className="text-xs text-slate-300 leading-relaxed">
            {t("home.final_cta_desc")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-3">
          <Link
            href="/wizard"
            className="px-6 py-3 bg-terracotta hover:bg-[#98380A] text-white font-bold rounded text-xs transition-colors shadow-hairline"
          >
            <span>{t("home.check_eligibility_btn")}</span>
          </Link>
          <Link
            href="/schemes"
            className="px-6 py-3 bg-[#162842] hover:bg-[#1E3456] text-slate-200 font-semibold rounded border border-slate-700 text-xs transition-colors"
          >
            <span>{t("home.browse_schemes_btn")}</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
