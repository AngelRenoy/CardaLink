import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC


@pytest.fixture
def logged_in_farmer(driver, base_url, farmer_credentials):
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(farmer_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(farmer_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/farmer"))
    return driver


def test_farmer_dashboard_overview_loads(logged_in_farmer):
    """TEST 5: Verify Farmer dashboard overview, sidebar, and summary cards load."""
    driver = logged_in_farmer

    # Verify Sidebar element
    sidebar = WebDriverWait(driver, 10).until(
        EC.presence_of_element_located((By.TAG_NAME, "aside"))
    )
    assert sidebar.is_displayed(), "Sidebar is not displayed"

    # Verify Header/Welcome text or Dashboard header
    page_text = driver.page_source
    assert "Plantation" in page_text or "Dashboard" in page_text or "Harvest" in page_text, "Farmer dashboard content not found"


def test_farmer_dashboard_tab_navigation(logged_in_farmer):
    """TEST 5: Test switching across sidebar tabs in Farmer Dashboard."""
    driver = logged_in_farmer

    tabs_to_test = [
        ("Harvest", "Harvest"),
        ("Plantation", "Plantation"),
        ("Fertilizer", "Fertilizer"),
        ("Pesticide", "Pesticide"),
        ("Irrigation", "Irrigation"),
        ("Inventory", "Inventory"),
        ("Expenses", "Expenses"),
        ("Sales", "Sales"),
        ("Transactions", "Transactions"),
        ("Profile", "Profile")
    ]

    for tab_label, expected_keyword in tabs_to_test:
        buttons = driver.find_elements(By.XPATH, f"//aside//button[contains(., '{tab_label}')]")
        if len(buttons) > 0:
            buttons[0].click()
            WebDriverWait(driver, 5).until(
                lambda d: expected_keyword in d.page_source or tab_label.lower() in d.page_source.lower()
            )
            assert expected_keyword.lower() in driver.page_source.lower(), f"Tab {tab_label} did not render expected content"
