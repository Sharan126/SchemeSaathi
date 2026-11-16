"use client";

import React from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { ShieldCheck, HeartHandshake, ExternalLink, Info, Lock, Building2 } from "lucide-react";

export function Footer() {
  const { t, locale } = useLanguage();

  return (
    <footer className="bg-[#0F1E36] text-slate-300 text-xs mt-20 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1: Identity & Public Purpose */}
          <div className="md:col-span-2 space-y-3.5">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded bg-[#162842] text-white flex items-center justify-center font-bold text-sm border-b-2 border-terracotta shrink-0">
                <span className="text-[#FF9933] font-serif">य</span>
                <span className="text-emerald-400 font-sans ml-0.5">S</span>
              </div>
              <span className="text-base font-extrabold text-white tracking-tight">
                {t("brand.name")}
              </span>
            </div>

            <p className="text-slate-300 text-xs max-w-md leading-relaxed">
              {locale === "hi"
                ? "भारतीय नागरिकों के लिए आधिकारिक राजपत्रों पर आधारित पारदर्शी सरकारी योजना खोज, नियम-सत्यापित पात्रता एवं दस्तावेज़ तैयारी मंच।"
                : locale === "kn"
                ? "ಭಾರತೀಯ ನಾಗರಿಕರಿಗಾಗಿ ಅಧಿಕೃತ ಗೆಜೆಟ್‌ಗಳ ಆಧಾರದ ಮೇಲೆ ಕಲ್ಯಾಣ ಯೋಜನೆಗಳ ಅನ್ವೇಷಣೆ, ಅರ್ಹತಾ ಪರಿಶೀಲನೆ ಮತ್ತು ಅರ್ಜಿ ಸನ್ನದ್ಧತಾ ವೇದಿಕೆ."
                : "An open civic platform helping Indian citizens discover welfare schemes, understand eligibility via deterministic rules, and prepare mandatory documents before applying."}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
              <span className="inline-flex items-center space-x-1.5 bg-[#162842] text-emerald-300 px-2.5 py-1 rounded border border-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Zero-PII Storage Policy</span>
              </span>
              <span className="inline-flex items-center space-x-1.5 bg-[#162842] text-slate-300 px-2.5 py-1 rounded border border-slate-700">
                <span>Deterministic AST Rules</span>
              </span>
            </div>
          </div>

          {/* Col 2: Citizen Readiness Portals */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs tracking-wider uppercase text-slate-200">
              Citizen Workflows
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
              <li>
                <Link href="/schemes" className="hover:text-white transition-colors">
                  {t("nav.schemes")} (Catalogue)
                </Link>
              </li>
              <li>
                <Link href="/wizard" className="hover:text-white transition-colors">
                  {t("nav.wizard")} (Eligibility)
                </Link>
              </li>
              <li>
                <Link href="/assistant" className="hover:text-white transition-colors">
                  {t("nav.assistant")} (Multilingual AI)
                </Link>
              </li>
              <li>
                <Link href="/documents" className="hover:text-white transition-colors">
                  {t("nav.documents")} (Readiness Checklist)
                </Link>
              </li>
              <li className="pt-1">
                <Link href="/admin" className="text-slate-400 hover:text-orange-300 inline-flex items-center space-x-1 font-medium">
                  <Lock className="w-3 h-3" />
                  <span>Verifier Desk Login</span>
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Official National Portals */}
          <div>
            <h4 className="text-white font-bold mb-3 text-xs tracking-wider uppercase text-slate-200">
              Official Portals
            </h4>
            <ul className="space-y-2 text-xs text-slate-300">
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
                  <span>myScheme Portal (MeitY)</span>
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
                  <span>PM-KISAN Samman Nidhi</span>
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
                <a
                  href="https://nsap.nic.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center space-x-1 hover:text-white transition-colors"
                >
                  <span>NSAP Social Assistance</span>
                  <ExternalLink className="w-3 h-3 text-slate-500" />
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Statutory & Non-Affiliation Notice */}
        <div className="bg-[#14233A] border border-slate-700/80 rounded p-4 text-[11px] text-slate-300 space-y-1.5 leading-relaxed">
          <div className="flex items-center space-x-1.5 text-white font-bold">
            <Info className="w-3.5 h-3.5 text-[#FF9933] shrink-0" />
            <span>Statutory Non-Affiliation &amp; Public Transparency Notice</span>
          </div>
          <p>
            SchemeSaathi is an independent, non-commercial public service initiative created to simplify access to welfare schemes for Indian citizens. SchemeSaathi is not an agency of the Government of India, does not charge any fee from citizens, and does not accept or process scheme application forms. Actual scheme registration must be completed through designated ministry portals or local Common Service Centres (CSCs). Information provided is grounded in published government gazettes and operational guidelines.
          </p>
        </div>

        {/* Bottom Baseline Bar */}
        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-400 gap-3">
          <p>© 2026 SchemeSaathi. Published under Open Civic Technology Standards.</p>
          <div className="flex items-center space-x-1 text-slate-400">
            <span>Built for the public interest across all 28 States &amp; 8 UTs</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
