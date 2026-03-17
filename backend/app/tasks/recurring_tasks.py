"""Process recurring transactions that are due."""
from datetime import date, timedelta

from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.tasks.celery_app import celery_app
from app.models.recurring_transaction import RecurringTransaction
from app.models.transaction import Transaction
from app.models.account import Account

engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)


def _advance_next_date(current: date, frequency: str) -> date:
    if frequency == "daily":
        return current + timedelta(days=1)
    elif frequency == "weekly":
        return current + timedelta(weeks=1)
    elif frequency == "biweekly":
        return current + timedelta(weeks=2)
    elif frequency == "monthly":
        month = current.month + 1
        year = current.year
        if month > 12:
            month = 1
            year += 1
        day = min(current.day, 28)  # Safe for all months
        return date(year, month, day)
    elif frequency == "yearly":
        return date(current.year + 1, current.month, current.day)
    return current + timedelta(days=30)


@celery_app.task(bind=True, max_retries=3)
def process_recurring_transactions(self):
    """Find all due recurring transactions and create them."""
    today = date.today()
    created_count = 0

    with Session(engine) as db:
        result = db.execute(
            select(RecurringTransaction).where(
                RecurringTransaction.is_active == True,
                RecurringTransaction.next_date <= today,
            )
        )
        recurring = result.scalars().all()

        for rec in recurring:
            # Check end date
            if rec.end_date and today > rec.end_date:
                rec.is_active = False
                continue

            # Create the transaction
            transaction = Transaction(
                account_id=rec.account_id,
                category_id=rec.category_id,
                amount=rec.amount,
                description=rec.description,
                date=rec.next_date,
                transaction_type=rec.transaction_type,
                is_recurring=True,
            )
            db.add(transaction)

            # Update account balance
            account = db.execute(
                select(Account).where(Account.id == rec.account_id)
            ).scalar_one_or_none()
            if account:
                if rec.transaction_type == "income":
                    account.balance = float(account.balance) + float(rec.amount)
                elif rec.transaction_type == "expense":
                    account.balance = float(account.balance) - float(rec.amount)

            # Advance to next date
            rec.next_date = _advance_next_date(rec.next_date, rec.frequency)
            created_count += 1

        db.commit()

    return {"created": created_count}
