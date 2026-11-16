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
  Mic,
} from "lucide-react";

export default function HomePage() {
  const { t, locale } = useLanguage();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/schemes?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push("/schemes");
    }
  };

  const categories = [
    { id: "agriculture", label: { en: "Agriculture & Farmers", hi: "कृषि एवं किसान", kn: "ಕೃಷಿ ಮತ್ತು ರೈತರು" }, icon: Sprout, count: "PM-KISAN" },
    { id: "health", label: { en: "Healthcare & Insurance", hi: "स्वास्थ्य एवं चिकित्सा", kn: "ಆರೋಗ್ಯ ಮತ್ತು ವೈದ್ಯಕೀಯ" }, icon: HeartPulse, count: "PM-JAY" },
    { id: "women_and_child", label: { en: "Women & Child Care", hi: "महिला एवं बाल विकास", kn: "ಮಹಿಳಾ ಮತ್ತು ಮಕ್ಕಳ ಕಲ್ಯಾಣ" }, icon: HeartHandshake, count: "PMMVY / SSY" },
    { id: "education", label: { en: "Education & Scholarships", hi: "शिक्षा एवं छात्रवृत्ति", kn: "ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ" }, icon: GraduationCap, count: "PMS-SC" },
    { id: "housing", label: { en: "Rural Housing", hi: "ग्रामीण आवास", kn: "ಗ್ರಾಮೀಣ ವಸತಿ" }, icon: Home, count: "PMAY-G" },
    { id: "social_security", label: { en: "Social Security & Pension", hi: "सामाजिक सुरक्षा एवं पेंशन", kn: "ಸಾಮಾಜಿಕ ಭದ್ರತೆ" }, icon: Users, count: "NSAP" },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-2xl p-6 sm:p-12 shadow-xl border border-slate-800 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-green-500/10 blur-3xl pointer-events-none" />

        <div className="max-w-3xl relative z-10 space-y-6">
          <div className="inline-flex items-center space-x-2 bg-slate-800/80 border border-slate-700 px-3 py-1 rounded-full text-xs text-emerald-400 font-medium">
            <ShieldCheck className="w-4 h-4" />
            <span>100% Official Source Citations • Verified Gazette Data</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            {t("home.hero_title")}
          </h1>

          <p className="text-slate-300 text-base sm:text-lg leading-relaxed">
            {t("home.hero_subtitle")}
          </p>

          {/* Quick Search Box */}
          <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2 pt-2">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("home.search_placeholder")}
                className="w-full pl-11 pr-4 py-3 bg-white text-slate-900 rounded-lg shadow-sm border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base font-normal placeholder:text-slate-400"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-gov-saffron hover:bg-orange-600 text-white font-semibold rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm sm:text-base cursor-pointer"
            >
              <span>{t("assistant.send_btn")}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Primary Action Buttons */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-2">
            <Link
              href="/voice"
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <Mic className="w-5 h-5 text-amber-100 animate-pulse" />
              <span>
                {locale === "kn"
                  ? "ಧ್ವನಿ ಮೂಲಕ ಮಾತನಾಡಿ"
                  : locale === "hi"
                  ? "बोलकर पूछें (आवाज़)"
                  : "Speak with Voice AI"}
              </span>
            </Link>
            <Link
              href="/wizard"
              className="px-6 py-3 bg-gov-green hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <CheckCircle2 className="w-5 h-5 text-emerald-200" />
              <span>{t("home.check_eligibility_btn")}</span>
            </Link>
            <Link
              href="/schemes"
              className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg border border-slate-700 transition-all flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <span>{t("home.browse_schemes_btn")}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Categories Grid */}
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

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const title = cat.label[locale] || cat.label.en;
            return (
              <Link
                key={cat.id}
                href={`/schemes?category=${cat.id}`}
                className="bg-white p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col items-center text-center space-y-2 group"
              >
                <div className="w-12 h-12 rounded-full bg-blue-50 text-gov-blue flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="font-semibold text-xs sm:text-sm text-slate-800 group-hover:text-blue-600 line-clamp-2">
                  {title}
                </h3>
                <span className="text-[11px] text-slate-400 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                  {cat.count}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Core Principles & Guarantees */}
      <section className="bg-slate-100/70 border border-slate-200 rounded-2xl p-6 sm:p-10 space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("home.principles_heading")}
          </h2>
          <p className="text-sm text-slate-600">
            Engineered with strict safety guardrails for millions of Indian citizens
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t("home.rule_engine_title")}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("home.rule_engine_desc")}
            </p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-slate-900">
              {t("home.privacy_title")}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {t("home.privacy_desc")}
            </p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center">
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
    </div>
  );
}
