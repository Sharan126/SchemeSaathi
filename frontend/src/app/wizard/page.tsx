"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { evaluateEligibility } from "@/lib/api";
import { BatchEvaluationResponse, EligibilityResult } from "@/types";
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
  HelpCircle,
  FileText,
  Building,
  Check,
  ChevronDown,
  ChevronUp,
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
  const [showWhyAsking, setShowWhyAsking] = useState<string | null>(null);

  const steps = [
    {
      title: locale === "hi" ? "बुनियादी जानकारी एवं पेशा" : locale === "kn" ? "ಮೂಲ ವಿವರಗಳು ಮತ್ತು ವೃತ್ತಿ" : "Basic Profile & Occupation",
      subtitle: locale === "hi" ? "यह जानकारी प्राथमिक योजना श्रेणियों को फ़िल्टर करने के लिए है।" : locale === "kn" ? "ಪ್ರಾಥಮಿಕ ಯೋಜನೆಗಳ ವಿಭಾಗಗಳನ್ನು ತಿಳಿಯಲು ಈ ವಿವರ ಅಗತ್ಯ." : "Filters primary sector grants and beneficiary categories.",
      fields: ["occupation", "gender", "age"],
    },
    {
      title: locale === "hi" ? "क्षेत्र एवं सामाजिक वर्ग" : locale === "kn" ? "ಪ್ರದೇಶ ಮತ್ತು ಸಾಮಾಜಿಕ ವರ್ಗ" : "Residence & Social Category",
      subtitle: locale === "hi" ? "ग्रामीण आवास एवं विशेष समुदाय छात्रवृत्ति के लिए आवश्यक।" : locale === "kn" ? "ಗ್ರಾಮೀಣ ಮತ್ತು ವಿಶೇಷ ವಿದ್ಯಾರ್ಥಿವೇತನಕ್ಕೆ ಅಗತ್ಯ." : "Required for rural development and category scholarships.",
      fields: ["residence_area", "social_category"],
    },
    {
      title: locale === "hi" ? "आय एवं आर्थिक स्थिति" : locale === "kn" ? "ಆದಾಯ ಮತ್ತು ಆರ್ಥಿಕ ಸ್ಥಿತಿ" : "Financial & Landholding Details",
      subtitle: locale === "hi" ? "अधिकांश योजनाओं में आय सीमा और भूमि स्वामित्व के नियम होते हैं।" : locale === "kn" ? "ಬಹುತೇಕ ಯೋಜನೆಗಳಲ್ಲಿ ಆದಾಯ ಮಿತಿ ಮತ್ತು ಭೂಹಿಡುವಳಿ ನಿಯಮಗಳಿರುತ್ತವೆ." : "Used strictly to verify statutory income ceilings and exclusions.",
      fields: ["annual_income_inr", "is_bpl_card_holder", "is_tax_payer", "landholding_hectares", "has_pucca_house"],
    },
    {
      title: locale === "hi" ? "विशिष्ट परिस्थितियां" : locale === "kn" ? "ವಿಶೇಷ ಸಂದರ್ಭಗಳು" : "Special Circumstances",
      subtitle: locale === "hi" ? "मातृत्व सहायता या दिव्यांगजन पेंशन जैसी विशेष योजनाओं के लिए।" : locale === "kn" ? "ತಾಯಂದಿರ ನೆರವು ಅಥವಾ ದಿವ್ಯಾಂಗರ ಪಿಂಚಣಿ ಯೋಜನೆಗಳಿಗೆ." : "Qualifies citizens for targeted maternity or disability grants.",
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
  };

  const toggleWhy = (fieldName: string) => {
    setShowWhyAsking(showWhyAsking === fieldName ? null : fieldName);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 py-2">
      {/* Title & Privacy Notice */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center space-x-1.5 bg-slate-100 text-slate-700 px-3 py-1 rounded text-xs font-semibold border border-slate-200">
          <ShieldCheck className="w-3.5 h-3.5 text-forest" />
          <span>{t("wizard.anonymous_notice")}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#0F1E36] tracking-tight">
          {t("wizard.title")}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 max-w-xl mx-auto leading-relaxed">
          {t("wizard.subtitle")}
        </p>
      </div>

      {targetScheme && (
        <div className="bg-slate-50 border border-hairline rounded p-3 flex items-center justify-between text-xs text-[#0F1E36]">
          <div className="flex items-center space-x-2">
            <Info className="w-4 h-4 text-civic shrink-0" />
            <span>Target Scheme Pre-selected: <strong className="font-bold">{targetScheme}</strong></span>
          </div>
          <button
            onClick={() => setTargetScheme(null)}
            className="text-xs text-civic hover:underline font-bold cursor-pointer"
          >
            Check all schemes instead
          </button>
        </div>
      )}

      {!results ? (
        <div className="bg-white rounded border border-hairline shadow-hairline p-6 sm:p-8 space-y-6">
          {/* Progress Indicator */}
          <div className="space-y-2 border-b border-hairline pb-4">
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600">
              <span>{t("wizard.step_counter")} {currentStep + 1} of {steps.length}: <strong className="text-[#0F1E36] font-bold">{steps[currentStep].title}</strong></span>
              <span className="font-mono">{Math.round(((currentStep + 1) / steps.length) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded overflow-hidden">
              <div
                className="h-full bg-[#0F1E36] transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-xs text-slate-500 pt-0.5">
              {steps[currentStep].subtitle}
            </p>
          </div>

          {/* Step Form Fields */}
          <div className="space-y-6">
            {/* Occupation */}
            {steps[currentStep].fields.includes("occupation") && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                    {locale === "hi" ? "आपका मुख्य व्यवसाय क्या है?" : locale === "kn" ? "ನಿಮ್ಮ ಮುಖ್ಯ ಉದ್ಯೋಗ ಯಾವುದು?" : "What is your primary occupation?"}
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleWhy("occupation")}
                    className="text-xs text-civic hover:underline inline-flex items-center space-x-1 cursor-pointer font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t("wizard.why_asking")}</span>
                  </button>
                </div>

                {showWhyAsking === "occupation" && (
                  <div className="bg-slate-50 p-2.5 rounded text-xs text-slate-600 border border-hairline leading-relaxed">
                    Different government ministries provide sector-specific grants (e.g. PM-KISAN is exclusively for cultivators, scholarships are for students).
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {[
                    { val: "farmer", label: { en: "Cultivator / Farmer", hi: "किसान / कृषक", kn: "ರೈತ / ಕೃಷಿಕ" } },
                    { val: "student", label: { en: "Student", hi: "विद्यार्थी / छात्र", kn: "ವಿದ್ಯಾರ್ಥಿ" } },
                    { val: "worker", label: { en: "Daily Wage / Worker", hi: "श्रमिक / दैनिक मजदूर", kn: "ದೈನಂದಿನ ಕಾರ್ಮಿಕ" } },
                    { val: "self_employed", label: { en: "Self-Employed / Artisan", hi: "स्वरोजगार / कारीगर", kn: "ಸ್ವಯಂ ಉದ್ಯೋಗಿ" } },
                    { val: "senior_citizen", label: { en: "Senior Citizen / Retired", hi: "वरिष्ठ नागरिक / सेवानिवृत्त", kn: "ಹಿರಿಯ ನಾಗರಿಕ" } },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleFieldChange("occupation", item.val)}
                      className={`p-3 rounded border text-xs sm:text-sm font-semibold transition-all cursor-pointer text-left ${
                        profile.occupation === item.val
                          ? "border-[#0F1E36] bg-slate-100 text-[#0F1E36] font-bold shadow-hairline"
                          : "border-hairline bg-white text-slate-700 hover:bg-slate-50"
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
                <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
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
                      className={`p-3 rounded border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        profile.gender === item.val
                          ? "border-[#0F1E36] bg-slate-100 text-[#0F1E36] font-bold shadow-hairline"
                          : "border-hairline bg-white text-slate-700 hover:bg-slate-50"
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
                <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                  {locale === "hi" ? "आयु (वर्षों में)" : locale === "kn" ? "ವಯಸ್ಸು (ವರ್ಷಗಳಲ್ಲಿ)" : "Age (in completed years)"}: <span className="text-[#0F1E36] font-extrabold text-base num-tabular">{profile.age}</span>
                </label>
                <input
                  type="range"
                  min="5"
                  max="95"
                  value={profile.age}
                  onChange={(e) => handleFieldChange("age", parseInt(e.target.value))}
                  className="w-full accent-[#0F1E36] cursor-pointer h-2 bg-slate-200 rounded"
                />
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span>5 yrs</span>
                  <span>18 yrs</span>
                  <span>60 yrs (Senior Citizen)</span>
                  <span>95 yrs</span>
                </div>
              </div>
            )}

            {/* Residence Area */}
            {steps[currentStep].fields.includes("residence_area") && (
              <div className="space-y-2">
                <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                  {locale === "hi" ? "निवास क्षेत्र" : locale === "kn" ? "ವಾಸಸ್ಥಳ" : "Area of Residence"}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { val: "rural", label: { en: "Rural (Gram Panchayat)", hi: "ग्रामीण (ग्राम पंचायत)", kn: "ಗ್ರಾಮೀಣ (ಗ್ರಾಮ ಪಂಚಾಯತ್)" } },
                    { val: "urban", label: { en: "Urban (Municipality / City)", hi: "शहरी (नगरपालिका / शहर)", kn: "ನಗರ (ಮುನ್ಸಿಪಾಲಿಟಿ)" } },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleFieldChange("residence_area", item.val)}
                      className={`p-3.5 rounded border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        profile.residence_area === item.val
                          ? "border-[#0F1E36] bg-slate-100 text-[#0F1E36] font-bold shadow-hairline"
                          : "border-hairline bg-white text-slate-700 hover:bg-slate-50"
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
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                    {locale === "hi" ? "सामाजिक वर्ग" : locale === "kn" ? "ಸಾಮಾಜಿಕ ವರ್ಗ" : "Social Category"}
                  </label>
                  <button
                    type="button"
                    onClick={() => toggleWhy("social_category")}
                    className="text-xs text-civic hover:underline inline-flex items-center space-x-1 cursor-pointer font-medium"
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>{t("wizard.why_asking")}</span>
                  </button>
                </div>

                {showWhyAsking === "social_category" && (
                  <div className="bg-slate-50 p-2.5 rounded text-xs text-slate-600 border border-hairline leading-relaxed">
                    Certain welfare schemes (such as the Post Matric Scholarship for SC Students) are designated by Parliament exclusively for affirmative action groups.
                  </div>
                )}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { val: "GEN", label: "General" },
                    { val: "OBC", label: "OBC" },
                    { val: "SC", label: "SC" },
                    { val: "ST", label: "ST" },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => handleFieldChange("social_category", item.val)}
                      className={`p-3 rounded border text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
                        profile.social_category === item.val
                          ? "border-[#0F1E36] bg-slate-100 text-[#0F1E36] font-bold shadow-hairline"
                          : "border-hairline bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Financial Details */}
            {steps[currentStep].fields.includes("annual_income_inr") && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                    {locale === "hi" ? "वार्षिक पारिवारिक आय" : locale === "kn" ? "ವಾರ್ಷಿಕ ಕುಟುಂಬ ಆದಾಯ" : "Annual Household Income (in INR)"}: <span className="text-[#0F1E36] font-extrabold num-tabular">₹{profile.annual_income_inr.toLocaleString("en-IN")}</span>
                  </label>
                  <input
                    type="range"
                    min="30000"
                    max="1000000"
                    step="10000"
                    value={profile.annual_income_inr}
                    onChange={(e) => handleFieldChange("annual_income_inr", parseInt(e.target.value))}
                    className="w-full accent-[#0F1E36] cursor-pointer h-2 bg-slate-200 rounded"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>₹30,000</span>
                    <span>₹2,50,000 (PMS-SC Limit)</span>
                    <span>₹10,00,000</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      {locale === "hi" ? "क्या आपके पास बीपीएल / राशन कार्ड है?" : locale === "kn" ? "ಬಿಪಿಎಲ್ ಕಾರ್ಡ್ ಹೊಂದಿದ್ದೀರಾ?" : "BPL / Ration Card Holder?"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleFieldChange("is_bpl_card_holder", true)}
                        className={`p-2.5 rounded border text-xs font-semibold cursor-pointer ${
                          profile.is_bpl_card_holder ? "border-forest bg-emerald-50 text-forest font-bold" : "border-hairline"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange("is_bpl_card_holder", false)}
                        className={`p-2.5 rounded border text-xs font-semibold cursor-pointer ${
                          !profile.is_bpl_card_holder ? "border-slate-600 bg-slate-100 text-slate-900 font-bold" : "border-hairline"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      {locale === "hi" ? "क्या परिवार में कोई आयकर दाता है?" : locale === "kn" ? "ಕುಟುಂಬದಲ್ಲಿ ಯಾರಾದರೂ ಆದಾಯ ತೆರಿಗೆ ಪಾವತಿಸುವರೇ?" : "Any Income Tax Payer in Family?"}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleFieldChange("is_tax_payer", true)}
                        className={`p-2.5 rounded border text-xs font-semibold cursor-pointer ${
                          profile.is_tax_payer ? "border-slate-800 bg-slate-100 text-slate-900 font-bold" : "border-hairline"
                        }`}
                      >
                        Yes
                      </button>
                      <button
                        type="button"
                        onClick={() => handleFieldChange("is_tax_payer", false)}
                        className={`p-2.5 rounded border text-xs font-semibold cursor-pointer ${
                          !profile.is_tax_payer ? "border-forest bg-emerald-50 text-forest font-bold" : "border-hairline"
                        }`}
                      >
                        No
                      </button>
                    </div>
                  </div>
                </div>

                {/* Landholding if farmer */}
                {profile.occupation === "farmer" && (
                  <div className="space-y-2 bg-[#FAFBFD] p-4 rounded border border-hairline">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-bold text-[#0F1E36]">
                        {locale === "hi" ? "कृषि भूमि का स्वामित्व (हेक्टेयर में)" : locale === "kn" ? "ಕೃಷಿ ಭೂಹಿಡುವಳಿ (ಹೆಕ್ಟೇರ್)" : "Cultivable Agricultural Land (in Hectares)"}
                      </label>
                      <span className="text-[11px] text-slate-500 font-mono">1 Hectare ≈ 2.47 Acres</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={profile.landholding_hectares}
                      onChange={(e) => handleFieldChange("landholding_hectares", parseFloat(e.target.value) || 0)}
                      placeholder="e.g. 1.2"
                      className="w-full px-3 py-2 border border-hairline rounded text-xs sm:text-sm font-semibold focus:ring-2 focus:ring-[#0F1E36] focus:outline-none bg-white"
                    />
                  </div>
                )}
              </div>
            )}

            {/* Special Circumstances */}
            {steps[currentStep].fields.includes("is_pregnant_or_lactating") && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                    {locale === "hi" ? "क्या परिवार में कोई गर्भवती या स्तनपान कराने वाली माता हैं?" : locale === "kn" ? "ಕುಟುಂಬದಲ್ಲಿ ಯಾರಾದರೂ ಗರ್ಭಿಣಿ ಅಥವಾ ಹಾಲುಣಿಸುವ ತಾಯಿಯರೇ?" : "Pregnant or Lactating Mother in Family?"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_pregnant_or_lactating", true)}
                      className={`p-3 rounded border text-xs font-semibold cursor-pointer ${
                        profile.is_pregnant_or_lactating ? "border-forest bg-emerald-50 text-forest font-bold" : "border-hairline"
                      }`}
                    >
                      Yes
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFieldChange("is_pregnant_or_lactating", false)}
                      className={`p-3 rounded border text-xs font-semibold cursor-pointer ${
                        !profile.is_pregnant_or_lactating ? "border-slate-600 bg-slate-100 text-slate-900 font-bold" : "border-hairline"
                      }`}
                    >
                      No
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs sm:text-sm font-bold text-[#0F1E36]">
                    {locale === "hi" ? "दिव्यांगजन (न्यूनतम 40% बेंचमार्क दिव्यांगता)?" : locale === "kn" ? "ವಿಕಲಚೇತನರೇ (ಕನಿಷ್ಠ 40% ಅಂಗವೈಕಲ್ಯ ಪ್ರಮಾಣಪತ್ರ)?" : "Person with Benchmark Disability (min 40%)?"}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        handleFieldChange("is_disabled", true);
                        handleFieldChange("disability_percentage", 45);
                      }}
                      className={`p-3 rounded border text-xs font-semibold cursor-pointer ${
                        profile.is_disabled ? "border-forest bg-emerald-50 text-forest font-bold" : "border-hairline"
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
                      className={`p-3 rounded border text-xs font-semibold cursor-pointer ${
                        !profile.is_disabled ? "border-slate-600 bg-slate-100 text-slate-900 font-bold" : "border-hairline"
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
          <div className="flex justify-between items-center pt-4 border-t border-hairline">
            {currentStep > 0 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 border border-hairline rounded text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center space-x-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{t("wizard.prev_btn")}</span>
              </button>
            ) : <div />}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2.5 bg-[#0F1E36] hover:bg-[#162842] text-white rounded text-xs font-bold flex items-center space-x-1.5 shadow-hairline cursor-pointer"
              >
                <span>{t("wizard.next_btn")}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleEvaluate}
                className="px-6 py-2.5 bg-terracotta hover:bg-[#98380A] text-white rounded text-xs font-bold flex items-center space-x-2 shadow-hairline cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <span>Evaluating Deterministic Rules...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-orange-200" />
                    <span>{t("wizard.calculate_btn")}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* Evaluation Results View */
        <div className="space-y-6">
          <div className="bg-white rounded border border-hairline p-5 shadow-hairline space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-[#0F1E36]">
                  {t("wizard.results_title")}
                </h2>
                <p className="text-xs text-slate-500">
                  Computed via deterministic rule trees based on official ministry gazettes. Zero hallucinations.
                </p>
              </div>
              <button
                onClick={resetWizard}
                className="inline-flex items-center space-x-1.5 px-3 py-1.5 border border-hairline rounded text-xs font-bold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-hairline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Edit Profile &amp; Answers</span>
              </button>
            </div>
          </div>

          {/* 1. Fully Eligible Schemes */}
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-forest">
              <CheckCircle2 className="w-4 h-4 text-forest" />
              <h3 className="font-bold text-sm sm:text-base text-[#0F1E36]">
                {t("wizard.eligible_heading")} ({results.eligible_schemes.length})
              </h3>
            </div>

            {results.eligible_schemes.length === 0 ? (
              <p className="text-xs text-slate-500 italic bg-white p-5 rounded border border-hairline shadow-hairline">
                No schemes completely satisfied based on provided criteria. Review the schemes below that require additional verification or missing inputs.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.eligible_schemes.map((item) => (
                  <div
                    key={item.scheme_id}
                    className="bg-white border-2 border-forest rounded p-5 space-y-3 shadow-hairline"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm sm:text-base text-[#0F1E36] leading-snug">
                        {item.scheme_title[locale] || item.scheme_title.en}
                      </h4>
                      <span className="text-[10px] font-bold bg-forest text-white px-2 py-0.5 rounded uppercase whitespace-nowrap">
                        Eligible
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-700">
                      <span className="font-bold block text-[10px] uppercase tracking-wide text-forest">
                        {t("wizard.why_eligible")}:
                      </span>
                      {item.passed_criteria.map((c) => (
                        <div key={c.criterion_id} className="flex items-start space-x-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-forest shrink-0 mt-0.5" />
                          <span>{c.explanation[locale] || c.explanation.en}</span>
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t border-hairline flex items-center justify-between">
                      <Link
                        href={`/schemes/${item.scheme_slug || item.scheme_id}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-forest hover:underline"
                      >
                        <span>View Preparation Dossier</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 2. Potentially Eligible Schemes (Missing Info) */}
          {results.potentially_eligible_schemes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-amber-800">
                <AlertTriangle className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-sm sm:text-base text-[#0F1E36]">
                  {t("wizard.potential_heading")} ({results.potentially_eligible_schemes.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.potentially_eligible_schemes.map((item) => (
                  <div
                    key={item.scheme_id}
                    className="bg-white border border-amber-300 rounded p-5 space-y-3 shadow-hairline"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-sm sm:text-base text-[#0F1E36] leading-snug">
                        {item.scheme_title[locale] || item.scheme_title.en}
                      </h4>
                      <span className="text-[10px] font-bold bg-amber-700 text-white px-2 py-0.5 rounded uppercase whitespace-nowrap">
                        Needs More Info
                      </span>
                    </div>

                    <div className="text-xs text-amber-900 space-y-1.5">
                      <p className="font-medium leading-relaxed">
                        {item.summary_explanation[locale] || item.summary_explanation.en}
                      </p>
                      {item.required_missing_fields?.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider block text-amber-800">
                            {t("wizard.missing_info")}:
                          </span>
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.required_missing_fields.map((f) => (
                              <span key={f} className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded font-mono">
                                {f}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="pt-2 border-t border-hairline flex items-center justify-between">
                      <Link
                        href={`/schemes/${item.scheme_slug || item.scheme_id}`}
                        className="inline-flex items-center space-x-1 text-xs font-bold text-civic hover:underline"
                      >
                        <span>Check Verification Requirements</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 3. Ineligible Schemes (Auditable Reasons) */}
          {results.ineligible_schemes && results.ineligible_schemes.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-slate-700">
                <XCircle className="w-4 h-4 text-slate-500" />
                <h3 className="font-bold text-sm sm:text-base text-[#0F1E36]">
                  {t("wizard.ineligible_heading")} ({results.ineligible_schemes.length})
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.ineligible_schemes.map((item) => (
                  <div
                    key={item.scheme_id}
                    className="bg-slate-50 border border-hairline rounded p-4 space-y-2.5"
                  >
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800">
                        {item.scheme_title[locale] || item.scheme_title.en}
                      </h4>
                      <span className="text-[10px] font-bold bg-slate-200 text-slate-700 px-2 py-0.2 rounded uppercase">
                        Not Eligible
                      </span>
                    </div>

                    <div className="space-y-1 text-xs text-slate-600">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                        {t("wizard.why_ineligible")}:
                      </span>
                      {item.failed_criteria?.map((c) => (
                        <div key={c.criterion_id} className="flex items-start space-x-1.5 text-red-800">
                          <XCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
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
    <Suspense fallback={<div className="py-20 text-center text-xs text-slate-500">Loading Eligibility Wizard...</div>}>
      <WizardContent />
    </Suspense>
  );
}
