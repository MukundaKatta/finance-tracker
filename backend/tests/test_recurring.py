import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_recurring(client: AsyncClient, auth_headers, test_account, test_category):
    response = await client.post("/api/v1/recurring/", headers=auth_headers, json={
        "account_id": test_account.id,
        "category_id": test_category.id,
        "amount": 1850.00,
        "description": "Monthly Rent",
        "frequency": "monthly",
        "transaction_type": "expense",
        "next_date": "2025-02-01",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 1850.00
    assert data["frequency"] == "monthly"
    assert data["is_active"] is True


@pytest.mark.asyncio
async def test_list_recurring(client: AsyncClient, auth_headers, test_account, test_category):
    await client.post("/api/v1/recurring/", headers=auth_headers, json={
        "account_id": test_account.id,
        "category_id": test_category.id,
        "amount": 15.99,
        "description": "Netflix",
        "frequency": "monthly",
        "transaction_type": "expense",
        "next_date": "2025-02-01",
    })
    response = await client.get("/api/v1/recurring/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_update_recurring(client: AsyncClient, auth_headers, test_account, test_category):
    create_resp = await client.post("/api/v1/recurring/", headers=auth_headers, json={
        "account_id": test_account.id,
        "category_id": test_category.id,
        "amount": 100.00,
        "description": "Gym Membership",
        "frequency": "monthly",
        "transaction_type": "expense",
        "next_date": "2025-02-01",
    })
    rec_id = create_resp.json()["id"]

    response = await client.patch(
        f"/api/v1/recurring/{rec_id}",
        headers=auth_headers,
        json={"amount": 120.00, "is_active": False},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["amount"] == 120.00
    assert data["is_active"] is False


@pytest.mark.asyncio
async def test_delete_recurring(client: AsyncClient, auth_headers, test_account, test_category):
    create_resp = await client.post("/api/v1/recurring/", headers=auth_headers, json={
        "account_id": test_account.id,
        "amount": 50.00,
        "description": "Weekly Savings Transfer",
        "frequency": "weekly",
        "transaction_type": "expense",
        "next_date": "2025-02-01",
    })
    rec_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/recurring/{rec_id}", headers=auth_headers
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_recurring(client: AsyncClient, auth_headers, test_user):
    response = await client.delete(
        "/api/v1/recurring/99999", headers=auth_headers
    )
    assert response.status_code == 404
