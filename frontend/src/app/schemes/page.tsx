"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { fetchSchemes } from "@/lib/api";
import { Scheme } from "@/types";
import {
  Search,
  Building,
  ShieldCheck,
  ArrowRight,
  Tag,
  Coins,
  CheckCircle2,
  Calendar,
  Filter,
  Users,
  RotateCcw,
} from "lucide-react";

function SchemesContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const initialCat = searchParams.get("category") || "";
  const initialQ = searchParams.get("q") || "";

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(initialCat);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState("");
  const [selectedScope, setSelectedScope] = useState("all");
  const [searchQuery, setSearchQuery] = useState(initialQ);

  const categories = [
    { id: "", label: t("schemes.all_categories") },
    { id: "agriculture", label: locale === "hi" ? "कृषि एवं किसान" : locale === "kn" ? "ಕೃಷಿ ಮತ್ತು ರೈತರು" : "Agriculture" },
    { id: "health", label: locale === "hi" ? "स्वास्थ्य एवं चिकित्सा" : locale === "kn" ? "ಆರೋಗ್ಯ ಮತ್ತು ವೈದ್ಯಕೀಯ" : "Health & Insurance" },
    { id: "women_and_child", label: locale === "hi" ? "महिला एवं बाल" : locale === "kn" ? "ಮಹಿಳೆ ಮತ್ತು ಮಕ್ಕಳು" : "Women & Child" },
    { id: "education", label: locale === "hi" ? "शिक्षा एवं छात्रवृत्ति" : locale === "kn" ? "ಶಿಕ್ಷಣ ಮತ್ತು ವಿದ್ಯಾರ್ಥಿವೇತನ" : "Education" },
    { id: "housing", label: locale === "hi" ? "ग्रामीण आवास" : locale === "kn" ? "ಗ್ರಾಮೀಣ ವಸತಿ" : "Housing" },
    { id: "social_security", label: locale === "hi" ? "सामाजिक सुरक्षा" : locale === "kn" ? "ಸಾಮಾಜಿಕ ಭದ್ರತೆ" : "Social Security" },
    { id: "disability_empowerment", label: locale === "hi" ? "दिव्यांगजन" : locale === "kn" ? "ದಿವ್ಯಾಂಗಜನ" : "Divyangjan" },
  ];

  const beneficiaries = [
    { id: "", label: t("schemes.all_beneficiaries") },
    { id: "farmers", label: locale === "hi" ? "किसान" : locale === "kn" ? "ರೈತರು" : "Farmers" },
    { id: "women", label: locale === "hi" ? "महिलाएं" : locale === "kn" ? "ಮಹಿಳೆಯರು" : "Women" },
    { id: "students", label: locale === "hi" ? "छात्र" : locale === "kn" ? "ವಿದ್ಯಾರ್ಥಿಗಳು" : "Students" },
    { id: "senior_citizens", label: locale === "hi" ? "वरिष्ठ नागरिक" : locale === "kn" ? "ಹಿರಿಯ ನಾಗರಿಕರು" : "Senior Citizens" },
    { id: "divyangjan", label: locale === "hi" ? "दिव्यांगजन" : locale === "kn" ? "ದಿವ್ಯಾಂಗರು" : "Divyangjan" },
    { id: "rural", label: locale === "hi" ? "ग्रामीण परिवार" : locale === "kn" ? "ಗ್ರಾಮೀಣ ಕುಟುಂಬಗಳು" : "Rural / Low Income" },
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

  // Client-side filtering for Scope and Beneficiary
  const filteredSchemes = schemes.filter((scheme) => {
    if (selectedBeneficiary) {
      const match = scheme.target_beneficiaries?.some((b) =>
        b.toLowerCase().includes(selectedBeneficiary.toLowerCase())
      );
      if (!match) return false;
    }
    if (selectedScope === "central") {
      const funding = scheme.funding_type?.toUpperCase() || "";
      if (!funding.includes("CENTRAL")) return false;
    } else if (selectedScope === "state") {
      const funding = scheme.funding_type?.toUpperCase() || "";
      if (funding.includes("CENTRAL_SECTOR")) return false;
    }
    return true;
  });

  const clearAllFilters = () => {
    setSelectedCategory("");
    setSelectedBeneficiary("");
    setSelectedScope("all");
    setSearchQuery("");
  };

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div className="space-y-1.5 border-b border-hairline pb-4">
        <div className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded text-[11px] font-semibold border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" />
          <span>Official Gazette Archive • 8 Audited Schemes</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] tracking-tight">
          {t("schemes.title")}
        </h1>
        <p className="text-slate-600 text-xs sm:text-sm max-w-2xl">
          {t("schemes.subtitle")}
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-5 rounded border border-hairline shadow-hairline space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t("home.search_placeholder")}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-hairline rounded text-xs sm:text-sm text-[#0F1E36] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0F1E36] focus:bg-white"
          />
        </div>

        {/* Level Toggle: Central vs State */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-hairline text-xs">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-700">{t("schemes.filter_scope")}:</span>
            <div className="flex bg-slate-100 p-0.5 rounded border border-slate-200">
              <button
                onClick={() => setSelectedScope("all")}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  selectedScope === "all" ? "bg-white text-[#0F1E36] shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("schemes.all_scopes")}
              </button>
              <button
                onClick={() => setSelectedScope("central")}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  selectedScope === "central" ? "bg-white text-[#0F1E36] shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("schemes.central_gov")}
              </button>
              <button
                onClick={() => setSelectedScope("state")}
                className={`px-3 py-1 rounded text-xs font-semibold cursor-pointer transition-colors ${
                  selectedScope === "state" ? "bg-white text-[#0F1E36] shadow-sm" : "text-slate-600 hover:text-slate-900"
                }`}
              >
                {t("schemes.state_gov")}
              </button>
            </div>
          </div>

          {(selectedCategory || selectedBeneficiary || selectedScope !== "all" || searchQuery) && (
            <button
              onClick={clearAllFilters}
              className="text-xs text-slate-500 hover:text-[#0F1E36] font-semibold inline-flex items-center space-x-1 cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset all filters</span>
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {t("schemes.filter_category")}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#0F1E36] text-white shadow-sm"
                      : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                  }`}
                >
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Beneficiary Filter Pills */}
        <div className="space-y-1.5 pt-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
            {t("schemes.filter_beneficiary")}:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {beneficiaries.map((b) => {
              const isSelected = selectedBeneficiary === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setSelectedBeneficiary(b.id)}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? "bg-civic text-white shadow-sm"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {b.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Results Count & Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-6 h-6 border-2 border-[#0F1E36] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-500">Loading verified government schemes...</p>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div className="bg-white rounded border border-hairline p-10 text-center space-y-2 shadow-hairline">
          <p className="text-slate-800 font-bold text-sm">{t("schemes.no_results")}</p>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting search terms, clearing category filters, or selecting &quot;All Levels&quot;.
          </p>
          <button
            onClick={clearAllFilters}
            className="text-xs text-civic font-bold underline cursor-pointer pt-2"
          >
            Clear all filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex justify-between items-center text-xs text-slate-500 px-1">
            <span>Showing <strong className="text-[#0F1E36] font-bold">{filteredSchemes.length}</strong> official welfare schemes</span>
            <span className="font-mono text-[11px]">SORTED BY RELEVANCE</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSchemes.map((scheme) => {
              const title = scheme.title[locale] || scheme.title.en;
              const shortDesc = scheme.short_description[locale] || scheme.short_description.en;
              const benefit = scheme.benefits?.[0]?.amount_description?.[locale] || scheme.benefits?.[0]?.amount_description?.en;

              return (
                <div
                  key={scheme.id}
                  className="bg-white rounded border border-hairline hover:border-slate-400 hover:shadow-panel transition-all flex flex-col justify-between overflow-hidden group"
                >
                  <div className="p-5 space-y-3">
                    {/* Category & Badge */}
                    <div className="flex justify-between items-start gap-2">
                      <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
                        {scheme.category.replace(/_/g, " ")}
                      </span>
                      <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-forest" />
                        <span>Verified v{scheme.version_number}</span>
                      </span>
                    </div>

                    {/* Scheme Title */}
                    <h3 className="font-bold text-sm sm:text-base text-[#0F1E36] group-hover:text-civic transition-colors line-clamp-2 leading-snug">
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

                    {/* Key Benefit Highlight in tabular figures */}
                    {benefit && (
                      <div className="bg-[#FAFBFD] border border-hairline rounded p-3 flex items-start space-x-2">
                        <Coins className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block">
                            {t("schemes.benefits_label")}
                          </span>
                          <p className="text-xs text-[#0F1E36] font-bold num-tabular leading-tight mt-0.5">
                            {benefit}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Target Beneficiaries */}
                    {scheme.target_beneficiaries && scheme.target_beneficiaries.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-1">
                        {scheme.target_beneficiaries.map((b) => (
                          <span
                            key={b}
                            className="text-[10px] font-medium text-slate-600 bg-slate-50 border border-slate-200 px-1.5 py-0.2 rounded"
                          >
                            {b}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Card Action Footer */}
                  <div className="px-5 py-3 bg-slate-50 border-t border-hairline flex items-center justify-between gap-2">
                    <Link
                      href={`/wizard?scheme=${scheme.slug}`}
                      className="text-xs font-bold text-forest hover:text-emerald-900 transition-colors inline-flex items-center space-x-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{t("schemes.check_eligibility")}</span>
                    </Link>

                    <Link
                      href={`/schemes/${scheme.slug}`}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-civic hover:text-blue-900 transition-colors"
                    >
                      <span>{t("schemes.view_details")}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default function SchemesPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-500">Loading Schemes Catalogue...</div>}>
      <SchemesContent />
    </Suspense>
  );
}
