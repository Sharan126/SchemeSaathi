"""Multilingual Embedding Engine & Extensible Provider Architecture

Supports:
1. BaseEmbeddingProvider: Abstract base class for embedding providers.
2. DeterministicHashEmbeddingProvider: Fast 768-d subword & token n-gram hasher with L2 normalization.
   Guarantees zero-dependency, deterministic, offline operation.
3. SentenceTransformerEmbeddingProvider: High-performance dense neural embeddings
   (e.g., paraphrase-multilingual-mpnet-base-v2, paraphrase-multilingual-MiniLM-L12-v2)
   with graceful fallback to DeterministicHashEmbeddingProvider if sentence-transformers is unavailable.
4. EmbeddingService: Singleton facade providing backward-compatible access to the active provider.
"""

import abc
import hashlib
import logging
import math
import os
from typing import List, Optional

logger = logging.getLogger(__name__)


EMBEDDING_STOPWORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "have", "has", "had", "do", "does", "did", "to", "at", "in", "on", "for",
    "of", "and", "or", "what", "how", "when", "where", "why",
    "which", "who", "whom", "this", "that", "these", "those", "can", "could", "will", "would",
    "shall", "should", "may", "might", "must", "with", "by", "from", "as", "about", "into",
    "through", "after", "before", "between", "under", "above", "up", "down", "out", "off", "over",
    "scheme", "yojana", "details", "rules", "pm", "pradhan", "mantri",
    # Hindi common particles & generic scheme terms
    "का", "के", "की", "को", "में", "से", "पर", "है", "हैं", "था", "थे", "थी", "हो", "होता", "होती",
    "और", "या", "तो", "भी", "ने", "एक", "इस", "उस", "यह", "वह", "किया", "गया", "कर", "कृपया",
    "योजना", "योजनाएं", "तहत", "विवरण", "नमस्ते", "नमस्कार", "प्रधान", "मंत्री", "प्रधानमंत्री", "पीएम",
    # Kannada common particles & generic scheme terms
    "ಮತ್ತು", "ಅಥವಾ", "ಇದು", "ಅದು", "ಈ", "ಆ", "ಇದೆ", "ಇವೆ", "ರಲ್ಲಿ", "ನಲ್ಲಿ", "ಗೆ", "ಯನ್ನು", "ಇಂದ", "ದಯವಿಟ್ಟು",
    "ಯೋಜನೆ", "ಯೋಜನೆಯ", "ಯೋಜನೆಯಡಿ", "ವಿವರಗಳು", "ನಮಸ್ಕಾರ", "ಪ್ರಧಾನ", "ಮಂತ್ರಿ", "ಪ್ರಧಾನಮಂತ್ರಿ", "ಪಿಎಂ"
}


