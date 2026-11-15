"""Checks the player-facing UI: plain tab labels, start tips, guide, and phone layout.

Usage: python3 tests/browser_ui_check.py  (saves screenshots to /tmp/ui-*.png)
"""
import pathlib
import sys

from playwright.sync_api import sync_playwright

INDEX = (pathlib.Path(__file__).resolve().parent.parent / "index.html").as_uri()
LABELS = ["Overview", "Compute", "Research", "Team", "Products", "Capital", "Policy", "Rivals", "Deals", "Market", "Log"]


def main():
    failures, errors = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        pg = browser.new_page(viewport={"width": 1400, "height": 900})
        pg.on("pageerror", lambda e: errors.append(str(e)))
        pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
        pg.goto(INDEX)
        pg.evaluate("localStorage.clear()")
        pg.reload()
        pg.click("[data-path='lab']")
        pg.click("#found")

        labels = pg.locator("[data-tab]").all_inner_texts()
        if labels != LABELS:
            failures.append(f"tab labels {labels}")
        if pg.locator("text=Start here").count() != 1:
            failures.append("start tips not shown on a new game")
        pg.screenshot(path="/tmp/ui-overview.png")

        pg.click("#tut-done")
        if pg.locator("text=Start here").count() != 0:
            failures.append("start tips still shown after hiding")

        pg.click("#help")
        if not pg.is_visible("#modal h2:has-text('Guide')"):
            failures.append("guide did not open")
        if pg.locator("#modal li").count() != 6:
            failures.append(f"guide has {pg.locator('#modal li').count()} items, expected 6")
        pg.screenshot(path="/tmp/ui-guide.png")
        pg.click("#tut-reset")
        pg.click("#help")
        pg.click("#close-help")

        pg.set_viewport_size({"width": 390, "height": 844})
        pg.click("[data-tab='overview']")
        if pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 2"):
            failures.append("horizontal scroll on phone width")
        pg.screenshot(path="/tmp/ui-phone.png")
        browser.close()
    if errors:
        failures.append(f"console errors: {errors[:3]}")
    for f in failures:
        print("FAIL:", f)
    print("ok" if not failures else f"{len(failures)} failure(s)")
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
