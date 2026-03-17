"""Seed database with realistic test data: 500+ transactions, 4 accounts, 20 categories, budgets, goals."""
import random
from datetime import date, timedelta

from sqlalchemy import create_engine
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash
from app.db.base import Base
from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction
from app.models.budget import Budget
from app.models.recurring_transaction import RecurringTransaction
from app.models.savings_goal import SavingsGoal

engine = create_engine(settings.DATABASE_URL_SYNC, pool_pre_ping=True)

EXPENSE_CATEGORIES = [
    ("Groceries", "cart", "#EF4444", False),
    ("Restaurants", "utensils", "#F97316", False),
    ("Transportation", "car", "#F59E0B", False),
    ("Gas & Fuel", "fuel", "#EAB308", False),
    ("Utilities", "zap", "#84CC16", False),
    ("Rent / Mortgage", "home", "#22C55E", False),
    ("Insurance", "shield", "#10B981", False),
    ("Healthcare", "heart", "#14B8A6", False),
    ("Entertainment", "film", "#06B6D4", False),
    ("Shopping", "shopping-bag", "#0EA5E9", False),
    ("Subscriptions", "repeat", "#3B82F6", False),
    ("Education", "book", "#6366F1", False),
    ("Travel", "plane", "#8B5CF6", False),
    ("Personal Care", "scissors", "#A855F7", False),
    ("Gifts & Donations", "gift", "#D946EF", False),
    ("Home Maintenance", "wrench", "#EC4899", False),
    ("Pets", "paw-print", "#F43F5E", False),
]

INCOME_CATEGORIES = [
    ("Salary", "briefcase", "#10B981", True),
    ("Freelance", "laptop", "#059669", True),
    ("Investments", "trending-up", "#047857", True),
]

EXPENSE_MERCHANTS = {
    "Groceries": ["Whole Foods Market", "Trader Joe's", "Costco", "Safeway", "Kroger", "Aldi", "Walmart Grocery"],
    "Restaurants": ["Chipotle", "Starbucks", "McDonald's", "Panera Bread", "DoorDash", "Uber Eats", "Pizza Hut", "Olive Garden"],
    "Transportation": ["Uber", "Lyft", "Metro Transit", "Parking Garage", "Car Wash Express"],
    "Gas & Fuel": ["Shell Gas Station", "Chevron", "BP Gas", "ExxonMobil", "Costco Gas"],
    "Utilities": ["Electric Company", "Water & Sewer", "Internet Provider", "Cell Phone Bill", "Natural Gas Co"],
    "Rent / Mortgage": ["Monthly Rent Payment", "Mortgage Payment"],
    "Insurance": ["Car Insurance", "Health Insurance Premium", "Renters Insurance"],
    "Healthcare": ["CVS Pharmacy", "Walgreens", "Dr. Smith Office", "Dentist Visit", "Eye Exam"],
    "Entertainment": ["Netflix", "Spotify", "Movie Theater", "Concert Tickets", "Bowling Alley", "Steam Games"],
    "Shopping": ["Amazon", "Target", "Best Buy", "Nike Store", "IKEA", "Nordstrom", "Zara"],
    "Subscriptions": ["Netflix", "Spotify Premium", "iCloud Storage", "NYT Subscription", "Adobe CC", "Gym Membership"],
    "Education": ["Udemy Course", "O'Reilly Books", "Coursera", "Textbooks"],
    "Travel": ["Delta Airlines", "Marriott Hotel", "Airbnb", "Rental Car", "Travel Insurance"],
    "Personal Care": ["Haircut", "Salon Visit", "Skincare Products", "Gym"],
    "Gifts & Donations": ["Birthday Gift", "Charity Donation", "Wedding Gift", "Holiday Gifts"],
    "Home Maintenance": ["Home Depot", "Lowe's", "Plumber Service", "Cleaning Service"],
    "Pets": ["PetSmart", "Vet Visit", "Pet Food", "Dog Grooming"],
}

AMOUNT_RANGES = {
    "Groceries": (25, 180),
    "Restaurants": (8, 75),
    "Transportation": (5, 45),
    "Gas & Fuel": (30, 70),
    "Utilities": (40, 200),
    "Rent / Mortgage": (1500, 2200),
    "Insurance": (80, 300),
    "Healthcare": (15, 250),
    "Entertainment": (10, 80),
    "Shopping": (15, 250),
    "Subscriptions": (5, 50),
    "Education": (10, 100),
    "Travel": (100, 800),
    "Personal Care": (15, 80),
    "Gifts & Donations": (20, 150),
    "Home Maintenance": (25, 300),
    "Pets": (20, 150),
}

