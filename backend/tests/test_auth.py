import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_register(client: AsyncClient):
    response = await client.post("/api/v1/auth/register", json={
        "email": "new@example.com",
        "full_name": "New User",
        "password": "securepassword123",
    })
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"


@pytest.mark.asyncio
async def test_register_duplicate_email(client: AsyncClient, test_user):
    response = await client.post("/api/v1/auth/register", json={
        "email": "test@example.com",
        "full_name": "Duplicate",
        "password": "password123",
    })
    assert response.status_code == 400


@pytest.mark.asyncio
async def test_login(client: AsyncClient, test_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data


@pytest.mark.asyncio
async def test_login_wrong_password(client: AsyncClient, test_user):
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me(client: AsyncClient, auth_headers, test_user):
    response = await client.get("/api/v1/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@example.com"
    assert data["full_name"] == "Test User"


@pytest.mark.asyncio
async def test_refresh_token(client: AsyncClient, test_user):
    # First login
    login_resp = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "testpassword123",
    })
    refresh_tok = login_resp.json()["refresh_token"]

    # Then refresh
    response = await client.post("/api/v1/auth/refresh", json={
        "refresh_token": refresh_tok,
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


@pytest.mark.asyncio
async def test_password_reset_flow(client: AsyncClient, test_user):
    # Request reset
    response = await client.post("/api/v1/auth/password-reset-request", json={
        "email": "test@example.com",
    })
    assert response.status_code == 200
    token = response.json().get("token")
    assert token is not None

    # Reset password
    response = await client.post("/api/v1/auth/password-reset", json={
        "token": token,
        "new_password": "newpassword456",
    })
    assert response.status_code == 200

    # Login with new password
    response = await client.post("/api/v1/auth/login", json={
        "email": "test@example.com",
        "password": "newpassword456",
    })
    assert response.status_code == 200


@pytest.mark.asyncio
async def test_update_profile(client: AsyncClient, auth_headers, test_user):
    response = await client.patch("/api/v1/auth/me", headers=auth_headers, json={
        "full_name": "Updated Name",
        "currency": "EUR",
    })
    assert response.status_code == 200
    data = response.json()
    assert data["full_name"] == "Updated Name"
    assert data["currency"] == "EUR"
