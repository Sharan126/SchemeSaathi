"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";

export default function DocumentsPage() {
  const { t, locale } = useLanguage();
  const [docs, setDocs] = useState<DocumentDirectoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const data = await fetchDocumentDirectory();
      setDocs(data);
      setLoading(false);
    }
    load();
  }, []);

  const filtered = docs.filter((d) => {
    const q = searchTerm.toLowerCase();
    const name = (d.name[locale] || d.name.en).toLowerCase();
    const auth = (d.authority[locale] || d.authority.en).toLowerCase();
    return name.includes(q) || auth.includes(q);
  });

  return (
    <div className="space-y-8 py-2">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          {t("documents.title")}
        </h1>
        <p className="text-sm sm:text-base text-slate-600 max-w-2xl">
          {t("documents.subtitle")}
        </p>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3.5 top-3.5 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("documents.search_placeholder")}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
        </div>
      </div>

      {/* Document Directory Cards */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-8 h-8 border-4 border-gov-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-500">Loading document requirements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filtered.map((doc) => {
            const name = doc.name[locale] || doc.name.en;
            const authority = doc.authority[locale] || doc.authority.en;
            const description = doc.description[locale] || doc.description.en;

            return (
              <div
                key={doc.code}
                className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-lg bg-blue-50 text-gov-blue flex items-center justify-center font-bold">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-slate-900">{name}</h3>
                      <span className="text-xs text-slate-400 font-mono">Code: {doc.code}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full">
                    Official Requirement
                  </span>
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
            );
          })}
        </div>
      )}
    </div>
  );
}
