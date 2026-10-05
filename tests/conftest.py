import os
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager

BASE_URL = os.getenv("BASE_URL", "http://localhost:5173")

TEST_FARMER_EMAIL = os.getenv("TEST_FARMER_EMAIL", "kerala.farmer@cardalink.com")
TEST_FARMER_PASSWORD = os.getenv("TEST_FARMER_PASSWORD", "Password@1234")

TEST_TRADER_EMAIL = os.getenv("TEST_TRADER_EMAIL", "spices.trader@cardalink.com")
TEST_TRADER_PASSWORD = os.getenv("TEST_TRADER_PASSWORD", "Password@1234")

TEST_ADMIN_EMAIL = os.getenv("TEST_ADMIN_EMAIL", "admin@cardalink.com")
TEST_ADMIN_PASSWORD = os.getenv("TEST_ADMIN_PASSWORD", "Admin@1234")


def get_chrome_driver():
    options = Options()
    headless_env = os.getenv("HEADLESS", "true").lower()
    if headless_env in ["true", "1", "yes"]:
        options.add_argument("--headless=new")
    
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--disable-gpu")
    options.add_argument("--window-size=1440,900")
    
    try:
        service = Service(ChromeDriverManager().install())
        driver = webdriver.Chrome(service=service, options=options)
    except Exception as e:
        # Fallback to direct webdriver.Chrome if ChromeDriverManager fails or driver is in PATH
        driver = webdriver.Chrome(options=options)

    driver.implicitly_wait(5)
    return driver


@pytest.fixture(scope="function")
def driver(request):
    drv = get_chrome_driver()
    request.node.driver = drv
    yield drv
    drv.quit()


@pytest.hookimpl(tryfirst=True, hookwrapper=True)
def pytest_runtest_makereport(item, call):
    outcome = yield
    report = outcome.get_result()
    if report.when == "call" and report.failed:
        drv = getattr(item, "driver", None)
        if drv:
            screenshots_dir = os.path.join("test-results", "screenshots")
            os.makedirs(screenshots_dir, exist_ok=True)
            clean_name = item.name.replace("/", "_").replace("\\", "_").replace(":", "_")
            screenshot_path = os.path.join(screenshots_dir, f"{clean_name}_failed.png")
            drv.save_screenshot(screenshot_path)
            print(f"\n[SCREENSHOT SAVED]: {screenshot_path}")
            
            # Attach to pytest-html if active
            pytest_html = item.config.pluginmanager.getplugin("html")
            if pytest_html is not None:
                extra = getattr(report, "extra", [])
                extra.append(pytest_html.extras.image(screenshot_path))
                report.extra = extra


@pytest.fixture
def base_url():
    return BASE_URL


@pytest.fixture
def farmer_credentials():
    return {"email": TEST_FARMER_EMAIL, "password": TEST_FARMER_PASSWORD}


@pytest.fixture
def trader_credentials():
    return {"email": TEST_TRADER_EMAIL, "password": TEST_TRADER_PASSWORD}


@pytest.fixture
def admin_credentials():
    return {"email": TEST_ADMIN_EMAIL, "password": TEST_ADMIN_PASSWORD}
