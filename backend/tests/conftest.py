import asyncio
from datetime import date

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.db.base import Base
from app.core.deps import get_db
from app.core.security import get_password_hash, create_access_token
from app.main import app
from app.models.user import User
from app.models.account import Account
from app.models.category import Category
from app.models.transaction import Transaction

TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"

engine = create_async_engine(TEST_DATABASE_URL, echo=False)
TestSession = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


@pytest_asyncio.fixture
async def db_session():
    async with TestSession() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_session: AsyncSession):
    async def override_get_db():
        try:
            yield db_session
            await db_session.commit()
        except Exception:
            await db_session.rollback()
            raise

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    user = User(
        email="test@example.com",
        full_name="Test User",
        hashed_password=get_password_hash("testpassword123"),
        currency="USD",
    )
    db_session.add(user)
    await db_session.flush()
    await db_session.refresh(user)
    return user


@pytest_asyncio.fixture
async def auth_headers(test_user: User) -> dict:
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture
async def test_account(db_session: AsyncSession, test_user: User) -> Account:
    account = Account(
        user_id=test_user.id,
        name="Test Checking",
        account_type="checking",
        balance=5000.00,
    )
    db_session.add(account)
    await db_session.flush()
    await db_session.refresh(account)
    return account


@pytest_asyncio.fixture
async def test_category(db_session: AsyncSession, test_user: User) -> Category:
    category = Category(
        user_id=test_user.id,
        name="Groceries",
        icon="cart",
        color="#EF4444",
        is_income=False,
    )
    db_session.add(category)
    await db_session.flush()
    await db_session.refresh(category)
    return category


@pytest_asyncio.fixture
async def test_transactions(
    db_session: AsyncSession, test_account: Account, test_category: Category
) -> list[Transaction]:
    txns = []
    for i in range(10):
        txn = Transaction(
            account_id=test_account.id,
            category_id=test_category.id,
            amount=50.00 + i * 10,
            description=f"Test transaction {i}",
            date=date(2025, 1, 1 + i),
            transaction_type="expense",
        )
        db_session.add(txn)
        txns.append(txn)
    await db_session.flush()
    for txn in txns:
        await db_session.refresh(txn)
    return txns
