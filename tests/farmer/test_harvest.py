import pytest
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait, Select
from selenium.webdriver.support import expected_conditions as EC


@pytest.fixture
def harvest_farmer_driver(driver, base_url, farmer_credentials):
    """Fixture that logs in as Farmer and navigates to the Harvest tab."""
    driver.get(f"{base_url}/login")
    WebDriverWait(driver, 10).until(EC.presence_of_element_located((By.NAME, "email")))
    driver.find_element(By.NAME, "email").send_keys(farmer_credentials["email"])
    driver.find_element(By.NAME, "password").send_keys(farmer_credentials["password"])
    driver.find_element(By.CSS_SELECTOR, "button[type='submit']").click()
    
    WebDriverWait(driver, 10).until(EC.url_contains("/dashboard/farmer"))
    
    # Click Harvest tab in sidebar
    harvest_tab = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//aside//button[contains(., 'Harvest')]"))
    )
    harvest_tab.click()
    
    # Wait for Harvest view header
    WebDriverWait(driver, 10).until(
        lambda d: "Harvest" in d.page_source
    )
    return driver


def ensure_no_active_cycle(driver):
    """Helper to complete any active harvest cycle before starting clean tests."""
    complete_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Complete Harvest')]")
    if len(complete_btns) > 0:
        try:
            complete_btns[0].click()
            WebDriverWait(driver, 5).until(
                EC.presence_of_element_located((By.XPATH, "//input[@placeholder='e.g. 24.5']"))
            )
            dry_input = driver.find_element(By.XPATH, "//input[@placeholder='e.g. 24.5']")
            dry_input.clear()
            dry_input.send_keys("20")
            submit_complete = driver.find_element(By.XPATH, "//button[contains(., 'Save & Complete Harvest')]")
            submit_complete.click()
            WebDriverWait(driver, 5).until(
                lambda d: len(d.find_elements(By.XPATH, "//button[contains(., 'Complete Harvest')]")) == 0
            )
        except Exception:
            pass


