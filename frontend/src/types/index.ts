export type Locale = "en" | "hi" | "kn";

export interface LocalizedString {
  en: string;
  hi: string;
  kn: string;
  [key: string]: string;
}

export interface SchemeBenefit {
  id?: string;
  benefit_type: string;
  amount_description: LocalizedString;
  frequency: string;
  max_monetary_value?: number;
}

export interface SchemeCriterion {
  id?: string;
  field_name: string;
  criterion_type: string;
  rule_ast: Record<string, any>;
  explanation: LocalizedString;
  is_mandatory: boolean;
}

export interface SchemeDocument {
  id?: string;
  document_code: string;
  document_name: LocalizedString;
  issuing_authority: LocalizedString;
  is_mandatory: boolean;
  alternatives: string[];
}

export interface SchemeStep {
  step: number;
  en: string;
  hi: string;
  kn: string;
}

export interface Scheme {
  id: string;
  slug: string;
  ministry: string;
  department?: string;
  category: string;
  target_beneficiaries: string[];
  status: string;
  version_number: number;
  title: LocalizedString;
  short_description: LocalizedString;
  full_description: LocalizedString;
  official_portal_url: string;
  gazette_notification_url?: string;
  source_reference_date: string;
  source_document_hash?: string;
  funding_type: string;
  application_mode: string;
  application_steps: SchemeStep[];
  benefits: SchemeBenefit[];
  criteria: SchemeCriterion[];
  documents: SchemeDocument[];
}

export interface CriterionEvaluation {
  criterion_id: string;
  field_name: string;
  passed: boolean;
  is_missing: boolean;
  citizen_value?: any;
  rule_summary: string;
  explanation: LocalizedString;
}

export interface EligibilityResult {
  scheme_id: string;
  scheme_slug?: string;
  scheme_title: LocalizedString;
  status: "ELIGIBLE" | "INELIGIBLE" | "NEEDS_MORE_INFO";
  is_eligible: boolean;
  confidence_score: number;
  passed_criteria: CriterionEvaluation[];
  failed_criteria: CriterionEvaluation[];
  missing_criteria: CriterionEvaluation[];
  required_missing_fields: string[];
  summary_explanation: LocalizedString;
}

export interface BatchEvaluationResponse {
  eligible_schemes: EligibilityResult[];
  potentially_eligible_schemes: EligibilityResult[];
  ineligible_schemes: EligibilityResult[];
  recommended_next_questions: string[];
}

export interface Citation {
  scheme_id: string;
  scheme_name: string;
  section_title: string;
  official_portal_url: string;
  gazette_notification_url?: string;
  source_reference_date: string;
}

export interface GroundedAnswerResponse {
  query: string;
  locale: string;
  answer: string;
  is_grounded: boolean;
  confidence_score: number;
  citations: Citation[];
}

export interface DocumentDirectoryItem {
  code: string;
  name: LocalizedString;
  authority: LocalizedString;
  description: LocalizedString;
  estimated_tat_days: string;
}

export interface SpokenCitation {
  scheme_id: string;
  scheme_name: string;
  official_portal_url: string;
  source_reference_date: string;
}

export interface VoiceMessage {
  role: "citizen" | "assistant";
  content: string;
  timestamp?: string;
  scheme_id?: string;
  intent?: string;
}

export interface VoiceChatResponse {
  spoken_text: string;
  display_text: string;
  language: string;
  dialogue_mode: "DISCOVERY" | "ELIGIBILITY_INTERVIEW" | "DOCUMENT_GUIDANCE" | "APPLICATION_STEPS";
  suggested_spoken_prompts: string[];
  citations: SpokenCitation[];
  action_type?: string;
  confidence_score: number;
  active_scheme_id?: string;
  detected_intent?: string;
  extracted_profile?: Record<string, any>;
  eligible_schemes?: string[];
}

export interface SpokenEligibilityQuestion {
  field_name: string;
  question_spoken: string;
  question_display: string;
  language: string;
  expected_type: string;
  step_number: number;
  total_steps: number;
}

export interface VoiceInterviewState {
  session_id: string;
  language: string;
  target_scheme_id?: string;
  answers: Record<string, any>;
  current_question?: SpokenEligibilityQuestion | null;
  is_completed: boolean;
  eligible_schemes_count: number;
  verdict_spoken?: string;
}
