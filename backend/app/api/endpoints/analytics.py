from datetime import date, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, extract

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.analytics import (
    SpendingSummary,
    CategoryBreakdown,
    TrendPoint,
    CashFlow,
    ForecastPoint,
    InsightResponse,
)
from app.ml.forecaster import generate_forecast
from app.ml.anomaly_detector import detect_anomalies, get_spending_patterns
from app.services.insights import generate_insights

router = APIRouter()


@router.get("/summary", response_model=SpendingSummary)
async def spending_summary(
    months: int = Query(1, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    start_date = date(today.year, today.month, 1) - timedelta(days=30 * (months - 1))
    end_date = today

    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return SpendingSummary(
            total_income=0, total_expenses=0, net_savings=0,
            savings_rate=0, period_start=start_date, period_end=end_date,
        )

    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "income",
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        )
    )
    total_income = float(income_result.scalar())

    expense_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
            Transaction.date >= start_date,
            Transaction.date <= end_date,
        )
    )
    total_expenses = float(expense_result.scalar())

    net_savings = total_income - total_expenses
    savings_rate = (net_savings / total_income * 100) if total_income > 0 else 0

    return SpendingSummary(
        total_income=round(total_income, 2),
        total_expenses=round(total_expenses, 2),
        net_savings=round(net_savings, 2),
        savings_rate=round(savings_rate, 1),
        period_start=start_date,
        period_end=end_date,
    )


@router.get("/category-breakdown", response_model=list[CategoryBreakdown])
async def category_breakdown(
    months: int = Query(1, ge=1, le=24),
    transaction_type: str = Query("expense"),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    start_date = date(today.year, today.month, 1) - timedelta(days=30 * (months - 1))

    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return []

    result = await db.execute(
        select(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == transaction_type,
            Transaction.date >= start_date,
            Transaction.category_id.isnot(None),
        )
        .group_by(Transaction.category_id)
        .order_by(func.sum(Transaction.amount).desc())
    )
    rows = result.all()

    grand_total = sum(float(r[1]) for r in rows)
    breakdowns = []
    for cat_id, total, count in rows:
        cat_result = await db.execute(select(Category).where(Category.id == cat_id))
        cat = cat_result.scalar_one_or_none()
        if cat:
            breakdowns.append(
                CategoryBreakdown(
                    category_id=cat.id,
                    category_name=cat.name,
                    category_color=cat.color,
                    category_icon=cat.icon,
                    total=round(float(total), 2),
                    percentage=round(float(total) / grand_total * 100, 1) if grand_total > 0 else 0,
                    transaction_count=int(count),
                )
            )
    return breakdowns


@router.get("/trends", response_model=list[TrendPoint])
async def spending_trends(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    start_date = date(today.year, today.month, 1) - timedelta(days=30 * (months - 1))

    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return []

    result = await db.execute(
        select(
            extract("year", Transaction.date).label("yr"),
            extract("month", Transaction.date).label("mn"),
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total"),
        )
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.date >= start_date,
        )
        .group_by("yr", "mn", Transaction.transaction_type)
        .order_by("yr", "mn")
    )
    rows = result.all()

    monthly: dict[str, dict] = {}
    for yr, mn, txn_type, total in rows:
        key = f"{int(yr)}-{int(mn):02d}"
        if key not in monthly:
            monthly[key] = {"income": 0, "expenses": 0}
        if txn_type == "income":
            monthly[key]["income"] = round(float(total), 2)
        elif txn_type == "expense":
            monthly[key]["expenses"] = round(float(total), 2)

    return [
        TrendPoint(
            date=k,
            income=v["income"],
            expenses=v["expenses"],
            net=round(v["income"] - v["expenses"], 2),
        )
        for k, v in sorted(monthly.items())
    ]


@router.get("/cash-flow", response_model=list[CashFlow])
async def cash_flow(
    months: int = Query(6, ge=1, le=24),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    start_date = date(today.year, today.month, 1) - timedelta(days=30 * (months - 1))

    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return []

    result = await db.execute(
        select(
            extract("year", Transaction.date).label("yr"),
            extract("month", Transaction.date).label("mn"),
            Transaction.transaction_type,
            func.sum(Transaction.amount).label("total"),
        )
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.date >= start_date,
        )
        .group_by("yr", "mn", Transaction.transaction_type)
        .order_by("yr", "mn")
    )
    rows = result.all()

    monthly: dict[str, dict] = {}
    for yr, mn, txn_type, total in rows:
        key = f"{int(yr)}-{int(mn):02d}"
        if key not in monthly:
            monthly[key] = {"inflow": 0, "outflow": 0}
        if txn_type == "income":
            monthly[key]["inflow"] = round(float(total), 2)
        elif txn_type == "expense":
            monthly[key]["outflow"] = round(float(total), 2)

    return [
        CashFlow(
            period=k,
            inflow=v["inflow"],
            outflow=v["outflow"],
            net=round(v["inflow"] - v["outflow"], 2),
        )
        for k, v in sorted(monthly.items())
    ]


@router.get("/forecast", response_model=list[ForecastPoint])
async def forecast(
    months_ahead: int = Query(3, ge=1, le=12),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return []

    result = await db.execute(
        select(Transaction.date, Transaction.amount, Transaction.transaction_type)
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
        )
        .order_by(Transaction.date)
    )
    transactions = result.all()
    if len(transactions) < 30:
        return []

    return await generate_forecast(transactions, months_ahead)


@router.get("/insights", response_model=list[InsightResponse])
async def get_insights(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await generate_insights(current_user.id, db)


@router.get("/anomalies")
async def get_anomalies(
    days: int = Query(90, ge=7, le=365),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await detect_anomalies(current_user.id, db, lookback_days=days)


@router.get("/spending-patterns")
async def spending_patterns(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_spending_patterns(current_user.id, db)
