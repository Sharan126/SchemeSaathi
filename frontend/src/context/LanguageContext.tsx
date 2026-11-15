"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Locale } from "@/types";
import enMessages from "@/messages/en.json";
import hiMessages from "@/messages/hi.json";
import knMessages from "@/messages/kn.json";

interface LanguageContextType {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (keyPath: string) => string;
}

const catalogs: Record<Locale, Record<string, any>> = {
  en: enMessages,
  hi: hiMessages,
  kn: knMessages,
};

const LanguageContext = createContext<LanguageContextType>({
  locale: "en",
  setLocale: () => {},
  t: (keyPath: string) => keyPath,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  useEffect(() => {
    const saved = localStorage.getItem("schemesaathi_locale") as Locale;
    if (saved && (saved === "en" || saved === "hi" || saved === "kn")) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("schemesaathi_locale", l);
  };

  const t = (keyPath: string): string => {
    const parts = keyPath.split(".");
    let curr: any = catalogs[locale];
    for (const p of parts) {
      if (curr && typeof curr === "object" && p in curr) {
        curr = curr[p];
      } else {
        // Fallback to English catalog
        let fallback: any = catalogs["en"];
        for (const fp of parts) {
          if (fallback && typeof fallback === "object" && fp in fallback) {
            fallback = fallback[fp];
          } else {
            return keyPath;
          }
        }
        return typeof fallback === "string" ? fallback : keyPath;
      }
    }
    return typeof curr === "string" ? curr : keyPath;
  };

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
