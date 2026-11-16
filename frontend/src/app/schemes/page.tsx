"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { fetchSchemes } from "@/lib/api";
import { Scheme } from "@/types";
import { Search, Building, ShieldCheck, ArrowRight, Tag, Coins } from "lucide-react";

function SchemesContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category") || "";
  const initialQ = searchParams.get("q") || "";

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [searchQuery, setSearchQuery] = useState(initialQ);

  const categories = [
    { id: "", label: t("schemes.all_categories") },
    { id: "agriculture", label: locale === "hi" ? "कृषि" : locale === "kn" ? "ಕೃಷಿ" : "Agriculture" },
    { id: "health", label: locale === "hi" ? "स्वास्थ्य" : locale === "kn" ? "ಆರೋಗ್ಯ" : "Health" },
    { id: "women_and_child", label: locale === "hi" ? "महिला एवं बाल" : locale === "kn" ? "ಮಹಿಳೆ ಮತ್ತು ಮಕ್ಕಳು" : "Women & Child" },
    { id: "education", label: locale === "hi" ? "शिक्षा" : locale === "kn" ? "ಶಿಕ್ಷಣ" : "Education" },
    { id: "housing", label: locale === "hi" ? "आवास" : locale === "kn" ? "ವಸತಿ" : "Housing" },
    { id: "social_security", label: locale === "hi" ? "सामाजिक सुरक्षा" : locale === "kn" ? "ಸಾಮಾಜಿಕ ಭದ್ರತೆ" : "Social Security" },
    { id: "disability_empowerment", label: locale === "hi" ? "दिव्यांगजन" : locale === "kn" ? "ದಿವ್ಯಾಂಗಜನ" : "Divyangjan" },
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchSchemes({
        category: selectedCategory || undefined,
        q: searchQuery || undefined,
        locale,
      });
      setSchemes(data);
      setLoading(false);
    }
    load();
  }, [selectedCategory, searchQuery, locale]);

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t("schemes.title")}
        </h1>
        <p className="text-slate-600 text-sm sm:text-base max-w-2xl">
          {t("schemes.subtitle")}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("home.search_placeholder")}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-slate-900 text-white shadow-sm"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Results Count & Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading verified government schemes...</p>
        </div>
      ) : schemes.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <p className="text-slate-600 font-medium">{t("schemes.no_results")}</p>
          <button
            onClick={() => { setSelectedCategory(""); setSearchQuery(""); }}
            className="text-xs text-gov-blue font-semibold underline cursor-pointer"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schemes.map((scheme) => {
            const title = scheme.title[locale] || scheme.title.en;
            const shortDesc = scheme.short_description[locale] || scheme.short_description.en;
            const benefit = scheme.benefits?.[0]?.amount_description?.[locale] || scheme.benefits?.[0]?.amount_description?.en;

            return (
              <div
                key={scheme.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-5 space-y-3">
                  {/* Category & Badge */}
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
                      {scheme.category.replace(/_/g, " ")}
                    </span>
                    <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified v{scheme.version_number}</span>
                    </span>
                  </div>

                  {/* Scheme Title */}
                  <h3 className="font-bold text-base text-slate-900 group-hover:text-gov-blue transition-colors line-clamp-2">
                    {title}
                  </h3>

                  {/* Ministry */}
                  <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                    <Building className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span className="truncate">{scheme.ministry}</span>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {shortDesc}
                  </p>

                  {/* Key Benefit Highlight */}
                  {benefit && (
                    <div className="bg-amber-50/70 border border-amber-200/60 rounded-lg p-2.5 flex items-start space-x-2">
                      <Coins className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-semibold text-amber-900 uppercase tracking-wide block">
                          {t("schemes.benefits_label")}
                        </span>
                        <p className="text-xs text-amber-900 font-medium">
                          {benefit}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Link */}
                <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                  <span className="text-[11px] text-slate-400">
                    Ref: {scheme.source_reference_date}
                  </span>
                  <Link
                    href={`/schemes/${scheme.slug}`}
                    className="inline-flex items-center space-x-1 text-xs font-semibold text-gov-blue hover:text-blue-800 transition-colors"
                  >
                    <span>{t("schemes.view_details")}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function SchemesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-sm text-slate-500">Loading Schemes...</div>}>
      <SchemesContent />
    </Suspense>
  );
}
