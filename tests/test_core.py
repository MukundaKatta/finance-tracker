"""Tests for FinanceTracker."""
from src.core import FinanceTracker
def test_init(): assert FinanceTracker().get_stats()["ops"] == 0
def test_op(): c = FinanceTracker(); c.track(x=1); assert c.get_stats()["ops"] == 1
def test_multi(): c = FinanceTracker(); [c.track() for _ in range(5)]; assert c.get_stats()["ops"] == 5
def test_reset(): c = FinanceTracker(); c.track(); c.reset(); assert c.get_stats()["ops"] == 0
def test_service_name(): c = FinanceTracker(); r = c.track(); assert r["service"] == "finance-tracker"
