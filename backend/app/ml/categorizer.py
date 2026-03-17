"""
TF-IDF based transaction auto-categorizer.
Trains on user's historical transactions and predicts categories for new ones.
"""
import pickle
from typing import Sequence

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.naive_bayes import MultinomialNB
from sklearn.pipeline import Pipeline
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.transaction import Transaction
from app.models.account import Account
from app.models.category import Category


# In-memory model cache per user
_model_cache: dict[int, Pipeline] = {}


async def _train_model(db: AsyncSession, user_id: int) -> Pipeline | None:
    """Train a TF-IDF + Naive Bayes model on user's categorized transactions."""
    acct_result = await db.execute(select(Account.id).where(Account.user_id == user_id))
    account_ids = [row[0] for row in acct_result.all()]
    if not account_ids:
        return None

    result = await db.execute(
        select(Transaction.description, Transaction.category_id).where(
            Transaction.account_id.in_(account_ids),
            Transaction.category_id.isnot(None),
        )
    )
    rows = result.all()
    if len(rows) < 10:
        return None

    descriptions = [row[0] for row in rows]
    labels = [row[1] for row in rows]

    pipeline = Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=5000,
            ngram_range=(1, 2),
            stop_words="english",
            lowercase=True,
        )),
        ("clf", MultinomialNB(alpha=0.1)),
    ])
    pipeline.fit(descriptions, labels)
    _model_cache[user_id] = pipeline
    return pipeline


async def predict_category(
    description: str,
    categories: Sequence[Category],
    db: AsyncSession,
    user_id: int,
) -> tuple[int | None, float | None]:
    """Predict category for a transaction description.

    Returns (category_id, confidence) or (None, None).
    """
    model = _model_cache.get(user_id)
    if model is None:
        model = await _train_model(db, user_id)
    if model is None:
        return None, None

    try:
        predicted_id = model.predict([description])[0]
        probabilities = model.predict_proba([description])[0]
        confidence = float(max(probabilities))

        # Verify predicted category is in user's categories
        valid_ids = {c.id for c in categories}
        if predicted_id in valid_ids and confidence >= 0.3:
            return int(predicted_id), round(confidence, 4)
    except Exception:
        pass

    return None, None


def invalidate_cache(user_id: int):
    """Clear cached model so it retrains on next prediction."""
    _model_cache.pop(user_id, None)
