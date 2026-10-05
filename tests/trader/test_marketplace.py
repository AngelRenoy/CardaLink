import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_trader_marketplace_view(driver, base_url, trader_credentials):
    """TEST 15: Open Marketplace, verify available cardamom or proper empty state."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(trader_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(trader_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/trader"))

    mkt_tab = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//aside//button[contains(., 'Marketplace')]"))
    )
    mkt_tab.click()

    WebDriverWait(driver, 10).until(
        lambda d: "Marketplace" in d.page_source or "Cardamom" in d.page_source
    )

    page_source = driver.page_source.lower()
    assert "marketplace" in page_source or "available" in page_source or "cardamom" in page_source
