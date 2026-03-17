from pydantic import BaseModel
from datetime import date, datetime


class TransactionCreate(BaseModel):
    account_id: int
    category_id: int | None = None
    amount: float
    description: str
    date: date
    transaction_type: str  # income, expense, transfer
    notes: str | None = None
    is_recurring: bool = False


class TransactionUpdate(BaseModel):
    category_id: int | None = None
    amount: float | None = None
    description: str | None = None
    date: date | None = None
    transaction_type: str | None = None
    notes: str | None = None


class TransactionResponse(BaseModel):
    id: int
    account_id: int
    category_id: int | None
    amount: float
    description: str
    date: date
    transaction_type: str
    notes: str | None
    is_recurring: bool
    ai_category_confidence: float | None
    created_at: datetime

    model_config = {"from_attributes": True}


class TransactionWithCategory(TransactionResponse):
    category_name: str | None = None
    category_color: str | None = None
    category_icon: str | None = None
    account_name: str | None = None