FREQUENCY_WEIGHTS = {
    "Groceries": 8,
    "Restaurants": 10,
    "Transportation": 6,
    "Gas & Fuel": 3,
    "Utilities": 1,
    "Rent / Mortgage": 1,
    "Insurance": 1,
    "Healthcare": 1,
    "Entertainment": 4,
    "Shopping": 5,
    "Subscriptions": 1,
    "Education": 1,
    "Travel": 1,
    "Personal Care": 2,
    "Gifts & Donations": 1,
    "Home Maintenance": 1,
    "Pets": 2,
}


def seed():
    Base.metadata.create_all(engine)

    with Session(engine) as db:
        # Check if already seeded
        existing = db.query(User).filter_by(email="demo@financetracker.com").first()
        if existing:
            print("Database already seeded.")
            return

        # Create demo user
        user = User(
            email="demo@financetracker.com",
            full_name="Alex Johnson",
            hashed_password=get_password_hash("demo123456"),
            currency="USD",
        )
        db.add(user)
        db.flush()

        # Create 4 accounts
        accounts_data = [
            ("Main Checking", "checking", 4250.00, "Chase Bank", "building"),
            ("Savings Account", "savings", 12500.00, "Ally Bank", "piggy-bank"),
            ("Credit Card", "credit", -1840.00, "Capital One", "credit-card"),
            ("Investment Account", "investment", 35200.00, "Vanguard", "trending-up"),
        ]
        accounts = []
        for name, atype, balance, inst, icon in accounts_data:
            acct = Account(
                user_id=user.id, name=name, account_type=atype,
                balance=balance, institution=inst, icon=icon,
            )
            db.add(acct)
            accounts.append(acct)
        db.flush()

        # Create 20 categories
        categories = {}
        for name, icon, color, is_income in EXPENSE_CATEGORIES + INCOME_CATEGORIES:
            cat = Category(
                user_id=user.id, name=name, icon=icon, color=color, is_income=is_income,
            )
            db.add(cat)
            db.flush()
            categories[name] = cat

        # Generate 500+ transactions over 6 months
        today = date.today()
        start_date = today - timedelta(days=180)
        transactions = []
        random.seed(42)

        # Monthly recurring: salary, rent, subscriptions
        current_date = start_date
        while current_date <= today:
            # Salary on 1st and 15th
            if current_date.day == 1:
                transactions.append(Transaction(
                    account_id=accounts[0].id, category_id=categories["Salary"].id,
                    amount=4500.00, description="Biweekly Salary Deposit",
                    date=current_date, transaction_type="income",
                ))
            if current_date.day == 15:
                transactions.append(Transaction(
                    account_id=accounts[0].id, category_id=categories["Salary"].id,
                    amount=4500.00, description="Biweekly Salary Deposit",
                    date=current_date, transaction_type="income",
                ))
            # Monthly freelance income (random months)
            if current_date.day == 20 and random.random() > 0.4:
                transactions.append(Transaction(
                    account_id=accounts[0].id, category_id=categories["Freelance"].id,
                    amount=round(random.uniform(500, 2000), 2),
                    description=random.choice(["Web Design Project", "Consulting Fee", "Freelance Development"]),
                    date=current_date, transaction_type="income",
                ))
            # Rent on 1st
            if current_date.day == 1:
                transactions.append(Transaction(
                    account_id=accounts[0].id, category_id=categories["Rent / Mortgage"].id,
                    amount=1850.00, description="Monthly Rent Payment",
                    date=current_date, transaction_type="expense",
                ))
            current_date += timedelta(days=1)

        # Random daily expenses
        cat_names = list(FREQUENCY_WEIGHTS.keys())
        cat_weights = [FREQUENCY_WEIGHTS[c] for c in cat_names]
        current_date = start_date
        while current_date <= today:
            # 2-5 transactions per day
            num_txns = random.randint(1, 4)
            for _ in range(num_txns):
                cat_name = random.choices(cat_names, weights=cat_weights, k=1)[0]
                if cat_name in ("Rent / Mortgage",):
                    continue  # Already handled above
                lo, hi = AMOUNT_RANGES[cat_name]
                merchants = EXPENSE_MERCHANTS[cat_name]
                amount = round(random.uniform(lo, hi), 2)
                # Use credit card ~30% of the time for non-utility expenses
                if cat_name not in ("Utilities", "Insurance") and random.random() < 0.3:
                    acct = accounts[2]  # credit card
                else:
                    acct = accounts[0]  # checking

                transactions.append(Transaction(
                    account_id=acct.id,
                    category_id=categories[cat_name].id,
                    amount=amount,
                    description=random.choice(merchants),
                    date=current_date,
                    transaction_type="expense",
                ))
            current_date += timedelta(days=1)

        # Investment dividends quarterly
        for month_offset in [0, 3]:
            inv_date = start_date + timedelta(days=30 * month_offset + 25)
            if inv_date <= today:
                transactions.append(Transaction(
                    account_id=accounts[3].id, category_id=categories["Investments"].id,
                    amount=round(random.uniform(200, 500), 2),
                    description="Quarterly Dividend Payment",
                    date=inv_date, transaction_type="income",
                ))

        db.add_all(transactions)
        print(f"Created {len(transactions)} transactions")

        # Create budgets
        budget_data = [
            ("Groceries", 600),
            ("Restaurants", 300),
            ("Transportation", 200),
            ("Entertainment", 200),
            ("Shopping", 400),
            ("Utilities", 350),
            ("Healthcare", 200),
            ("Subscriptions", 100),
            ("Personal Care", 100),
        ]
        for cat_name, amount in budget_data:
            budget = Budget(
                user_id=user.id,
                category_id=categories[cat_name].id,
                amount=amount,
                period="monthly",
                alert_threshold=0.80,
            )
            db.add(budget)

        # Create recurring transactions
        recurring_data = [
            (accounts[0].id, "Rent / Mortgage", 1850, "Monthly Rent Payment", "monthly", "expense"),
            (accounts[0].id, "Utilities", 120, "Electric Company", "monthly", "expense"),
            (accounts[0].id, "Utilities", 65, "Internet Provider", "monthly", "expense"),
            (accounts[0].id, "Subscriptions", 15.99, "Netflix", "monthly", "expense"),
            (accounts[0].id, "Subscriptions", 10.99, "Spotify Premium", "monthly", "expense"),
            (accounts[0].id, "Insurance", 145, "Car Insurance", "monthly", "expense"),
            (accounts[0].id, "Salary", 4500, "Biweekly Salary Deposit", "biweekly", "income"),
        ]
        for acct_id, cat_name, amount, desc, freq, txn_type in recurring_data:
            rec = RecurringTransaction(
                user_id=user.id,
                account_id=acct_id,
                category_id=categories[cat_name].id,
                amount=amount,
                description=desc,
                frequency=freq,
                transaction_type=txn_type,
                next_date=today + timedelta(days=random.randint(1, 30)),
            )
            db.add(rec)

        # Create savings goals
        goals_data = [
            ("Emergency Fund", 15000, 8500, today + timedelta(days=365), "shield", "#EF4444"),
            ("Vacation Fund", 5000, 2200, today + timedelta(days=180), "plane", "#3B82F6"),
            ("New Laptop", 2500, 1800, today + timedelta(days=90), "laptop", "#8B5CF6"),
            ("Car Down Payment", 10000, 3500, today + timedelta(days=540), "car", "#F59E0B"),
        ]
        for name, target, current, target_date, icon, color in goals_data:
            goal = SavingsGoal(
                user_id=user.id,
                name=name,
                target_amount=target,
                current_amount=current,
                target_date=target_date,
                icon=icon,
                color=color,
            )
            db.add(goal)

        db.commit()
        print("Seed data created successfully!")
        print(f"  User: demo@financetracker.com / demo123456")
        print(f"  Accounts: {len(accounts_data)}")
        print(f"  Categories: {len(EXPENSE_CATEGORIES) + len(INCOME_CATEGORIES)}")
        print(f"  Transactions: {len(transactions)}")
        print(f"  Budgets: {len(budget_data)}")
        print(f"  Recurring: {len(recurring_data)}")
        print(f"  Goals: {len(goals_data)}")


if __name__ == "__main__":
    seed()
