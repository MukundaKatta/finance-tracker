import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_transaction(client: AsyncClient, auth_headers, test_account, test_category):
    response = await client.post("/api/v1/transactions/", headers=auth_headers, json={
        "account_id": test_account.id,
        "category_id": test_category.id,
        "amount": 45.99,
        "description": "Whole Foods Market",
        "date": "2025-01-15",
        "transaction_type": "expense",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 45.99
    assert data["description"] == "Whole Foods Market"
    assert data["transaction_type"] == "expense"


@pytest.mark.asyncio
async def test_list_transactions(client: AsyncClient, auth_headers, test_transactions):
    response = await client.get("/api/v1/transactions/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10


@pytest.mark.asyncio
async def test_list_transactions_with_filters(
    client: AsyncClient, auth_headers, test_transactions, test_account
):
    response = await client.get(
        f"/api/v1/transactions/?account_id={test_account.id}&transaction_type=expense",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 10


@pytest.mark.asyncio
async def test_list_transactions_date_filter(
    client: AsyncClient, auth_headers, test_transactions
):
    response = await client.get(
        "/api/v1/transactions/?start_date=2025-01-03&end_date=2025-01-07",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 5


@pytest.mark.asyncio
async def test_update_transaction(
    client: AsyncClient, auth_headers, test_transactions
):
    txn = test_transactions[0]
    response = await client.patch(
        f"/api/v1/transactions/{txn.id}",
        headers=auth_headers,
        json={"amount": 99.99, "description": "Updated description"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 99.99
    assert data["description"] == "Updated description"


@pytest.mark.asyncio
async def test_delete_transaction(client: AsyncClient, auth_headers, test_transactions):
    txn = test_transactions[0]
    response = await client.delete(
        f"/api/v1/transactions/{txn.id}", headers=auth_headers
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_create_income_updates_balance(
    client: AsyncClient, auth_headers, test_account, test_category
):
    response = await client.post("/api/v1/transactions/", headers=auth_headers, json={
        "account_id": test_account.id,
        "amount": 1000.00,
        "description": "Salary",
        "date": "2025-01-15",
        "transaction_type": "income",
    })
    assert response.status_code == 201

    acct_resp = await client.get(
        f"/api/v1/accounts/{test_account.id}", headers=auth_headers
    )
    assert acct_resp.json()["balance"] == 6000.00
