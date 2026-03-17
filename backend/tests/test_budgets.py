import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_budget(client: AsyncClient, auth_headers, test_user, test_category):
    response = await client.post("/api/v1/budgets/", headers=auth_headers, json={
        "category_id": test_category.id,
        "amount": 500.00,
        "period": "monthly",
        "alert_threshold": 0.80,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["amount"] == 500.00
    assert data["period"] == "monthly"
    assert data["category_id"] == test_category.id


@pytest.mark.asyncio
async def test_list_budgets(client: AsyncClient, auth_headers, test_user, test_category):
    # Create a budget first
    await client.post("/api/v1/budgets/", headers=auth_headers, json={
        "category_id": test_category.id,
        "amount": 300.00,
    })
    response = await client.get("/api/v1/budgets/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "spent" in data[0]
    assert "remaining" in data[0]
    assert "percentage" in data[0]
    assert "category_name" in data[0]


@pytest.mark.asyncio
async def test_update_budget(client: AsyncClient, auth_headers, test_user, test_category):
    create_resp = await client.post("/api/v1/budgets/", headers=auth_headers, json={
        "category_id": test_category.id,
        "amount": 500.00,
    })
    budget_id = create_resp.json()["id"]

    response = await client.patch(
        f"/api/v1/budgets/{budget_id}",
        headers=auth_headers,
        json={"amount": 750.00},
    )
    assert response.status_code == 200
    assert response.json()["amount"] == 750.00


@pytest.mark.asyncio
async def test_delete_budget(client: AsyncClient, auth_headers, test_user, test_category):
    create_resp = await client.post("/api/v1/budgets/", headers=auth_headers, json={
        "category_id": test_category.id,
        "amount": 400.00,
    })
    budget_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/budgets/{budget_id}", headers=auth_headers
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_budget(client: AsyncClient, auth_headers, test_user):
    response = await client.delete(
        "/api/v1/budgets/99999", headers=auth_headers
    )
    assert response.status_code == 404
