"""
User, invite-token, and post-assignment models.
No passwords — authentication is invite-token only.
"""
import enum
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, Integer, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    MARSHAL = "marshal"
    JUDGE = "judge"
    SECRETARY = "secretary"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), nullable=False)
    # NULL for judges/secretaries — they are race-agnostic global accounts.
    # Marshals always have a race_id (they join via per-race invite).
    race_id: Mapped[int | None] = mapped_column(ForeignKey("races.id", ondelete="CASCADE"), nullable=True)
    # Bcrypt hash for judge/secretary login; marshals have None (invite-only).
    password_hash: Mapped[str | None] = mapped_column(String(128), nullable=True)
    # Opaque session token issued after invite redemption; stored as plain text
    # (not a password — it grants access to a single race only).
    session_token: Mapped[str | None] = mapped_column(String(128), index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    invite: Mapped["UserInvite | None"] = relationship("UserInvite", back_populates="user", uselist=False)
    user_posts: Mapped[list["UserPost"]] = relationship("UserPost", back_populates="user")


class UserInvite(Base):
    """One-time invite link / QR code record."""
    __tablename__ = "user_invites"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), unique=True)
    # URL-safe random token embedded in the invite URL
    token: Mapped[str] = mapped_column(String(128), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    redeemed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="invite")


class UserPost(Base):
    """Assignment of a marshal to a track post for a race."""
    __tablename__ = "user_posts"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    post_id: Mapped[int] = mapped_column(ForeignKey("posts.id", ondelete="CASCADE"))
    assigned_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now()
    )

    user: Mapped["User"] = relationship("User", back_populates="user_posts")
    post: Mapped["Post"] = relationship("Post", back_populates="user_posts")  # noqa: F821
