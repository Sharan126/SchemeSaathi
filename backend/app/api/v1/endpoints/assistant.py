"""Grounded AI Assistant Endpoint"""

from typing import Optional
from fastapi import APIRouter, Query
from pydantic import BaseModel
from app.db.repository import SchemeRepository
from app.modules.rag.grounded_qa import GroundedQAService, GroundedAnswerResponse

router = APIRouter(prefix="/assistant", tags=["Assistant"])


class ChatQueryRequest(BaseModel):
    query: str
    locale: str = "en"
    category_filter: Optional[str] = None


@router.post("/query", response_model=GroundedAnswerResponse)
def ask_scheme_assistant(request: ChatQueryRequest):
    """
    Submits a conversational query regarding government schemes in English, Hindi, or Kannada.
    Answers are strictly grounded in retrieved official scheme text chunks with verified citations.
    """
    all_chunks = SchemeRepository.get_all_chunks()
    return GroundedQAService.answer_query(
        query=request.query,
        locale=request.locale,
        all_chunks=all_chunks,
        category_filter=request.category_filter
    )
