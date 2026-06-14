"""
Incident lifecycle endpoints:
  POST /incidents/audio   — marshal uploads voice clip → ASR + NLP → transcript returned
  POST /incidents/{id}/confirm   — marshal confirms / edits transcript
  POST /incidents/{id}/decide    — judge issues decision
  GET  /incidents/                — list for a race
  GET  /incidents/{id}           — single incident with full detail
"""
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sqlfunc

from app.db.database import get_db
from app.models.incident import Incident, Decision, ProtocolEntry, IncidentStatus, ViolationType
from app.models.audio import AudioFile
from app.models.user import User
from app.models.race import Post
from app.schemas.incident import (
    TranscriptResult, IncidentConfirm, IncidentRead,
    DecisionCreate, DecisionRead, ProtocolEntryRead,
    DecisionSplitCreate,
)
from app.services import audio_service
from app.services.asr import whisper_service
from app.services.nlp.parser import parse
from app.services.ws_manager import manager

router = APIRouter(prefix="/incidents", tags=["incidents"])


@router.post("/audio", response_model=TranscriptResult, status_code=status.HTTP_201_CREATED)
async def upload_audio(
    race_id: int = Form(...),
    post_id: int = Form(...),
    marshal_id: int = Form(...),
    is_emergency: bool = Form(False),
    audio: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
):
    """
    Step 1: Marshal uploads voice clip.
    Creates a pending incident, runs ASR + NLP, returns structured transcript.
    The marshal confirms or retries on their device.
    """
    raw = await audio.read()

    # Create incident record in PENDING state before heavy processing
    incident = Incident(
        race_id=race_id,
        post_id=post_id,
        marshal_id=marshal_id,
        is_emergency=is_emergency,
        status=IncidentStatus.PENDING_CONFIRM,
    )
    db.add(incident)
    await db.flush()  # get incident.id

    # Persist audio
    audio_path: Path = await audio_service.save_audio(raw, race_id, incident.id)
    duration = await audio_service.get_duration(audio_path)
    audio_record = AudioFile(
        incident_id=incident.id,
        file_path=str(audio_path),
        duration_seconds=duration,
        file_size_bytes=len(raw),
    )
    db.add(audio_record)

    # ASR
    transcript = await whisper_service.transcribe(audio_path)
    incident.transcript_raw = transcript

    # NLP
    parsed = parse(transcript)
    incident.pilot_numbers = ",".join(str(n) for n in parsed.pilot_numbers)
    incident.violation_type = parsed.violation_type
    incident.free_text = parsed.free_text
    if is_emergency or parsed.is_emergency:
        incident.is_emergency = True

    await db.flush()
    await db.refresh(incident)

    return TranscriptResult(
        incident_id=incident.id,
        transcript_raw=transcript,
        pilot_numbers=parsed.pilot_numbers,
        violation_type=parsed.violation_type,
        free_text=parsed.free_text,
    )


@router.post("/{incident_id}/confirm", response_model=IncidentRead)
async def confirm_incident(
    incident_id: int,
    body: IncidentConfirm,
    db: AsyncSession = Depends(get_db),
):
    """
    Step 2: Marshal confirms (possibly edited) transcript.
    Broadcasts incident card to judge channel via WebSocket.
    """
    from datetime import datetime, timezone
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.status != IncidentStatus.PENDING_CONFIRM:
        raise HTTPException(status_code=400, detail="Incident already confirmed")

    incident.pilot_numbers = ",".join(str(n) for n in body.pilot_numbers)
    incident.violation_type = body.violation_type
    incident.free_text = body.free_text
    incident.is_emergency = body.is_emergency
    incident.status = IncidentStatus.CONFIRMED
    incident.confirmed_at = datetime.now(timezone.utc)
    await db.flush()
    await db.refresh(incident)

    # Notify judge(s)
    post = await db.get(Post, incident.post_id)
    ws_payload = {
        "incident_id": incident.id,
        "pilot_numbers": body.pilot_numbers,
        "violation_type": incident.violation_type.value if incident.violation_type else None,
        "transcript_raw": incident.transcript_raw,
        "free_text": incident.free_text,
        "is_emergency": incident.is_emergency,
        "post_id": incident.post_id,
        "post_label": post.label if post else f"Пост {incident.post_id}",
        "marshal_id": incident.marshal_id,
        "audio_url": f"/audio/{incident.id}",
    }
    if incident.is_emergency:
        await manager.broadcast_emergency("incident.new", ws_payload)
    else:
        await manager.broadcast_to_channel("judge", "incident.new", ws_payload)

    return incident


