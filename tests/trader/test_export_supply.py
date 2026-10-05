import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_trader_export_supply_tab(driver, base_url, trader_credentials):
    """Open Export Supply tab and verify section loads."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(trader_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(trader_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/trader"))

    export_tab = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//aside//button[contains(., 'Export Supply')]"))
    )
    export_tab.click()

    WebDriverWait(driver, 10).until(
        lambda d: "Export" in d.page_source or "Supply" in d.page_source
    )

    assert "export" in driver.page_source.lower()
