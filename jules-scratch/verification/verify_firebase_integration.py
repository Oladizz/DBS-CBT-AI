from playwright.sync_api import sync_playwright

def handle_console(msg):
    # Correctly access properties: msg.type and msg.text
    print(f"Browser Console ({msg.type}): {msg.text}")

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    # Register the console event handler
    page.on("console", handle_console)

    try:
        # Go to the page and wait for it to be idle
        page.goto("http://localhost:3000", wait_until="networkidle")
        # Add a short wait for async operations
        page.wait_for_timeout(2000)
        page.screenshot(path="jules-scratch/verification/verification.png")
    except Exception as e:
        print(f"An error occurred during Playwright execution: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)