"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Locale, VoiceChatResponse, VoiceInterviewState, VoiceMessage } from "@/types";
import {
  sendVoiceChat,
  startVoiceInterview,
  submitVoiceAnswer,
} from "@/lib/api";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Play,
  Pause,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  HelpCircle,
  FileCheck2,
  ExternalLink,
  ChevronRight,
  Globe,
  AlertCircle,
  Send,
  MessageSquare,
  FastForward,
  User,
  Bot,
  RefreshCw,
  Sliders,
} from "lucide-react";

// Web Audio API tone synthesizer (requires zero external media assets)
function playToneChime(type: "start" | "ready" | "alert") {
  if (typeof window === "undefined") return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === "start") {
      // Pleasant upward double chime (440Hz -> 660Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(660, ctx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === "ready") {
      // Gentle confirmation ding-dong (523Hz -> 784Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(523, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(784, ctx.currentTime + 0.2);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (type === "alert") {
      // Soft reminder chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Graceful fallback if audio context blocked by browser policy
  }
}

interface ChatHistoryItem {
  id: string;
  role: "citizen" | "assistant";
  spokenText?: string;
  displayText: string;
  timestamp: string;
  schemeId?: string;
  citations?: any[];
  isInterviewQuestion?: boolean;
}

function VoiceAssistantContent() {
  const { locale, setLocale, t } = useLanguage();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "eligibility" ? "ELIGIBILITY" : "CONVERSATION";

  // Voice Interaction State
  const [activeLang, setActiveLang] = useState<"kn" | "hi" | "en">(
    (locale as "kn" | "hi" | "en") || "kn"
  );
  const [mode, setMode] = useState<"CONVERSATION" | "ELIGIBILITY">(initialMode);
  const [status, setStatus] = useState<"IDLE" | "LISTENING" | "PROCESSING" | "SPEAKING">("IDLE");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [simplicityMode, setSimplicityMode] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [textFallbackInput, setTextFallbackInput] = useState("");
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);
  const [activeSchemeId, setActiveSchemeId] = useState<string | undefined>(undefined);
  const [profileContext, setProfileContext] = useState<Record<string, any>>({});

  // Multi-Turn Conversation Thread
  const [conversation, setConversation] = useState<ChatHistoryItem[]>([]);
  const [interviewSession, setInterviewSession] = useState<VoiceInterviewState | null>(null);

  // Audio Recognition and Synthesis Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const chatScrollRef = useRef<HTMLDivElement | null>(null);

  // Sync active language with global language context
  useEffect(() => {
    if (["kn", "hi", "en"].includes(locale)) {
      setActiveLang(locale as "kn" | "hi" | "en");
    }
  }, [locale]);

  // Auto-scroll chat stream
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [conversation, status, liveTranscript]);

  // Initial welcome message per language
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }

    if (mode === "CONVERSATION") {
      const initialWelcomes = {
        kn: {
          spoken: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ. ನೀವು ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್, ವಿದ್ಯಾರ್ಥಿವೇತನ ಅಥವಾ ವಸತಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ಮಾತನಾಡಲು ಮೈಕ್ರೋಫೋನ್ ಬಟನ್ ಒತ್ತಿ.",
          display: "ನಮಸ್ಕಾರ! ನಾನು ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ. ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಮಾಹಿತಿ ಮತ್ತು ನಿಮ್ಮ ಅರ್ಹತೆ ತಿಳಿಯಲು ಕೆಳಗಿನ ಮೈಕ್ ಒತ್ತಿ ನೇರವಾಗಿ ಮಾತನಾಡಿ.",
          prompts: ["ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ", "ಆಯುಷ್ಮಾನ್ 5 ಲಕ್ಷ ಆರೋಗ್ಯ ಕಾರ್ಡ್", "ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ", "ವಿದ್ಯಾರ್ಥಿವೇತನಗಳು"]
        },
        hi: {
          spoken: "नमस्ते! मैं स्कीमसाथी आवाज़ सहायक हूँ। आप मुझसे पीएम-किसान, आयुष्मान भारत कार्ड, छात्रवृत्ति या किसी भी योजना के बारे में पूछ सकते हैं। बोलने के लिए नीचे दिए गए माइक बटन को दबाएं।",
          display: "नमस्ते! मैं स्कीमसाथी वॉइस असिस्टेंट हूँ। योजनाओं की जानकारी और पात्रता जांचने के लिए माइक दबाकर बोलें।",
          prompts: ["पीएम-किसान योजना की जानकारी", "आयुष्मान भारत कार्ड", "मेरी पात्रता जांचें", "छात्रवृत्ति योजना"]
        },
        en: {
          spoken: "Hello! I am your SchemeSaathi voice assistant. You can speak to me about farmer support, free healthcare, scholarships, or pensions. Tap the microphone and speak naturally.",
          display: "Hello! I am your SchemeSaathi voice assistant. Speak naturally to discover verified welfare schemes, check your eligibility, and understand required documents.",
          prompts: ["Tell me about PM-KISAN", "How to get Ayushman Health Card?", "I am a 55-year-old farmer, what can I get?", "Scholarships for students"]
        },
      };

      const w = initialWelcomes[activeLang] || initialWelcomes.en;
      setConversation([
        {
          id: `welcome-${Date.now()}`,
          role: "assistant",
          spokenText: w.spoken,
          displayText: w.display,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
      setSuggestedPrompts(w.prompts);
    } else {
      initiateInterview(activeLang);
    }

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [activeLang, mode]);

  // Audio Waveform Visualizer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const drawWave = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (status === "LISTENING" || status === "SPEAKING") {
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.strokeStyle = status === "LISTENING" ? "#D97706" : "#059669"; // Amber listening, Emerald speaking

        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;
        const amplitude = status === "LISTENING" ? 22 : 16;

        for (let x = 0; x < width; x += 3) {
          const y = midY + Math.sin(x * 0.05 + phase) * amplitude * Math.sin(x / width * Math.PI);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
        phase += 0.12;
      } else {
        // Civic subtle dotted baseline when idle
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#E2E8F0";
        ctx.moveTo(0, canvas.height / 2);
        ctx.lineTo(canvas.width, canvas.height / 2);
        ctx.stroke();
      }

      animationFrameRef.current = requestAnimationFrame(drawWave);
    };

    drawWave();
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [status]);

  // Speech Recognition Initializer
  const startListening = () => {
    stopSpeaking();

    const SpeechRecognitionClass =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionClass) {
      setMicPermissionDenied(true);
      return;
    }

    try {
      playToneChime("start");
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      const langCodes: Record<string, string> = {
        kn: "kn-IN",
        hi: "hi-IN",
        en: "en-IN",
      };
      recognition.lang = langCodes[activeLang] || "kn-IN";

      recognition.onstart = () => {
        setStatus("LISTENING");
        setLiveTranscript("");
        setMicPermissionDenied(false);
      };

      recognition.onresult = (event: any) => {
        let interim = "";
        let final = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            final += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }
        setLiveTranscript(final || interim);

        if (final.trim()) {
          handleSpokenInput(final.trim());
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicPermissionDenied(true);
          playToneChime("alert");
        }
        setStatus("IDLE");
      };

      recognition.onend = () => {
        if (status === "LISTENING") {
          setStatus("IDLE");
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error("Failed to start speech recognition", err);
      setStatus("IDLE");
      setMicPermissionDenied(true);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    setStatus("IDLE");
  };

  // Text-to-Speech Playback
  const speakText = (text: string) => {
    if (!synthRef.current || !text) return;
    synthRef.current.cancel();

    playToneChime("ready");
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechSpeed;
    utterance.pitch = 1.0;

    const langCodes: Record<string, string> = {
      kn: "kn-IN",
      hi: "hi-IN",
      en: "en-IN",
    };
    utterance.lang = langCodes[activeLang] || "kn-IN";

    // Attempt to pick matching local regional voice
    const voices = synthRef.current.getVoices();
    const matchedVoice = voices.find(
      (v) =>
        v.lang === utterance.lang ||
        v.lang.startsWith(activeLang) ||
        (activeLang === "kn" && (v.name.includes("Kannada") || v.lang.includes("kn"))) ||
        (activeLang === "hi" && (v.name.includes("Hindi") || v.lang.includes("hi")))
    );

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onstart = () => {
      setStatus("SPEAKING");
      setIsPaused(false);
    };

    utterance.onend = () => {
      setStatus("IDLE");
      setIsPaused(false);
    };

    utterance.onerror = (e) => {
      console.warn("Speech synthesis error", e);
      setStatus("IDLE");
    };

    currentUtteranceRef.current = utterance;
    synthRef.current.speak(utterance);
  };

  const pauseResumeSpeaking = () => {
    if (!synthRef.current) return;
    if (isPaused) {
      synthRef.current.resume();
      setIsPaused(false);
      setStatus("SPEAKING");
    } else {
      synthRef.current.pause();
      setIsPaused(true);
      setStatus("IDLE");
    }
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    setStatus("IDLE");
    setIsPaused(false);
  };

  const repeatLastAnswer = () => {
    const lastAssistant = [...conversation].reverse().find((m) => m.role === "assistant" && m.spokenText);
    if (lastAssistant && lastAssistant.spokenText) {
      speakText(lastAssistant.spokenText);
    }
  };

  const speakSlower = () => {
    setSpeechSpeed(0.8);
    const lastAssistant = [...conversation].reverse().find((m) => m.role === "assistant" && m.spokenText);
    if (lastAssistant && lastAssistant.spokenText) {
      if (synthRef.current) synthRef.current.cancel();
      const utterance = new SpeechSynthesisUtterance(lastAssistant.spokenText);
      utterance.rate = 0.8;
      const langCodes: Record<string, string> = { kn: "kn-IN", hi: "hi-IN", en: "en-IN" };
      utterance.lang = langCodes[activeLang] || "kn-IN";
      synthRef.current?.speak(utterance);
      setStatus("SPEAKING");
    }
  };

  const explainSimply = () => {
    setSimplicityMode(true);
    const lastCitizen = [...conversation].reverse().find((m) => m.role === "citizen");
    if (lastCitizen) {
      handleSpokenInput(
        activeLang === "kn"
          ? `${lastCitizen.displayText} - ಇದನ್ನು ಅತ್ಯಂತ ಸರಳವಾಗಿ ಸಾಮಾನ್ಯ ಜನರಿಗೆ ಅರ್ಥವಾಗುವಂತೆ ವಿವರಿಸಿ`
          : activeLang === "hi"
          ? `${lastCitizen.displayText} - इसे बहुत ही आसान और सरल भाषा में समझाएं`
          : `${lastCitizen.displayText} - explain this in very simple language for a common citizen`
      );
    }
  };

  const resetConversation = () => {
    stopSpeaking();
    stopListening();
    setActiveSchemeId(undefined);
    setProfileContext({});
    setSimplicityMode(false);
    setConversation([]);
    setLiveTranscript("");
    if (mode === "CONVERSATION") {
      const initialWelcomes = {
        kn: {
          spoken: "ಸಂಭಾಷಣೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ. ಹೊಸ ಪ್ರಶ್ನೆ ಕೇಳಲು ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ.",
          display: "ಸಂಭಾಷಣೆ ಮರುಹೊಂದಿಸಲಾಗಿದೆ. ನೀವು ಹೊಸ ಪ್ರಶ್ನೆಯನ್ನು ಮುಕ್ತವಾಗಿ ಕೇಳಬಹುದು.",
          prompts: ["ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ", "ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್", "ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ"]
        },
        hi: {
          spoken: "संवाद पुनः आरंभ किया गया। नया प्रश्न पूछने के लिए माइक दबाएं।",
          display: "संवाद पुनः आरंभ किया गया। आप नया प्रश्न पूछ सकते हैं।",
          prompts: ["पीएम-किसान योजना", "आयुष्मान भारत कार्ड", "मेरी पात्रता जांचें"]
        },
        en: {
          spoken: "Conversation reset. Tap the microphone to ask a new question.",
          display: "Conversation reset. Speak naturally to explore any government scheme.",
          prompts: ["Tell me about PM-KISAN", "How to get Ayushman Card?", "Check my eligibility"]
        }
      };
      const w = initialWelcomes[activeLang] || initialWelcomes.en;
      setConversation([{
        id: `reset-${Date.now()}`,
        role: "assistant",
        spokenText: w.spoken,
        displayText: w.display,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setSuggestedPrompts(w.prompts);
    } else {
      initiateInterview(activeLang);
    }
  };

  // Main input processor
  const handleSpokenInput = async (userInput: string) => {
    stopListening();
    setLiveTranscript("");
    setStatus("PROCESSING");

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append Citizen Turn to History
    const citizenMsg: ChatHistoryItem = {
      id: `citizen-${Date.now()}`,
      role: "citizen",
      displayText: userInput,
      timestamp: timeStr,
    };
    setConversation((prev) => [...prev, citizenMsg]);

    if (mode === "ELIGIBILITY") {
      await handleInterviewAnswer(userInput);
    } else {
      await handleConversationTurn(userInput, timeStr);
    }
  };

  // Turn in Free Conversation Mode
  const handleConversationTurn = async (queryText: string, timeStr: string) => {
    try {
      // Map previous turns to backend schema
      const historyPayload: VoiceMessage[] = conversation.map((m) => ({
        role: m.role,
        content: m.displayText,
        scheme_id: m.schemeId,
      }));

      const resp: VoiceChatResponse = await sendVoiceChat(
        queryText,
        activeLang,
        activeSchemeId,
        historyPayload,
        profileContext,
        simplicityMode,
        speechSpeed
      );

      if (resp.active_scheme_id) {
        setActiveSchemeId(resp.active_scheme_id);
      }
      if (resp.extracted_profile) {
        setProfileContext((prev) => ({ ...prev, ...resp.extracted_profile }));
      }

      const assistantMsg: ChatHistoryItem = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        spokenText: resp.spoken_text,
        displayText: resp.display_text,
        timestamp: timeStr,
        schemeId: resp.active_scheme_id,
        citations: resp.citations || [],
      };

      setConversation((prev) => [...prev, assistantMsg]);
      setSuggestedPrompts(resp.suggested_spoken_prompts || []);

      // Speak answer out loud
      speakText(resp.spoken_text);
    } catch (err) {
      console.error("Voice conversation failed", err);
      const fallback =
        activeLang === "kn"
          ? "ಕ್ಷಮಿಸಿ, ಧ್ವನಿ ಸಂಸ್ಕರಣೆಯಲ್ಲಿ ತೊಂದರೆಯಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೊಮ್ಮೆ ಮಾತನಾಡಿ."
          : activeLang === "hi"
          ? "क्षमा करें, आवाज़ सेवा से संपर्क नहीं हो पाया। कृपया पुनः बोलें।"
          : "I'm sorry, I encountered an issue. Please try speaking once more.";

      setConversation((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: "assistant",
          spokenText: fallback,
          displayText: fallback,
          timestamp: timeStr,
        }
      ]);
      speakText(fallback);
    }
  };

  // Turn in Guided Spoken Eligibility Interview Mode
  const initiateInterview = async (lang: string) => {
    setStatus("PROCESSING");
    try {
      const state = await startVoiceInterview(lang);
      setInterviewSession(state);
      if (state.current_question) {
        const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        setConversation([
          {
            id: `interview-${Date.now()}`,
            role: "assistant",
            spokenText: state.current_question.question_spoken,
            displayText: state.current_question.question_display,
            timestamp: timeStr,
            isInterviewQuestion: true,
          }
        ]);
        speakText(state.current_question.question_spoken);
      }
    } catch (err) {
      console.error("Failed to start voice interview", err);
      setStatus("IDLE");
    }
  };

  const handleInterviewAnswer = async (spokenAns: string) => {
    if (!interviewSession) {
      await initiateInterview(activeLang);
      return;
    }

    try {
      const updated = await submitVoiceAnswer(
        interviewSession.session_id,
        spokenAns,
        activeLang
      );
      setInterviewSession(updated);

      const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

      if (updated.is_completed && updated.verdict_spoken) {
        setConversation((prev) => [
          ...prev,
          {
            id: `verdict-${Date.now()}`,
            role: "assistant",
            spokenText: updated.verdict_spoken,
            displayText: updated.verdict_spoken || "",
            timestamp: timeStr,
          }
        ]);
        speakText(updated.verdict_spoken);
      } else if (updated.current_question) {
        setConversation((prev) => [
          ...prev,
          {
            id: `q-${Date.now()}`,
            role: "assistant",
            spokenText: updated.current_question?.question_spoken,
            displayText: updated.current_question?.question_display || "",
            timestamp: timeStr,
            isInterviewQuestion: true,
          }
        ]);
        if (updated.current_question.question_spoken) {
          speakText(updated.current_question.question_spoken);
        }
      }
    } catch (err) {
      console.error("Voice interview answer failed", err);
      setStatus("IDLE");
    }
  };

  const changeLanguage = (newLang: "kn" | "hi" | "en") => {
    stopSpeaking();
    stopListening();
    setActiveLang(newLang);
    setLocale(newLang as Locale);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5 py-2 px-2 sm:px-4">
      {/* 1. Civic Public Service Header & Language Switcher */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col sm:flex-row justify-between items-center gap-3 border-b-2 border-amber-500">
        <div className="flex items-center space-x-3 w-full sm:w-auto">
          <Link
            href="/"
            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl transition-colors text-slate-300 hover:text-white shrink-0"
            aria-label="Back to SchemeSaathi Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-white">
                {activeLang === "kn"
                  ? "ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ"
                  : activeLang === "hi"
                  ? "स्कीमसाथी आवाज़ सहायक"
                  : "SchemeSaathi AI Voice Assistant"}
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              {activeLang === "kn"
                ? "ಕೇವಲ ಮಾತನಾಡಿ • ಅಧಿಕೃತ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳು"
                : activeLang === "hi"
                ? "सिर्फ बोलिए • सत्यापित सरकारी योजनाएं"
                : "Spoken Welfare Guidance • Deterministic Eligibility"}
            </p>
          </div>
        </div>

        {/* Large Prominent Spoken Language Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-800 p-1 rounded-xl border border-slate-700 self-end sm:self-auto">
          <Globe className="w-4 h-4 text-slate-400 ml-2 mr-1 hidden sm:inline" />
          {(["kn", "hi", "en"] as const).map((l) => (
            <button
              key={l}
              onClick={() => changeLanguage(l)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeLang === l
                  ? "bg-amber-500 text-slate-950 font-extrabold shadow"
                  : "text-slate-300 hover:bg-slate-700 hover:text-white"
              }`}
            >
              {l === "kn" ? "ಕನ್ನಡ" : l === "hi" ? "हिन्दी" : "English"}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Dialogue Mode Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/80 p-1 rounded-2xl border border-slate-300">
        <button
          onClick={() => {
            stopSpeaking();
            setMode("CONVERSATION");
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mode === "CONVERSATION"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>
            {activeLang === "kn"
              ? "ಮುಕ್ತ ಧ್ವನಿ ಸಂಭಾಷಣೆ (Free Voice)"
              : activeLang === "hi"
              ? "खुली आवाज़ बातचीत (Free Voice)"
              : "Voice Scheme Discovery"}
          </span>
        </button>

        <button
          onClick={() => {
            stopSpeaking();
            setMode("ELIGIBILITY");
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mode === "ELIGIBILITY"
              ? "bg-white text-slate-900 shadow-sm border border-slate-200"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {activeLang === "kn"
              ? "ಧ್ವನಿ ಅರ್ಹತಾ ಸಂದರ್ಶನ (Interview)"
              : activeLang === "hi"
              ? "बोलकर पात्रता जांच (Interview)"
              : "Spoken Eligibility Interview"}
          </span>
        </button>
      </div>

      {/* 3. Central Focused Voice Stage */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-8 text-center space-y-5 relative overflow-hidden">
        {/* Active Audio Waveform */}
        <div className="flex justify-center">
          <canvas
            ref={canvasRef}
            width={340}
            height={44}
            className="rounded-xl w-full max-w-sm h-11"
          />
        </div>

        {/* State Label */}
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            {status === "LISTENING"
              ? activeLang === "kn"
                ? "ಮಾತನಾಡಿ, ನಾನು ಆಲಿಸುತ್ತಿದ್ದೇನೆ..."
                : activeLang === "hi"
                ? "बोलिए, मैं सुन रहा हूँ..."
                : "Listening... Speak naturally"
              : status === "SPEAKING"
              ? activeLang === "kn"
                ? "ಸಹಾಯಕ ಮಾತನಾಡುತ್ತಿದ್ದಾನೆ..."
                : activeLang === "hi"
                ? "सहायक उत्तर दे रहा है..."
                : "SchemeSaathi is speaking..."
              : status === "PROCESSING"
              ? activeLang === "kn"
                ? "ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..."
                : activeLang === "hi"
                ? "सत्यापन किया जा रहा है..."
                : "Retrieving verified records..."
              : activeLang === "kn"
              ? "ಮಾತನಾಡಲು ಮೈಕ್ರೋಫೋನ್ ಒತ್ತಿ"
              : activeLang === "hi"
              ? "बोलने के लिए माइक दबाएं"
              : "Tap Microphone to Speak"}
          </h2>
          <p className="text-xs text-slate-500">
            {activeLang === "kn"
              ? "ಕೃಷಿ, ಆರೋಗ್ಯ, ವಿದ್ಯಾರ್ಥಿವೇತನ, ಅಥವಾ ನಿಮ್ಮ ಪರಿಸ್ಥಿತಿಯನ್ನು ಕನ್ನಡದಲ್ಲೇ ಹೇಳಿ."
              : activeLang === "hi"
              ? "कृषि, स्वास्थ्य, छात्रवृत्ति या अपनी स्थिति के बारे में बोलकर बताएं।"
              : "Explain your situation (e.g. 'I am a 55-year-old farmer') to hear verified benefits."}
          </p>
        </div>

        {/* Giant Tactile Microphone Button */}
        <div className="flex justify-center items-center py-1">
          <button
            onClick={status === "LISTENING" ? stopListening : startListening}
            aria-label="Toggle Microphone"
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl relative select-none ${
              status === "LISTENING"
                ? "bg-amber-600 text-white ring-8 ring-amber-200 animate-pulse scale-105"
                : status === "SPEAKING"
                ? "bg-emerald-600 text-white ring-8 ring-emerald-200"
                : "bg-slate-900 hover:bg-slate-800 text-white ring-4 ring-slate-100 hover:scale-105"
            }`}
          >
            {status === "LISTENING" ? (
              <Mic className="w-12 h-12 text-white" />
            ) : status === "SPEAKING" ? (
              <Volume2 className="w-12 h-12 text-white animate-bounce" />
            ) : (
              <Mic className="w-12 h-12 text-amber-400" />
            )}
            <span className="text-xs font-bold mt-1 tracking-tight">
              {status === "LISTENING"
                ? activeLang === "kn" ? "ನಿಲ್ಲಿಸಿ" : activeLang === "hi" ? "रोकें" : "Stop"
                : status === "SPEAKING"
                ? activeLang === "kn" ? "ಕೇಳಿಸಿಕೊಳ್ಳಿ" : activeLang === "hi" ? "सुनें" : "Listening"
                : activeLang === "kn" ? "ಮಾತನಾಡಿ" : activeLang === "hi" ? "बोलिए" : "Tap to Speak"}
            </span>
          </button>
        </div>

        {/* Live Audio Transcription Bubble */}
        {liveTranscript && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-amber-900 italic animate-pulse max-w-md mx-auto">
            "{liveTranscript}"
          </div>
        )}

        {/* 4. Action Controls Bar (Human-Centered Public Service Tools) */}
        <div className="flex flex-wrap justify-center items-center gap-2 pt-2 border-t border-slate-100">
          {/* Repeat Answer */}
          <button
            onClick={repeatLastAnswer}
            disabled={conversation.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
            <span>
              {activeLang === "kn" ? "ಮತ್ತೊಮ್ಮೆ ಹೇಳಿ" : activeLang === "hi" ? "दोबारा सुनें" : "Repeat"}
            </span>
          </button>

          {/* Speak Slower */}
          <button
            onClick={speakSlower}
            disabled={conversation.length === 0}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <Sliders className="w-3.5 h-3.5 text-slate-600" />
            <span>
              {activeLang === "kn" ? "ನಿಧಾನವಾಗಿ ಹೇಳಿ (0.8x)" : activeLang === "hi" ? "धीरे बोलें (0.8x)" : "Speak Slower"}
            </span>
          </button>

          {/* Explain More Simply */}
          <button
            onClick={explainSimply}
            disabled={conversation.length === 0}
            className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-40"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>
              {activeLang === "kn" ? "ಸರಳವಾಗಿ ಹೇಳಿ" : activeLang === "hi" ? "आसान भाषा में" : "Explain Simply"}
            </span>
          </button>

          {/* Pause / Resume */}
          {(status === "SPEAKING" || isPaused) && (
            <button
              onClick={pauseResumeSpeaking}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            >
              {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-amber-600" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>
          )}

          {/* Reset / Clear Conversation */}
          <button
            onClick={resetConversation}
            className="px-3 py-2 text-slate-500 hover:text-slate-800 rounded-xl text-xs font-medium flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>
              {activeLang === "kn" ? "ಹೊಸ ಸಂಭಾಷಣೆ" : activeLang === "hi" ? "नया संवाद" : "Reset"}
            </span>
          </button>
        </div>

        {/* 5. Suggested Spoken Prompts Pills */}
        {suggestedPrompts.length > 0 && (
          <div className="space-y-1.5 pt-1 text-left">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeLang === "kn"
                ? "ನೀವು ಹೀಗೂ ಕೇಳಬಹುದು (Tap to speak):"
                : activeLang === "hi"
                ? "आप ऐसे भी बोल सकते हैं (टैप करें):"
                : "Suggested questions you can speak (tap to ask):"}
            </span>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSpokenInput(p)}
                  className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-900 border border-slate-200 hover:border-blue-300 rounded-full text-xs font-medium cursor-pointer transition-colors text-left"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 6. Multi-Turn Conversation Thread Feed */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wide">
              {activeLang === "kn"
                ? "ಸಂಭಾಷಣೆಯ ವಿವರ (Conversation Transcript)"
                : activeLang === "hi"
                ? "बातचीत का विवरण (Transcript)"
                : "Conversation Transcript & Grounding"}
            </h3>
          </div>
          {profileContext && Object.keys(profileContext).length > 0 && (
            <span className="text-[11px] bg-blue-50 text-blue-800 px-2.5 py-0.5 rounded-full font-semibold border border-blue-200">
              Context: {profileContext.occupation || "citizen"} {profileContext.age ? `• ${profileContext.age} yrs` : ""} {profileContext.state ? `• ${profileContext.state}` : ""}
            </span>
          )}
        </div>

        <div
          ref={chatScrollRef}
          className="space-y-4 max-h-96 overflow-y-auto pr-1 scroll-smooth"
        >
          {conversation.map((item) => (
            <div
              key={item.id}
              className={`flex flex-col ${item.role === "citizen" ? "items-end" : "items-start"}`}
            >
              {/* Turn Bubble */}
              <div
                className={`max-w-xl rounded-2xl p-4 text-sm shadow-sm space-y-2 ${
                  item.role === "citizen"
                    ? "bg-slate-900 text-white rounded-tr-sm"
                    : "bg-slate-50 border border-slate-200 text-slate-900 rounded-tl-sm"
                }`}
              >
                <div className="flex items-center justify-between space-x-2 pb-1 border-b border-black/10 text-xs">
                  <div className="flex items-center space-x-1.5 font-bold">
                    {item.role === "citizen" ? (
                      <>
                        <User className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-amber-300">
                          {activeLang === "kn" ? "ನೀವು ಹೇಳಿದ್ದು" : activeLang === "hi" ? "आपने कहा" : "You said"}
                        </span>
                      </>
                    ) : (
                      <>
                        <Bot className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-slate-700">SchemeSaathi</span>
                      </>
                    )}
                  </div>
                  <span className={`text-[10px] ${item.role === "citizen" ? "text-slate-400" : "text-slate-400"}`}>
                    {item.timestamp}
                  </span>
                </div>

                <div className="leading-relaxed whitespace-pre-line text-xs sm:text-sm font-normal">
                  {item.displayText}
                </div>

                {/* Citations Box */}
                {item.citations && item.citations.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 text-[11px]">
                    <span className="text-slate-500 font-semibold flex items-center space-x-1">
                      <FileCheck2 className="w-3 h-3 text-blue-600" />
                      <span>Official Source:</span>
                    </span>
                    {item.citations.map((c, i) => (
                      <a
                        key={i}
                        href={c.official_portal_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline font-bold inline-flex items-center space-x-0.5"
                      >
                        <span>{c.scheme_name}</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}

          {status === "PROCESSING" && (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-3 max-w-xs">
              <div className="w-3.5 h-3.5 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              <span>
                {activeLang === "kn"
                  ? "ಅಧಿಕೃತ ನಿಯಮಗಳನ್ನು ಪರಿಶೀಲಿಸಲಾಗುತ್ತಿದೆ..."
                  : activeLang === "hi"
                  ? "आधिकारिक नियमों की जांच जारी है..."
                  : "Analyzing official rules & eligibility..."}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 7. Fallback Accessibility Drawer: Text Input & Mic Help */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
        {micPermissionDenied && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">
                {activeLang === "kn"
                  ? "ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ನಿರ್ಬಂಧಿಸಲಾಗಿದೆ"
                  : activeLang === "hi"
                  ? "माइक की अनुमति नहीं मिली"
                  : "Microphone Access Denied"}
              </p>
              <p className="text-[11px] text-amber-800">
                {activeLang === "kn"
                  ? "ನಿಮ್ಮ ಬ್ರೌಸರ್ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ ಮೈಕ್ ಅನುಮತಿಸಿ, ಅಥವಾ ಕೆಳಗಿನ ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ಟೈಪ್ ಮಾಡಿ ಕಳುಹಿಸಿ."
                  : activeLang === "hi"
                  ? "ब्राउज़र में माइक की अनुमति दें, या नीचे दिए बॉक्स में लिखकर पूछें।"
                  : "Enable microphone permission in your browser, or type your question below."}
              </p>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textFallbackInput.trim()) {
              handleSpokenInput(textFallbackInput.trim());
              setTextFallbackInput("");
            }
          }}
          className="flex items-center space-x-2"
        >
          <input
            type="text"
            value={textFallbackInput}
            onChange={(e) => setTextFallbackInput(e.target.value)}
            placeholder={
              activeLang === "kn"
                ? "ಟೈಪ್ ಮಾಡಿ ಕೇಳಲು ಇಲ್ಲಿ ಬರೆಯಿರಿ (Type query here)..."
                : activeLang === "hi"
                ? "लिखकर पूछने के लिए यहाँ टाइप करें..."
                : "Type here if in a noisy environment or mic is disabled..."
            }
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 bg-slate-50 text-slate-900"
          />
          <button
            type="submit"
            disabled={!textFallbackInput.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
          >
            <span>{activeLang === "kn" ? "ಕಳುಹಿಸಿ" : activeLang === "hi" ? "भेजें" : "Send"}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* 8. Citizen Trust & Privacy Assurance Banner */}
      <div className="bg-slate-100 rounded-xl p-3 text-slate-600 text-xs flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {activeLang === "kn"
              ? "ಗೌಪ್ಯತೆಯ ಭರವಸೆ: ನಿಮ್ಮ ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ ಅನ್ನು ನಾವು ಶಾಶ್ವತವಾಗಿ ಸಂಗ್ರಹಿಸುವುದಿಲ್ಲ."
              : activeLang === "hi"
              ? "गोपनीयता आश्वासन: हम आपकी ऑडियो रिकॉर्डिंग को स्थायी रूप से स्टोर नहीं करते।"
              : "Privacy Assurance: Spoken voice is processed in-memory and not stored as raw surveillance audio."}
          </span>
        </div>
        <span className="text-[10px] text-slate-400 hidden sm:inline">AST Evaluator + Grounded RAG</span>
      </div>
    </div>
  );
}

export default function VoiceAssistantPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-4xl mx-auto py-12 text-center text-slate-500">
          Loading Voice Assistant...
        </div>
      }
    >
      <VoiceAssistantContent />
    </React.Suspense>
  );
}
