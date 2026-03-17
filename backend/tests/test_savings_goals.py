import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_savings_goal(client: AsyncClient, auth_headers, test_user):
    response = await client.post("/api/v1/savings-goals/", headers=auth_headers, json={
        "name": "Emergency Fund",
        "target_amount": 15000.00,
        "current_amount": 5000.00,
        "target_date": "2026-12-31",
        "icon": "shield",
        "color": "#EF4444",
    })
    assert response.status_code == 201
    data = response.json()
    assert data["name"] == "Emergency Fund"
    assert data["target_amount"] == 15000.00
    assert data["current_amount"] == 5000.00


@pytest.mark.asyncio
async def test_list_savings_goals(client: AsyncClient, auth_headers, test_user):
    await client.post("/api/v1/savings-goals/", headers=auth_headers, json={
        "name": "Vacation",
        "target_amount": 3000.00,
    })
    response = await client.get("/api/v1/savings-goals/", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    assert "percentage" in data[0]
    assert "remaining" in data[0]


@pytest.mark.asyncio
async def test_update_savings_goal(client: AsyncClient, auth_headers, test_user):
    create_resp = await client.post("/api/v1/savings-goals/", headers=auth_headers, json={
        "name": "New Laptop",
        "target_amount": 2500.00,
        "current_amount": 500.00,
    })
    goal_id = create_resp.json()["id"]

    response = await client.patch(
        f"/api/v1/savings-goals/{goal_id}",
        headers=auth_headers,
        json={"current_amount": 1200.00, "name": "MacBook Pro"},
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_amount"] == 1200.00
    assert data["name"] == "MacBook Pro"


@pytest.mark.asyncio
async def test_delete_savings_goal(client: AsyncClient, auth_headers, test_user):
    create_resp = await client.post("/api/v1/savings-goals/", headers=auth_headers, json={
        "name": "Car Fund",
        "target_amount": 10000.00,
    })
    goal_id = create_resp.json()["id"]

    response = await client.delete(
        f"/api/v1/savings-goals/{goal_id}", headers=auth_headers
    )
    assert response.status_code == 204


@pytest.mark.asyncio
async def test_delete_nonexistent_goal(client: AsyncClient, auth_headers, test_user):
    response = await client.delete(
        "/api/v1/savings-goals/99999", headers=auth_headers
    )
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_savings_goal_progress_calculation(client: AsyncClient, auth_headers, test_user):
    await client.post("/api/v1/savings-goals/", headers=auth_headers, json={
        "name": "Test Goal",
        "target_amount": 1000.00,
        "current_amount": 750.00,
        "target_date": "2027-06-15",
    })
    response = await client.get("/api/v1/savings-goals/", headers=auth_headers)
    data = response.json()
    goal = next(g for g in data if g["name"] == "Test Goal")
    assert goal["percentage"] == 75.0
    assert goal["remaining"] == 250.00
    assert goal["days_left"] is not None
    assert goal["monthly_needed"] is not None