class BaseEmbeddingProvider(abc.ABC):
    """Abstract base class for all vector embedding providers."""

    @property
    @abc.abstractmethod
    def dimensions(self) -> int:
        """Returns the vector dimensionality."""
        pass

    @property
    @abc.abstractmethod
    def provider_name(self) -> str:
        """Returns the unique identifier for the provider."""
        pass

    @abc.abstractmethod
    def embed_text(self, text: str) -> List[float]:
        """Generates an embedding vector for a single string."""
        pass

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generates embeddings for a batch of strings. Defaults to iterative embedding."""
        return [self.embed_text(t) for t in texts]


class DeterministicHashEmbeddingProvider(BaseEmbeddingProvider):
    """
    Deterministic 768-dimensional token and character n-gram hashing provider.
    Provides fast, reproducible, zero-external-dependency vector representation
    with subword morphological matching for Indic scripts (Devanagari, Kannada).
    """

    DIMENSIONS = 768

    @property
    def dimensions(self) -> int:
        return self.DIMENSIONS

    @property
    def provider_name(self) -> str:
        return "deterministic-hash-indic-768"

    def embed_text(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.DIMENSIONS

        clean_text = text.lower().strip()
        for p in "?!.,:;()[]\"'/-":
            clean_text = clean_text.replace(p, " ")

        vector = [0.0] * self.DIMENSIONS

        words = [w for w in clean_text.split() if w not in EMBEDDING_STOPWORDS and len(w) >= 2]
        for word in words:
            # Deterministic word-level feature using MD5
            w_int = int.from_bytes(hashlib.md5(word.encode("utf-8")).digest()[:4], "big")
            idx = w_int % self.DIMENSIONS
            vector[idx] += 1.5

            # 3-gram subwords for morphological matching in Hindi/Kannada
            for i in range(len(word) - 2):
                gram = word[i : i + 3]
                g_int = int.from_bytes(hashlib.md5(gram.encode("utf-8")).digest()[:4], "big")
                g_idx = g_int % self.DIMENSIONS
                vector[g_idx] += 0.5

        # L2 Normalization
        norm = math.sqrt(sum(x * x for x in vector))
        if norm > 0:
            vector = [x / norm for x in vector]
        return vector


class SentenceTransformerEmbeddingProvider(BaseEmbeddingProvider):
    """
    Dense multilingual neural embedding provider using Hugging Face Sentence Transformers.
    Default model: sentence-transformers/paraphrase-multilingual-mpnet-base-v2 (768 dimensions).
    Alternative: sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 (384/768 dimensions).

    If sentence-transformers or PyTorch is not installed or model weights cannot be loaded,
    gracefully falls back to DeterministicHashEmbeddingProvider.
    """

    DEFAULT_MODEL = "sentence-transformers/paraphrase-multilingual-mpnet-base-v2"
    DIMENSIONS = 768

    def __init__(self, model_name: Optional[str] = None):
        self._model_name = model_name or os.getenv("EMBEDDING_MODEL_NAME", self.DEFAULT_MODEL)
        self._model = None
        self._fallback_provider = DeterministicHashEmbeddingProvider()
        self._is_active = False

        try:
            from sentence_transformers import SentenceTransformer  # type: ignore

            logger.info("Initializing SentenceTransformer: %s", self._model_name)
            self._model = SentenceTransformer(self._model_name)
            self._is_active = True
            logger.info("SentenceTransformer %s loaded successfully", self._model_name)
        except (ImportError, Exception) as err:
            logger.warning(
                "SentenceTransformer (%s) could not be loaded (%s). Falling back to DeterministicHashEmbeddingProvider.",
                self._model_name,
                str(err),
            )
            self._is_active = False

    @property
    def dimensions(self) -> int:
        return self.DIMENSIONS

    @property
    def provider_name(self) -> str:
        if self._is_active:
            return f"sentence-transformer:{self._model_name}"
        return f"sentence-transformer-fallback:{self._fallback_provider.provider_name}"

    @property
    def is_neural_active(self) -> bool:
        return self._is_active

    def embed_text(self, text: str) -> List[float]:
        if not text:
            return [0.0] * self.DIMENSIONS
        if self._is_active and self._model is not None:
            try:
                emb = self._model.encode(text, normalize_embeddings=True)
                return emb.tolist()
            except Exception as e:
                logger.error("Error during neural embedding inference: %s. Using fallback.", str(e))
                return self._fallback_provider.embed_text(text)
        return self._fallback_provider.embed_text(text)

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        if self._is_active and self._model is not None:
            try:
                embeddings = self._model.encode(texts, normalize_embeddings=True, show_progress_bar=False)
                return embeddings.tolist()
            except Exception as e:
                logger.error("Error during neural batch embedding inference: %s. Using fallback.", str(e))
                return self._fallback_provider.embed_batch(texts)
        return self._fallback_provider.embed_batch(texts)


class EmbeddingService:
    """
    Public Facade for the SchemeSaathi Embedding Engine.
    Provides backward-compatible static methods while dispatching to the configured provider.
    """

    DIMENSIONS = 768
    _provider: Optional[BaseEmbeddingProvider] = None

    @classmethod
    def get_provider(cls) -> BaseEmbeddingProvider:
        """Retrieves or initializes the active embedding provider."""
        if cls._provider is None:
            provider_type = os.getenv("EMBEDDING_PROVIDER", "auto").lower()
            if provider_type in ("sentence_transformer", "sentence_transformers", "neural"):
                cls._provider = SentenceTransformerEmbeddingProvider()
            elif provider_type in ("hash", "deterministic-hash", "deterministic_hash", "local_hash"):
                cls._provider = DeterministicHashEmbeddingProvider()
            else:
                # "auto": Try neural provider first; it safely falls back if dependencies/weights are missing
                neural_prov = SentenceTransformerEmbeddingProvider()
                if neural_prov.is_neural_active:
                    cls._provider = neural_prov
                else:
                    cls._provider = DeterministicHashEmbeddingProvider()
        return cls._provider

    @classmethod
    def set_provider(cls, provider: BaseEmbeddingProvider) -> None:
        """Sets a custom embedding provider."""
        cls._provider = provider
        cls.DIMENSIONS = provider.dimensions

    @classmethod
    def generate_vector(cls, text: str) -> List[float]:
        """
        Generates a normalized embedding vector for the given text
        using the active embedding provider.
        """
        return cls.get_provider().embed_text(text)

    @classmethod
    def generate_batch(cls, texts: List[str]) -> List[List[float]]:
        """Generates normalized embedding vectors for a list of strings."""
        return cls.get_provider().embed_batch(texts)

    @staticmethod
    def cosine_similarity(vec_a: List[float], vec_b: List[float]) -> float:
        """Computes cosine similarity between two normalized vectors."""
        if not vec_a or not vec_b or len(vec_a) != len(vec_b):
            return 0.0
        return sum(a * b for a, b in zip(vec_a, vec_b))
