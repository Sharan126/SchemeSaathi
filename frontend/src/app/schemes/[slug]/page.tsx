"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { fetchSchemeBySlug } from "@/lib/api";
import { Scheme } from "@/types";
import {
  ArrowLeft,
  ShieldCheck,
  ExternalLink,
  Coins,
  CheckCircle2,
  FileText,
  ListOrdered,
  Building,
  Calendar,
  Layers,
  HelpCircle
} from "lucide-react";

export default function SchemeDetailPage() {
  const { t, locale } = useLanguage();
  const params = useParams();
  const slug = params?.slug as string;

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"benefits" | "criteria" | "documents" | "apply">("benefits");

  useEffect(() => {
    async function load() {
      if (slug) {
        setLoading(true);
        const data = await fetchSchemeBySlug(slug);
        setScheme(data);
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-slate-500">Loading scheme verified details...</p>
      </div>
    );
  }

  if (!scheme) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
        <h2 className="text-xl font-bold text-slate-800">Scheme Not Found</h2>
        <p className="text-sm text-slate-500">We could not locate the requested scheme.</p>
        <Link
          href="/schemes"
          className="inline-flex items-center space-x-1 text-sm font-semibold text-gov-blue underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t("details.back_to_schemes")}</span>
        </Link>
      </div>
    );
  }

  const title = scheme.title[locale] || scheme.title.en;
  const fullDesc = scheme.full_description[locale] || scheme.full_description.en;

  return (
    <div className="space-y-8 py-2">
      {/* Back button */}
      <div>
        <Link
          href="/schemes"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("details.back_to_schemes")}</span>
        </Link>
      </div>

      {/* Scheme Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md uppercase tracking-wider">
            {scheme.category.replace(/_/g, " ")}
          </span>
          <span className="inline-flex items-center space-x-1 text-xs font-medium text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Verified Version {scheme.version_number}</span>
          </span>
          <span className="text-xs text-slate-400 font-medium">
            Funding: {scheme.funding_type.replace(/_/g, " ")}
          </span>
        </div>

        <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight leading-snug">
          {title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2 text-xs text-slate-600 border-t border-slate-100">
          <div className="flex items-center space-x-2">
            <Building className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Ministry</span>
              <span className="font-medium text-slate-800">{scheme.ministry}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Gazette Date</span>
              <span className="font-medium text-slate-800">{scheme.source_reference_date}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Application Mode</span>
              <span className="font-medium text-slate-800">{scheme.application_mode}</span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
            <div>
              <span className="block text-[10px] text-slate-400 uppercase font-semibold">Official Portal</span>
              <a
                href={scheme.official_portal_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-gov-blue hover:underline truncate block max-w-[160px]"
              >
                Visit Portal
              </a>
            </div>
          </div>
        </div>

        <p className="text-slate-700 text-sm sm:text-base leading-relaxed pt-2">
          {fullDesc}
        </p>

        {/* Action Button */}
        <div className="pt-2">
          <Link
            href={`/wizard?scheme=${scheme.id}`}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-gov-green hover:bg-emerald-700 text-white font-semibold rounded-lg text-sm shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{t("details.check_my_eligibility")}</span>
          </Link>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex space-x-4">
        {[
          { id: "benefits", label: t("details.benefits_tab"), icon: Coins },
          { id: "criteria", label: t("details.criteria_tab"), icon: HelpCircle },
          { id: "documents", label: t("details.documents_tab"), icon: FileText },
          { id: "apply", label: t("details.how_to_apply_tab"), icon: ListOrdered },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center space-x-2 py-3 px-1 border-b-2 font-medium text-sm transition-colors cursor-pointer ${
                isActive
                  ? "border-gov-blue text-gov-blue font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-800 hover:border-slate-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Benefits */}
      {activeTab === "benefits" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheme.benefits?.map((b, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 space-y-2">
              <span className="text-[10px] uppercase font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                {b.benefit_type.replace(/_/g, " ")} • {b.frequency}
              </span>
              <h3 className="font-bold text-base text-slate-900">
                {b.amount_description[locale] || b.amount_description.en}
              </h3>
              {b.max_monetary_value && (
                <p className="text-xs text-slate-500">
                  Maximum Sovereign Value: ₹{b.max_monetary_value.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Deterministic Criteria */}
      {activeTab === "criteria" && (
        <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
          <div className="p-4 bg-slate-50 text-xs font-semibold text-slate-700">
            Deterministic Eligibility Rules (Evaluated via AST Engine — Zero Hallucinations)
          </div>
          {scheme.criteria?.map((c, idx) => (
            <div key={idx} className="p-4 flex items-start space-x-3">
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                {idx + 1}
              </div>
              <div className="space-y-1 flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-sm text-slate-900">
                    {c.explanation[locale] || c.explanation.en}
                  </span>
                  {c.is_mandatory && (
                    <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded font-medium border border-red-200">
                      Mandatory
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-xs text-slate-400">
                  <span>Field: <code className="text-slate-600 bg-slate-100 px-1 rounded">{c.field_name}</code></span>
                  <span>•</span>
                  <span>Rule Type: {c.criterion_type}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Required Documents */}
      {activeTab === "documents" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheme.documents?.map((doc, idx) => (
            <div key={idx} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm text-slate-900">
                  {doc.document_name[locale] || doc.document_name.en}
                </h3>
                {doc.is_mandatory ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                    Mandatory
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-semibold">
                    Optional
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-600 space-y-1">
                <p>
                  <span className="font-semibold text-slate-800">{t("details.issuing_authority")}: </span>
                  {doc.issuing_authority[locale] || doc.issuing_authority.en}
                </p>
                {doc.alternatives?.length > 0 && (
                  <p>
                    <span className="font-semibold text-slate-800">{t("details.alternatives")}: </span>
                    {doc.alternatives.join(", ")}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 4: How to Apply */}
      {activeTab === "apply" && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-base text-slate-900">Official Step-by-Step Procedure</h3>
            <p className="text-xs text-slate-500">Follow the designated workflow as approved by the ministry:</p>
          </div>
          <ol className="relative border-l border-slate-200 ml-3 space-y-6">
            {scheme.application_steps?.map((step) => {
              const text = (step as any)[locale] || step.en;
              return (
                <li key={step.step} className="ml-6 space-y-1">
                  <span className="absolute -left-3 flex items-center justify-center w-6 h-6 bg-gov-navy text-white rounded-full text-xs font-bold">
                    {step.step}
                  </span>
                  <p className="text-sm font-medium text-slate-800 leading-relaxed">
                    {text}
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Apply via official government channel:</span>
            <a
              href={scheme.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1 px-4 py-2 bg-gov-blue text-white text-xs font-semibold rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span>{t("details.official_portal")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Citation & Provenance Drawer */}
      <div className="bg-slate-100/70 border border-slate-200 rounded-xl p-4 text-xs text-slate-600 space-y-2">
        <div className="flex items-center space-x-2 font-semibold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Official Source & Verification Provenance</span>
        </div>
        <p className="leading-relaxed">
          Record verified on <span className="font-semibold text-slate-800">{scheme.source_reference_date}</span> against official notifications.
          {scheme.gazette_notification_url && (
            <a
              href={scheme.gazette_notification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-gov-blue hover:underline ml-1 inline-flex items-center space-x-0.5"
            >
              <span>View Gazette Circular</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </p>
        {scheme.source_document_hash && (
          <p className="font-mono text-[11px] text-slate-400 truncate">
            SHA-256 Checksum: {scheme.source_document_hash}
          </p>
        )}
      </div>
    </div>
  );
}
