"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

export function FloatingVoiceButton() {
  const pathname = usePathname();
  const { locale } = useLanguage();

  if (pathname === "/voice") return null;

  const tooltipText =
    locale === "kn"
      ? "ಮಾತನಾಡಿ ಕೇಳಿ (ಧ್ವನಿ ಸಹಾಯಕ)"
      : locale === "hi"
      ? "बोलकर पूछें (आवाज़ सहायक)"
      : "Speak with SchemeSaathi";

  return (
    <Link
      href="/voice"
      aria-label={tooltipText}
      className="fixed bottom-6 right-6 z-40 group flex items-center bg-gradient-to-r from-amber-500 to-orange-500 text-white pl-4 pr-5 py-3.5 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all duration-200 border-2 border-white/80"
    >
      <span className="relative flex h-3.5 w-3.5 mr-2.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
        <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-white" />
      </span>
      <Mic className="w-5 h-5 mr-2 shrink-0 text-white" />
      <span className="text-xs sm:text-sm font-bold tracking-wide whitespace-nowrap">
        {tooltipText}
      </span>
    </Link>
  );
}
