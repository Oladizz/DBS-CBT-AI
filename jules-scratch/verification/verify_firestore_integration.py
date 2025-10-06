from playwright.sync_api import sync_playwright, expect

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()

    try:
        # Navigate to the application URL
        page.goto("http://localhost:3001")

        # Wait for the "Loading..." text to disappear.
        # This confirms that the Suspense fallback has been replaced by the actual component.
        loading_indicator = page.get_by_text("Loading...")
        expect(loading_indicator).to_be_hidden(timeout=10000) # Wait up to 10 seconds

        # Take a screenshot to verify the UI has loaded
        page.screenshot(path="jules-scratch/verification/verification.png")

    except Exception as e:
        print(f"An error occurred during Playwright execution: {e}")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)