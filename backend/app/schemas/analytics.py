from pydantic import BaseModel
from datetime import date


class SpendingSummary(BaseModel):
    total_income: float
    total_expenses: float
    net_savings: float
    savings_rate: float
    period_start: date
    period_end: date


class CategoryBreakdown(BaseModel):
    category_id: int
    category_name: str
    category_color: str
    category_icon: str
    total: float
    percentage: float
    transaction_count: int


class TrendPoint(BaseModel):
    date: str
    income: float
    expenses: float
    net: float


class CashFlow(BaseModel):
    period: str
    inflow: float
    outflow: float
    net: float


class ForecastPoint(BaseModel):
    date: str
    predicted: float
    lower_bound: float
    upper_bound: float


class InsightResponse(BaseModel):
    type: str  # warning, tip, achievement, info
    title: str
    message: str
    severity: str = "info"  # low, medium, high
    related_category: str | None = None
