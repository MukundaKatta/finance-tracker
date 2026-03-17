from datetime import date, timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.budget import Budget
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.account import Account
from app.schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetWithSpent

router = APIRouter()


def _get_period_dates(period: str) -> tuple[date, date]:
    today = date.today()
    if period == "weekly":
        start = today - timedelta(days=today.weekday())
        end = start + timedelta(days=6)
    elif period == "yearly":
        start = date(today.year, 1, 1)
        end = date(today.year, 12, 31)
    else:  # monthly
        start = date(today.year, today.month, 1)
        if today.month == 12:
            end = date(today.year + 1, 1, 1) - timedelta(days=1)
        else:
            end = date(today.year, today.month + 1, 1) - timedelta(days=1)
    return start, end


@router.get("/", response_model=list[BudgetWithSpent])
async def list_budgets(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Budget).where(Budget.user_id == current_user.id))
    budgets = result.scalars().all()

    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    user_account_ids = [row[0] for row in acct_result.all()]

    enriched = []
    for b in budgets:
        cat_result = await db.execute(select(Category).where(Category.id == b.category_id))
        cat = cat_result.scalar_one_or_none()
        if not cat:
            continue

        start, end = _get_period_dates(b.period)
        spent_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.account_id.in_(user_account_ids),
                Transaction.category_id == b.category_id,
                Transaction.transaction_type == "expense",
                Transaction.date >= start,
                Transaction.date <= end,
            )
        )
        spent = float(spent_result.scalar())
        remaining = max(0, float(b.amount) - spent)
        percentage = (spent / float(b.amount) * 100) if float(b.amount) > 0 else 0

        enriched.append(
            BudgetWithSpent(
                id=b.id,
                category_id=b.category_id,
                amount=float(b.amount),
                period=b.period,
                alert_threshold=float(b.alert_threshold),
                created_at=b.created_at,
                category_name=cat.name,
                category_color=cat.color,
                category_icon=cat.icon,
                spent=spent,
                remaining=remaining,
                percentage=round(percentage, 1),
            )
        )
    return enriched


@router.post("/", response_model=BudgetResponse, status_code=status.HTTP_201_CREATED)
async def create_budget(
    budget_in: BudgetCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    budget = Budget(user_id=current_user.id, **budget_in.model_dump())
    db.add(budget)
    await db.flush()
    await db.refresh(budget)
    return budget


@router.patch("/{budget_id}", response_model=BudgetResponse)
async def update_budget(
    budget_id: int,
    budget_in: BudgetUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    for field, value in budget_in.model_dump(exclude_unset=True).items():
        setattr(budget, field, value)
    await db.flush()
    await db.refresh(budget)
    return budget


@router.delete("/{budget_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_budget(
    budget_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Budget).where(Budget.id == budget_id, Budget.user_id == current_user.id)
    )
    budget = result.scalar_one_or_none()
    if not budget:
        raise HTTPException(status_code=404, detail="Budget not found")
    await db.delete(budget)
