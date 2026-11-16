"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { fetchDocumentDirectory } from "@/lib/api";
import { DocumentDirectoryItem } from "@/types";
import {
  FileText,
  Building,
  Clock,
  Search,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Check,
  RotateCcw,
  AlertCircle,
  ArrowRight,
  Filter,
  Info,
} from "lucide-react";

export default function DocumentsPage() {
  const { t, locale } = useLanguage();
  const [docs, setDocs] = useState<DocumentDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "ready" | "needed">("all");

  // LocalStorage-backed Personal Checklist (Zero file uploads, stored purely on citizen's browser)
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchDocumentDirectory();
      setDocs(data);
      setLoading(false);
    }
    load();

    try {
      const saved = localStorage.getItem("schemesaathi_document_checklist");
      if (saved) {
        setCheckedDocs(JSON.parse(saved));
      }
    } catch {
      // LocalStorage fallback for private browsing
    }
  }, []);

  const toggleDoc = (code: string) => {
    setCheckedDocs((prev) => {
      const updated = { ...prev, [code]: !prev[code] };
      try {
        localStorage.setItem("schemesaathi_document_checklist", JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const resetChecklist = () => {
    if (confirm("Reset your personal document checklist?")) {
      setCheckedDocs({});
      try {
        localStorage.removeItem("schemesaathi_document_checklist");
      } catch {}
    }
  };

  const filtered = docs.filter((d) => {
    const q = searchTerm.toLowerCase();
    const name = (d.name[locale] || d.name.en).toLowerCase();
    const auth = (d.authority[locale] || d.authority.en).toLowerCase();
    const matchesSearch = name.includes(q) || auth.includes(q);

    if (!matchesSearch) return false;

    if (filterStatus === "ready") {
      return !!checkedDocs[d.code];
    } else if (filterStatus === "needed") {
      return !checkedDocs[d.code];
    }
    return true;
  });

  const totalDocs = docs.length;
  const readyCount = Object.values(checkedDocs).filter(Boolean).length;
  const progressPct = totalDocs > 0 ? Math.round((readyCount / totalDocs) * 100) : 0;

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-3.5 h-3.5 text-gov-blue" />
          <span>Statutory Document Specifications</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t("documents.title")}
        </h1>
        <p className="text-xs sm:text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
          {t("documents.subtitle")}
        </p>
      </div>

      {/* Interactive Personal Checklist Progress Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {t("documents.checklist_title")}
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {t("documents.checklist_desc")}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right">
              <span className="text-[11px] text-slate-500 block">{t("documents.progress_label")}</span>
              <span className="text-sm font-bold text-slate-900">{readyCount} of {totalDocs} Documents Ready ({progressPct}%)</span>
            </div>
            {readyCount > 0 && (
              <button
                onClick={resetChecklist}
                className="text-xs text-slate-400 hover:text-red-600 p-1 rounded cursor-pointer"
                title="Reset checklist"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-600 transition-all duration-300"
            style={{ width: `${progressPct}%` }}
          />
        </div>

        {/* Privacy Assurance Notice */}
        <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 flex items-start space-x-2 text-xs text-emerald-900">
          <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
          <span>
            {t("documents.local_storage_notice")}
          </span>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("documents.search_placeholder")}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                filterStatus === "all" ? "bg-white text-gov-blue shadow-sm" : "text-slate-600"
              }`}
            >
              All Documents ({docs.length})
            </button>
            <button
              onClick={() => setFilterStatus("ready")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                filterStatus === "ready" ? "bg-white text-emerald-800 shadow-sm" : "text-slate-600"
              }`}
            >
              Ready ({readyCount})
            </button>
            <button
              onClick={() => setFilterStatus("needed")}
              className={`px-3 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                filterStatus === "needed" ? "bg-white text-amber-800 shadow-sm" : "text-slate-600"
              }`}
            >
              Still Needed ({totalDocs - readyCount})
            </button>
          </div>

          <span className="text-slate-400 text-[11px]">
            Showing {filtered.length} documents
          </span>
        </div>
      </div>

      {/* Document Directory Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading document requirements...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-2 shadow-sm">
          <p className="text-slate-700 font-semibold text-sm">No documents found matching &quot;{searchTerm}&quot;</p>
          <button
            onClick={() => { setSearchTerm(""); setFilterStatus("all"); }}
            className="text-xs text-gov-blue font-bold underline cursor-pointer"
          >
            Clear search &amp; filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((doc) => {
            const name = doc.name[locale] || doc.name.en;
            const authority = doc.authority[locale] || doc.authority.en;
            const description = doc.description[locale] || doc.description.en;
            const isReady = !!checkedDocs[doc.code];

            return (
              <div
                key={doc.code}
                className={`bg-white rounded-2xl border p-6 space-y-4 hover:shadow-md transition-all flex flex-col justify-between ${
                  isReady ? "border-emerald-300 ring-1 ring-emerald-200" : "border-slate-200"
                }`}
              >
                <div className="space-y-3">
                  {/* Card Header & Checkbox */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                        isReady ? "bg-emerald-100 text-emerald-800" : "bg-blue-50 text-gov-blue"
                      }`}>
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-base text-slate-900 leading-snug">{name}</h3>
                        <span className="text-[11px] text-slate-400 font-mono">Code: {doc.code}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleDoc(doc.code)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center space-x-1 shrink-0 ${
                        isReady
                          ? "bg-emerald-600 text-white shadow-sm"
                          : "bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300"
                      }`}
                    >
                      {isReady ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>{t("documents.status_have")}</span>
                        </>
                      ) : (
                        <span>{t("documents.status_need")}</span>
                      )}
                    </button>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {description}
                  </p>

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600">
                    <div className="flex items-start space-x-2">
                      <Building className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          {t("documents.authority_label")}
                        </span>
                        <span className="font-semibold text-slate-800">{authority}</span>
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Clock className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] uppercase font-bold text-slate-400">
                          {t("documents.tat_label")}
                        </span>
                        <span className="font-semibold text-slate-800">{doc.estimated_tat_days}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer Link to Matching Schemes */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Officially required for verification</span>
                  <Link
                    href={`/schemes?q=${encodeURIComponent(name.split(" ")[0])}`}
                    className="text-gov-blue hover:text-blue-800 font-semibold inline-flex items-center space-x-1"
                  >
                    <span>Find schemes requiring this</span>
                    <ArrowRight className="w-3 h-3" />
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
