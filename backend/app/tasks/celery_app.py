from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "finance_tracker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=[
        "app.tasks.recurring_tasks",
        "app.tasks.insights_tasks",
        "app.tasks.analytics_tasks",
    ],
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    beat_schedule={
        "process-recurring-transactions": {
            "task": "app.tasks.recurring_tasks.process_recurring_transactions",
            "schedule": crontab(hour=0, minute=5),  # 12:05 AM daily
        },
        "generate-nightly-insights": {
            "task": "app.tasks.insights_tasks.generate_nightly_insights",
            "schedule": crontab(hour=1, minute=0),  # 1:00 AM daily
        },
        "precompute-analytics": {
            "task": "app.tasks.analytics_tasks.precompute_analytics",
            "schedule": crontab(hour=2, minute=0),  # 2:00 AM daily
        },
    },
)
