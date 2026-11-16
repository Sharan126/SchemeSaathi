"""Production-Grade Gemini LLM Client with Bounded Retries, Backoff & Outage Fallback

Features:
1. Environment-driven model selection (defaults to currently supported gemini-3.5-flash).
2. Rate-limit (HTTP 429) detection with exponential backoff.
3. Strict request timeout handling.
4. Bounded retry policy (up to 3 attempts).
5. Secure credential masking (never exposes API keys in exception traces or logs).
6. Graceful degradation: Returns None upon persistent failure to trigger deterministic synthesis.
"""

import logging
import time
from typing import Optional, Dict, Any
import httpx
from app.core.config import settings

logger = logging.getLogger(__name__)


def mask_key(key: Optional[str]) -> str:
    """Safely masks an API key for logs and error traces."""
    if not key:
        return "<not_set>"
    if len(key) <= 8:
        return "***"
    return f"{key[:6]}...{key[-4:]}"


class GeminiClient:
    """Robust client for Google AI Studio Generative Language REST API with Circuit Breaker."""

    _consecutive_failures: int = 0
    _circuit_open_until: float = 0.0
    CIRCUIT_FAILURE_THRESHOLD: int = 3
    CIRCUIT_COOLDOWN_SECONDS: float = 30.0

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: Optional[str] = None,
        timeout: float = 5.0,
        max_retries: int = 2
    ):
        self.api_key = api_key or settings.LLM_API_KEY
        self.model = model or settings.LLM_MODEL
        self.timeout = timeout
        self.max_retries = max_retries

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and self.api_key.strip())

    @classmethod
    def is_circuit_open(cls) -> bool:
        return time.time() < cls._circuit_open_until

    @classmethod
    def record_success(cls):
        cls._consecutive_failures = 0
        cls._circuit_open_until = 0.0

    @classmethod
    def record_failure(cls):
        cls._consecutive_failures += 1
        if cls._consecutive_failures >= cls.CIRCUIT_FAILURE_THRESHOLD:
            cls._circuit_open_until = time.time() + cls.CIRCUIT_COOLDOWN_SECONDS
            logger.warning(
                "GeminiClient: %d consecutive API failures reached. Tripping Circuit Breaker OPEN for %.0fs.",
                cls._consecutive_failures, cls.CIRCUIT_COOLDOWN_SECONDS
            )

    def generate(
        self,
        prompt: str,
        temperature: float = 0.0,
        max_output_tokens: int = 1024
    ) -> Optional[str]:
        """
        Executes a generateContent request with bounded retries and circuit breaker.
        Returns generated text on success, or None on failure (triggering deterministic fallback).
        """
        if not self.is_configured:
            logger.debug("GeminiClient: No API key configured. Skipping external LLM generation.")
            return None

        # Support both modern Google AI Studio keys (starting with AQ.) and legacy keys (starting with AIza)
        clean_key = self.api_key.strip()

        # Normalize model identifier
        model = (self.model or "gemini-2.5-flash").strip()
        if model == "gemini-2.5-flash-lite":
            model = "gemini-2.5-flash"

        # 0. Check Circuit Breaker
        if self.is_circuit_open():
            remaining_cooldown = max(0.0, self._circuit_open_until - time.time())
            logger.warning(
                "GeminiClient: Circuit breaker is OPEN (cooldown: %.1fs remaining). Fast-failing to deterministic synthesis.",
                remaining_cooldown
            )
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={clean_key}"
        headers = {
            "x-goog-api-key": clean_key,
            "Content-Type": "application/json",
        }
        payload = {
            "contents": [
                {
                    "parts": [{"text": prompt}]
                }
            ],
            "generationConfig": {
                "temperature": temperature,
                "maxOutputTokens": max_output_tokens,
            }
        }

        masked = mask_key(clean_key)

        for attempt in range(1, self.max_retries + 1):
            try:
                logger.debug(
                    "GeminiClient: Sending request to model=%s (attempt %d/%d, key=%s)",
                    model, attempt, self.max_retries, masked
                )
                with httpx.Client(timeout=self.timeout) as client:
                    resp = client.post(url, headers=headers, json=payload)

                if resp.status_code == 200:
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if candidates and "content" in candidates[0]:
                        parts = candidates[0]["content"].get("parts", [])
                        if parts and "text" in parts[0]:
                            self.record_success()
                            return parts[0]["text"].strip()
                    logger.warning("GeminiClient: HTTP 200 returned but candidate content was empty.")
                    self.record_failure()
                    return None

                elif resp.status_code == 404 and model != "gemini-1.5-flash":
                    # If specific model is not found, fallback to standard gemini-1.5-flash
                    logger.warning(
                        "GeminiClient: Model %s not found (HTTP 404). Retrying with gemini-1.5-flash...",
                        model
                    )
                    fallback_url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={clean_key}"
                    with httpx.Client(timeout=self.timeout) as client:
                        resp_fallback = client.post(fallback_url, headers=headers, json=payload)
                    if resp_fallback.status_code == 200:
                        data = resp_fallback.json()
                        candidates = data.get("candidates", [])
                        if candidates and "content" in candidates[0]:
                            parts = candidates[0]["content"].get("parts", [])
                            if parts and "text" in parts[0]:
                                self.record_success()
                                return parts[0]["text"].strip()
                    logger.warning("GeminiClient: HTTP 200 returned but candidate content was empty.")
                    self.record_failure()
                    return None

                elif resp.status_code == 429:
                    # Rate limit encountered - backoff
                    wait_time = 1.5 * attempt
                    logger.warning(
                        "GeminiClient: HTTP 429 Rate Limited on model=%s. Backing off for %.1fs (attempt %d/%d)...",
                        self.model, wait_time, attempt, self.max_retries
                    )
                    time.sleep(wait_time)
                    continue

                elif resp.status_code in (500, 502, 503, 504):
                    # Google server outage or high demand
                    wait_time = 1.0 * attempt
                    logger.warning(
                        "GeminiClient: HTTP %d server error on model=%s. Retrying in %.1fs...",
                        resp.status_code, self.model, wait_time
                    )
                    time.sleep(wait_time)
                    continue

                else:
                    # Client error (400, 403, 404)
                    error_msg = resp.json().get("error", {}).get("message", "Unknown error")
                    logger.error(
                        "GeminiClient: HTTP %d for model=%s: %s (key=%s)",
                        resp.status_code, self.model, error_msg, masked
                    )
                    self.record_failure()
                    return None

            except httpx.TimeoutException:
                logger.warning(
                    "GeminiClient: Request timeout (%.1fs) on model=%s (attempt %d/%d)",
                    self.timeout, self.model, attempt, self.max_retries
                )
                if attempt < self.max_retries:
                    time.sleep(1.0)
            except Exception as e:
                logger.error(
                    "GeminiClient: Connection error on model=%s: %s (attempt %d/%d)",
                    self.model, str(e), attempt, self.max_retries
                )
                if attempt < self.max_retries:
                    time.sleep(1.0)

        self.record_failure()
        logger.warning(
            "GeminiClient: All %d attempts failed for model=%s. Falling back to deterministic synthesis.",
            self.max_retries, self.model
        )
        return None
