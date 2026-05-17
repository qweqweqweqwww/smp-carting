"""
Race and track-post models.
"""
import enum
from datetime import datetime, timezone

from sqlalchemy import DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class RaceStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    FINISHED = "finished"
    ARCHIVED = "archived"


class Race(Base):
    __tablename__ = "races"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), nullable=False)
    venue: Mapped[str] = mapped_column(String(200), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[RaceStatus] = mapped_column(
        Enum(RaceStatus), default=RaceStatus.DRAFT, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    posts: Mapped[list["Post"]] = relationship("Post", back_populates="race", cascade="all, delete-orphan")
    incidents: Mapped[list["Incident"]] = relationship("Incident", back_populates="race")  # noqa: F821


class Post(Base):
    """A marshal observation post at a fixed point on the track."""
    __tablename__ = "posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    race_id: Mapped[int] = mapped_column(ForeignKey("races.id", ondelete="CASCADE"), nullable=False)
    label: Mapped[str] = mapped_column(String(50), nullable=False)   # e.g. "T1", "Sector B"
    # Pixel coordinates on the track map image (used by drag-assign UI)
    map_x: Mapped[int | None] = mapped_column(Integer)
    map_y: Mapped[int | None] = mapped_column(Integer)

    race: Mapped["Race"] = relationship("Race", back_populates="posts")
    user_posts: Mapped[list["UserPost"]] = relationship("UserPost", back_populates="post")  # noqa: F821
