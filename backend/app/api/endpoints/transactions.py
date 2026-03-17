from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_

from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.account import Account
from app.models.transaction import Transaction
from app.models.category import Category
from app.schemas.transaction import TransactionCreate, TransactionUpdate, TransactionResponse, TransactionWithCategory
from app.ml.categorizer import predict_category

router = APIRouter()


@router.get("/", response_model=list[TransactionWithCategory])
async def list_transactions(
    account_id: int | None = None,
    category_id: int | None = None,
    transaction_type: str | None = None,
    start_date: date | None = None,
    end_date: date | None = None,
    limit: int = Query(50, le=500),
    offset: int = 0,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Get user's account IDs
    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    user_account_ids = [row[0] for row in acct_result.all()]
    if not user_account_ids:
        return []

    query = select(Transaction).where(Transaction.account_id.in_(user_account_ids))

    if account_id:
        query = query.where(Transaction.account_id == account_id)
    if category_id:
        query = query.where(Transaction.category_id == category_id)
    if transaction_type:
        query = query.where(Transaction.transaction_type == transaction_type)
    if start_date:
        query = query.where(Transaction.date >= start_date)
    if end_date:
        query = query.where(Transaction.date <= end_date)

    query = query.order_by(Transaction.date.desc()).offset(offset).limit(limit)
    result = await db.execute(query)
    transactions = result.scalars().all()

    enriched = []
    for t in transactions:
        data = TransactionWithCategory.model_validate(t)
        if t.category_id:
            cat_result = await db.execute(select(Category).where(Category.id == t.category_id))
            cat = cat_result.scalar_one_or_none()
            if cat:
                data.category_name = cat.name
                data.category_color = cat.color
                data.category_icon = cat.icon
        acct_result = await db.execute(select(Account).where(Account.id == t.account_id))
        acct = acct_result.scalar_one_or_none()
        if acct:
            data.account_name = acct.name
        enriched.append(data)
    return enriched


@router.post("/", response_model=TransactionResponse, status_code=status.HTTP_201_CREATED)
async def create_transaction(
    txn_in: TransactionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # Verify account ownership
    result = await db.execute(
        select(Account).where(Account.id == txn_in.account_id, Account.user_id == current_user.id)
    )
    account = result.scalar_one_or_none()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    txn_data = txn_in.model_dump()

    # Auto-categorize if no category provided
    if txn_data.get("category_id") is None:
        cat_result = await db.execute(select(Category).where(Category.user_id == current_user.id))
        categories = cat_result.scalars().all()
        if categories:
            predicted_id, confidence = await predict_category(
                txn_in.description, categories, db, current_user.id
            )
            if predicted_id:
                txn_data["category_id"] = predicted_id
                txn_data["ai_category_confidence"] = confidence

    transaction = Transaction(**txn_data)
    db.add(transaction)

    # Update account balance
    if txn_in.transaction_type == "income":
        account.balance = float(account.balance) + txn_in.amount
    elif txn_in.transaction_type == "expense":
        account.balance = float(account.balance) - txn_in.amount

    await db.flush()
    await db.refresh(transaction)
    return transaction


@router.get("/{transaction_id}", response_model=TransactionResponse)
async def get_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    user_account_ids = [row[0] for row in acct_result.all()]
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == transaction_id, Transaction.account_id.in_(user_account_ids))
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return transaction


@router.patch("/{transaction_id}", response_model=TransactionResponse)
async def update_transaction(
    transaction_id: int,
    txn_in: TransactionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    user_account_ids = [row[0] for row in acct_result.all()]
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == transaction_id, Transaction.account_id.in_(user_account_ids))
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    for field, value in txn_in.model_dump(exclude_unset=True).items():
        setattr(transaction, field, value)
    await db.flush()
    await db.refresh(transaction)
    return transaction


@router.delete("/{transaction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_transaction(
    transaction_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    acct_result = await db.execute(select(Account.id).where(Account.user_id == current_user.id))
    user_account_ids = [row[0] for row in acct_result.all()]
    result = await db.execute(
        select(Transaction).where(
            and_(Transaction.id == transaction_id, Transaction.account_id.in_(user_account_ids))
        )
    )
    transaction = result.scalar_one_or_none()
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")

    # Reverse balance effect
    acct = await db.execute(select(Account).where(Account.id == transaction.account_id))
    account = acct.scalar_one()
    if transaction.transaction_type == "income":
        account.balance = float(account.balance) - float(transaction.amount)
    elif transaction.transaction_type == "expense":
        account.balance = float(account.balance) + float(transaction.amount)

    await db.delete(transaction)
