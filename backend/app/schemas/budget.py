from pydantic import BaseModel
from datetime import datetime


class BudgetCreate(BaseModel):
    category_id: int
    amount: float
    period: str = "monthly"
    alert_threshold: float = 0.80


class BudgetUpdate(BaseModel):
    amount: float | None = None
    period: str | None = None
    alert_threshold: float | None = None


class BudgetResponse(BaseModel):
    id: int
    category_id: int
    amount: float
    period: str
    alert_threshold: float
    created_at: datetime

    model_config = {"from_attributes": True}


class BudgetWithSpent(BudgetResponse):
    category_name: str
    category_color: str
    category_icon: str
    spent: float = 0.0
    remaining: float = 0.0
    percentage: float = 0.0
