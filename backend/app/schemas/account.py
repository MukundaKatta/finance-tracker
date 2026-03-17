from pydantic import BaseModel
from datetime import datetime


class AccountCreate(BaseModel):
    name: str
    account_type: str
    balance: float = 0.0
    currency: str = "USD"
    institution: str | None = None
    icon: str = "wallet"


class AccountUpdate(BaseModel):
    name: str | None = None
    account_type: str | None = None
    balance: float | None = None
    institution: str | None = None
    icon: str | None = None


class AccountResponse(BaseModel):
    id: int
    name: str
    account_type: str
    balance: float
    currency: str
    institution: str | None
    icon: str
    created_at: datetime

    model_config = {"from_attributes": True}
