import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


def test_unauthenticated_farmer_dashboard_access(driver, base_url):
    """TEST 4: Attempt unauthenticated access to /dashboard/farmer."""
    driver.get(f"{base_url}/dashboard/farmer")
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/farmer" not in d.current_url
    )
    assert "/dashboard/farmer" not in driver.current_url, "Unauthenticated user was able to access /dashboard/farmer"


def test_unauthenticated_trader_dashboard_access(driver, base_url):
    """TEST 4: Attempt unauthenticated access to /dashboard/trader."""
    driver.get(f"{base_url}/dashboard/trader")
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/trader" not in d.current_url
    )
    assert "/dashboard/trader" not in driver.current_url, "Unauthenticated user was able to access /dashboard/trader"


def test_unauthenticated_admin_dashboard_access(driver, base_url):
    """TEST 4: Attempt unauthenticated access to /dashboard/admin."""
    driver.get(f"{base_url}/dashboard/admin")
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/admin" not in d.current_url
    )
    assert "/dashboard/admin" not in driver.current_url, "Unauthenticated user was able to access /dashboard/admin"
