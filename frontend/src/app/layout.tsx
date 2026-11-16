import "./globals.css";
import type { Metadata } from "next";
import { LanguageProvider } from "@/context/LanguageContext";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { FloatingVoiceButton } from "@/components/FloatingVoiceButton";

export const metadata: Metadata = {
  title: "SchemeSaathi — Multilingual Government Scheme Discovery & Eligibility Platform",
  description: "Discover Central Government schemes, check eligibility deterministically, and identify required documents in English, Hindi, and Kannada.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased text-slate-800 bg-slate-50">
        <LanguageProvider>
          <Navbar />
          <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            {children}
          </main>
          <Footer />
          <FloatingVoiceButton />
        </LanguageProvider>
      </body>
    </html>
  );
}
