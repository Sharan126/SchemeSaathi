"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Locale } from "@/types";
import { ShieldCheck, Globe, Menu, X, CheckCircle2, ArrowRight } from "lucide-react";

export function Navbar() {
  const { locale, setLocale, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: t("nav.home") },
    { href: "/schemes", label: t("nav.schemes") },
    { href: "/wizard", label: t("nav.wizard") },
    { href: "/assistant", label: t("nav.assistant") },
    { href: "/documents", label: t("nav.documents") },
    { href: "/admin", label: t("nav.admin") },
  ];

  const handleLocaleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocale(e.target.value as Locale);
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-hairline shadow-hairline">
      {/* 1. Official National Tricolor Hairline Accent */}
      <div className="h-1 w-full bg-gradient-to-r from-[#FF9933] via-white to-[#138808]" />

      {/* 2. Top Administrative Transparency Bar */}
      <div className="bg-[#0F1E36] text-slate-300 text-[11px] py-1 px-4 sm:px-8 flex justify-between items-center font-medium">
        <div className="flex items-center space-x-2">
          <span className="text-[#FF9933] font-bold">🇮🇳</span>
          <span className="tracking-wide">
            {locale === "hi"
              ? "भारत सरकार • राष्ट्रीय कल्याणकारी सूचना एवं आवेदन तत्परता मंच"
              : locale === "kn"
              ? "ಭಾರತ ಸರ್ಕಾರ • ರಾಷ್ಟ್ರೀಯ ಕಲ್ಯಾಣ ಮಾಹಿತಿ ಮತ್ತು ಅರ್ಜಿ ಸನ್ನದ್ಧತಾ ವೇದಿಕೆ"
              : "Government of India • National Welfare Discovery & Readiness Platform"}
          </span>
        </div>

        <div className="flex items-center space-x-4">
          <span className="hidden md:inline text-slate-400 font-mono text-[10px]">
            GAZETTE-GROUNDED • ZERO PII
          </span>

          {/* Language Switcher */}
          <div className="flex items-center space-x-1.5 bg-[#162842] px-2.5 py-0.5 rounded border border-slate-700">
            <Globe className="w-3 h-3 text-slate-400" />
            <select
              value={locale}
              onChange={handleLocaleChange}
              aria-label="Language selection"
              className="bg-transparent text-white text-[11px] font-semibold cursor-pointer focus:outline-none"
            >
              <option value="en" className="bg-[#0F1E36] text-white">English</option>
              <option value="hi" className="bg-[#0F1E36] text-white">हिन्दी (Hindi)</option>
              <option value="kn" className="bg-[#0F1E36] text-white">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Main Navigation Bar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Identity Seal */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-9 h-9 rounded bg-[#0F1E36] text-white flex items-center justify-center font-bold text-base border-b-2 border-terracotta shadow-sm shrink-0">
            <span className="text-[#FF9933] font-serif">य</span>
            <span className="text-emerald-400 font-sans ml-0.5">S</span>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-extrabold tracking-tight text-[#0F1E36] group-hover:text-civic transition-colors">
                {t("brand.name")}
              </span>
              <span className="text-[10px] uppercase font-bold text-forest bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                Official Data
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium hidden sm:block leading-none mt-0.5">
              {locale === "hi"
                ? "सरकारी योजना खोज एवं आवेदन तैयारी मंच"
                : locale === "kn"
                ? "ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಅನ್ವೇಷಣೆ ಮತ್ತು ಅರ್ಜಿ ಸನ್ನದ್ಧತೆ"
                : "Public Welfare Scheme Discovery & Application Readiness"}
            </p>
          </div>
        </Link>

        {/* Desktop Nav Items (Editorial Bottom-Border Ink Marker) */}
        <div className="hidden md:flex items-center h-full space-x-1 lg:space-x-2">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`h-full flex items-center px-3 text-xs lg:text-sm font-semibold transition-colors border-b-2 ${
                  isActive
                    ? "border-[#0F1E36] text-[#0F1E36] font-bold"
                    : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Primary CTA & Mobile Hamburger */}
        <div className="flex items-center space-x-3">
          <Link
            href="/wizard"
            className="hidden sm:inline-flex items-center space-x-1.5 px-4 py-2 bg-terracotta hover:bg-[#98380A] text-white text-xs font-bold rounded shadow-hairline transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-orange-200" />
            <span>{locale === "hi" ? "पात्रता जांचें" : locale === "kn" ? "ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ" : "Check Eligibility"}</span>
          </Link>

          {/* Mobile Menu Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            className="md:hidden p-2 text-slate-700 hover:text-slate-900 focus:outline-none rounded"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* 4. Mobile Drawer View */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-hairline bg-white px-4 py-4 space-y-2 shadow-panel">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded text-sm font-semibold transition-colors min-h-[44px] flex items-center justify-between ${
                  isActive
                    ? "bg-slate-100 text-[#0F1E36] font-bold border-l-4 border-[#0F1E36]"
                    : "text-slate-700 hover:bg-slate-50"
                }`}
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
              </Link>
            );
          })}

          <div className="pt-2 border-t border-hairline">
            <Link
              href="/wizard"
              onClick={() => setMobileMenuOpen(false)}
              className="w-full flex items-center justify-center space-x-2 py-3 bg-terracotta text-white rounded text-sm font-bold min-h-[48px]"
            >
              <CheckCircle2 className="w-4 h-4 text-orange-200" />
              <span>{locale === "hi" ? "मेरी पात्रता जांचें" : locale === "kn" ? "ನನ್ನ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ" : "Check My Eligibility"}</span>
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
