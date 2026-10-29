"""
Render the concept images from the dev-only /studio route.

Usage (with `npm run dev` running on port 3000):
    pip install playwright && python -m playwright install chromium
    python scripts/capture-stills.py                 # every shot
    python scripts/capture-stills.py kadal-hero      # one shot

Images are written to public/images/concepts/<shot>.jpg
"""
import asyncio
import base64
import json
import os
import re
import sys

from playwright.async_api import async_playwright

BASE = os.environ.get("STUDIO_URL", "http://localhost:3000")
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "public", "images", "concepts")
SHOTS_TS = os.path.join(ROOT, "lib", "three", "shots.ts")


def read_shots():
    src = open(SHOTS_TS, encoding="utf-8").read()
    shots = {}
    for m in re.finditer(r'"([a-z0-9-]+)":\s*\{(.*?)size:\s*\[(\d+),\s*(\d+)\]', src, re.S):
        shots[m.group(1)] = (int(m.group(3)), int(m.group(4)))
    return shots


async def main():
    shots = read_shots()
    wanted = sys.argv[1:] or list(shots)
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(args=["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        for shot in wanted:
            w, h = shots[shot]
            page = await browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=1)
            await page.goto(f"{BASE}/studio/{shot}", wait_until="networkidle")
            await page.wait_for_function("document.body.dataset.ready === '1'", timeout=240000)
            await page.wait_for_timeout(500)
            path = os.path.join(OUT, f"{shot}.jpg")
            data = await page.evaluate("document.querySelector('canvas').toDataURL('image/jpeg', 0.9)")
            with open(path, "wb") as fh:
                fh.write(base64.b64decode(data.split(",", 1)[1]))
            print("saved", path)
            await page.close()
        await browser.close()


asyncio.run(main())