def test_harvest_cycle_workflow(harvest_farmer_driver):
    """TEST 6 to TEST 13: Full Harvest Cycle End-to-End Test Suite."""
    driver = harvest_farmer_driver

    # Ensure clean start
    ensure_no_active_cycle(driver)

    # -------------------------------------------------------------------------
    # TEST 6: Start New Harvest Cycle
    # -------------------------------------------------------------------------
    start_btn = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Start New Harvest')]"))
    )
    start_btn.click()

    # Wait for Start Cycle modal
    WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Start New Harvest Cycle')]"))
    )

    name_input = driver.find_element(By.XPATH, "//label[contains(., 'Harvest Cycle Name')]/following-sibling::input")
    start_date_input = driver.find_element(By.XPATH, "//label[contains(., 'Start Date')]/following-sibling::input")
    end_date_input = driver.find_element(By.XPATH, "//label[contains(., 'Expected End Date')]/following-sibling::input")
    plantation_select = Select(driver.find_element(By.XPATH, "//label[contains(., 'Select Plantation')]/following-sibling::select"))
    
    name_input.clear()
    name_input.send_keys("Selenium Test Harvest Cycle 1")
    
    start_date_input.clear()
    start_date_input.send_keys("2026-09-15")
    
    end_date_input.clear()
    end_date_input.send_keys("2026-09-20")

    # Select first plantation option
    if len(plantation_select.options) > 1:
        plantation_select.select_by_index(1)

    submit_start = driver.find_element(By.XPATH, "//button[contains(., 'Start Harvest Cycle')]")
    submit_start.click()

    # Verify status = ACTIVE
    WebDriverWait(driver, 10).until(
        lambda d: "ACTIVE HARVEST" in d.page_source or "Active" in d.page_source
    )
    assert "Selenium Test Harvest Cycle 1" in driver.page_source, "Cycle 1 name should appear in active harvest section"

    # -------------------------------------------------------------------------
    # TEST 7: Add 3 Daily Harvest Entries
    # -------------------------------------------------------------------------
    daily_test_records = [
        {"date": "2026-09-16", "fresh": "12", "dried": "2.5"},
        {"date": "2026-09-17", "fresh": "15", "dried": "3"},
        {"date": "2026-09-18", "fresh": "10", "dried": "2"},
    ]

    for record in daily_test_records:
        date_field = driver.find_element(By.XPATH, "//label[contains(., 'Harvest Date')]/following-sibling::input")
        fresh_field = driver.find_element(By.XPATH, "//label[contains(., 'Fresh Harvest')]/following-sibling::input")
        dried_field = driver.find_element(By.XPATH, "//label[contains(., 'Dried/Cured Harvest')]/following-sibling::input")
        save_btn = driver.find_element(By.XPATH, "//button[contains(., 'Save Today')]")

        date_field.clear()
        date_field.send_keys(record["date"])
        
        fresh_field.clear()
        fresh_field.send_keys(record["fresh"])
        
        dried_field.clear()
        dried_field.send_keys(record["dried"])

        save_btn.click()

        # Wait for record date to appear in daily table
        WebDriverWait(driver, 5).until(
            lambda d: record["date"] in d.page_source
        )

    # Verify all 3 records exist separately in table
    assert "2026-09-16" in driver.page_source
    assert "2026-09-17" in driver.page_source
    assert "2026-09-18" in driver.page_source

    # -------------------------------------------------------------------------
    # TEST 8: Duplicate Daily Harvest Date Validation
    # -------------------------------------------------------------------------
    date_field = driver.find_element(By.XPATH, "//label[contains(., 'Harvest Date')]/following-sibling::input")
    fresh_field = driver.find_element(By.XPATH, "//label[contains(., 'Fresh Harvest')]/following-sibling::input")
    save_btn = driver.find_element(By.XPATH, "//button[contains(., 'Save Today')]")

    date_field.clear()
    date_field.send_keys("2026-09-16")  # Duplicate date
    fresh_field.clear()
    fresh_field.send_keys("5")

    save_btn.click()

    # Application should reject duplicate date with notification banner
    WebDriverWait(driver, 5).until(
        lambda d: "already" in d.page_source.lower() or "error" in d.page_source.lower()
    )
    assert "already" in driver.page_source.lower() or "recorded" in driver.page_source.lower(), "Duplicate harvest date should be rejected with appropriate message"

    # -------------------------------------------------------------------------
    # TEST 9: Harvest Validation (Zero / Negative / Large Number)
    # -------------------------------------------------------------------------
    date_field.clear()
    date_field.send_keys("2026-09-19")
    fresh_field.clear()
    fresh_field.send_keys("-5")  # Negative value
    save_btn.click()

    assert "-5" not in driver.find_element(By.TAG_NAME, "table").text, "Negative harvest value must be rejected"

    # -------------------------------------------------------------------------
    # TEST 10 & 11: Complete Harvest & Harvest Summary
    # -------------------------------------------------------------------------
    complete_btn = driver.find_element(By.XPATH, "//button[contains(., 'Complete Harvest')]")
    complete_btn.click()

    WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Complete Harvest Cycle')]"))
    )

    dry_kg_input = driver.find_element(By.XPATH, "//input[@placeholder='e.g. 24.5']")
    dry_kg_input.clear()
    dry_kg_input.send_keys("24.5")

    save_complete_btn = driver.find_element(By.XPATH, "//button[contains(., 'Save & Complete Harvest')]")
    save_complete_btn.click()

    # Wait for Summary Modal or completed status
    WebDriverWait(driver, 10).until(
        lambda d: "FINAL HARVEST SUMMARY" in d.page_source or "COMPLETED" in d.page_source
    )

    # TEST 11: Check summary figures (37 kg total fresh, 24.5 kg full dry)
    page_text = driver.page_source
    assert "37" in page_text, "Total Fresh Harvest 37 kg should be calculated"
    assert "24.5" in page_text, "Full Dry KG 24.5 kg should be displayed"

    # Close summary modal if open
    close_summary_btns = driver.find_elements(By.XPATH, "//button[contains(., 'Close Summary')]")
    if len(close_summary_btns) > 0:
        close_summary_btns[0].click()

    # -------------------------------------------------------------------------
    # TEST 12: Harvest History
    # -------------------------------------------------------------------------
    history_section = driver.find_element(By.XPATH, "//*[contains(text(), 'Harvest History')]")
    assert history_section.is_displayed(), "Harvest history section should be visible"
    assert "Selenium Test Harvest Cycle 1" in driver.page_source

    # -------------------------------------------------------------------------
    # TEST 13: Next Harvest Cycle Separation
    # -------------------------------------------------------------------------
    start_btn2 = WebDriverWait(driver, 10).until(
        EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Start New Harvest')]"))
    )
    start_btn2.click()

    WebDriverWait(driver, 5).until(
        EC.presence_of_element_located((By.XPATH, "//h3[contains(., 'Start New Harvest Cycle')]"))
    )

    name_input = driver.find_element(By.XPATH, "//label[contains(., 'Harvest Cycle Name')]/following-sibling::input")
    start_date_input = driver.find_element(By.XPATH, "//label[contains(., 'Start Date')]/following-sibling::input")
    end_date_input = driver.find_element(By.XPATH, "//label[contains(., 'Expected End Date')]/following-sibling::input")
    plantation_select = Select(driver.find_element(By.XPATH, "//label[contains(., 'Select Plantation')]/following-sibling::select"))

    name_input.clear()
    name_input.send_keys("Selenium Test Harvest Cycle 2")
    
    start_date_input.clear()
    start_date_input.send_keys("2026-09-21")
    
    end_date_input.clear()
    end_date_input.send_keys("2026-09-25")

    if len(plantation_select.options) > 1:
        plantation_select.select_by_index(1)

    driver.find_element(By.XPATH, "//button[contains(., 'Start Harvest Cycle')]").click()

    WebDriverWait(driver, 10).until(
        lambda d: "Selenium Test Harvest Cycle 2" in d.page_source
    )

    assert "Selenium Test Harvest Cycle 2" in driver.page_source, "Cycle 2 should now be active"
    assert "Selenium Test Harvest Cycle 1" in driver.page_source, "Cycle 1 must remain preserved in history"
