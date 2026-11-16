"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { fetchSchemeBySlug } from "@/lib/api";
import { Scheme } from "@/types";
import { SchemeReadinessTracker } from "@/components/SchemeReadinessTracker";
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
  HelpCircle,
  Users,
  AlertCircle,
  RotateCcw,
} from "lucide-react";

export default function SchemeDetailPage() {
  const { t, locale } = useLanguage();
  const params = useParams();
  const slug = params?.slug as string;

  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<"readiness" | "benefits" | "criteria" | "documents" | "apply">("readiness");

  const loadData = async () => {
    if (slug) {
      setLoading(true);
      setError(false);
      try {
        const data = await fetchSchemeBySlug(slug);
        if (data) {
          setScheme(data);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    loadData();
  }, [slug]);

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <div className="w-6 h-6 border-2 border-[#0F1E36] border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-xs text-slate-500">Loading verified scheme guidelines...</p>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="bg-white rounded border border-hairline p-10 text-center space-y-4 max-w-lg mx-auto my-12 shadow-hairline">
        <AlertCircle className="w-8 h-8 text-amber-600 mx-auto" />
        <h2 className="text-lg font-bold text-[#0F1E36]">Scheme Information Unavailable</h2>
        <p className="text-xs text-slate-600">
          We could not load verified records for &quot;{slug}&quot;. Please check the link or browse our full directory.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <button
            onClick={loadData}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <Link
            href="/schemes"
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-[#0F1E36] hover:bg-[#162842] text-white text-xs font-semibold rounded"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>{t("details.back_to_schemes")}</span>
          </Link>
        </div>
      </div>
    );
  }

  const title = scheme.title[locale] || scheme.title.en;
  const fullDesc = scheme.full_description[locale] || scheme.full_description.en;

  return (
    <div className="space-y-6 py-2">
      {/* Back button */}
      <div>
        <Link
          href="/schemes"
          className="inline-flex items-center space-x-1 text-xs font-semibold text-slate-500 hover:text-[#0F1E36] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>{t("details.back_to_schemes")}</span>
        </Link>
      </div>

      {/* Scheme Dossier Header Card */}
      <div className="bg-white rounded border border-hairline p-6 sm:p-8 shadow-hairline space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded uppercase tracking-wider">
            {scheme.category.replace(/_/g, " ")}
          </span>
          <span className="inline-flex items-center space-x-1 text-[10px] font-bold text-forest bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-forest" />
            <span>Verified Gazette Record (v{scheme.version_number})</span>
          </span>
          <span className="text-xs text-slate-500 font-mono">
            Funding: {scheme.funding_type.replace(/_/g, " ")}
          </span>
        </div>

        <h1 className="text-xl sm:text-3xl font-extrabold text-[#0F1E36] tracking-tight leading-snug">
          {title}
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 text-xs text-slate-600 border-t border-hairline">
          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Ministry / Department</span>
            <span className="font-bold text-[#0F1E36]">{scheme.ministry}</span>
          </div>

          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Gazette Date</span>
            <span className="font-bold text-[#0F1E36] font-mono">{scheme.source_reference_date}</span>
          </div>

          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Application Mode</span>
            <span className="font-bold text-[#0F1E36]">{scheme.application_mode}</span>
          </div>

          <div className="space-y-0.5">
            <span className="block text-[10px] text-slate-400 uppercase font-semibold">Official Portal</span>
            <a
              href={scheme.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-bold text-civic hover:underline truncate block"
            >
              Open Ministry Portal ↗
            </a>
          </div>
        </div>

        <p className="text-slate-700 text-xs sm:text-sm leading-relaxed pt-1">
          {fullDesc}
        </p>

        {/* Target Beneficiaries Pills */}
        {scheme.target_beneficiaries && scheme.target_beneficiaries.length > 0 && (
          <div className="flex items-center space-x-2 pt-1 text-xs">
            <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-700">{t("details.who_can_apply")}:</span>
            <div className="flex flex-wrap gap-1">
              {scheme.target_beneficiaries.map((b) => (
                <span
                  key={b}
                  className="bg-slate-50 border border-slate-200 text-slate-700 font-medium px-2 py-0.2 rounded text-[11px] capitalize"
                >
                  {b.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="pt-2 flex flex-wrap gap-3">
          <Link
            href={`/wizard?scheme=${scheme.slug}`}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-terracotta hover:bg-[#98380A] text-white font-bold rounded text-xs shadow-hairline transition-colors"
          >
            <CheckCircle2 className="w-4 h-4 text-orange-200" />
            <span>{t("details.check_my_eligibility")}</span>
          </Link>
          <a
            href={scheme.official_portal_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-semibold rounded text-xs transition-colors border border-hairline"
          >
            <span>{t("details.official_portal")}</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </a>
        </div>
      </div>

      {/* Tabs Navigation (Editorial Bottom-Border Ink Marker) */}
      <div className="border-b border-hairline flex space-x-2 sm:space-x-4 overflow-x-auto">
        {[
          { id: "readiness", label: t("details.readiness_tab"), icon: CheckCircle2 },
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
              className={`flex items-center space-x-2 py-2.5 px-2 border-b-2 font-semibold text-xs transition-colors cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-[#0F1E36] text-[#0F1E36] font-bold"
                  : "border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 0: Readiness Tracker */}
      {activeTab === "readiness" && (
        <SchemeReadinessTracker scheme={scheme} />
      )}

      {/* Tab 1: Benefits */}
      {activeTab === "benefits" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheme.benefits?.map((b, idx) => (
            <div key={idx} className="bg-white p-5 rounded border border-hairline space-y-2 shadow-hairline">
              <span className="text-[10px] uppercase font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {b.benefit_type.replace(/_/g, " ")} • {b.frequency}
              </span>
              <h3 className="font-bold text-base text-[#0F1E36] num-tabular">
                {b.amount_description[locale] || b.amount_description.en}
              </h3>
              {b.max_monetary_value && (
                <p className="text-xs text-slate-500 font-mono">
                  Maximum Sovereign Value: ₹{b.max_monetary_value.toLocaleString("en-IN")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Tab 2: Deterministic Criteria */}
      {activeTab === "criteria" && (
        <div className="bg-white rounded border border-hairline divide-y divide-hairline overflow-hidden shadow-hairline">
          <div className="p-3.5 bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-between">
            <span>Deterministic Eligibility Conditions (Audited from Ministry Gazettes)</span>
            <span className="text-forest font-bold">Rule-based AST</span>
          </div>
          {scheme.criteria?.map((c, idx) => (
            <div key={idx} className="p-4 flex items-start space-x-3">
              <div className="w-5 h-5 rounded bg-slate-100 text-[#0F1E36] flex items-center justify-center text-xs font-bold shrink-0 mt-0.5 border border-slate-200">
                {idx + 1}
              </div>
              <div className="space-y-1 flex-1 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">
                    {c.explanation[locale] || c.explanation.en}
                  </span>
                  {c.is_mandatory && (
                    <span className="text-[10px] bg-red-50 text-red-800 px-1.5 py-0.2 rounded font-semibold border border-red-200">
                      Mandatory
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
                  <span>Field: <code className="text-slate-600 bg-slate-100 px-1 rounded">{c.field_name}</code></span>
                  <span>•</span>
                  <span>Type: {c.criterion_type}</span>
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
            <div key={idx} className="bg-white p-5 rounded border border-hairline space-y-3 shadow-hairline">
              <div className="flex justify-between items-start">
                <h3 className="font-bold text-sm text-[#0F1E36]">
                  {doc.document_name[locale] || doc.document_name.en}
                </h3>
                {doc.is_mandatory ? (
                  <span className="text-[10px] bg-emerald-50 text-forest px-2 py-0.5 rounded font-bold border border-emerald-200">
                    Mandatory
                  </span>
                ) : (
                  <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-medium">
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
        <div className="bg-white rounded border border-hairline p-6 sm:p-8 space-y-6 shadow-hairline">
          <div className="space-y-1">
            <h3 className="font-bold text-sm sm:text-base text-[#0F1E36]">Official Step-by-Step Procedure</h3>
            <p className="text-xs text-slate-500">Follow the designated workflow as approved by the ministry:</p>
          </div>
          <ol className="relative border-l border-slate-200 ml-3 space-y-5">
            {scheme.application_steps?.map((step) => {
              const text = (step as any)[locale] || step.en;
              return (
                <li key={step.step} className="ml-5 space-y-1">
                  <span className="absolute -left-2.5 flex items-center justify-center w-5 h-5 bg-[#0F1E36] text-white rounded-full text-[10px] font-bold">
                    {step.step}
                  </span>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 leading-relaxed">
                    {text}
                  </p>
                </li>
              );
            })}
          </ol>
          <div className="pt-3 border-t border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <span className="text-xs text-slate-500">Official government application portal:</span>
            <a
              href={scheme.official_portal_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center space-x-1.5 px-4 py-2 bg-[#0F1E36] text-white text-xs font-bold rounded hover:bg-[#162842] transition-colors"
            >
              <span>{t("details.official_portal")}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Citation & Provenance Drawer */}
      <div className="bg-slate-50 border border-hairline rounded p-4 text-xs text-slate-600 space-y-1.5">
        <div className="flex items-center space-x-2 font-bold text-[#0F1E36]">
          <ShieldCheck className="w-4 h-4 text-forest" />
          <span>Official Source &amp; Verification Provenance</span>
        </div>
        <p className="leading-relaxed">
          Record verified on <span className="font-mono font-bold text-slate-800">{scheme.source_reference_date}</span> against official notifications.
          {scheme.gazette_notification_url && (
            <a
              href={scheme.gazette_notification_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-civic hover:underline ml-1 inline-flex items-center space-x-0.5 font-bold"
            >
              <span>View Gazette Circular</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </p>
        {scheme.source_document_hash && (
          <p className="font-mono text-[10px] text-slate-400 truncate">
            SHA-256 Checksum: {scheme.source_document_hash}
          </p>
        )}
      </div>
    </div>
  );
}
