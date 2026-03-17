from pydantic import BaseModel
from datetime import date, datetime


class RecurringTransactionCreate(BaseModel):
    account_id: int
    category_id: int | None = None
    amount: float
    description: str
    frequency: str
    transaction_type: str
    next_date: date
    end_date: date | None = None


class RecurringTransactionUpdate(BaseModel):
    amount: float | None = None
    description: str | None = None
    frequency: str | None = None
    next_date: date | None = None
    end_date: date | None = None
    is_active: bool | None = None


class RecurringTransactionResponse(BaseModel):
    id: int
    account_id: int
    category_id: int | None
    amount: float
    description: str
    frequency: str
    transaction_type: str
    next_date: date
    end_date: date | None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
