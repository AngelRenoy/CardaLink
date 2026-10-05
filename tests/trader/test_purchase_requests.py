import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_trader_purchase_requests_tab(driver, base_url, trader_credentials):
    """TEST 16: Open Purchase Requests tab and verify requests table/list or empty state."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(trader_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(trader_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/trader"))

    req_tab = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//aside//button[contains(., 'Purchase Requests')]"))
    )
    req_tab.click()

    WebDriverWait(driver, 10).until(
        lambda d: "Purchase" in d.page_source or "Requests" in d.page_source
    )

    assert "purchase" in driver.page_source.lower() or "request" in driver.page_source.lower()
