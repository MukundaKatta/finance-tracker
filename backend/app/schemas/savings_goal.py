from pydantic import BaseModel
from datetime import date, datetime


class SavingsGoalCreate(BaseModel):
    name: str
    target_amount: float
    current_amount: float = 0.0
    target_date: date | None = None
    icon: str = "target"
    color: str = "#10B981"


class SavingsGoalUpdate(BaseModel):
    name: str | None = None
    target_amount: float | None = None
    current_amount: float | None = None
    target_date: date | None = None
    icon: str | None = None
    color: str | None = None


class SavingsGoalResponse(BaseModel):
    id: int
    name: str
    target_amount: float
    current_amount: float
    target_date: date | None
    icon: str
    color: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SavingsGoalWithProgress(SavingsGoalResponse):
    percentage: float = 0.0
    remaining: float = 0.0
    days_left: int | None = None
    monthly_needed: float | None = None
