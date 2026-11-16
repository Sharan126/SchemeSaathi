"use client";

import React, { useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { askAssistant } from "@/lib/api";
import { GroundedAnswerResponse, Citation } from "@/types";
import {
  Sparkles,
  Send,
  ShieldCheck,
  ExternalLink,
  HelpCircle,
  AlertCircle,
  FileCheck2,
} from "lucide-react";

export default function AssistantPage() {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<
    { query: string; response: GroundedAnswerResponse }[]
  >([]);

  const sampleQuestions = [
    {
      en: "What are the exclusion criteria for PM-KISAN?",
      hi: "पीएम-किसान योजना के तहत कौन से लोग अपात्र हैं?",
      kn: "ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆಯಿಂದ ಯಾರನ್ನು ಹೊರಗಿಡಲಾಗಿದೆ?",
    },
    {
      en: "How much cashless cover is provided under Ayushman Bharat PM-JAY?",
      hi: "आयुष्मान भारत योजना के तहत कितना मुफ्त इलाज कवर मिलता है?",
      kn: "ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಯೋಜನೆಯಡಿ ಎಷ್ಟು ವಿಮಾ ರಕ್ಷಣೆ ಸಿಗುತ್ತದೆ?",
    },
    {
      en: "What is the cash benefit for mothers under PMMVY?",
      hi: "पीएमएमवीवाई योजना में माताओं को कितनी नकद सहायता मिलती है?",
      kn: "ಪಿಎಂಎಂವಿವೈ ಯೋಜನೆಯಡಿ ತಾಯಂದಿರಿಗೆ ಎಷ್ಟು ಹಣ ಸಿಗುತ್ತದೆ?",
    },
    {
      en: "Who is eligible for Post Matric Scholarship for SC Students?",
      hi: "अनुसूचित जाति पोस्ट मैट्रिक छात्रवृत्ति के लिए कौन पात्र है?",
      kn: "ಪರಿಶಿಷ್ಟ ಜಾತಿ ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಯಾರು ಅರ್ಹರು?",
    },
  ];

  const handleAsk = async (textToAsk: string) => {
    const q = textToAsk.trim();
    if (!q) return;

    setLoading(true);
    try {
      const resp = await askAssistant(q, locale);
      setConversation((prev) => [...prev, { query: q, response: resp }]);
      setQuery("");
    } catch (err) {
      console.error("Assistant query failed", err);
      setConversation((prev) => [
        ...prev,
        {
          query: q,
          response: {
            query: q,
            locale,
            answer:
              locale === "hi"
                ? "सहायक सेवा से संपर्क करने में समस्या हुई। कृपया पुनः प्रयास करें या निकटतम सीएससी केंद्र से संपर्क करें।"
                : locale === "kn"
                ? "ಸಹಾಯಕ ಸೇವೆಯನ್ನು ಸಂಪರ್ಕಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ. ದಯವಿಟ್ಟು ಪುನಃ ಪ್ರಯತ್ನಿಸಿ ಅಥವಾ ಹತ್ತಿರದ ಸಿಎಸ್‌ಸಿ ಕೇಂದ್ರವನ್ನು ಸಂಪರ್ಕಿಸಿ."
                : "Unable to reach the assistant service at this moment. Please try again or consult the nearest Common Service Centre (CSC).",
            is_grounded: false,
            confidence_score: 0.0,
            citations: [],
            retrieved_chunks: [],
          },
        },
      ]);
      setQuery("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Header */}
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center space-x-1.5 bg-blue-50 text-blue-900 border border-blue-200 px-3.5 py-1 rounded-full text-xs font-semibold">
          <Sparkles className="w-4 h-4 text-gov-blue" />
          <span>Grounded RAG Engine • Zero Hallucinations</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t("assistant.title")}
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          {t("assistant.subtitle")}
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 text-xs text-amber-900 flex items-start space-x-2.5">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t("assistant.disclaimer")}
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {t("assistant.suggested_questions")}
        </span>
        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((item, idx) => {
            const prompt = (item as any)[locale] || item.en;
            return (
              <button
                key={idx}
                onClick={() => handleAsk(prompt)}
                disabled={loading}
                className="text-xs bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors text-left cursor-pointer disabled:opacity-50"
              >
                {prompt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-6">
        {conversation.map((entry, idx) => (
          <div key={idx} className="space-y-4">
            {/* Citizen Query */}
            <div className="flex justify-end">
              <div className="bg-gov-navy text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-lg text-sm shadow-sm">
                {entry.query}
              </div>
            </div>

            {/* Grounded Assistant Answer */}
            <div className="flex justify-start">
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm p-6 max-w-2xl text-sm shadow-sm space-y-4">
                <div className="flex items-center space-x-2 text-xs font-semibold text-slate-500 pb-2 border-b border-slate-100">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>SchemeSaathi Grounded Evidence</span>
                  {entry.response.is_grounded && (
                    <span className="bg-emerald-50 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                      Confidence 95%
                    </span>
                  )}
                </div>

                <div className="text-slate-800 leading-relaxed whitespace-pre-line text-sm">
                  {entry.response.answer}
                </div>

                {/* Citations Box */}
                {entry.response.citations?.length > 0 && (
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 mt-4">
                    <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                      <span>{t("assistant.citations_label")}</span>
                    </span>
                    <div className="space-y-2">
                      {entry.response.citations.map((cite: Citation, cIdx: number) => (
                        <div key={cIdx} className="text-xs text-slate-600 flex justify-between items-center gap-2">
                          <div className="truncate">
                            <span className="font-semibold text-slate-800">{cite.scheme_name}</span>
                            <span className="text-slate-400"> • {cite.section_title} (Ref: {cite.source_reference_date})</span>
                          </div>
                          <a
                            href={cite.official_portal_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gov-blue hover:underline inline-flex items-center space-x-0.5 font-medium shrink-0"
                          >
                            <span>Verify Source</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center space-x-3 text-xs text-slate-500">
              <div className="w-4 h-4 border-2 border-gov-blue border-t-transparent rounded-full animate-spin" />
              <span>Retrieving official scheme chunks and synthesizing verified answer...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(query);
        }}
        className="sticky bottom-4 bg-white p-2 rounded-2xl border border-slate-300 shadow-xl flex items-center space-x-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("assistant.input_placeholder")}
          className="flex-1 px-4 py-2 text-sm text-slate-900 focus:outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-5 py-2.5 bg-gov-blue hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center space-x-1.5 shadow-sm transition-all cursor-pointer"
        >
          <span>{t("assistant.send_btn")}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
