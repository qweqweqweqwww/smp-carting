from datetime import datetime
from pydantic import BaseModel, ConfigDict
from app.models.incident import IncidentStatus, ViolationType, DecisionType


class TranscriptResult(BaseModel):
    """ASR + NLP output returned to marshal for confirmation."""
    incident_id: int
    transcript_raw: str
    pilot_numbers: list[int]
    violation_type: ViolationType | None
    free_text: str | None


class IncidentConfirm(BaseModel):
    """Marshal edits (if any) before confirming."""
    pilot_numbers: list[int]
    violation_type: ViolationType | None = None
    free_text: str | None = None
    is_emergency: bool = False


class IncidentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    race_id: int
    post_id: int
    marshal_id: int
    transcript_raw: str | None
    pilot_numbers: str | None
    violation_type: ViolationType | None
    free_text: str | None
    status: IncidentStatus
    is_emergency: bool
    reported_at: datetime
    confirmed_at: datetime | None
    audio_file_id: int | None = None


class DecisionCreate(BaseModel):
    decision_type: DecisionType
    penalty_detail: str | None = None
    notes: str | None = None
    assigned_pilot_number: str | None = None  # if set, overrides incident.pilot_numbers in ProtocolEntry


class SplitDecisionItem(BaseModel):
    pilot_number: str
    decision_type: DecisionType
    penalty_detail: str | None = None


class DecisionSplitCreate(BaseModel):
    decisions: list[SplitDecisionItem]


class DecisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    incident_id: int
    judge_id: int
    decision_type: DecisionType
    penalty_detail: str | None
    notes: str | None
    decided_at: datetime


class ProtocolEntryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    incident_id: int
    race_id: int
    sequence_number: int
    pilot_numbers: str
    violation_type: str
    transcript_raw: str | None
    decision_type: str
    penalty_detail: str | None
    post_label: str
    marshal_name: str
    judge_name: str
    created_at: datetime
