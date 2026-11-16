"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, HeartHandshake, ExternalLink, Info, Lock } from "lucide-react";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="bg-slate-900 text-slate-400 text-sm mt-16 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity & Mission */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-gov-navy text-white flex items-center justify-center font-bold border-2 border-orange-500">
                <span className="text-orange-400 text-xs">य</span>
                <span className="text-green-400 text-xs">S</span>
              </div>
              <span className="text-lg font-bold text-white tracking-wide">
                {t("brand.name")}
              </span>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm max-w-md leading-relaxed">
              {t("brand.tagline")}
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700 w-fit">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-PII Storage Policy • Grounded Gazette Evidence</span>
            </div>
          </div>

          {/* Col 2: Citizen Portals */}
          <div>
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
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
            <h4 className="text-white font-semibold mb-3 text-xs tracking-wider uppercase">
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
                  href="https://www.myscheme.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-white transition-colors"
                >
                  <span>myScheme Portal</span>
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
              <li className="pt-2">
                <Link href="/admin" className="text-slate-400 hover:text-orange-400 transition-colors inline-flex items-center space-x-1 font-semibold">
                  <Lock className="w-3 h-3" />
                  <span>Institutional Verifier Desk</span>
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Public Service & Transparency Disclaimer Banner */}
        <div className="bg-slate-800/60 border border-slate-700/80 rounded-xl p-4 text-xs text-slate-400 space-y-1.5 leading-relaxed">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <Info className="w-4 h-4 text-orange-400 shrink-0" />
            <span>Public Service &amp; Legal Transparency Notice</span>
          </div>
          <p>
            SchemeSaathi is an independent citizen-readiness and scheme discovery platform providing information grounded in verified official government circulars and gazettes. SchemeSaathi does not process financial transactions, charge citizen fees, or guarantee government scheme approvals. All actual applications must be submitted directly through authorized ministry portals or local Common Service Centres (CSCs). We never ask for or store Aadhaar numbers, PAN, or bank security credentials.
          </p>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2026 SchemeSaathi. Dedicated to Public Welfare &amp; Open GovTech Standards.</p>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Built with integrity</span>
            <HeartHandshake className="w-3.5 h-3.5 text-orange-400" />
            <span>for Citizens across India</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
