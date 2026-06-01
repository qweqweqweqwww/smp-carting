"""
Audio file streaming endpoint.
"""
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.models.audio import AudioFile

router = APIRouter(prefix="/audio", tags=["audio"])


@router.get("/{incident_id}")
async def stream_audio(incident_id: int, db: AsyncSession = Depends(get_db)):
    """
    Stream the OGG audio file for an incident.
    Used by the judge tablet's audio player.
    """
    result = await db.execute(
        select(AudioFile).where(AudioFile.incident_id == incident_id)
    )
    audio = result.scalar_one_or_none()
    if not audio:
        raise HTTPException(status_code=404, detail="Audio not found")

    path = Path(audio.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="Audio file missing from disk")

    return FileResponse(path, media_type="audio/ogg; codecs=opus", filename=f"incident_{incident_id}.ogg")
