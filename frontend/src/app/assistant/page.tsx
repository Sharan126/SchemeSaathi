"use client";

import React, { useState } from "react";
import Link from "next/link";
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
  Copy,
  Check,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

export default function AssistantPage() {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [conversation, setConversation] = useState<
    { query: string; response: GroundedAnswerResponse; feedback?: "helpful" | "unhelpful" }[]
  >([]);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);

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
          },
        },
      ]);
      setQuery("");
    } finally {
      setLoading(false);
    }
  };

  const copyResponse = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(index);
      setTimeout(() => setCopiedIdx(null), 2500);
    } catch {
      // Clipboard fallback
    }
  };

  const handleFeedback = (index: number, type: "helpful" | "unhelpful") => {
    setConversation((prev) =>
      prev.map((c, i) => (i === index ? { ...c, feedback: type } : c))
    );
  };

  const clearChat = () => {
    setConversation([]);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Header */}
      <div className="space-y-1.5 text-center">
        <div className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-700 px-3 py-0.5 rounded text-xs font-semibold border border-slate-200">
          <Sparkles className="w-3.5 h-3.5 text-civic" />
          <span>Grounded RAG Engine • Ministry Gazette Evidence</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] tracking-tight">
          {t("assistant.title")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          {t("assistant.subtitle")}
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div className="bg-[#FAFBFD] border border-hairline rounded p-3.5 text-xs text-slate-700 flex items-start space-x-2.5 shadow-hairline">
        <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t("assistant.disclaimer")}
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="font-bold text-slate-500 uppercase tracking-wider block text-[10px]">
            {t("assistant.suggested_questions")}
          </span>
          {conversation.length > 0 && (
            <button
              onClick={clearChat}
              className="text-xs text-slate-500 hover:text-red-700 inline-flex items-center space-x-1 cursor-pointer font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t("assistant.clear_chat")}</span>
            </button>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {sampleQuestions.map((item, idx) => {
            const prompt = (item as any)[locale] || item.en;
            return (
              <button
                key={idx}
                onClick={() => handleAsk(prompt)}
                disabled={loading}
                className="text-xs bg-white hover:bg-slate-50 text-slate-800 border border-hairline px-3 py-1.5 rounded transition-all text-left cursor-pointer disabled:opacity-50 shadow-hairline font-medium"
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
          <div key={idx} className="space-y-3">
            {/* Citizen Query */}
            <div className="flex justify-end">
              <div className="bg-[#0F1E36] text-white px-4 py-2.5 rounded text-xs sm:text-sm shadow-hairline leading-relaxed max-w-lg">
                {entry.query}
              </div>
            </div>

            {/* Grounded Assistant Answer */}
            <div className="flex justify-start">
              <div className="bg-white border border-hairline rounded p-5 max-w-2xl text-xs sm:text-sm shadow-hairline space-y-4">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-500 pb-2 border-b border-hairline">
                  <div className="flex items-center space-x-2">
                    <ShieldCheck className="w-4 h-4 text-forest" />
                    <span className="text-[#0F1E36] font-bold">SchemeSaathi Grounded Evidence</span>
                    {entry.response.is_grounded && (
                      <span className="bg-emerald-50 text-forest text-[10px] px-2 py-0.2 rounded font-bold border border-emerald-200">
                        Evidence Grounded
                      </span>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => copyResponse(entry.response.answer, idx)}
                      className="text-slate-500 hover:text-[#0F1E36] inline-flex items-center space-x-1 cursor-pointer text-xs"
                      title={t("assistant.copy_btn")}
                    >
                      {copiedIdx === idx ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-forest" />
                          <span className="text-forest text-[11px] font-bold">{t("assistant.copied_btn")}</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5" />
                          <span className="text-[11px] font-medium">{t("assistant.copy_btn")}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="text-slate-800 leading-relaxed whitespace-pre-line text-xs sm:text-sm">
                  {entry.response.answer}
                </div>

                {/* Citations Box */}
                {entry.response.citations?.length > 0 && (
                  <div className="bg-[#FAFBFD] border border-hairline rounded p-3.5 space-y-2 mt-3">
                    <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wide flex items-center space-x-1">
                      <FileCheck2 className="w-3.5 h-3.5 text-civic" />
                      <span>{t("assistant.citations_label")}</span>
                    </span>
                    <div className="space-y-1.5">
                      {entry.response.citations.map((cite: Citation, cIdx: number) => (
                        <div key={cIdx} className="text-xs text-slate-600 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1.5 pt-1 border-t border-hairline first:border-t-0 first:pt-0">
                          <div className="truncate">
                            <span className="font-bold text-[#0F1E36]">{cite.scheme_name}</span>
                            <span className="text-slate-500 font-mono text-[11px]"> • {cite.section_title} (Ref: {cite.source_reference_date})</span>
                          </div>
                          <div className="flex items-center space-x-2 shrink-0">
                            {cite.scheme_id && (
                              <Link
                                href={`/schemes/${cite.scheme_id}`}
                                className="text-civic hover:underline inline-flex items-center space-x-0.5 font-bold"
                              >
                                <span>{t("assistant.scheme_link_label")}</span>
                                <ArrowRight className="w-3 h-3" />
                              </Link>
                            )}
                            <a
                              href={cite.official_portal_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-slate-500 hover:text-slate-800 inline-flex items-center space-x-0.5 font-medium ml-1"
                            >
                              <span>Official Gazette</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Response Feedback & Action Buttons */}
                <div className="pt-2 border-t border-hairline flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-slate-500">
                    <span>Was this helpful?</span>
                    <button
                      onClick={() => handleFeedback(idx, "helpful")}
                      className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${
                        entry.feedback === "helpful" ? "text-forest font-bold" : "text-slate-400"
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleFeedback(idx, "unhelpful")}
                      className={`p-1 rounded hover:bg-slate-100 cursor-pointer ${
                        entry.feedback === "unhelpful" ? "text-amber-700 font-bold" : "text-slate-400"
                      }`}
                    >
                      <ThumbsDown className="w-3.5 h-3.5" />
                    </button>
                    {entry.feedback && (
                      <span className="text-[11px] text-forest italic font-semibold">
                        {t("assistant.feedback_recorded")}
                      </span>
                    )}
                  </div>

                  <Link
                    href="/wizard"
                    className="inline-flex items-center space-x-1 font-bold text-civic hover:underline"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Check Eligibility for these Schemes</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-hairline rounded p-4 flex items-center space-x-3 text-xs text-slate-500 shadow-hairline">
              <div className="w-4 h-4 border-2 border-[#0F1E36] border-t-transparent rounded-full animate-spin" />
              <span>Retrieving verified official circular chunks and synthesizing grounded response...</span>
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
        className="sticky bottom-4 bg-white p-2 rounded border border-slate-300 shadow-panel flex items-center space-x-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("assistant.input_placeholder")}
          className="flex-1 px-3 py-2 text-xs sm:text-sm text-[#0F1E36] focus:outline-none bg-transparent"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2 bg-[#0F1E36] hover:bg-[#162842] disabled:opacity-50 text-white rounded text-xs font-bold flex items-center space-x-1.5 shadow-hairline transition-colors cursor-pointer shrink-0"
        >
          <span>{t("assistant.send_btn")}</span>
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
