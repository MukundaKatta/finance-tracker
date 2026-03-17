from fastapi import APIRouter

from app.api.endpoints import auth, accounts, categories, transactions, budgets, recurring, savings_goals, analytics

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(accounts.router, prefix="/accounts", tags=["accounts"])
api_router.include_router(categories.router, prefix="/categories", tags=["categories"])
api_router.include_router(transactions.router, prefix="/transactions", tags=["transactions"])
api_router.include_router(budgets.router, prefix="/budgets", tags=["budgets"])
api_router.include_router(recurring.router, prefix="/recurring", tags=["recurring"])
api_router.include_router(savings_goals.router, prefix="/savings-goals", tags=["savings-goals"])
api_router.include_router(analytics.router, prefix="/analytics", tags=["analytics"])
