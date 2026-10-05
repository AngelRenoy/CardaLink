import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC


def test_register_page_elements(driver, base_url):
    """TEST 1: Verify Register page loads and all required fields exist."""
    driver.get(f"{base_url}/register")

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.NAME, "full_name"))
    )

    full_name_field = driver.find_element(By.NAME, "full_name")
    email_field = driver.find_element(By.NAME, "email")
    phone_field = driver.find_element(By.NAME, "phone")
    role_field = driver.find_element(By.NAME, "role")
    password_field = driver.find_element(By.NAME, "password")
    confirm_password_field = driver.find_element(By.NAME, "confirmPassword")
    submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")

    assert full_name_field.is_displayed(), "Full Name field is not displayed"
    assert email_field.is_displayed(), "Email field is not displayed"
    assert phone_field.is_displayed(), "Phone field is not displayed"
    assert role_field.is_displayed(), "Role dropdown is not displayed"
    assert password_field.is_displayed(), "Password field is not displayed"
    assert confirm_password_field.is_displayed(), "Confirm Password field is not displayed"
    assert submit_button.is_displayed(), "Register submit button is not displayed"


def test_register_validation_empty_fields(driver, base_url):
    """TEST 1 Validation: Submit empty form and verify error messages."""
    driver.get(f"{base_url}/register")

    WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.CSS_SELECTOR, "button[type='submit']"))
    )

    submit_button = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
    submit_button.click()

    # Form should remain on /register and display validation feedback
    assert "/register" in driver.current_url
    error_texts = driver.find_elements(By.CLASS_NAME, "error-text")
    assert len(error_texts) > 0, "Validation error messages should appear for empty fields"


def test_register_validation_invalid_email(driver, base_url):
    """TEST 1 Validation: Invalid email format."""
    driver.get(f"{base_url}/register")

    driver.find_element(By.NAME, "full_name").send_keys("Test User")
    driver.find_element(By.NAME, "email").send_keys("invalid-email-format")
    driver.find_element(By.NAME, "phone").send_keys("+919876543210")
    driver.find_element(By.NAME, "password").send_keys("Password@123")
    driver.find_element(By.NAME, "confirmPassword").send_keys("Password@123")
    
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    assert "/register" in driver.current_url
    page_source = driver.page_source.lower()
    assert "email" in page_source or len(driver.find_elements(By.CLASS_NAME, "error-text")) > 0


def test_register_validation_password_mismatch(driver, base_url):
    """TEST 1 Validation: Password mismatch."""
    driver.get(f"{base_url}/register")

    driver.find_element(By.NAME, "full_name").send_keys("Test User")
    driver.find_element(By.NAME, "email").send_keys("testuser@example.com")
    driver.find_element(By.NAME, "phone").send_keys("+919876543210")
    driver.find_element(By.NAME, "password").send_keys("Password@123")
    driver.find_element(By.NAME, "confirmPassword").send_keys("DifferentPassword@123")

    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()

    assert "/register" in driver.current_url
    page_source = driver.page_source.lower()
    assert "match" in page_source or len(driver.find_elements(By.CLASS_NAME, "error-text")) > 0
