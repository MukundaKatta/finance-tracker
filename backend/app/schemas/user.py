from pydantic import BaseModel, EmailStr
from datetime import datetime


class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str
    currency: str = "USD"


class UserUpdate(BaseModel):
    full_name: str | None = None
    currency: str | None = None


class UserResponse(BaseModel):
    id: int
    email: str
    full_name: str
    currency: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class PasswordReset(BaseModel):
    token: str
    new_password: str


class PasswordResetRequest(BaseModel):
    email: EmailStr
