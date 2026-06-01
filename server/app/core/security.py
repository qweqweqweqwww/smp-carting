"""
Token utilities and password hashing for authentication.
Marshals join via a one-time opaque URL / QR code.
Judges and secretaries use name + password.
"""
import secrets

import bcrypt


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def generate_opaque_token(nbytes: int = 32) -> str:
    """URL-safe random token for single-use invites stored in DB."""
    return secrets.token_urlsafe(nbytes)
