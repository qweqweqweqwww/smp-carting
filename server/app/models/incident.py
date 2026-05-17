"""
Incident, decision, and protocol-entry models.
"""
import enum
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class IncidentStatus(str, enum.Enum):
    PENDING_CONFIRM = "pending_confirm"   # marshal seeing transcription
    CONFIRMED = "confirmed"               # marshal confirmed, sent to judge
    DECIDED = "decided"                   # judge issued decision
    DISMISSED = "dismissed"              # judge dismissed


class ViolationType(str, enum.Enum):
    COLLISION = "collision"
    TRACK_LIMITS = "track_limits"
    FALSE_START = "false_start"
    UNSAFE_DRIVING = "unsafe_driving"
    BLOCKING = "blocking"
    OTHER = "other"


class DecisionType(str, enum.Enum):
    PENALTY = "penalty"
    WARNING = "warning"
    DISMISS = "dismiss"


class Incident(Base):
    __tablename__ = "incidents"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id"), nullable=False)
    marshal_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    # Raw voice transcript from Whisper
    transcript_raw: Mapped[str | None] = mapped_column(Text)
    # Structured fields extracted by NLP parser
    pilot_numbers: Mapped[str | None] = mapped_column(String(100))  # comma-separated, e.g. "7,23"
    violation_type: Mapped[ViolationType | None] = mapped_column(Enum(ViolationType))
    free_text: Mapped[str | None] = mapped_column(Text)             # remainder after extraction
    status: Mapped[IncidentStatus] = mapped_column(
        Enum(IncidentStatus), default=IncidentStatus.PENDING_CONFIRM
    )
    is_emergency: Mapped[bool] = mapped_column(default=False)
    reported_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    race: Mapped["Race"] = relationship("Race", back_populates="incidents")  # noqa: F821
    audio_file: Mapped["AudioFile | None"] = relationship("AudioFile", back_populates="incident", uselist=False)  # noqa: F821
    decision: Mapped["Decision | None"] = relationship("Decision", back_populates="incident", uselist=False)
    protocol_entry: Mapped["ProtocolEntry | None"] = relationship("ProtocolEntry", back_populates="incident", uselist=False)


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), unique=True)
    judge_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    decision_type: Mapped[DecisionType] = mapped_column(Enum(DecisionType), nullable=False)
    # Human-readable penalty detail, e.g. "+5 seconds" or "drive-through"
    penalty_detail: Mapped[str | None] = mapped_column(String(200))
    notes: Mapped[str | None] = mapped_column(Text)
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    incident: Mapped["Incident"] = relationship("Incident", back_populates="decision")


class ProtocolEntry(Base):
    """Secretary-visible immutable record written after each decision."""
    __tablename__ = "protocol_entries"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    incident_id: Mapped[int] = mapped_column(ForeignKey("incidents.id", ondelete="CASCADE"), unique=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id"), nullable=False)
    sequence_number: Mapped[int] = mapped_column(Integer, nullable=False)  # monotone per race
    pilot_numbers: Mapped[str] = mapped_column(String(100), nullable=False)
    violation_type: Mapped[str] = mapped_column(String(50), nullable=False)
    transcript_raw: Mapped[str | None] = mapped_column(Text)
    decision_type: Mapped[str] = mapped_column(String(50), nullable=False)
    penalty_detail: Mapped[str | None] = mapped_column(String(200))
    post_label: Mapped[str] = mapped_column(String(50), nullable=False)
    marshal_name: Mapped[str] = mapped_column(String(100), nullable=False)
    judge_name: Mapped[str] = mapped_column(String(100), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    incident: Mapped["Incident"] = relationship("Incident", back_populates="protocol_entry")
