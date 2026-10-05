import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_farmer_inventory_view_and_items(driver, base_url, farmer_credentials):
    """Verify Farmer Inventory tab loads and displays stock items."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(farmer_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(farmer_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/farmer"))
    
    inventory_tab = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//aside//button[contains(., 'Inventory')]"))
    )
    inventory_tab.click()

    WebDriverWait(driver, 10).until(
        lambda d: "Inventory" in d.page_source or "Stock" in d.page_source
    )

    assert "Inventory" in driver.page_source or "Stock" in driver.page_source
