"""Роутер аутентификации: регистрация, вход, текущий пользователь."""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import create_access_token, get_password_hash, verify_password
from app.db import get_db
from app.models import User
from app.schemas import Token, UserCreate, UserLogin, UserOut

router = APIRouter(tags=["auth"])


async def get_user_by_email(db: AsyncSession, email: str) -> User | None:
    """Находит пользователя по email."""
    result = await db.execute(select(User).where(User.email == email))
    return result.scalar_one_or_none()


@router.post("/auth/register", response_model=None)
async def register(body: UserCreate, db: AsyncSession = Depends(get_db)) -> Token:
    """Регистрация: создаёт пользователя, возвращает JWT."""
    if await get_user_by_email(db, body.email):
        raise HTTPException(status_code=400, detail="Email уже зарегистрирован")

    user = User(email=body.email, hashed_password=get_password_hash(body.password))
    db.add(user)
    await db.commit()

    return Token(access_token=create_access_token(body.email))


@router.post("/auth/login", response_model=None)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)) -> Token:
    """Вход: проверяет пароль, возвращает JWT."""
    user = await get_user_by_email(db, body.email)
    if user is None or not verify_password(body.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")

    return Token(access_token=create_access_token(body.email))


@router.get("/auth/me", response_model=None)
async def me(
    request: Request,
    db: AsyncSession = Depends(get_db),
) -> UserOut:
    """Текущий пользователь по JWT из заголовка Authorization."""
    auth = request.headers.get("Authorization", "")
    if not auth.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Не авторизован")

    # Локальный импорт, чтобы избежать циклической зависимости deps -> auth.
    from app.deps import get_user_from_token

    user = await get_user_from_token(db, auth.removeprefix("Bearer ").strip())
    if user is None:
        raise HTTPException(status_code=401, detail="Не авторизован")

    return UserOut(email=user.email)
