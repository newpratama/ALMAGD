import os
import time
from playwright.sync_api import sync_playwright

def capture_all():
    os.makedirs("screenshots", exist_ok=True)

    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path='/usr/bin/google-chrome', headless=True)
        context = browser.new_context(viewport={'width': 1440, 'height': 900})
        page = context.new_page()

        print("1. Capturing Login Page...")
        page.goto('http://localhost:5173/admin/login')
        time.sleep(2)
        page.screenshot(path='screenshots/shot_01_login.png')

        print("2. Logging in as Manager...")
        page.fill('input[type="email"]', 'newpratama25@gmail.com')
        page.fill('input[type="password"]', '1NP.A@M.com')
        page.click('button[type="submit"]')
        time.sleep(3)

        # Switch language to Arabic if it is in Indonesian
        lang_btn = page.query_selector('button:has-text("العربية")')
        if lang_btn:
            lang_btn.click()
            time.sleep(1)

        print("3. Capturing Today Page Dashboard...")
        page.goto('http://localhost:5173/admin/today')
        time.sleep(3)
        page.screenshot(path='screenshots/shot_02_today_dashboard.png')

        print("4. Capturing Occupied Units...")
        occupied_el = page.query_selector('text=الفلل والغرف الممتلئة')
        if occupied_el:
            occupied_el.scroll_into_view_if_needed()
            time.sleep(1)
            page.screenshot(path='screenshots/shot_03_occupied_units.png')

        print("5. Capturing New Booking Page...")
        page.goto('http://localhost:5173/admin/bookings/new')
        time.sleep(2)
        page.screenshot(path='screenshots/shot_04_new_booking.png')

        print("6. Capturing Calendar Page...")
        page.goto('http://localhost:5173/admin/calendar')
        time.sleep(3)
        page.screenshot(path='screenshots/shot_05_calendar.png')

        print("7. Capturing Reports Page...")
        page.goto('http://localhost:5173/admin/reports')
        time.sleep(2)
        page.screenshot(path='screenshots/shot_06_reports.png')

        print("8. Navigating to Booking Detail Page...")
        page.goto('http://localhost:5173/admin/bookings')
        time.sleep(2)
        first_row = page.query_selector('table tbody tr td:first-child')
        if first_row:
            first_row.click()
            time.sleep(2)
            page.screenshot(path='screenshots/shot_07_booking_detail.png')

            print("9. Capturing Extend Stay Modal...")
            extend_btn = page.query_selector('button:has-text("تمديد الإقامة")')
            if extend_btn:
                extend_btn.click()
                time.sleep(1.5)
                page.screenshot(path='screenshots/shot_08_extend_modal.png')
                page.keyboard.press("Escape")
                time.sleep(1)

            print("10. Capturing Room Transfer Modal...")
            transfer_btn = page.query_selector('button:has-text("نقل الوحدة")')
            if transfer_btn:
                transfer_btn.click()
                time.sleep(2)
                page.screenshot(path='screenshots/shot_09_transfer_modal.png')
                page.keyboard.press("Escape")
                time.sleep(1)

            print("11. Capturing Early Checkout Modal...")
            early_btn = page.query_selector('button:has-text("مغادرة مبكرة")')
            if early_btn:
                early_btn.click()
                time.sleep(1.5)
                page.screenshot(path='screenshots/shot_10_early_checkout_modal.png')
                page.keyboard.press("Escape")
                time.sleep(1)

            print("12. Capturing Cancel Booking Modal...")
            cancel_btn = page.query_selector('button:has-text("إلغاء الحجز")')
            if cancel_btn:
                cancel_btn.click()
                time.sleep(1.5)
                page.screenshot(path='screenshots/shot_11_cancel_modal.png')
                page.keyboard.press("Escape")
                time.sleep(1)

            print("13. Capturing Receipt Voucher Modal...")
            receipt_btn = page.query_selector('button:has-text("معاينة الإيصال")')
            if receipt_btn:
                receipt_btn.click()
                time.sleep(1.5)
                page.screenshot(path='screenshots/shot_12_receipt_modal.png')
                page.keyboard.press("Escape")
                time.sleep(1)

        browser.close()
        print("SUCCESS: All real screenshots captured successfully into screenshots/ directory!")

if __name__ == "__main__":
    capture_all()
