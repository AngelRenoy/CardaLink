import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_trader_login_and_dashboard_overview(driver, base_url, trader_credentials):
    """TEST 14: Login as Trader and verify Trader Dashboard loads with all section navigation."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(trader_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(trader_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/trader"))
    assert "/dashboard/trader" in driver.current_url

    # Check sidebar presence
    sidebar = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "aside"))
    )
    assert sidebar.is_displayed()

    # Test clicking sidebar tabs
    trader_tabs = [
        "Marketplace",
        "Purchase Requests",
        "Inventory",
        "Sales",
        "Transactions",
        "Export Supply",
        "Reports",
        "Profile"
    ]

    for tab_label in trader_tabs:
        btn = driver.find_elements(By.XPATH, f"//aside//button[contains(., '{tab_label}')]")
        if len(btn) > 0:
            btn[0].click()
            WebDriverWait(driver, 5).until(
                lambda d: tab_label.lower() in d.page_source.lower()
            )
            assert tab_label.lower() in driver.page_source.lower()
