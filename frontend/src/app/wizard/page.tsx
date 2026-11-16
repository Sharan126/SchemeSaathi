"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { evaluateEligibility } from "@/lib/api";
import { BatchEvaluationResponse } from "@/types";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Info,
  Mic,
} from "lucide-react";

function WizardContent() {
  const { t, locale } = useLanguage();
  const searchParams = useSearchParams();
  const [targetScheme, setTargetScheme] = useState<string | null>(searchParams.get("scheme"));

  // Wizard Form State (Stored locally in memory, NEVER persisted as PII)
  const [profile, setProfile] = useState<Record<string, any>>({
    occupation: "farmer",
    gender: "female",
    age: 32,
    social_category: "GEN",
    residence_area: "rural",
    annual_income_inr: 120000,
    is_bpl_card_holder: true,
    is_tax_payer: false,
    landholding_hectares: 1.2,
    is_disabled: false,
    disability_percentage: 0,
    is_pregnant_or_lactating: false,
    has_pucca_house: false,
  });

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<BatchEvaluationResponse | null>(null);

  const steps = [
    {
      title: locale === "hi" ? "बुनियादी जानकारी एवं पेशा" : locale === "kn" ? "ಮೂಲ ವಿವರಗಳು ಮತ್ತು ವೃತ್ತಿ" : "Basic Profile & Occupation",
      fields: ["occupation", "gender", "age"],
    },
    {
      title: locale === "hi" ? "क्षेत्र एवं सामाजिक वर्ग" : locale === "kn" ? "ಪ್ರದೇಶ ಮತ್ತು ಸಾಮಾಜಿಕ ವರ್ಗ" : "Residence & Social Category",
      fields: ["residence_area", "social_category"],
    },
    {
      title: locale === "hi" ? "आय एवं आर्थिक स्थिति" : locale === "kn" ? "ಆದಾಯ ಮತ್ತು ಆರ್ಥಿಕ ಸ್ಥಿತಿ" : "Financial & Landholding Details",
      fields: ["annual_income_inr", "is_bpl_card_holder", "is_tax_payer", "landholding_hectares", "has_pucca_house"],
    },
    {
      title: locale === "hi" ? "विशिष्ट परिस्थितियां" : locale === "kn" ? "ವಿಶೇಷ ಸಂದರ್ಭಗಳು" : "Special Circumstances",
      fields: ["is_pregnant_or_lactating", "is_disabled"],
    },
  ];

  const handleFieldChange = (field: string, value: any) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  const handleEvaluate = async () => {
    setLoading(true);
    try {
      const res = await evaluateEligibility(profile, targetScheme || undefined);
      setResults(res);
    } catch (err) {
      console.error("Evaluation failed", err);
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setResults(null);
    setCurrentStep(0);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-2">
      {/* Title & Privacy Notice */}
      <div className="space-y-3 text-center">
        <div className="inline-flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1 rounded-full text-xs font-semibold">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>{t("wizard.anonymous_notice")}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          {t("wizard.title")}
        </h1>
        <p className="text-sm text-slate-600 max-w-xl mx-auto">
          {t("wizard.subtitle")}
        </p>
      </div>

      {targetScheme && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex items-center justify-between text-xs sm:text-sm text-blue-900">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Target Scheme Pre-selected: <strong className="font-semibold">{targetScheme}</strong></span>
          </div>
          <button
            onClick={() => setTargetScheme(null)}
            className="text-xs text-blue-700 hover:text-blue-950 font-semibold underline cursor-pointer"
          >
            Check all schemes instead
          </button>
        </div>
      )}

      {/* Voice Eligibility Mode Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl p-3.5 sm:p-4 shadow-md flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
            <Mic className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <p className="text-xs sm:text-sm font-bold">
              {locale === "kn"
                ? "ಫಾರ್ಮ್ ಓದಲು ಅಥವಾ ಭರ್ತಿ ಮಾಡಲು ಕಷ್ಟವೇ? ಧ್ವನಿ ಮೂಲಕ ಅರ್ಹತೆ ಪರಿಶೀಲಿಸಿ!"
                : locale === "hi"
                ? "फॉर्म भरने में असुविधा? बोलकर अपनी पात्रता की जांच करें!"
                : "Cannot read or fill this form? Check eligibility by speaking!"}
            </p>
            <p className="text-[11px] sm:text-xs text-amber-100">
              {locale === "kn"
                ? "ಕನ್ನಡ, ಹಿಂದಿ ಅಥವಾ ಇಂಗ್ಲಿಷ್‌ನಲ್ಲಿ ನೇರ ಧ್ವನಿ ಸಂದರ್ಶನ"
                : locale === "hi"
                ? "कन्नड़, हिंदी या अंग्रेजी में सीधा बोलचाल साक्षात्कार"
                : "Interactive spoken interview in Kannada, Hindi, or English"}
            </p>
          </div>
        </div>
        <Link
          href="/voice?mode=eligibility"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white text-orange-600 hover:bg-orange-50 font-bold text-xs sm:text-sm rounded-lg shadow transition-all shrink-0"
        >
          <span>{locale === "kn" ? "ಧ್ವನಿ ಆರಂಭಿಸಿ" : locale === "hi" ? "बोलना शुरू करें" : "Speak to Check"}</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {!results ? (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-10 space-y-8">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-500">
              <span>{t("wizard.step_counter")} {currentStep + 1} of {steps.length}: {steps[currentStep].title}</span>
              <span>{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gov-blue transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Step Form Fields */}
          <div className="space-y-6">
            {/* Occupation */}
            {steps[currentStep].fields.includes("occupation") && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  {locale === "hi" ? "आपका मुख्य व्यवसाय क्या है?" : locale === "kn" ? "ನಿಮ್ಮ ಮುಖ್ಯ ಉದ್ಯೋಗ ಯಾವುದು?" : "What is your primary occupation?"}
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { val: "farmer", label: { en: "Farmer", hi: "किसान", kn: "ರೈತ" } },
                    { val: "student", label: { en: "Student", hi: "विद्यार्थी", kn: "ವಿದ್ಯಾರ್ಥಿ" } },
                    { val: "worker", label: { en: "Daily Worker", hi: "श्रमिक", kn: "ಕಾರ್ಮಿಕ" } },
                    { val: "self_employed", label: { en: "Self-Employed", hi: "स्वरोजगार", kn: "ಸ್ವಯಂ ಉದ್ಯೋಗಿ" } },
                    { val: "senior_citizen", label: { en: "Senior Citizen", hi: "वरिष्ठ नागरिक", kn: "ಹಿರಿಯ ನಾಗರಿಕ" } },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleFieldChange("occupation", item.val)}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        profile.occupation === item.val
                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.label[locale] || item.label.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Gender */}
            {steps[currentStep].fields.includes("gender") && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  {locale === "hi" ? "लिंग" : locale === "kn" ? "ಲಿಂಗ" : "Gender"}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: "female", label: { en: "Female", hi: "महिला", kn: "ಮಹಿಳೆ" } },
                    { val: "male", label: { en: "Male", hi: "पुरुष", kn: "ಪುರುಷ" } },
                    { val: "transgender", label: { en: "Transgender", hi: "ट्रांसजेंडर", kn: "ತೃತೀಯಲಿಂಗಿ" } },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleFieldChange("gender", item.val)}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        profile.gender === item.val
                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.label[locale] || item.label.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Age */}
            {steps[currentStep].fields.includes("age") && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  {locale === "hi" ? "आयु (वर्षों में)" : locale === "kn" ? "ವಯಸ್ಸು (ವರ್ಷಗಳಲ್ಲಿ)" : "Age (in years)"}: <span className="text-gov-blue">{profile.age}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={profile.age}
                  onChange={(e) => handleFieldChange("age", parseInt(e.target.value))}
                  className="w-full accent-blue-600 cursor-pointer"
                />
              </div>
            )}

            {/* Residence Area */}
            {steps[currentStep].fields.includes("residence_area") && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  {locale === "hi" ? "निवास क्षेत्र" : locale === "kn" ? "ವಾಸಸ್ಥಳ" : "Area of Residence"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "rural", label: { en: "Rural (Village / Panchayat)", hi: "ग्रामीण (गाँव)", kn: "ಗ್ರಾಮೀಣ (ಹಳ್ಳಿ)" } },
                    { val: "urban", label: { en: "Urban (Town / City)", hi: "शहरी (शहर)", kn: "ನಗರ ಪ್ರದೇಶ" } },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleFieldChange("residence_area", item.val)}
                      className={`p-3 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        profile.residence_area === item.val
                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {item.label[locale] || item.label.en}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Social Category */}
            {steps[currentStep].fields.includes("social_category") && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  {locale === "hi" ? "सामाजिक वर्ग / श्रेणी" : locale === "kn" ? "ಸಾಮಾಜಿಕ ವರ್ಗ" : "Social Category"}
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {["GEN", "SC", "ST", "OBC", "EWS"].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleFieldChange("social_category", cat)}
                      className={`p-2.5 rounded-xl border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        profile.social_category === cat
                          ? "border-blue-600 bg-blue-50 text-blue-900 shadow-sm"
                          : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Annual Income */}
            {steps[currentStep].fields.includes("annual_income_inr") && (
              <div className="space-y-2">
                <label className="block text-sm font-bold text-slate-900">
                  {locale === "hi" ? "वार्षिक पारिवारिक आय (रुपये में)" : locale === "kn" ? "ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ (ರೂ.)" : "Annual Household Income (INR)"}
                </label>
                <input
                  type="number"
                  value={profile.annual_income_inr}
                  onChange={(e) => handleFieldChange("annual_income_inr", parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 150000"
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            )}

            {/* BPL Card & Tax Payer */}
            {steps[currentStep].fields.includes("is_bpl_card_holder") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">
                    {locale === "hi" ? "क्या आपके पास बीपीएल राशन कार्ड है?" : locale === "kn" ? "ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಹೊಂದಿದ್ದೀರಾ?" : "Hold a BPL / Antyodaya Card?"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_bpl_card_holder", true)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        profile.is_bpl_card_holder ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_bpl_card_holder", false)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        !profile.is_bpl_card_holder ? "border-red-600 bg-red-50 text-red-900" : "border-slate-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">
                    {locale === "hi" ? "क्या आप आयकर दाता हैं?" : locale === "kn" ? "ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿದಾರರೇ?" : "Pay Income Tax?"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_tax_payer", true)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        profile.is_tax_payer ? "border-blue-600 bg-blue-50 text-blue-900" : "border-slate-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_tax_payer", false)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        !profile.is_tax_payer ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Landholding (if farmer) */}
            {steps[currentStep].fields.includes("landholding_hectares") && profile.occupation === "farmer" && (
              <div className="space-y-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                <label className="block text-sm font-bold text-slate-900">
                  {locale === "hi" ? "कृषि भूमि का स्वामित्व (हेक्टेयर में)" : locale === "kn" ? "ಕೃಷಿ ಭೂಹಿಡುವಳಿ (ಹೆಕ್ಟೇರ್)" : "Cultivable Agricultural Land (Hectares)"}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={profile.landholding_hectares}
                  onChange={(e) => handleFieldChange("landholding_hectares", parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 1.5"
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
                />
              </div>
            )}

            {/* Pregnancy & Disability */}
            {steps[currentStep].fields.includes("is_pregnant_or_lactating") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">
                    {locale === "hi" ? "गर्भवती या स्तनपान कराने वाली माता?" : locale === "kn" ? "ಗರ್ಭಿಣಿ ಅಥವಾ ಹಾಲುಣಿಸುವ ತಾಯಿಯೇ?" : "Pregnant or Lactating Mother?"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_pregnant_or_lactating", true)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        profile.is_pregnant_or_lactating ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_pregnant_or_lactating", false)}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        !profile.is_pregnant_or_lactating ? "border-slate-600 bg-slate-50 text-slate-900" : "border-slate-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-bold text-slate-900">
                    {locale === "hi" ? "दिव्यांगजन (न्यूनतम 40%)?" : locale === "kn" ? "ವಿಕಲಚೇತನರೇ (ಕನಿಷ್ಠ 40%)?" : "Person with Disability (min 40%)?"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange("is_disabled", true);
                        handleFieldChange("disability_percentage", 45);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        profile.is_disabled ? "border-emerald-600 bg-emerald-50 text-emerald-900" : "border-slate-200"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange("is_disabled", false);
                        handleFieldChange("disability_percentage", 0);
                      }}
                      className={`p-2.5 rounded-xl border text-xs font-semibold cursor-pointer ${
                        !profile.is_disabled ? "border-slate-600 bg-slate-50 text-slate-900" : "border-slate-200"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-slate-100">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>{t("wizard.prev_btn")}</span>
              </button>
            ) : <div />}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-6 py-2.5 bg-gov-blue hover:bg-blue-700 text-white rounded-lg text-sm font-semibold flex items-center space-x-1.5 shadow-sm cursor-pointer"
              >
                <span>{t("wizard.next_btn")}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleEvaluate}
                className="px-8 py-3 bg-gov-green hover:bg-emerald-700 text-white rounded-lg text-sm font-bold flex items-center space-x-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Evaluating...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-200" />
                    <span>{t("wizard.calculate_btn")}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Evaluation Results View */
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900">
                  {t("wizard.results_title")}
                </h2>
                <p className="text-xs text-slate-500">
                  Evaluated using deterministic AST logic. Zero guesses.
                </p>
              </div>
              <button
                onClick={resetWizard}
                className="inline-flex items-center space-x-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Change Answers</span>
              </button>
            </div>
          </div>

          {/* 1. Eligible Schemes */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-emerald-800">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <h3 className="font-bold text-lg text-slate-900">
                {t("wizard.eligible_heading")} ({results.eligible_schemes.length})
              </h3>
            </div>

            {results.eligible_schemes.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-white p-4 rounded-xl border border-slate-200">
                No schemes completely satisfied based on provided criteria. Check potentially eligible schemes below.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.eligible_schemes.map((item) => (
                  <div
                    key={item.scheme_id}
                    className="bg-emerald-50/50 border-2 border-emerald-500 rounded-xl p-5 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-slate-900">
                        {item.scheme_title[locale] || item.scheme_title.en}
                      </h4>
                      <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded-full uppercase">
                        100% Eligible
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700">
                      <span className="font-semibold block text-[11px] uppercase tracking-wide text-emerald-800">
                        {t("wizard.why_eligible")}:
                      </span>
                      {item.passed_criteria.map((c) => (
                        <div key={c.criterion_id} className="flex items-center space-x-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{c.explanation[locale] || c.explanation.en}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/schemes/${item.scheme_slug || item.scheme_id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-emerald-800 hover:text-emerald-950 underline"
                      >
                        <span>View Application Procedure & Checklist</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Potentially Eligible Schemes (Missing Info) */}
          {results.potentially_eligible_schemes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-amber-800">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-lg text-slate-900">
                  {t("wizard.potential_heading")} ({results.potentially_eligible_schemes.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.potentially_eligible_schemes.map((item) => (
                  <div
                    key={item.scheme_id}
                    className="bg-amber-50/50 border border-amber-300 rounded-xl p-5 space-y-3"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-slate-900">
                        {item.scheme_title[locale] || item.scheme_title.en}
                      </h4>
                      <span className="text-[10px] font-bold bg-amber-600 text-white px-2 py-0.5 rounded-full uppercase">
                        Needs Info
                      </span>
                    </div>

                    <div className="text-xs text-amber-900 space-y-1">
                      <p className="font-medium">
                        {item.summary_explanation[locale] || item.summary_explanation.en}
                      </p>
                      <div className="flex flex-wrap gap-1 pt-1">
                        {item.required_missing_fields.map((f) => (
                          <span key={f} className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono">
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="pt-2">
                      <Link
                        href={`/schemes/${item.scheme_slug || item.scheme_id}`}
                        className="inline-flex items-center space-x-1 text-xs font-semibold text-amber-900 hover:underline"
                      >
                        <span>Inspect Scheme Criteria</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Ineligible Schemes */}
          {results.ineligible_schemes.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-slate-600">
                <XCircle className="w-5 h-5 text-red-500" />
                <h3 className="font-bold text-lg text-slate-900">
                  {t("wizard.ineligible_heading")} ({results.ineligible_schemes.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.ineligible_schemes.map((item) => (
                  <div
                    key={item.scheme_id}
                    className="bg-white border border-slate-200 rounded-xl p-5 space-y-3 opacity-80"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-base text-slate-800">
                        {item.scheme_title[locale] || item.scheme_title.en}
                      </h4>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full uppercase">
                        Ineligible
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600">
                      <span className="font-semibold block text-[11px] uppercase tracking-wide text-red-700">
                        {t("wizard.why_ineligible")}:
                      </span>
                      {item.failed_criteria.map((c) => (
                        <div key={c.criterion_id} className="flex items-center space-x-1.5 text-red-800">
                          <XCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                          <span>{c.explanation[locale] || c.explanation.en}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WizardPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-slate-500 font-medium">Loading Eligibility Wizard...</div>}>
      <WizardContent />
    </Suspense>
  );
}
