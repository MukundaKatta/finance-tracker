"""
Anomaly detection for unusual spending patterns.
Uses Isolation Forest from scikit-learn to detect outlier transactions.
"""
from datetime import date, timedelta
from typing import Sequence

import numpy as np
from sklearn.ensemble import IsolationForest
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.account import Account
from app.models.transaction import Transaction
from app.models.category import Category


async def detect_anomalies(
    user_id: int,
    db: AsyncSession,
    lookback_days: int = 90,
    contamination: float = 0.05,
) -> list[dict]:
    """Detect anomalous transactions for a user.

    Returns a list of dicts with transaction details and anomaly scores.
    """
    acct_result = await db.execute(
        select(Account.id).where(Account.user_id == user_id)
    )
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return []

    cutoff = date.today() - timedelta(days=lookback_days)
    result = await db.execute(
        select(Transaction)
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
            Transaction.date >= cutoff,
        )
        .order_by(Transaction.date)
    )
    transactions = result.scalars().all()

    if len(transactions) < 20:
        return []

    # Build feature matrix: [amount, day_of_week, day_of_month, hour_proxy]
    amounts = np.array([float(t.amount) for t in transactions])
    features = np.column_stack([
        amounts,
        np.array([t.date.weekday() for t in transactions]),
        np.array([t.date.day for t in transactions]),
        np.array([t.category_id or 0 for t in transactions]),
    ])

    # Normalize amounts using log scale to handle large ranges
    features[:, 0] = np.log1p(features[:, 0])

    model = IsolationForest(
        contamination=contamination,
        random_state=42,
        n_estimators=100,
    )
    predictions = model.fit_predict(features)
    scores = model.decision_function(features)

    anomalies = []
    for i, (txn, pred, score) in enumerate(zip(transactions, predictions, scores)):
        if pred == -1:  # Anomaly
            cat_name = None
            if txn.category_id:
                cat_result = await db.execute(
                    select(Category.name).where(Category.id == txn.category_id)
                )
                row = cat_result.first()
                cat_name = row[0] if row else None

            anomalies.append({
                "transaction_id": txn.id,
                "amount": float(txn.amount),
                "description": txn.description,
                "date": txn.date.isoformat(),
                "category": cat_name,
                "anomaly_score": round(float(-score), 4),
            })

    # Sort by anomaly score descending (most anomalous first)
    anomalies.sort(key=lambda x: x["anomaly_score"], reverse=True)
    return anomalies[:10]


async def get_spending_patterns(
    user_id: int,
    db: AsyncSession,
) -> dict:
    """Analyze spending patterns per category to find deviations."""
    acct_result = await db.execute(
        select(Account.id).where(Account.user_id == user_id)
    )
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return {"patterns": []}

    today = date.today()
    month_start = date(today.year, today.month, 1)

    # Get current month category spending
    result = await db.execute(
        select(
            Transaction.category_id,
            func.sum(Transaction.amount).label("current_total"),
            func.count(Transaction.id).label("current_count"),
        )
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
            Transaction.date >= month_start,
            Transaction.category_id.isnot(None),
        )
        .group_by(Transaction.category_id)
    )
    current_spending = {row[0]: (float(row[1]), int(row[2])) for row in result.all()}

    # Get average monthly spending over last 3 months
    three_months_ago = month_start - timedelta(days=90)
    result = await db.execute(
        select(
            Transaction.category_id,
            func.sum(Transaction.amount).label("total"),
            func.count(Transaction.id).label("count"),
        )
        .where(
            Transaction.account_id.in_(account_ids),
            Transaction.transaction_type == "expense",
            Transaction.date >= three_months_ago,
            Transaction.date < month_start,
            Transaction.category_id.isnot(None),
        )
        .group_by(Transaction.category_id)
    )
    historical = {row[0]: (float(row[1]) / 3, int(row[2]) / 3) for row in result.all()}

    patterns = []
    all_cat_ids = set(current_spending.keys()) | set(historical.keys())

    for cat_id in all_cat_ids:
        current_total, current_count = current_spending.get(cat_id, (0, 0))
        avg_total, avg_count = historical.get(cat_id, (0, 0))

        cat_result = await db.execute(
            select(Category.name, Category.color).where(Category.id == cat_id)
        )
        row = cat_result.first()
        if not row:
            continue

        deviation = 0.0
        if avg_total > 0:
            deviation = ((current_total - avg_total) / avg_total) * 100

        patterns.append({
            "category_id": cat_id,
            "category_name": row[0],
            "category_color": row[1],
            "current_month_total": round(current_total, 2),
            "average_monthly": round(avg_total, 2),
            "deviation_percent": round(deviation, 1),
            "current_count": current_count,
            "average_count": round(avg_count, 1),
        })

    patterns.sort(key=lambda x: abs(x["deviation_percent"]), reverse=True)
    return {"patterns": patterns}
