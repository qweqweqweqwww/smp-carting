from datetime import datetime
from pydantic import BaseModel, ConfigDict, model_validator
from app.models.user import UserRole


class UserCreate(BaseModel):
    name: str
    role: UserRole
    race_id: int | None = None  # NULL for judge/secretary (global); required for marshal
    password: str | None = None


class UserLogin(BaseModel):
    name: str
    password: str


class UserUpdate(BaseModel):
    name: str | None = None
    is_active: bool | None = None


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    role: UserRole
    race_id: int | None
    is_active: bool
    has_session: bool = False
    assigned_post_id: int | None = None
    created_at: datetime

    @model_validator(mode="before")
    @classmethod
    def _compute_fields(cls, data):
        if not hasattr(data, "session_token"):
            return data
        assigned_post_id = None
        user_posts = getattr(data, "user_posts", [])
        if user_posts:
            latest = sorted(user_posts, key=lambda x: x.assigned_at, reverse=True)[0]
            assigned_post_id = latest.post_id
        return {
            "id": data.id,
            "name": data.name,
            "role": data.role,
            "race_id": data.race_id,
            "is_active": data.is_active,
            "created_at": data.created_at,
            "has_session": data.session_token is not None,
            "assigned_post_id": assigned_post_id,
        }


class InviteRead(BaseModel):
    """Returned to organizer when invite is created."""
    invite_url: str
    qr_code_url: str
    expires_at: datetime


class InviteRedeemRequest(BaseModel):
    token: str


class InviteRedeemResponse(BaseModel):
    """Returned to marshal device after successful redemption."""
    session_token: str
    user: UserRead


class PostAssignRequest(BaseModel):
    user_id: int
    post_id: int
