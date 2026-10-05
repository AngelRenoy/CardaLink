import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


def test_login_valid_farmer(driver, base_url, farmer_credentials):
    """TEST 2: Test valid Farmer login and redirection to Farmer Dashboard."""
    driver.get(f"{base_url}/login")

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "email"))
    )

    email_input = driver.find_element(By.NAME, "email")
    password_input = driver.find_element(By.NAME, "password")
    submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

    email_input.clear()
    email_input.send_keys(farmer_credentials["email"])
    password_input.clear()
    password_input.send_keys(farmer_credentials["password"])

    submit_button.click()

    WebDriverWait(driver, 10).until(
        EC.url_contains("/dashboard/farmer")
    )
    assert "/dashboard/farmer" in driver.current_url, f"Expected farmer dashboard URL, got {driver.current_url}"


def test_login_wrong_password(driver, base_url, farmer_credentials):
    """TEST 2 Validation: Wrong password displays error banner."""
    driver.get(f"{base_url}/login")

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "email"))
    )

    driver.find_element(By.NAME, "email").send_keys(farmer_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys("WrongPassword999!")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    error_banner = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "error-banner"))
    )
    assert error_banner.is_displayed(), "Error banner should be displayed for wrong password"
    assert "/login" in driver.current_url


def test_login_wrong_email(driver, base_url):
    """TEST 2 Validation: Non-existent email displays error banner."""
    driver.get(f"{base_url}/login")

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "email"))
    )

    driver.find_element(By.NAME, "email").send_keys("nonexistent.user999@cardalink.com")
    driver.find_element(By.NAME, "password").send_keys("Password@1234")
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    error_banner = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CLASS_NAME, "error-banner"))
    )
    assert error_banner.is_displayed(), "Error banner should be displayed for wrong email"


def test_login_empty_credentials(driver, base_url):
    """TEST 2 Validation: Empty email and password."""
    driver.get(f"{base_url}/login")

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "button[type='submit']"))
    )

    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    assert "/login" in driver.current_url
    error_elements = driver.find_elements(By.CLASS_NAME, "error-text")
    assert len(error_elements) > 0 or len(driver.find_elements(By.CLASS_NAME, "error-banner")) > 0
