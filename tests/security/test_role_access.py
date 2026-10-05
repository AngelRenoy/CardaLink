import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_farmer_cannot_access_trader_or_admin_dashboards(driver, base_url, farmer_credentials):
    """TEST 20: FARMER cannot access /dashboard/trader or /dashboard/admin."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(farmer_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(farmer_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/farmer"))

    # Try navigating to Trader Dashboard
    driver.get(f"{base_url}/dashboard/trader")
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/trader" not in d.current_url or "Forbidden" in d.page_source or "Unauthorized" in d.page_source
    )
    assert "/dashboard/trader" not in driver.current_url or "forbidden" in driver.page_source.lower()

    # Try navigating to Admin Dashboard
    driver.get(f"{base_url}/dashboard/admin")
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/admin" not in d.current_url or "Forbidden" in d.page_source or "Unauthorized" in d.page_source
    )
    assert "/dashboard/admin" not in driver.current_url or "forbidden" in driver.page_source.lower()


def test_trader_cannot_access_farmer_or_admin_dashboards(driver, base_url, trader_credentials):
    """TEST 20: TRADER cannot access /dashboard/farmer or /dashboard/admin."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(trader_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(trader_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/trader"))

    # Try navigating to Farmer Dashboard
    driver.get(f"{base_url}/dashboard/farmer")
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/farmer" not in d.current_url or "Forbidden" in d.page_source or "Unauthorized" in d.page_source
    )
    assert "/dashboard/farmer" not in driver.current_url or "forbidden" in driver.page_source.lower()

    # Try navigating to Admin Dashboard
    driver.get(f"{base_url}/dashboard/admin")
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/admin" not in d.current_url or "Forbidden" in d.page_source or "Unauthorized" in d.page_source
    )
    assert "/dashboard/admin" not in driver.current_url or "forbidden" in driver.page_source.lower()


def test_admin_access_admin_dashboard(driver, base_url, admin_credentials):
    """TEST 20: ADMIN can access /dashboard/admin."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(admin_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(admin_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/admin"))
    assert "/dashboard/admin" in driver.current_url
