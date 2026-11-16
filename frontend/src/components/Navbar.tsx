"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Locale } from "@/types";
import { ShieldCheck, Globe, Menu, X, CheckCircle2 } from "lucide-react";

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
    <header className="sticky top-0 z-50 bg-white border-b border-slate-200 shadow-sm">
      {/* Top Tricolor Banner */}
      <div className="h-1.5 w-full bg-gradient-to-r from-orange-500 via-white to-green-600" />

      {/* Official Government Top Bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1 px-4 sm:px-8 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
          <span>{t("brand.gov_portal")}</span>
        </div>
        <div className="flex items-center space-x-3">
          <span className="hidden sm:inline text-slate-400">Verified Records • Multilingual Readiness</span>
          <div className="flex items-center space-x-1 bg-slate-800 px-2 py-0.5 rounded border border-slate-700">
            <Globe className="w-3 h-3 text-slate-400" />
            <select
              value={locale}
              onChange={handleLocaleChange}
              aria-label="Language selection"
              className="bg-transparent text-white text-xs font-medium cursor-pointer focus:outline-none"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिन्दी (Hindi)</option>
              <option value="kn" className="bg-slate-900 text-white">ಕನ್ನಡ (Kannada)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-lg bg-gov-navy text-white flex items-center justify-center font-bold text-xl shadow-md border-2 border-orange-500">
            <span className="text-orange-400">य</span>
            <span className="text-green-400">S</span>
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 group-hover:text-gov-blue transition-colors">
              {t("brand.name")}
            </span>
            <p className="text-xs text-slate-500 hidden sm:block">
              {locale === "hi" ? "योजना साथी - भारत सरकार" : locale === "kn" ? "ಯೋಜನೆ ಸಾಥಿ - ಭಾರತ ಸರ್ಕಾರ" : "Government Scheme Assistant"}
            </p>
          </div>
        </Link>

        {/* Desktop Nav Items */}
        <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {navLinks.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-slate-100 text-gov-blue font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Quick Action Button & Mobile Toggle */}
        <div className="flex items-center space-x-2">
          <Link
            href="/wizard"
            className="hidden sm:inline-flex items-center space-x-1.5 px-3.5 py-2 bg-gov-green hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{t("nav.wizard")}</span>
          </Link>

          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-md text-base font-medium ${
                  isActive
                    ? "bg-blue-50 text-gov-blue font-bold"
                    : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
