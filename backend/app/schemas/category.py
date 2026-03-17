from pydantic import BaseModel
from datetime import datetime


class CategoryCreate(BaseModel):
    name: str
    icon: str = "tag"
    color: str = "#6366F1"
    is_income: bool = False
    parent_id: int | None = None


class CategoryUpdate(BaseModel):
    name: str | None = None
    icon: str | None = None
    color: str | None = None


class CategoryResponse(BaseModel):
    id: int
    name: str
    icon: str
    color: str
    is_income: bool
    parent_id: int | None
    created_at: datetime

    model_config = {"from_attributes": True}