@router.post("/{incident_id}/decide", response_model=DecisionRead)
async def decide_incident(
    incident_id: int,
    body: DecisionCreate,
    judge_id: int,          # TODO: extract from auth header in production
    db: AsyncSession = Depends(get_db),
):
    """
    Step 3: Judge issues a decision.
    Creates Decision + ProtocolEntry, notifies secretary.
    """
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.status != IncidentStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Incident not in CONFIRMED state")

    decision = Decision(
        incident_id=incident_id,
        judge_id=judge_id,
        **body.model_dump(exclude={"assigned_pilot_number"}),
    )
    db.add(decision)
    incident.status = IncidentStatus.DECIDED
    await db.flush()

    # Build protocol entry (denormalized for export stability)
    judge = await db.get(User, judge_id)
    marshal = await db.get(User, incident.marshal_id)
    post = await db.get(Post, incident.post_id)

    seq_result = await db.execute(
        select(sqlfunc.count(ProtocolEntry.id)).where(ProtocolEntry.race_id == incident.race_id)
    )
    seq_num = (seq_result.scalar() or 0) + 1

    # Use judge-assigned pilot number if provided, otherwise fall back to incident's pilot numbers
    effective_pilots = body.assigned_pilot_number or (incident.pilot_numbers or "")

    protocol = ProtocolEntry(
        incident_id=incident_id,
        race_id=incident.race_id,
        sequence_number=seq_num,
        pilot_numbers=effective_pilots,
        violation_type=incident.violation_type.value if incident.violation_type else "",
        transcript_raw=incident.transcript_raw,
        decision_type=body.decision_type.value,
        penalty_detail=body.penalty_detail,
        post_label=post.label if post else "",
        marshal_name=marshal.name if marshal else "",
        judge_name=judge.name if judge else "",
    )
    db.add(protocol)
    await db.flush()
    await db.refresh(decision)

    # Notify secretary
    await manager.broadcast_to_channel("secretary", "protocol.new", {
        "incident_id": incident_id,
        "sequence_number": seq_num,
        "pilot_numbers": effective_pilots,
        "violation_type": incident.violation_type.value if incident.violation_type else "",
        "transcript_raw": incident.transcript_raw,
        "decision_type": body.decision_type.value,
        "penalty_detail": body.penalty_detail,
        "post_label": post.label if post else "",
    })

    return decision


@router.post("/{incident_id}/decide-split", response_model=list[ProtocolEntryRead])
async def decide_split_incident(
    incident_id: int,
    body: DecisionSplitCreate,
    judge_id: int,
    db: AsyncSession = Depends(get_db),
):
    """
    Judge issues separate decisions for individual pilots in one incident.
    Creates one Decision record (for the incident) and N ProtocolEntry records
    (one per split item), then notifies the secretary for each entry.
    """
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    if incident.status != IncidentStatus.CONFIRMED:
        raise HTTPException(status_code=400, detail="Incident not in CONFIRMED state")
    if not body.decisions:
        raise HTTPException(status_code=400, detail="decisions list cannot be empty")

    judge = await db.get(User, judge_id)
    marshal = await db.get(User, incident.marshal_id)
    post = await db.get(Post, incident.post_id)

    # One Decision record marks the incident as settled; use the first item's type
    decision = Decision(
        incident_id=incident_id,
        judge_id=judge_id,
        decision_type=body.decisions[0].decision_type,
        penalty_detail=body.decisions[0].penalty_detail,
        notes=f"split:{len(body.decisions)}",
    )
    db.add(decision)
    await db.flush()

    created_entries: list[ProtocolEntry] = []

    for item in body.decisions:
        seq_result = await db.execute(
            select(sqlfunc.count(ProtocolEntry.id)).where(ProtocolEntry.race_id == incident.race_id)
        )
        seq_num = (seq_result.scalar() or 0) + 1

        protocol = ProtocolEntry(
            incident_id=incident_id,
            race_id=incident.race_id,
            sequence_number=seq_num,
            pilot_numbers=item.pilot_number,
            violation_type=incident.violation_type.value if incident.violation_type else "",
            transcript_raw=incident.transcript_raw,
            decision_type=item.decision_type.value,
            penalty_detail=item.penalty_detail,
            post_label=post.label if post else "",
            marshal_name=marshal.name if marshal else "",
            judge_name=judge.name if judge else "",
        )
        db.add(protocol)
        await db.flush()
        await db.refresh(protocol)
        created_entries.append(protocol)

        await manager.broadcast_to_channel("secretary", "protocol.new", {
            "incident_id": incident_id,
            "sequence_number": seq_num,
            "pilot_numbers": item.pilot_number,
            "violation_type": incident.violation_type.value if incident.violation_type else "",
            "transcript_raw": incident.transcript_raw,
            "decision_type": item.decision_type.value,
            "penalty_detail": item.penalty_detail,
            "post_label": post.label if post else "",
        })

    incident.status = IncidentStatus.DECIDED
    await db.flush()

    return created_entries


@router.get("/protocol", response_model=list[ProtocolEntryRead])
async def get_protocol(race_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(ProtocolEntry)
        .where(ProtocolEntry.race_id == race_id)
        .order_by(ProtocolEntry.sequence_number)
    )
    return result.scalars().all()


@router.get("/", response_model=list[IncidentRead])
async def list_incidents(race_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Incident).where(Incident.race_id == race_id).order_by(Incident.reported_at.desc())
    )
    return result.scalars().all()


@router.get("/{incident_id}", response_model=IncidentRead)
async def get_incident(incident_id: int, db: AsyncSession = Depends(get_db)):
    incident = await db.get(Incident, incident_id)
    if not incident:
        raise HTTPException(status_code=404, detail="Incident not found")
    return incident
