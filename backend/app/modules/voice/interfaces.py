"""Voice Assistant Interfaces & Data Models

Defines provider-independent protocols and schemas for Speech-to-Text (STT),
Text-to-Speech (TTS), and Voice Dialogue Management.
"""

from typing import Optional, List, Dict, Any
from enum import Enum
from pydantic import BaseModel, Field


class VoiceLanguage(str, Enum):
    KANNADA = "kn"
    HINDI = "hi"
    ENGLISH = "en"


class VoiceDialogueMode(str, Enum):
    DISCOVERY = "DISCOVERY"
    ELIGIBILITY_INTERVIEW = "ELIGIBILITY_INTERVIEW"
    DOCUMENT_GUIDANCE = "DOCUMENT_GUIDANCE"
    APPLICATION_STEPS = "APPLICATION_STEPS"


class TranscriptionResult(BaseModel):
    text: str
    language: str
    confidence: float
    is_low_confidence: bool = False
    needs_repetition: bool = False
    duration_seconds: Optional[float] = None


class SynthesisRequest(BaseModel):
    text: str
    language: str = "en"
    speed: float = 1.0  # 0.8 to 1.2
    pitch: float = 1.0


class VoiceMessage(BaseModel):
    role: str  # "citizen" | "assistant"
    content: str
    timestamp: Optional[str] = None
    scheme_id: Optional[str] = None
    intent: Optional[str] = None


class VoiceChatRequest(BaseModel):
    query: str
    language: str = "en"
    session_id: Optional[str] = None
    target_scheme_id: Optional[str] = None
    dialogue_mode: VoiceDialogueMode = VoiceDialogueMode.DISCOVERY
    conversation_history: List[VoiceMessage] = Field(default_factory=list)
    profile_context: Optional[Dict[str, Any]] = Field(default_factory=dict)
    simplicity_mode: bool = False
    speech_speed: float = 1.0


class SpokenCitation(BaseModel):
    scheme_id: str
    scheme_name: str
    official_portal_url: str
    source_reference_date: str


class VoiceChatResponse(BaseModel):
    spoken_text: str  # Short, empathetic, natural sentence designed for audio playback
    display_text: str  # Detailed text for screen/family/CSC companions
    language: str
    dialogue_mode: VoiceDialogueMode
    suggested_spoken_prompts: List[str] = Field(default_factory=list)
    citations: List[SpokenCitation] = Field(default_factory=list)
    action_type: Optional[str] = None  # e.g., "NAVIGATE_WIZARD", "SHOW_DOCS"
    confidence_score: float = 1.0
    active_scheme_id: Optional[str] = None
    detected_intent: Optional[str] = None
    extracted_profile: Dict[str, Any] = Field(default_factory=dict)
    eligible_schemes: List[str] = Field(default_factory=list)


class SpokenEligibilityQuestion(BaseModel):
    field_name: str
    question_spoken: str  # Spoken prompt, e.g. "Do you own agricultural land in your name?"
    question_display: str
    language: str
    expected_type: str  # "BOOLEAN" | "NUMBER" | "CHOICE" | "TEXT"
    step_number: int
    total_steps: int


class VoiceInterviewState(BaseModel):
    session_id: str
    language: str
    target_scheme_id: Optional[str] = None
    answers: Dict[str, Any] = Field(default_factory=dict)
    current_question: Optional[SpokenEligibilityQuestion] = None
    is_completed: bool = False
    eligible_schemes_count: int = 0
    verdict_spoken: Optional[str] = None
