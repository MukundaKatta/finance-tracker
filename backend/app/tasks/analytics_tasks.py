"""Pre-compute analytics for dashboard performance."""
import json
from datetime import date, timedelta

import redis
from sqlalchemy import create_engine, select, func
from sqlalchemy.orm import Session

from app.core.config import settings
from app.tasks.celery_app import celery_app
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction

engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)
redis_client = redis.from_url(settings.REDIS_URL)


@celery_app.task(bind=True, max_retries=3)
def precompute_analytics(self):
    """Pre-compute common analytics queries and cache results."""
    processed = 0

    with Session(engine) as db:
        users = db.execute(select(User).where(User.is_active == True)).scalars().all()

        for user in users:
            try:
                account_ids = [
                    row[0]
                    for row in db.execute(
                        select(Account.id).where(Account.user_id == user.id)
                    ).all()
                ]
                if not account_ids:
                    continue

                today = date.today()
                month_start = date(today.year, today.month, 1)

                # Monthly totals
                income = db.execute(
                    select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                        Transaction.account_id.in_(account_ids),
                        Transaction.transaction_type == "income",
                        Transaction.date >= month_start,
                    )
                ).scalar()

                expenses = db.execute(
                    select(func.coalesce(func.sum(Transaction.amount), 0)).where(
                        Transaction.account_id.in_(account_ids),
                        Transaction.transaction_type == "expense",
                        Transaction.date >= month_start,
                    )
                ).scalar()

                total_balance = db.execute(
                    select(func.coalesce(func.sum(Account.balance), 0)).where(
                        Account.user_id == user.id
                    )
                ).scalar()

                analytics = {
                    "monthly_income": float(income),
                    "monthly_expenses": float(expenses),
                    "net_savings": float(income) - float(expenses),
                    "total_balance": float(total_balance),
                    "computed_at": today.isoformat(),
                }

                cache_key = f"analytics:user:{user.id}:dashboard"
                redis_client.setex(cache_key, 86400, json.dumps(analytics))
                processed += 1

            except Exception as e:
                print(f"Error computing analytics for user {user.id}: {e}")

    return {"processed": processed}
