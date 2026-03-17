import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_spending_summary(
    client: AsyncClient, auth_headers, test_transactions
):
    response = await client.get(
        "/api/v1/analytics/summary?months=6",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert "total_income" in data
    assert "total_expenses" in data
    assert "net_savings" in data
    assert "savings_rate" in data


@pytest.mark.asyncio
async def test_category_breakdown(
    client: AsyncClient, auth_headers, test_transactions
):
    response = await client.get(
        "/api/v1/analytics/category-breakdown?months=6",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    if len(data) > 0:
        assert "category_name" in data[0]
        assert "total" in data[0]
        assert "percentage" in data[0]


@pytest.mark.asyncio
async def test_trends(
    client: AsyncClient, auth_headers, test_transactions
):
    response = await client.get(
        "/api/v1/analytics/trends?months=6",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_cash_flow(
    client: AsyncClient, auth_headers, test_transactions
):
    response = await client.get(
        "/api/v1/analytics/cash-flow?months=6",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_insights(
    client: AsyncClient, auth_headers, test_transactions
):
    response = await client.get(
        "/api/v1/analytics/insights",
        headers=auth_headers,
    )
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)


@pytest.mark.asyncio
async def test_forecast_insufficient_data(
    client: AsyncClient, auth_headers, test_transactions
):
    response = await client.get(
        "/api/v1/analytics/forecast?months_ahead=3",
        headers=auth_headers,
    )
    assert response.status_code == 200
    # With only 10 test transactions, should return empty
    data = response.json()
    assert isinstance(data, list)
