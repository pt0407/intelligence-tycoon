"""Browser auto-player: plays the real page with clicks, one game per pathway.

Usage: python3 tests/browser_autoplay.py [pathway ...] [--scenario=base] [--json=out.json]
Requires: pip install playwright && playwright install chromium
"""
import json
import pathlib
import sys
import time

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = (ROOT / "index.html").as_uri()
PATHS = ["lab", "garage", "bigtech", "open", "hardware", "robotics"]
TABS = ["overview", "hardware", "research", "talent", "products", "finance", "policy", "rivals", "deals", "market", "log"]
MAX_ACTIONS_PER_YEAR = 6


ACTION_TABS = ["overview", "talent", "products", "hardware", "research", "rivals", "deals", "finance"]


def take_actions(pg, report, year):
    taken = 0
    for tab in ACTION_TABS:
        if taken >= MAX_ACTIONS_PER_YEAR:
            return
        pg.click(f"[data-tab='{tab}']")
        while taken < MAX_ACTIONS_PER_YEAR:
            buttons = pg.locator("[data-act]:not([disabled])")
            if buttons.count() == 0:
                break
            key = buttons.first.get_attribute("data-act")
            buttons.first.click()
            report["actions"].append({"year": year, "tab": tab, "key": key})
            taken += 1
            pg.wait_for_timeout(20)


def check_layout(pg, report, year, tab):
    overflow = pg.evaluate("document.documentElement.scrollWidth > document.documentElement.clientWidth + 2")
    if overflow:
        report["issues"].append({"year": year, "tab": tab, "issue": "horizontal scroll"})


def play(pg, path, scenario):
    report = {"path": path, "years": 0, "actions": [], "issues": [], "errors": [], "verdict": None, "seconds": 0}
    started = time.time()
    pg.goto(INDEX)
    pg.evaluate("localStorage.clear()")
    pg.reload()
    pg.click(f"[data-scenario='{scenario}']")
    pg.click(f"[data-path='{path}']")
    pg.click("#found")
    for _ in range(40):
        year = int(pg.inner_text(".year"))
        for tab in TABS:
            pg.click(f"[data-tab='{tab}']")
            check_layout(pg, report, year, tab)
        pg.click("[data-tab='overview']")
        take_actions(pg, report, year)
        pg.click("#end-year")
        pg.wait_for_selector("#modal:not([hidden])", timeout=5000)
        report["years"] += 1
        pg.click("#continue")
        if pg.is_visible("#end"):
            break
    if pg.is_visible("#end"):
        report["verdict"] = pg.inner_text("#end h1")
    else:
        report["issues"].append({"year": None, "issue": "game did not reach the end screen"})
    report["seconds"] = round(time.time() - started, 1)
    return report


def main():
    args = sys.argv[1:]
    scenario = next((a.split("=", 1)[1] for a in args if a.startswith("--scenario=")), "base")
    out = next((a.split("=", 1)[1] for a in args if a.startswith("--json=")), None)
    paths = [a for a in args if not a.startswith("--")] or PATHS
    reports = []
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for path in paths:
            pg = browser.new_page(viewport={"width": 1400, "height": 900})
            errors = []
            pg.on("pageerror", lambda e: errors.append(str(e)))
            pg.on("console", lambda m: errors.append(m.text) if m.type == "error" else None)
            rep = play(pg, path, scenario)
            rep["errors"] = errors
            reports.append(rep)
            print(f"{path}: {rep['years']} years, {len(rep['actions'])} actions, "
                  f"{len(rep['issues'])} issues, {len(errors)} errors, {rep['seconds']}s | {rep['verdict']}")
            for issue in rep["issues"][:5]:
                print("   issue:", issue)
            for err in errors[:3]:
                print("   error:", err)
            pg.close()
        browser.close()
    if out:
        pathlib.Path(out).write_text(json.dumps(reports, indent=1))
    failed = any(r["issues"] or r["errors"] for r in reports)
    sys.exit(1 if failed else 0)


if __name__ == "__main__":
    main()
