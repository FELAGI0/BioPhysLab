"""Утилиты безопасности: хеширование паролей (bcrypt) и JWT (python-jose)."""

from datetime import datetime, timedelta, timezone

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.config import settings

# bcrypt для хеширования паролей.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Срок жизни access-токена.
TOKEN_EXPIRE_DAYS = 7


def get_password_hash(password: str) -> str:
    """Хеширует пароль bcrypt'ом."""
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Проверяет пароль против хеша."""
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(email: str) -> str:
    """Создаёт JWT со сроком жизни 7 дней."""
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload = {"sub": email, "exp": expire}
    return jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")


def decode_token(token: str) -> str | None:
    """Проверяет JWT и возвращает email (sub) или None при любой ошибке."""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
    except JWTError:
        return None
    email = payload.get("sub")
    if not isinstance(email, str):
        return None
    return email
