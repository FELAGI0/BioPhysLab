"""Pydantic-схемы аутентификации: регистрация, вход, токен."""

from pydantic import BaseModel, EmailStr, Field


class UserCreate(BaseModel):
    """Тело POST /api/auth/register."""

    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
    """Тело POST /api/auth/login."""

    email: EmailStr
    password: str = Field(min_length=6, max_length=128)


class Token(BaseModel):
    """Ответ успешного входа/регистрации."""

    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    """Ответ GET /api/auth/me."""

    email: EmailStr
