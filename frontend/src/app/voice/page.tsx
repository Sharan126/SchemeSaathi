"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { Locale, VoiceChatResponse, VoiceInterviewState } from "@/types";
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
      // Warm response ready tone (523Hz -> 784Hz)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
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
  const [lastUserSpoken, setLastUserSpoken] = useState("");
  const [assistantSpoken, setAssistantSpoken] = useState("");
  const [assistantDisplay, setAssistantDisplay] = useState("");
  const [speechSpeed, setSpeechSpeed] = useState<number>(1.0);
  const [isPaused, setIsPaused] = useState(false);
  const [micPermissionDenied, setMicPermissionDenied] = useState(false);
  const [textFallbackInput, setTextFallbackInput] = useState("");
  const [citations, setCitations] = useState<any[]>([]);
  const [suggestedPrompts, setSuggestedPrompts] = useState<string[]>([]);

  // Interview state
  const [interviewSession, setInterviewSession] = useState<VoiceInterviewState | null>(null);

  // Audio Recognition and Synthesis Refs
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const currentUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Sync active language with global language context
  useEffect(() => {
    if (["kn", "hi", "en"].includes(locale)) {
      setActiveLang(locale as "kn" | "hi" | "en");
    }
  }, [locale]);

  // Initial welcome greeting
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
    }

    if (mode === "CONVERSATION") {
      const initialWelcomes = {
        kn: "ನಮಸ್ಕಾರ! ನಾನು ನಿಮ್ಮ ಸ್ಕೀಮ್‌ಸಾಥಿ ಧ್ವನಿ ಸಹಾಯಕ. ನೀವು ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್, ಆಯುಷ್ಮಾನ್ ಕಾರ್ಡ್, ಅಥವಾ ಯಾವುದೇ ಸರ್ಕಾರಿ ಯೋಜನೆಗಳ ಬಗ್ಗೆ ಕೇಳಬಹುದು. ಮಾತನಾಡಲು ಮೈಕ್ರೋಫೋನ್ ಬಟನ್ ಒತ್ತಿ.",
        hi: "नमस्ते! मैं आपका स्कीमसाथी आवाज़ सहायक हूँ। आप पीएम-किसान, आयुष्मान भारत कार्ड, या किसी भी सरकारी योजना के बारे में पूछ सकते हैं। बोलने के लिए नीचे दिए गए माइक बटन को दबाएं।",
        en: "Hello! I am your SchemeSaathi voice assistant. You can ask me about farmer support, health cards, scholarships, or any government scheme. Tap the microphone button and speak naturally.",
      };
      const welcome = initialWelcomes[activeLang] || initialWelcomes.en;
      setAssistantSpoken(welcome);
      setAssistantDisplay(welcome);
      setSuggestedPrompts(
        activeLang === "kn"
          ? ["ರೈತರ ಪಿಎಂ-ಕಿಸಾನ್ ಯೋಜನೆ", "ಆಯುಷ್ಮಾನ್ ಆರೋಗ್ಯ ಕಾರ್ಡ್", "ನನ್ನ ಅರ್ಹತೆ ಪರೀಕ್ಷಿಸಿ"]
          : activeLang === "hi"
          ? ["पीएम-किसान योजना", "आयुष्मान भारत कार्ड", "मेरी पात्रता जांचें"]
          : ["PM-KISAN scheme", "Ayushman Health Card", "Check my eligibility"]
      );
    } else {
      initiateInterview(activeLang);
    }

    return () => {
      stopSpeaking();
      stopListening();
    };
  }, [activeLang, mode]);

  // Animated Audio Waveform for Visual Feedback
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
        ctx.strokeStyle = status === "LISTENING" ? "#EA580C" : "#059669";

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
        // Flat gentle baseline when idle
        ctx.beginPath();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "#CBD5E1";
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
      alert(
        activeLang === "kn"
          ? "ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್ ಬೆಂಬಲವಿಲ್ಲ. ದಯವಿಟ್ಟು ಟೆಕ್ಸ್ಟ್ ಮೂಲಕ ಪ್ರಶ್ನೆ ಕೇಳಿ."
          : activeLang === "hi"
          ? "आपके ब्राउज़र में आवाज़ पहचान उपलब्ध नहीं है। कृपया लिखकर प्रश्न पूछें।"
          : "Speech recognition is not supported in this browser. Please use text input below."
      );
      return;
    }

    try {
      playToneChime("start");
      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      // Map language code for Web Speech API
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

  // Text to Speech playback with Indian natural voices
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

  const repeatAnswer = () => {
    if (assistantSpoken) {
      speakText(assistantSpoken);
    }
  };

  // Main input processor
  const handleSpokenInput = async (userInput: string) => {
    stopListening();
    setStatus("PROCESSING");
    setLastUserSpoken(userInput);

    if (mode === "ELIGIBILITY") {
      await handleInterviewAnswer(userInput);
    } else {
      await handleConversationTurn(userInput);
    }
  };

  // Turn in Free Conversation Mode
  const handleConversationTurn = async (queryText: string) => {
    try {
      const resp: VoiceChatResponse = await sendVoiceChat(queryText, activeLang);
      setAssistantSpoken(resp.spoken_text);
      setAssistantDisplay(resp.display_text);
      setCitations(resp.citations || []);
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
      setAssistantSpoken(fallback);
      setAssistantDisplay(fallback);
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
        setAssistantSpoken(state.current_question.question_spoken);
        setAssistantDisplay(state.current_question.question_display);
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

      if (updated.is_completed && updated.verdict_spoken) {
        setAssistantSpoken(updated.verdict_spoken);
        setAssistantDisplay(updated.verdict_spoken);
        speakText(updated.verdict_spoken);
      } else if (updated.current_question) {
        setAssistantSpoken(updated.current_question.question_spoken);
        setAssistantDisplay(updated.current_question.question_display);
        speakText(updated.current_question.question_spoken);
      }
    } catch (err) {
      console.error("Voice interview answer failed", err);
      setStatus("IDLE");
    }
  };

  const restartInterview = () => {
    stopSpeaking();
    initiateInterview(activeLang);
  };

  const changeLanguage = (newLang: "kn" | "hi" | "en") => {
    stopSpeaking();
    stopListening();
    setActiveLang(newLang);
    setLocale(newLang as Locale);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2 px-2 sm:px-4">
      {/* Top Navigation & Language Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <Link
          href="/"
          className="inline-flex items-center space-x-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-gov-blue"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{activeLang === "kn" ? "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ" : activeLang === "hi" ? "मुख्य पृष्ठ" : "Back to Home"}</span>
        </Link>

        {/* Large Prominent Spoken Language Switcher */}
        <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl">
          <Globe className="w-4 h-4 text-slate-500 ml-1.5 hidden sm:inline" />
          <button
            onClick={() => changeLanguage("kn")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeLang === "kn"
                ? "bg-gov-blue text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            ಕನ್ನಡ
          </button>
          <button
            onClick={() => changeLanguage("hi")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeLang === "hi"
                ? "bg-gov-blue text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            हिन्दी
          </button>
          <button
            onClick={() => changeLanguage("en")}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeLang === "en"
                ? "bg-gov-blue text-white shadow-sm"
                : "text-slate-700 hover:bg-slate-200"
            }`}
          >
            English
          </button>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1.5 rounded-2xl border border-slate-300">
        <button
          onClick={() => {
            stopSpeaking();
            setMode("CONVERSATION");
          }}
          className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 transition-all cursor-pointer ${
            mode === "CONVERSATION"
              ? "bg-white text-gov-blue shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>
            {activeLang === "kn"
              ? "ಮುಕ್ತ ಧ್ವನಿ ಸಂಭಾಷಣೆ"
              : activeLang === "hi"
              ? "खुली आवाज़ बातचीत"
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
              ? "bg-white text-gov-blue shadow-sm"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>
            {activeLang === "kn"
              ? "ಧ್ವನಿ ಅರ್ಹತಾ ಸಂದರ್ಶನ"
              : activeLang === "hi"
              ? "बोलकर पात्रता जांचें"
              : "Spoken Eligibility Interview"}
          </span>
        </button>
      </div>

      {/* Main Voice Display & Interactive Canvas Card */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-md p-6 sm:p-10 text-center space-y-6 relative overflow-hidden">
        {/* Top Civic Trust Badge */}
        <div className="inline-flex items-center space-x-2 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3.5 py-1 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>
            {activeLang === "kn"
              ? "ಕೇವಲ ಮಾತನಾಡಿ • ಅಧಿಕೃತ ಸರ್ಕಾರಿ ವಿವರಗಳು"
              : activeLang === "hi"
              ? "सिर्फ बोलिए • आधिकारिक सरकारी योजनाएं"
              : "Just Speak • Official Government Welfare"}
          </span>
        </div>

        {/* Spoken Status Title */}
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            {status === "LISTENING"
              ? activeLang === "kn"
                ? "ಮಾತನಾಡಿ, ನಾನು ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇನೆ..."
                : activeLang === "hi"
                ? "बोलिए, मैं सुन रहा हूँ..."
                : "Listening... Speak now"
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
                : "Verifying official rules..."
              : activeLang === "kn"
              ? "ಮಾತನಾಡಲು ಮೈಕ್ ಬಟನ್ ಒತ್ತಿ"
              : activeLang === "hi"
              ? "बोलने के लिए माइक बटन दबाएं"
              : "Tap Microphone to Speak"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            {activeLang === "kn"
              ? "ಯಾವುದೇ ಅರ್ಜಿ ಬರೆಯುವ ಅಗತ್ಯವಿಲ್ಲ. ಸರಳವಾಗಿ ಕನ್ನಡದಲ್ಲೇ ಮಾತನಾಡಿ."
              : activeLang === "hi"
              ? "कुछ भी टाइप करने की ज़रूरत नहीं है। अपनी भाषा में बोलिए।"
              : "No typing required. Speak naturally in your preferred language."}
          </p>
        </div>

        {/* Live Audio Visualizer Canvas */}
        <div className="flex justify-center py-1">
          <canvas
            ref={canvasRef}
            width={340}
            height={48}
            className="rounded-xl w-full max-w-sm h-12"
          />
        </div>

        {/* Giant Interactive Microphone Button */}
        <div className="flex justify-center items-center py-2">
          <button
            onClick={status === "LISTENING" ? stopListening : startListening}
            aria-label="Toggle Microphone"
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center transition-all cursor-pointer shadow-xl relative ${
              status === "LISTENING"
                ? "bg-orange-600 text-white ring-8 ring-orange-200 animate-pulse scale-105"
                : status === "SPEAKING"
                ? "bg-emerald-600 text-white ring-8 ring-emerald-200"
                : "bg-gov-blue hover:bg-blue-700 text-white ring-4 ring-blue-100 hover:scale-105"
            }`}
          >
            {status === "LISTENING" ? (
              <Mic className="w-12 h-12 sm:w-14 sm:h-14" />
            ) : status === "SPEAKING" ? (
              <Volume2 className="w-12 h-12 sm:w-14 sm:h-14" />
            ) : (
              <Mic className="w-12 h-12 sm:w-14 sm:h-14" />
            )}
            <span className="text-[11px] sm:text-xs font-bold mt-1 tracking-tight">
              {status === "LISTENING"
                ? activeLang === "kn" ? "ನಿಲ್ಲಿಸಿ" : activeLang === "hi" ? "रोकें" : "Stop"
                : activeLang === "kn" ? "ಮಾತನಾಡಿ" : activeLang === "hi" ? "बोलिए" : "Tap to Speak"}
            </span>
          </button>
        </div>

        {/* Spoken / Recognized Audio Text Display */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-6 text-left space-y-3">
          {lastUserSpoken && (
            <div className="text-xs sm:text-sm font-semibold text-slate-500 flex items-center space-x-2">
              <span className="bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded-full text-xs">
                {activeLang === "kn" ? "ನೀವು ಹೇಳಿದ್ದು:" : activeLang === "hi" ? "आपने कहा:" : "You said:"}
              </span>
              <span className="text-slate-800 italic">"{lastUserSpoken}"</span>
            </div>
          )}

          {/* Assistant Answer Box */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-gov-blue uppercase tracking-wider block">
              {activeLang === "kn"
                ? "ಸ್ಕೀಮ್‌ಸಾಥಿ ಸಹಾಯಕನ ಧ್ವನಿ ವಿವರ:"
                : activeLang === "hi"
                ? "स्कीमसाथी सहायक का विवरण:"
                : "SchemeSaathi Voice Response:"}
            </span>
            <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
              {assistantDisplay || assistantSpoken}
            </p>
          </div>

          {/* Citations Link if present */}
          {citations.length > 0 && (
            <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center gap-2">
              <span className="text-xs text-slate-500 font-semibold flex items-center space-x-1">
                <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Official Source:</span>
              </span>
              {citations.map((c, i) => (
                <a
                  key={i}
                  href={c.official_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-gov-blue hover:underline font-semibold inline-flex items-center space-x-1"
                >
                  <span>{c.scheme_name}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              ))}
            </div>
          )}
        </div>

        {/* Voice Playback Controls Row */}
        <div className="flex flex-wrap justify-center items-center gap-2.5 pt-1">
          {/* Repeat Answer */}
          <button
            onClick={repeatAnswer}
            disabled={!assistantSpoken}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4 text-slate-600" />
            <span>
              {activeLang === "kn" ? "ಮರುಹೇಳಿ (Repeat)" : activeLang === "hi" ? "दोबारा सुनें" : "Repeat"}
            </span>
          </button>

          {/* Pause / Resume */}
          {status === "SPEAKING" || isPaused ? (
            <button
              onClick={pauseResumeSpeaking}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              {isPaused ? <Play className="w-4 h-4 text-emerald-600" /> : <Pause className="w-4 h-4 text-orange-600" />}
              <span>{isPaused ? "Resume" : "Pause"}</span>
            </button>
          ) : null}

          {/* Speed Toggle */}
          <div className="flex items-center space-x-1 bg-slate-100 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700">
            <span>Speed:</span>
            {[0.8, 1.0, 1.2].map((s) => (
              <button
                key={s}
                onClick={() => setSpeechSpeed(s)}
                className={`px-2 py-0.5 rounded text-[11px] cursor-pointer ${
                  speechSpeed === s ? "bg-gov-blue text-white font-bold" : "hover:bg-slate-200"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>

          {/* Restart Interview if in eligibility mode */}
          {mode === "ELIGIBILITY" && (
            <button
              onClick={restartInterview}
              className="px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>
                {activeLang === "kn" ? "ಮರುಪ್ರಾರಂಭಿಸಿ" : activeLang === "hi" ? "शुरू से करें" : "Restart Interview"}
              </span>
            </button>
          )}
        </div>

        {/* Suggested Voice Prompts */}
        {suggestedPrompts.length > 0 && (
          <div className="space-y-2 pt-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              {activeLang === "kn"
                ? "ನೀವು ಹೀಗೂ ಕೇಳಬಹುದು (Tap to speak):"
                : activeLang === "hi"
                ? "आप ऐसे भी बोल सकते हैं:"
                : "Suggested questions you can speak:"}
            </span>
            <div className="flex flex-wrap justify-center gap-2">
              {suggestedPrompts.map((p, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSpokenInput(p)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-gov-blue border border-slate-200 hover:border-blue-300 rounded-full text-xs font-medium cursor-pointer transition-colors"
                >
                  "{p}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Microphone Permission Help Banner */}
        {micPermissionDenied && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 flex items-start space-x-2 text-left">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold">
                {activeLang === "kn"
                  ? "ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿ ಅಗತ್ಯವಿದೆ"
                  : activeLang === "hi"
                  ? "माइक्रोफ़ोन की अनुमति चाहिए"
                  : "Microphone Permission Required"}
              </span>
              <p>
                {activeLang === "kn"
                  ? "ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮೈಕ್ರೋಫೋನ್ ಅನುಮತಿಸಿ ಅಥವಾ ಕೆಳಗಿರುವ ಪೆಟ್ಟಿಗೆಯಲ್ಲಿ ನೇರವಾಗಿ ಬರೆದು ಕಳುಹಿಸಿ."
                  : activeLang === "hi"
                  ? "कृपया अपने ब्राउज़र में माइक की अनुमति दें या नीचे लिखकर भेजें।"
                  : "Please allow microphone access in your browser, or type your question below."}
              </p>
            </div>
          </div>
        )}

        {/* Fallback Text Input for Accessibility */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (textFallbackInput.trim()) {
              handleSpokenInput(textFallbackInput.trim());
              setTextFallbackInput("");
            }
          }}
          className="flex items-center space-x-2 pt-2"
        >
          <input
            type="text"
            value={textFallbackInput}
            onChange={(e) => setTextFallbackInput(e.target.value)}
            placeholder={
              activeLang === "kn"
                ? "ಟೈಪ್ ಮಾಡಿ ಕೇಳಲು ಇಲ್ಲಿ ಬರೆಯಿರಿ..."
                : activeLang === "hi"
                ? "लिखकर पूछने के लिए यहाँ टाइप करें..."
                : "Type here if you prefer typing..."
            }
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50"
          />
          <button
            type="submit"
            disabled={!textFallbackInput.trim()}
            className="px-4 py-2.5 bg-gov-blue hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center space-x-1.5 cursor-pointer disabled:opacity-40"
          >
            <span>{activeLang === "kn" ? "ಕಳುಹಿಸಿ" : activeLang === "hi" ? "भेजें" : "Send"}</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Low-Literacy Guidance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {activeLang === "kn" ? "1. ಕೇವಲ ಮಾತನಾಡಿ" : activeLang === "hi" ? "1. सिर्फ बोलिए" : "1. Just Speak"}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              {activeLang === "kn"
                ? "ಯಾವುದೇ ಅರ್ಜಿ ಭರ್ತಿ ಮಾಡುವ ಅಗತ್ಯವಿಲ್ಲ."
                : activeLang === "hi"
                ? "कोई भी फॉर्म भरने की ज़रूरत नहीं है।"
                : "No complex forms or typing required."}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {activeLang === "kn" ? "2. ಧ್ವನಿಯಲ್ಲಿ ಕೇಳಿ" : activeLang === "hi" ? "2. आवाज़ में सुनें" : "2. Listen in Audio"}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              {activeLang === "kn"
                ? "ಸ್ಕೀಮ್‌ಸಾಥಿ ನೇರವಾಗಿ ಕನ್ನಡದಲ್ಲೇ ಉತ್ತರಿಸುತ್ತದೆ."
                : activeLang === "hi"
                ? "स्कीमसाथी सरल हिंदी में उत्तर सुनाएगा।"
                : "Hear clear explanations in your language."}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-start space-x-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              {activeLang === "kn" ? "3. ಅರ್ಹತೆ ತಿಳಿಯಿರಿ" : activeLang === "hi" ? "3. पात्रता समझें" : "3. Know Your Rights"}
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed mt-0.5">
              {activeLang === "kn"
                ? "ನಿಮಗೆ ಎಷ್ಟು ಹಣ ಸಿಗುತ್ತದೆ ಎಂದು ತಿಳಿಯಿರಿ."
                : activeLang === "hi"
                ? "जानिए आपको कितना सरकारी लाभ मिलेगा।"
                : "Discover exact grants and benefits."}
            </p>
          </div>
        </div>
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
