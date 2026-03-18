# AI Finance Tracker

An intelligent personal finance tracker with ML-powered categorization, spending forecasts, and anomaly detection.

## Features

- **Smart Categorization** — ML model auto-categorizes transactions
- **Spending Forecasts** — Prophet-based forecasting of future expenses
- **Anomaly Detection** — Flag unusual spending patterns automatically
- **Multi-Account** — Track checking, savings, credit cards, and investments
- **Budgets** — Set monthly budgets per category with progress tracking
- **Recurring Transactions** — Manage subscriptions and scheduled payments
- **Savings Goals** — Set and track progress toward financial goals
- **AI Insights** — Personalized financial tips generated from your data
- **Mobile App** — React Native / Expo app with charts and quick actions
- **Background Tasks** — Celery workers for recurring jobs and analytics

## Tech Stack

- **Backend:** FastAPI + SQLAlchemy (async) + PostgreSQL
- **ML:** scikit-learn, Prophet, pandas, NumPy
- **Task Queue:** Celery + Redis
- **Mobile:** React Native + Expo (SDK 52) + Zustand
- **Migrations:** Alembic
- **Testing:** pytest + pytest-asyncio
- **Containerization:** Docker + Docker Compose

## Getting Started

### Prerequisites

- Python 3.11+
- Node.js 18+ and npm
- Docker & Docker Compose (recommended)

### Installation

```bash
git clone <repo-url>
cd finance-tracker

# Backend
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
python -m app.db.seed

# Mobile
cd ../mobile
npm install
```

### Run

```bash
# With Docker (backend + DB + Redis)
docker-compose up

# Or manually
cd backend && uvicorn app.main:app --reload

# Mobile app
cd mobile && npx expo start
```

## Project Structure

```
backend/
├── app/
│   ├── api/endpoints/   # Auth, accounts, transactions, budgets, etc.
│   ├── models/          # SQLAlchemy models
│   ├── schemas/         # Pydantic schemas
│   ├── ml/              # Categorizer, forecaster, anomaly detector
│   ├── services/        # Business logic (insights)
│   └── tasks/           # Celery background tasks
├── alembic/             # Database migrations
└── tests/               # pytest test suite
mobile/
└── src/
    ├── api/             # API client modules
    ├── components/      # Dashboard, transactions, budgets, charts
    ├── screens/         # Expo Router screens
    └── stores/          # Zustand auth & finance stores
```

## License

MIT
