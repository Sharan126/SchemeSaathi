"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { Scheme } from "@/types";
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Clock,
  ArrowRight,
  ExternalLink,
  CreditCard,
  FileCheck2,
  Info,
} from "lucide-react";

interface SchemeReadinessTrackerProps {
  scheme: Scheme;
  eligibilityPassed?: boolean;
  missingCriteriaCount?: number;
}

export function SchemeReadinessTracker({
  scheme,
  eligibilityPassed = false,
  missingCriteriaCount = 0,
}: SchemeReadinessTrackerProps) {
  const { t, locale } = useLanguage();

  // Local storage document readiness integration
  const [userDocs, setUserDocs] = useState<Record<string, boolean>>({});
  const [bankDbtLinked, setBankDbtLinked] = useState<boolean>(false);
  const [applicationStarted, setApplicationStarted] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedDocs = localStorage.getItem("schemesaathi_document_checklist");
      if (savedDocs) {
        setUserDocs(JSON.parse(savedDocs));
      }
      const savedBank = localStorage.getItem("schemesaathi_bank_dbt_ready");
      if (savedBank) {
        setBankDbtLinked(savedBank === "true");
      }
      const savedApp = localStorage.getItem(`schemesaathi_app_started_${scheme.slug}`);
      if (savedApp) {
        setApplicationStarted(savedApp === "true");
      }
    } catch {
      // Local storage fallback for private windows
    }
  }, [scheme.slug]);

  const toggleBankDbt = (checked: boolean) => {
    setBankDbtLinked(checked);
    try {
      localStorage.setItem("schemesaathi_bank_dbt_ready", checked ? "true" : "false");
    } catch {}
  };

  const toggleAppStarted = (checked: boolean) => {
    setApplicationStarted(checked);
    try {
      localStorage.setItem(`schemesaathi_app_started_${scheme.slug}`, checked ? "true" : "false");
    } catch {}
  };

  // Calculate required documents readiness for this specific scheme
  const schemeDocs = scheme.documents || [];
  const mandatoryDocs = schemeDocs.filter((d) => d.is_mandatory);
  const userReadyDocs = mandatoryDocs.filter((d) => userDocs[d.document_code]);
  const docsReady = mandatoryDocs.length > 0 ? userReadyDocs.length === mandatoryDocs.length : true;

  // Calculate readiness steps (4 pillars)
  const steps = [
    {
      id: "eligibility",
      title: locale === "hi" ? "१. पात्रता सत्यापन" : locale === "kn" ? "೧. ಅರ್ಹತೆ ಪರಿಶೀಲನೆ" : "1. Eligibility Requirements",
      status: eligibilityPassed ? "READY" : missingCriteriaCount > 0 ? "INCOMPLETE" : "PENDING",
      desc: eligibilityPassed
        ? locale === "hi" ? "पात्रता शर्तें संतुष्ट" : locale === "kn" ? "ಅರ್ಹತಾ ಷರತ್ತುಗಳು ಪೂರ್ಣಗೊಂಡಿವೆ" : "Eligibility conditions satisfied"
        : missingCriteriaCount > 0
        ? locale === "hi" ? `${missingCriteriaCount} जानकारी अभी आवश्यक है` : locale === "kn" ? `${missingCriteriaCount} ಮಾಹಿತಿ ಬಾಕಿ ಇದೆ` : `${missingCriteriaCount} criteria need more info`
        : locale === "hi" ? "विज़ार्ड में जांच आवश्यक" : locale === "kn" ? "ಪರಿಶೀಲನೆ ಅಗತ್ಯವಿದೆ" : "Check eligibility in wizard",
      actionLink: `/wizard?scheme=${scheme.slug}`,
      actionLabel: locale === "hi" ? "पात्रता जांचें" : locale === "kn" ? "ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ" : "Check Eligibility",
    },
    {
      id: "documents",
      title: locale === "hi" ? "२. आवश्यक सरकारी दस्तावेज़" : locale === "kn" ? "೨. ಅಗತ್ಯ ಸರ್ಕಾರಿ ದಾಖಲೆಗಳು" : "2. Document Preparation",
      status: docsReady ? "READY" : "INCOMPLETE",
      desc: docsReady
        ? locale === "hi" ? `सभी ${mandatoryDocs.length} अनिवार्य दस्तावेज़ तैयार हैं` : locale === "kn" ? `ಎಲ್ಲಾ ${mandatoryDocs.length} ಕಡ್ಡಾಯ ದಾಖಲೆಗಳು ಸಿದ್ಧವಾಗಿವೆ` : `All ${mandatoryDocs.length} required documents ready`
        : locale === "hi" ? `${userReadyDocs.length}/${mandatoryDocs.length} दस्तावेज़ तैयार हैं` : locale === "kn" ? `${userReadyDocs.length}/${mandatoryDocs.length} ದಾಖಲೆಗಳು ಸಿದ್ಧವಾಗಿವೆ` : `${userReadyDocs.length}/${mandatoryDocs.length} required documents marked ready`,
      actionLink: "/documents",
      actionLabel: locale === "hi" ? "दस्तावेज़ चेकलिस्ट देखें" : locale === "kn" ? "ದಾಖಲೆಗಳ ಪಟ್ಟಿ ನೋಡಿ" : "View Document Center",
    },
    {
      id: "banking",
      title: locale === "hi" ? "३. बैंक खाता एवं डीबीटी (DBT)" : locale === "kn" ? "೩. ಬ್ಯಾಂಕ್ ಖಾತೆ ಮತ್ತು ಡಿಬಿಟಿ (DBT)" : "3. Direct Benefit Transfer (DBT)",
      status: bankDbtLinked ? "READY" : "PENDING",
      desc: bankDbtLinked
        ? locale === "hi" ? "आधार से जुड़ा सक्रिय बैंक खाता तैयार" : locale === "kn" ? "ಆಧಾರ್ ಲಿಂಕ್ ಆದ ಸಕ್ರಿಯ ಬ್ಯಾಂಕ್ ಖಾತೆ ಸಿದ್ಧವಾಗಿದೆ" : "Aadhaar-seeded active bank account confirmed"
        : locale === "hi" ? "डीबीटी के लिए बैंक खाते में आधार लिंक होना अनिवार्य है" : locale === "kn" ? "ಡಿಬಿಟಿಗಾಗಿ ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ಆಧಾರ್ ಲಿಂಕ್ ಅಗತ್ಯವಿದೆ" : "Required for direct government cash transfers",
      isInteractive: true,
      onToggle: toggleBankDbt,
      checked: bankDbtLinked,
      toggleLabel: locale === "hi" ? "मेरा बैंक खाता आधार से जुड़ा (DBT-Active) है" : locale === "kn" ? "ನನ್ನ ಬ್ಯಾಂಕ್ ಖಾತೆ ಆಧಾರ್ ಲಿಂಕ್ ಆಗಿದೆ (DBT ಸಕ್ರಿಯ)" : "I have an active bank account linked to Aadhaar (DBT active)",
    },
    {
      id: "submission",
      title: locale === "hi" ? "४. आधिकारिक पोर्टल पर आवेदन" : locale === "kn" ? "೪. ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ" : "4. Official Portal Submission",
      status: applicationStarted ? "READY" : "PENDING",
      desc: applicationStarted
        ? locale === "hi" ? "आधिकारिक पोर्टल पर आवेदन प्रक्रिया आरंभ की गई" : locale === "kn" ? "ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಪ್ರಕ್ರಿಯೆ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ" : "Application opened on ministry portal"
        : locale === "hi" ? "तैयारी पूर्ण होने पर आधिकारिक पोर्टल पर जाएं" : locale === "kn" ? "ಸಿದ್ಧತೆ ಪೂರ್ಣಗೊಂಡ ನಂತರ ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ಗೆ ಭೇಟಿ ನೀಡಿ" : "Apply directly through the responsible ministry portal",
      actionLink: scheme.official_portal_url,
      isExternal: true,
      actionLabel: locale === "hi" ? "आधिकारिक पोर्टल खोलें" : locale === "kn" ? "ಅಧಿಕೃತ ಪೋರ್ಟಲ್ ತೆರೆಯಿರಿ" : "Open Ministry Portal",
      isInteractive: true,
      onToggle: toggleAppStarted,
      checked: applicationStarted,
      toggleLabel: locale === "hi" ? "मैंने आधिकारिक पोर्टल पर आवेदन शुरू किया है" : locale === "kn" ? "ನಾನು ಅಧಿಕೃತ ಪೋರ್ಟಲ್‌ನಲ್ಲಿ ಅರ್ಜಿ ಪ್ರಾರಂಭಿಸಿದ್ದೇನೆ" : "I have initiated my application on the official portal",
    },
  ];

  const readyCount = steps.filter((s) => s.status === "READY").length;
  const progressPct = Math.round((readyCount / steps.length) * 100);

  return (
    <div className="bg-white rounded border border-hairline p-6 shadow-hairline space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-hairline pb-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
              {t("tracker.title")}
            </span>
            <span className="text-xs font-semibold text-slate-500">
              {scheme.title[locale] || scheme.title.en}
            </span>
          </div>
          <h2 className="text-base sm:text-lg font-bold text-[#0F1E36] mt-1">
            Application Preparation Progress
          </h2>
        </div>

        {/* Overall score indicator */}
        <div className="flex items-center space-x-3 bg-slate-50 px-3.5 py-1.5 rounded border border-hairline">
          <div className="text-right">
            <span className="text-[10px] text-slate-500 font-semibold uppercase block">Readiness Level</span>
            <span className="text-sm font-bold text-[#0F1E36] num-tabular">{progressPct}% Prepared</span>
          </div>
          <div className="w-8 h-8 rounded border-2 border-forest flex items-center justify-center font-bold text-xs text-[#0F1E36]">
            {readyCount}/4
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 h-2 rounded overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${
            progressPct === 100 ? "bg-forest" : progressPct >= 50 ? "bg-civic" : "bg-terracotta"
          }`}
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* 4 Pillars Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {steps.map((step) => {
          const isReady = step.status === "READY";
          const isIncomplete = step.status === "INCOMPLETE";

          return (
            <div
              key={step.id}
              className={`p-4 rounded border transition-all space-y-2.5 ${
                isReady
                  ? "bg-emerald-50/40 border-emerald-200"
                  : isIncomplete
                  ? "bg-amber-50/40 border-amber-200"
                  : "bg-slate-50/60 border-hairline"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center space-x-2">
                  {isReady ? (
                    <CheckCircle2 className="w-4 h-4 text-forest shrink-0" />
                  ) : isIncomplete ? (
                    <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
                  ) : (
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                  <h3 className="font-bold text-xs sm:text-sm text-[#0F1E36]">{step.title}</h3>
                </div>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.2 rounded ${
                    isReady
                      ? "bg-emerald-100 text-forest"
                      : isIncomplete
                      ? "bg-amber-100 text-amber-900"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {isReady ? "Ready" : isIncomplete ? "In Progress" : "Pending"}
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{step.desc}</p>

              {/* Interactive Checkbox if available */}
              {step.isInteractive && step.onToggle && (
                <label className="flex items-center space-x-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={step.checked}
                    onChange={(e) => step.onToggle!(e.target.checked)}
                    className="w-3.5 h-3.5 text-forest rounded border-slate-300 focus:ring-forest cursor-pointer"
                  />
                  <span className="text-xs font-medium text-slate-700 select-none">
                    {step.toggleLabel}
                  </span>
                </label>
              )}

              {/* Action Link */}
              {step.actionLink && (
                <div className="pt-0.5">
                  {step.isExternal ? (
                    <a
                      href={step.actionLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center space-x-1 text-xs font-bold text-civic hover:underline"
                    >
                      <span>{step.actionLabel}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <Link
                      href={step.actionLink}
                      className="inline-flex items-center space-x-1 text-xs font-bold text-civic hover:underline"
                    >
                      <span>{step.actionLabel}</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Required Documents Checklist for this Scheme */}
      {mandatoryDocs.length > 0 && (
        <div className="bg-slate-50 p-4 rounded border border-hairline space-y-2">
          <span className="text-xs font-bold text-[#0F1E36] block">
            Mandatory Documents for {scheme.title[locale] || scheme.title.en}:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {mandatoryDocs.map((doc) => {
              const hasIt = userDocs[doc.document_code];
              const docName = doc.document_name[locale] || doc.document_name.en;
              return (
                <div
                  key={doc.document_code}
                  className={`p-2 rounded border flex items-center justify-between ${
                    hasIt ? "bg-emerald-50 border-emerald-200 text-forest" : "bg-white border-hairline text-slate-700"
                  }`}
                >
                  <span className="font-semibold truncate pr-2">{docName}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${hasIt ? "bg-emerald-200 text-forest" : "bg-slate-100 text-slate-500"}`}>
                    {hasIt ? "Marked Ready" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
          <div className="pt-1 text-right">
            <Link
              href="/documents"
              className="text-xs text-civic font-bold hover:underline"
            >
              Open Full Document Readiness Center →
            </Link>
          </div>
        </div>
      )}

      {/* Transparency Disclaimer */}
      <div className="bg-slate-50 border border-hairline rounded p-3 flex items-start space-x-2 text-[11px] text-slate-600">
        <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t("tracker.disclaimer")}
        </p>
      </div>
    </div>
  );
}
