import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_category(client: AsyncClient, auth_headers, test_user):
    response = await client.post("/api/v1/categories/", headers=auth_headers, json={
        "name": "Dining Out",
        "icon": "utensils",
        "color": "#F97316",
        "is_income": False,
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Dining Out"
    assert data["icon"] == "utensils"
    assert data["color"] == "#F97316"
    assert data["is_income"] is False


@pytest.mark.asyncio
async def test_list_categories(client: AsyncClient, auth_headers, test_category):
    response = await client.get("/api/v1/categories/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1


@pytest.mark.asyncio
async def test_get_category(client: AsyncClient, auth_headers, test_category):
    response = await client.get(
        f"/api/v1/categories/{test_category.id}", headers=auth_headers
    )
    assert response.status_code == 200
    assert response.json()["name"] == "Groceries"


@pytest.mark.asyncio
async def test_update_category(client: AsyncClient, auth_headers, test_category):
    response = await client.patch(
        f"/api/v1/categories/{test_category.id}",
        headers=auth_headers,
        json={"name": "Food & Groceries", "color": "#22C55E"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Food & Groceries"
    assert data["color"] == "#22C55E"


@pytest.mark.asyncio
async def test_delete_category(client: AsyncClient, auth_headers, test_category):
    response = await client.delete(
        f"/api/v1/categories/{test_category.id}", headers=auth_headers
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_get_nonexistent_category(client: AsyncClient, auth_headers, test_user):
    response = await client.get("/api/v1/categories/99999", headers=auth_headers)
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_create_income_category(client: AsyncClient, auth_headers, test_user):
    response = await client.post("/api/v1/categories/", headers=auth_headers, json={
        "name": "Salary",
        "icon": "briefcase",
        "color": "#10B981",
        "is_income": True,
    })
    assert response.status_code == 201
    assert response.json()["is_income"] is True
