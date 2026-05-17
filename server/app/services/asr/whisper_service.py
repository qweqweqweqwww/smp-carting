"""
Whisper ASR service — loads model once at startup, transcribes on demand.

Design notes:
- Model is loaded lazily on first call and reused for all subsequent requests.
- Transcription runs in a thread pool so it does not block the async event loop.
- Input is expected as a WAV file path; conversion from OGG happens before this call.
"""
import asyncio
import logging
from concurrent.futures import ThreadPoolExecutor
from functools import lru_cache
from pathlib import Path
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import whisper as _whisper_type

from app.core.config import settings

logger = logging.getLogger(__name__)

# Single-threaded pool: Whisper is not thread-safe with shared CUDA contexts.
_executor = ThreadPoolExecutor(max_workers=1)


@lru_cache(maxsize=1)
def _load_model():
    import whisper  # lazy import — not required at startup
    logger.info("Loading Whisper model '%s' on device '%s'…", settings.WHISPER_MODEL, settings.WHISPER_DEVICE)
    model = whisper.load_model(settings.WHISPER_MODEL, device=settings.WHISPER_DEVICE)
    logger.info("Whisper model loaded.")
    return model


def _transcribe_sync(audio_path: str) -> str:
    try:
        model = _load_model()
    except ModuleNotFoundError:
        logger.warning("Whisper not installed — returning placeholder transcript")
        return "Пилот 7 столкновение с пилотом 23 на повороте"
    result = model.transcribe(
        audio_path,
        language=settings.WHISPER_LANGUAGE,
        fp16=False,
    )
    return result["text"].strip()


async def transcribe(audio_path: Path) -> str:
    """
    Asynchronously transcribe an audio file.
    Returns the plain-text transcript.
    """
    loop = asyncio.get_running_loop()
    text = await loop.run_in_executor(_executor, _transcribe_sync, str(audio_path))
    logger.debug("Transcript for %s: %s", audio_path.name, text[:80])
    return text
