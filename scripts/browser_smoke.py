"""Browser smoke test: plays the full RIPPLE loop in headless Google Chrome.

Optional (not part of `npm test`). Requires the dev server and an installed Google Chrome:

    npm run dev        # in one terminal
    uv run --with playwright python scripts/browser_smoke.py [URL] [SCREENSHOT_DIR]

Checks that the browser shows the same outcomes as `npm run demo:headless`, that clicking an
object inside the Phaser canvas selects it, that Reset clears the edit, and that there are no
console errors or failed requests. Exits non-zero on any mismatch.
"""
import sys
import time
from pathlib import Path

from playwright.sync_api import sync_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:5173/"
SHOTS = Path(sys.argv[2]) if len(sys.argv) > 2 else None

# Expected (title, end tick) for each run, from docs/puzzle-spec.md.
EXPECTED = {
    "original": ("Maya didn't make it.", "t = 12 s (end)"),
    "trash can": ("Maya made it!", "t = 21 s (end)"),
    "traffic light": ("Maya made it!", "t = 24 s (end)"),
    "delivery crate": ("Maya didn't make it.", "t = 13 s (end)"),
}
failures: list[str] = []
problems: list[str] = []


def text(page, sel: str) -> str:
    return page.locator(sel).inner_text()


def shot(page, name: str) -> None:
    if SHOTS:
        SHOTS.mkdir(parents=True, exist_ok=True)
        page.screenshot(path=str(SHOTS / name))


def play_and_check(page, label: str) -> None:
    page.locator("[data-el=play]").click()
    deadline = time.time() + 40
    while not page.locator("[data-el=result]").is_visible():
        if time.time() > deadline:
            raise SystemExit(f"timeout waiting for result: {label}")
        time.sleep(0.1)
    got = (text(page, "[data-el=resultTitle]"), text(page, "[data-el=tick]"))
    status = "ok" if got == EXPECTED[label] else "MISMATCH"
    if status != "ok":
        failures.append(f"{label}: expected {EXPECTED[label]}, got {got}")
    print(f"[{status}] {label}: {got[0]} {got[1]}")
    for line in text(page, "[data-el=explanation]").splitlines():
        print(f"         - {line}")


with sync_playwright() as p:
    browser = p.chromium.launch(channel="chrome", headless=True)
    page = browser.new_page(viewport={"width": 1400, "height": 860})
    page.on("console", lambda m: problems.append(f"console {m.type}: {m.text}") if m.type in ("error", "warning") else None)
    page.on("pageerror", lambda e: problems.append(f"page error: {e}"))
    page.on("response", lambda r: problems.append(f"HTTP {r.status} {r.url}") if r.status >= 400 else None)
    page.goto(URL)
    page.wait_for_timeout(1500)
    shot(page, "1-start.png")
    page.locator("[data-el=speed]").click()  # 2.5x playback; outcomes do not depend on speed

    play_and_check(page, "original")
    shot(page, "2-original-accident.png")

    # Select the trash can by clicking its sprite inside the Phaser canvas.
    canvas = page.locator("#stage canvas").bounding_box()
    scale = canvas["width"] / (24 * 16)
    page.mouse.click(canvas["x"] + (10 * 16 + 8) * scale, canvas["y"] + (6 * 16 + 8) * scale)
    selected = page.locator(".object.selected").all_inner_texts()
    if not selected or not selected[0].startswith("Trash can"):
        failures.append(f"canvas click did not select the trash can: {selected}")
    play_and_check(page, "trash can")
    shot(page, "3-trash-can-success.png")

    page.locator(".object", has_text="Traffic light").click()
    play_and_check(page, "traffic light")
    page.locator(".object", has_text="Delivery crate").click()
    play_and_check(page, "delivery crate")
    shot(page, "4-delivery-crate-failure.png")

    page.locator("[data-el=reset]").click()
    if page.locator(".object.selected").count() != 0:
        failures.append("reset did not clear the selection")
    print("attempts:", " | ".join(text(page, "[data-el=attemptList]").splitlines()))
    browser.close()

for failure in failures:
    print("mismatch:", failure)
for problem in problems:
    print("problem:", problem)
if failures or problems:
    print(f"FAILED: {len(failures)} mismatches, {len(problems)} browser problems")
    sys.exit(1)
print("PASSED: browser outcomes match the headless simulation; no console errors")
