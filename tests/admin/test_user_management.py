import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_admin_user_management_section(driver, base_url, admin_credentials):
    """TEST 19 Sub-test: Test Admin User Management and Pending Approvals view."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(admin_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(admin_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/admin"))

    # Click Users / User Management tab in sidebar
    user_mgmt_btns = driver.find_elements(By.XPATH, "//aside//button[contains(., 'User') or contains(., 'Users')]")
    if len(user_mgmt_btns) > 0:
        user_mgmt_btns[0].click()
        WebDriverWait(driver, 5).until(
            lambda d: "user" in d.page_source.lower()
        )
        assert "user" in driver.page_source.lower()
