"""AI Insights Engine: generates personalized financial insights."""
from datetime import date, timedelta

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.account import Account
from app.models.transaction import Transaction
from app.models.category import Category
from app.models.budget import Budget
from app.schemas.analytics import InsightResponse


async def generate_insights(user_id: int, db: AsyncSession) -> list[InsightResponse]:
    insights: list[InsightResponse] = []

    acct_result = await db.execute(select(Account.id).where(Account.user_id == user_id))
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return insights

    today = date.today()
    month_start = date(today.year, today.month, 1)
    prev_month_start = (month_start - timedelta(days=1)).replace(day=1)
    prev_month_end = month_start - timedelta(days=1)

    # 1. Budget alerts
    budget_result = await db.execute(select(Budget).where(Budget.user_id == user_id))
    budgets = budget_result.scalars().all()
    for b in budgets:
        spent_result = await db.execute(
            select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                Transaction.account_id.in_(account_ids),
                Transaction.category_id == b.category_id,
                Transaction.transaction_type == "expense",
                Transaction.date >= month_start,
                Transaction.date <= today,
            )
        )
        spent = float(spent_result.scalar())
        pct = spent / float(b.amount) if float(b.amount) > 0 else 0

        cat_result = await db.execute(select(Category).where(Category.id == b.category_id))
        cat = cat_result.scalar_one_or_none()
        cat_name = cat.name if cat else "Unknown"

        if pct >= 1.0:
            insights.append(InsightResponse(
                type="warning",
                title=f"{cat_name} budget exceeded",
                message=f"You've spent ${spent:.2f} of your ${float(b.amount):.2f} {cat_name} budget ({pct*100:.0f}%).",
                severity="high",
                related_category=cat_name,
            ))
        elif pct >= float(b.alert_threshold):
            insights.append(InsightResponse(
                type="warning",
                title=f"{cat_name} budget alert",
                message=f"You've used {pct*100:.0f}% of your {cat_name} budget (${spent:.2f} / ${float(b.amount):.2f}).",
                severity="medium",
                related_category=cat_name,
            ))

    # 2. Month-over-month spending comparison
    this_month_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
            Transaction.date >= month_start,
            Transaction.date <= today,
        )
    )
    this_month_total = float(this_month_result.scalar())

    prev_month_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
            Transaction.date >= prev_month_start,
            Transaction.date <= prev_month_end,
        )
    )
    prev_month_total = float(prev_month_result.scalar())

    if prev_month_total > 0:
        change_pct = ((this_month_total - prev_month_total) / prev_month_total) * 100
        if change_pct > 20:
            insights.append(InsightResponse(
                type="warning",
                title="Spending increase detected",
                message=f"Your spending is up {change_pct:.0f}% compared to last month (${this_month_total:.2f} vs ${prev_month_total:.2f}).",
                severity="medium",
            ))
        elif change_pct < -10:
            insights.append(InsightResponse(
                type="achievement",
                title="Great job saving!",
                message=f"Your spending is down {abs(change_pct):.0f}% compared to last month. Keep it up!",
                severity="low",
            ))

    # 3. Top spending category insight
    top_cat_result = await db.execute(
        select(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
        )
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
            Transaction.date >= month_start,
            Transaction.category_id.isnot(None),
        )
        .group_by(Transaction.category_id)
        .order_by(func.sum(Transaction.amount).desc())
        .limit(1)
    )
    top = top_cat_result.first()
    if top:
        cat_result = await db.execute(select(Category).where(Category.id == top[0]))
        cat = cat_result.scalar_one_or_none()
        if cat and this_month_total > 0:
            pct = float(top[1]) / this_month_total * 100
            insights.append(InsightResponse(
                type="info",
                title=f"Top spending: {cat.name}",
                message=f"{cat.name} accounts for {pct:.0f}% of your spending this month (${float(top[1]):.2f}).",
                severity="low",
                related_category=cat.name,
            ))

    # 4. Savings rate insight
    income_result = await db.execute(
        select(func.coalesce(func.sum(Transaction.amount), 0)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "income",
            Transaction.date >= month_start,
            Transaction.date <= today,
        )
    )
    income = float(income_result.scalar())
    if income > 0:
        savings_rate = ((income - this_month_total) / income) * 100
        if savings_rate >= 20:
            insights.append(InsightResponse(
                type="achievement",
                title="Excellent savings rate",
                message=f"You're saving {savings_rate:.0f}% of your income this month. Financial freedom is getting closer!",
                severity="low",
            ))
        elif savings_rate < 0:
            insights.append(InsightResponse(
                type="warning",
                title="Spending exceeds income",
                message=f"You've spent ${this_month_total - income:.2f} more than you've earned this month.",
                severity="high",
            ))

    # 5. Unusual transaction detection
    avg_result = await db.execute(
        select(func.avg(Transaction.amount)).where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
        )
    )
    avg_amount = avg_result.scalar()
    if avg_amount:
        avg_val = float(avg_amount)
        large_result = await db.execute(
            select(Transaction).where(
                Transaction.account_id.in_(account_ids),
                Transaction.transaction_type == "expense",
                Transaction.amount > avg_val * 3,
                Transaction.date >= month_start,
            ).order_by(Transaction.amount.desc()).limit(3)
        )
        large_txns = large_result.scalars().all()
        for txn in large_txns:
            insights.append(InsightResponse(
                type="info",
                title="Large transaction detected",
                message=f"${float(txn.amount):.2f} at '{txn.description}' on {txn.date} is significantly above your average.",
                severity="low",
            ))

    return insights
