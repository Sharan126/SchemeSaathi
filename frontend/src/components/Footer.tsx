"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, HeartHandshake, ExternalLink } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold">
                SS
              </div>
              <span className="text-lg font-bold text-white tracking-wide">
                {t("brand.name")}
              </span>
            </div>
            <p className="text-slate-400 text-sm max-w-md">
              {t("brand.tagline")}
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-md border border-slate-700 w-fit">
              <ShieldCheck className="w-4 h-4" />
              <span>Zero-PII Storage Policy & Deterministic AST Rule Evaluation</span>
            </div>
          </div>

          {/* Col 2: Citizen Portals */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wider uppercase">
              Citizen Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <Link href="/schemes" className="hover:text-white transition-colors">
                  {t("nav.schemes")}
                </Link>
              </li>
              <li>
                <Link href="/wizard" className="hover:text-white transition-colors">
                  {t("nav.wizard")}
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-white transition-colors">
                  {t("nav.assistant")}
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-white transition-colors">
                  {t("nav.documents")}
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Official Verification & Institutions */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-sm tracking-wider uppercase">
              Official Resources
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <a
                  href="https://www.india.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-white transition-colors"
                >
                  <span>National Portal of India</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://pmkisan.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-white transition-colors"
                >
                  <span>PM-KISAN Portal</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <a
                  href="https://pmjay.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-white transition-colors"
                >
                  <span>Ayushman Bharat PM-JAY</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
              <li>
                <Link href="/admin" className="hover:text-white transition-colors">
                  Verifier & CSC Desk Login
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 SchemeSaathi. Developed for the Citizens of India. Data sourced directly from official Government gazettes.</p>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Built with integrity</span>
            <HeartHandshake className="w-3.5 h-3.5 text-orange-400" />
            <span>for All India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
