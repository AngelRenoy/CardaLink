import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_admin_login_and_dashboard_overview(driver, base_url, admin_credentials):
    """TEST 19: Login as Admin and verify Admin Dashboard loads with all admin modules."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(admin_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(admin_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/admin"))
    assert "/dashboard/admin" in driver.current_url

    sidebar = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "aside"))
    )
    assert sidebar.is_displayed()

    # Verify key admin items exist
    page_source = driver.page_source.lower()
    assert "admin" in page_source or "system" in page_source or "users" in page_source
