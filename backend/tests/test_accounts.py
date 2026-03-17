import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_account(client: AsyncClient, auth_headers, test_user):
    response = await client.post("/api/v1/accounts/", headers=auth_headers, json={
        "name": "New Savings",
        "account_type": "savings",
        "balance": 1000.00,
        "institution": "Test Bank",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "New Savings"
    assert data["balance"] == 1000.00


@pytest.mark.asyncio
async def test_list_accounts(client: AsyncClient, auth_headers, test_account):
    response = await client.get("/api/v1/accounts/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 1
    assert data[0]["name"] == "Test Checking"


@pytest.mark.asyncio
async def test_get_account(client: AsyncClient, auth_headers, test_account):
    response = await client.get(f"/api/v1/accounts/{test_account.id}", headers=auth_headers)
    assert response.status_code == 200
    assert response.json()["name"] == "Test Checking"


@pytest.mark.asyncio
async def test_update_account(client: AsyncClient, auth_headers, test_account):
    response = await client.patch(
        f"/api/v1/accounts/{test_account.id}",
        headers=auth_headers,
        json={"name": "Updated Checking"},
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Updated Checking"


@pytest.mark.asyncio
async def test_delete_account(client: AsyncClient, auth_headers, test_account):
    response = await client.delete(
        f"/api/v1/accounts/{test_account.id}", headers=auth_headers
    )
    assert response.status_code == 204

    response = await client.get(
        f"/api/v1/accounts/{test_account.id}", headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_get_nonexistent_account(client: AsyncClient, auth_headers, test_user):
    response = await client.get("/api/v1/accounts/99999", headers=auth_headers)
    assert response.status_code == 404
