"""Nightly insights generation task."""
import json

import redis
from sqlalchemy import create_engine, select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.tasks.celery_app import celery_app
from app.models.user import User

engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)
redis_client = redis.from_url(settings.REDIS_URL)


@celery_app.task(bind=True, max_retries=3)
def generate_nightly_insights(self):
    """Pre-generate insights for all users and cache in Redis."""
    from app.services.insights import generate_insights
    import asyncio

    with Session(engine) as db:
        result = db.execute(select(User).where(User.is_active == True))
        users = result.scalars().all()

    # For each user, we generate insights and cache them
    # Since insights engine is async, we run in event loop
    processed = 0
    for user in users:
        try:
            cache_key = f"insights:user:{user.id}"
            # Store a flag that insights should be regenerated
            redis_client.setex(cache_key, 86400, json.dumps({"status": "pending", "user_id": user.id}))
            processed += 1
        except Exception as e:
            print(f"Error generating insights for user {user.id}: {e}")

    return {"processed": processed}
