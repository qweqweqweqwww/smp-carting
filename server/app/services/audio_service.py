"""
Audio file management service.

Responsibilities:
  - Accept WAV upload from client
  - Convert WAV -> OGG for storage (ffmpeg via subprocess)
  - Derive and store file metadata (duration, size)
  - Return the stored file path for streaming/download
"""
import asyncio
import logging
import subprocess
from pathlib import Path

import aiofiles

from app.core.config import settings

logger = logging.getLogger(__name__)


def _storage_path(race_id: int, incident_id: int) -> Path:
    directory = settings.AUDIO_STORAGE_DIR / str(race_id)
    directory.mkdir(parents=True, exist_ok=True)
    return directory / f"incident_{incident_id}.{settings.AUDIO_STORAGE_FORMAT}"


async def save_audio(raw_bytes: bytes, race_id: int, incident_id: int) -> Path:
    """
    Write the incoming audio bytes to storage.
    Converts WAV->OGG via ffmpeg when available; falls back to raw storage.
    """
    tmp_path = settings.AUDIO_STORAGE_DIR / f"tmp_{incident_id}.wav"
    tmp_path.parent.mkdir(parents=True, exist_ok=True)

    async with aiofiles.open(tmp_path, "wb") as f:
        await f.write(raw_bytes)

    ogg_path = _storage_path(race_id, incident_id)
    try:
        await _convert_wav_to_ogg(tmp_path, ogg_path)
        tmp_path.unlink(missing_ok=True)
    except (FileNotFoundError, RuntimeError):
        logger.warning("ffmpeg unavailable — storing raw audio as-is")
        tmp_path.rename(ogg_path)

    logger.info("Audio saved: %s", ogg_path)
    return ogg_path


async def _convert_wav_to_ogg(src: Path, dst: Path) -> None:
    """Run ffmpeg in a subprocess to convert WAV -> OGG Vorbis."""
    cmd = [
        "ffmpeg", "-y",
        "-i", str(src),
        "-c:a", "libopus",
        "-b:a", "64k",
        str(dst),
    ]
    proc = await asyncio.create_subprocess_exec(
        *cmd,
        stdout=asyncio.subprocess.DEVNULL,
        stderr=asyncio.subprocess.PIPE,
    )
    _, stderr = await proc.communicate()
    if proc.returncode != 0:
        raise RuntimeError(f"ffmpeg conversion failed: {stderr.decode()}")


def get_audio_path(race_id: int, incident_id: int) -> Path | None:
    path = _storage_path(race_id, incident_id)
    return path if path.exists() else None


async def get_duration(path: Path) -> float | None:
    """Use ffprobe to get duration in seconds."""
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error",
                "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1",
                str(path),
            ],
            capture_output=True, text=True, timeout=10,
        )
        return float(result.stdout.strip())
    except Exception:
        return None
