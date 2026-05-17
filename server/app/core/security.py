"""
Token utilities and password hashing for authentication.
Marshals join via a one-time signed URL / QR code.
Judges and secretaries use name + password.
"""
import secrets
from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())

ALGORITHM = "HS256"


def create_invite_token(user_id: int, race_id: int) -> str:
    """Return a signed JWT encoding the invite payload."""
    expire = datetime.now(timezone.utc) + timedelta(
        hours=settings.INVITE_TOKEN_EXPIRE_HOURS
    )
    payload = {
        "sub": str(user_id),
        "race_id": race_id,
        "type": "invite",
        "exp": expire,
    }
    return jwt.encode(payload, settings.SECRET_KEY, algorithm=ALGORITHM)


def decode_invite_token(token: str) -> dict:
    """
    Decode and validate an invite token.
    Raises jose.JWTError on invalid / expired token.
    """
    return jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])


def generate_opaque_token(nbytes: int = 32) -> str:
    """URL-safe random token for single-use invites stored in DB."""
    return secrets.token_urlsafe(nbytes)
