"""
User management, invite creation/redemption, and post assignment.
"""
from datetime import datetime, timedelta, timezone

import qrcode
import io
import base64

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete, or_, and_
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.security import generate_opaque_token, hash_password, verify_password
from app.db.database import get_db
from app.models.user import User, UserInvite, UserPost, UserRole
from app.schemas.user import (
    UserCreate, UserLogin, UserRead, UserUpdate, InviteRead, InviteRedeemRequest,
    InviteRedeemResponse, PostAssignRequest,
)

router = APIRouter(prefix="/users", tags=["users"])


async def _get_user_with_posts(db: AsyncSession, user_id: int) -> User:
    result = await db.execute(
        select(User).options(selectinload(User.user_posts)).where(User.id == user_id)
    )
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.post("/login", response_model=InviteRedeemResponse)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    """Password login for judge and secretary roles."""
    result = await db.execute(
        select(User).options(selectinload(User.user_posts))
        .where(User.name == body.name)
        .where(User.role.in_([UserRole.JUDGE, UserRole.SECRETARY]))
        .where(User.is_active == True)  # noqa: E712
    )
    user = result.scalar_one_or_none()
    if not user or not user.password_hash or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверное имя или пароль")

    session_token = generate_opaque_token()
    user.session_token = session_token
    await db.flush()
    return InviteRedeemResponse(session_token=session_token, user=UserRead.model_validate(user))


@router.post("/", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_user(body: UserCreate, db: AsyncSession = Depends(get_db)):
    data = body.model_dump(exclude={"password"})
    user = User(**data)
    if body.password and body.role in (UserRole.JUDGE, UserRole.SECRETARY):
        user.password_hash = hash_password(body.password)
    db.add(user)
    await db.flush()
    return await _get_user_with_posts(db, user.id)


@router.get("/global", response_model=list[UserRead])
async def list_global_users(db: AsyncSession = Depends(get_db)):
    """Return all judges and secretaries (race-agnostic global accounts)."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.user_posts))
        .where(User.role.in_([UserRole.JUDGE, UserRole.SECRETARY]))
        .where(User.is_active == True)  # noqa: E712
        .order_by(User.role, User.name)
    )
    return result.scalars().all()


@router.get("/", response_model=list[UserRead])
async def list_users(race_id: int, db: AsyncSession = Depends(get_db)):
    """Return marshals for a race + all global judges/secretaries."""
    result = await db.execute(
        select(User)
        .options(selectinload(User.user_posts))
        .where(
            or_(
                User.race_id == race_id,
                and_(
                    User.role.in_([UserRole.JUDGE, UserRole.SECRETARY]),
                    User.race_id.is_(None),
                ),
            )
        )
    )
    return result.scalars().all()


@router.patch("/{user_id}", response_model=UserRead)
async def update_user(user_id: int, body: UserUpdate, db: AsyncSession = Depends(get_db)):
    user = await _get_user_with_posts(db, user_id)
    for field, value in body.model_dump(exclude_none=True).items():
        setattr(user, field, value)
    await db.flush()
    return await _get_user_with_posts(db, user_id)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Remove related records explicitly — SQLAlchemy won't cascade by default
    # because user_id is NOT NULL in both tables.
    await db.execute(delete(UserPost).where(UserPost.user_id == user_id))
    await db.execute(delete(UserInvite).where(UserInvite.user_id == user_id))
    await db.delete(user)
    await db.flush()


@router.post("/{user_id}/invite", response_model=InviteRead)
async def create_invite(
    user_id: int,
    base_url: str = "http://localhost:5174",
    db: AsyncSession = Depends(get_db),
):
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Upsert: delete old invite so a fresh one can be generated
    result = await db.execute(select(UserInvite).where(UserInvite.user_id == user_id))
    old_invite = result.scalar_one_or_none()
    if old_invite:
        await db.delete(old_invite)
        await db.flush()

    token = generate_opaque_token()
    expires_at = datetime.now(timezone.utc) + timedelta(hours=settings.INVITE_TOKEN_EXPIRE_HOURS)
    invite = UserInvite(user_id=user_id, token=token, expires_at=expires_at)
    db.add(invite)
    await db.flush()

    invite_url = f"{base_url}/join/{token}"

    img = qrcode.make(invite_url)
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    qr_data = base64.b64encode(buf.getvalue()).decode()
    qr_code_url = f"data:image/png;base64,{qr_data}"

    return InviteRead(invite_url=invite_url, qr_code_url=qr_code_url, expires_at=expires_at)


@router.get("/invite/peek")
async def peek_invite(token: str, db: AsyncSession = Depends(get_db)):
    """Return the role for an invite token without redeeming it."""
    result = await db.execute(
        select(UserInvite, User).join(User, UserInvite.user_id == User.id)
        .where(UserInvite.token == token)
    )
    row = result.first()
    if not row:
        raise HTTPException(status_code=404, detail="Invite not found")
    invite, user = row
    if invite.redeemed_at is not None:
        raise HTTPException(status_code=409, detail="Invite already redeemed")
    return {"role": user.role.value}


@router.post("/invite/redeem", response_model=InviteRedeemResponse)
async def redeem_invite(body: InviteRedeemRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(UserInvite).where(UserInvite.token == body.token))
    invite = result.scalar_one_or_none()

    if not invite:
        raise HTTPException(status_code=404, detail="Invite not found")
    if invite.redeemed_at is not None:
        raise HTTPException(status_code=409, detail="Invite already redeemed")
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    if invite.expires_at < now:
        raise HTTPException(status_code=410, detail="Invite expired")

    session_token = generate_opaque_token()
    invite.redeemed_at = datetime.now(timezone.utc)

    user = await db.get(User, invite.user_id)
    user.session_token = session_token
    await db.flush()

    full_user = await _get_user_with_posts(db, user.id)
    return InviteRedeemResponse(session_token=session_token, user=UserRead.model_validate(full_user))


@router.post("/assign-post", status_code=status.HTTP_204_NO_CONTENT)
async def assign_post(body: PostAssignRequest, db: AsyncSession = Depends(get_db)):
    """Organizer assigns a marshal to a track post (replaces previous assignment)."""
    await db.execute(delete(UserPost).where(UserPost.user_id == body.user_id))
    assignment = UserPost(user_id=body.user_id, post_id=body.post_id)
    db.add(assignment)
    await db.flush()


@router.delete("/{user_id}/assign-post", status_code=status.HTTP_204_NO_CONTENT)
async def unassign_post(user_id: int, db: AsyncSession = Depends(get_db)):
    """Remove a marshal from their current post."""
    await db.execute(delete(UserPost).where(UserPost.user_id == user_id))
    await db.flush()
