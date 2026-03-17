"""
Time-series spending forecast using Prophet.
Falls back to simple moving average if Prophet is unavailable.
"""
from datetime import date, timedelta
from typing import Sequence

import pandas as pd

from app.schemas.analytics import ForecastPoint


async def generate_forecast(
    transactions: Sequence[tuple],  # (date, amount, type)
    months_ahead: int = 3,
) -> list[ForecastPoint]:
    """Generate spending forecast from historical transactions."""
    # Build daily spending dataframe
    daily: dict[date, float] = {}
    for txn_date, amount, txn_type in transactions:
        d = txn_date if isinstance(txn_date, date) else txn_date
        daily[d] = daily.get(d, 0) + float(amount)

    if not daily:
        return []

    df = pd.DataFrame([
        {"ds": d, "y": amt}
        for d, amt in sorted(daily.items())
    ])

    try:
        from prophet import Prophet

        model = Prophet(
            daily_seasonality=False,
            weekly_seasonality=True,
            yearly_seasonality=True,
            changepoint_prior_scale=0.05,
        )
        model.fit(df)

        future = model.make_future_dataframe(periods=months_ahead * 30)
        forecast = model.predict(future)

        # Return only future dates
        today = date.today()
        future_forecast = forecast[forecast["ds"].dt.date > today]

        # Aggregate to monthly
        future_forecast = future_forecast.copy()
        future_forecast["month"] = future_forecast["ds"].dt.to_period("M")
        monthly = future_forecast.groupby("month").agg({
            "yhat": "sum",
            "yhat_lower": "sum",
            "yhat_upper": "sum",
        }).reset_index()

        return [
            ForecastPoint(
                date=str(row["month"]),
                predicted=round(max(0, row["yhat"]), 2),
                lower_bound=round(max(0, row["yhat_lower"]), 2),
                upper_bound=round(max(0, row["yhat_upper"]), 2),
            )
            for _, row in monthly.head(months_ahead).iterrows()
        ]

    except ImportError:
        # Fallback: simple moving average
        df["ds"] = pd.to_datetime(df["ds"])
        df["month"] = df["ds"].dt.to_period("M")
        monthly_totals = df.groupby("month")["y"].sum()

        if len(monthly_totals) < 2:
            return []

        avg = monthly_totals.tail(3).mean()
        std = monthly_totals.tail(3).std() if len(monthly_totals) >= 3 else avg * 0.1

        today = date.today()
        points = []
        for i in range(1, months_ahead + 1):
            future_date = date(today.year, today.month, 1) + timedelta(days=30 * i)
            points.append(
                ForecastPoint(
                    date=future_date.strftime("%Y-%m"),
                    predicted=round(max(0, avg), 2),
                    lower_bound=round(max(0, avg - 1.5 * std), 2),
                    upper_bound=round(avg + 1.5 * std, 2),
                )
            )
        return points
