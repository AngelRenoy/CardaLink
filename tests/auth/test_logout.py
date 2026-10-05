import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_logout_redirect_and_session_cleared(driver, base_url, farmer_credentials):
    """TEST 3: Login -> Logout -> Attempt direct dashboard access -> Verify redirect."""
    # 1. Login
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(farmer_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(farmer_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/farmer"))
    assert "/dashboard/farmer" in driver.current_url

    # 2. Click Logout button
    logout_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Logout')]")
    assert len(logout_buttons) > 0, "Logout button should be present on dashboard"
    logout_buttons[0].click()

    # 3. Verify redirected to Landing page or Login page
    WebDriverWait(driver, 10).until(
        lambda d: "/login" in d.current_url or d.current_url.rstrip("/") == base_url.rstrip("/")
    )

    # 4. Attempt direct navigation to protected dashboard
    driver.get(f"{base_url}/dashboard/farmer")

    # 5. Verify redirection back to login or landing page
    WebDriverWait(driver, 10).until(
        lambda d: "/dashboard/farmer" not in d.current_url
    )
    assert "/dashboard/farmer" not in driver.current_url, "Unauthenticated user should not be able to access farmer dashboard after logout"
