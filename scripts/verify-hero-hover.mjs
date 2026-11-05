import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const externalUrl = process.env.PREVIEW_URL || process.argv.find(arg => arg.startsWith("--url="))?.slice(6);
const url = externalUrl || "http://127.0.0.1:3194";
const preview = externalUrl ? null : spawn(process.execPath, ["scripts/preview.mjs", "--port", "3194"], { stdio: "ignore", windowsHide: true });
const diagnose = process.argv.includes("--diagnose");
const selector = ".reference-hero-portrait";
let browser;

try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(url)).ok) break; } catch { /* Wait for the owned preview. */ }
    if (attempt === 39) throw new Error("Hero preview did not start");
    await delay(150);
  }
  await mkdir("artifacts", { recursive: true });
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || (process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : undefined), headless: true });
  for (const [name, options] of [
    ["system", {}],
    ["mouse", { reducedMotion: "no-preference" }],
    ["hybrid", { reducedMotion: "no-preference", hasTouch: true }],
    ["reduced-motion", { reducedMotion: "reduce" }],
  ]) {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, ...options });
    const errors = [];
    page.on("pageerror", error => errors.push(error.message));
    await page.goto(url, { waitUntil: "networkidle" });
    await page.waitForFunction(sel => Number(getComputedStyle(document.querySelector(sel)).opacity) > .99, selector);
    const portrait = page.locator(selector);
    const bounds = await portrait.boundingBox();
    const initialTransform = await portrait.locator(".reference-portrait-motion").evaluate(element => getComputedStyle(element).transform);
    await page.mouse.move(bounds.x + bounds.width * .85, bounds.y + bounds.height * .15);
    const readHover = () => portrait.evaluate(element => ({
      opacity: Number(getComputedStyle(element.querySelector(".reference-portrait-light")).opacity),
      transform: getComputedStyle(element.querySelector(".reference-portrait-motion")).transform,
      finePointer: matchMedia("(hover: hover) and (pointer: fine)").matches,
      reducedMotion: matchMedia("(prefers-reduced-motion: reduce)").matches,
    }));
    if (diagnose) {
      await delay(1000);
      console.log(name, await readHover());
    } else {
      await page.waitForFunction(sel => Number(getComputedStyle(document.querySelector(`${sel} .reference-portrait-light`)).opacity) > .9, selector);
      const state = await readHover();
      if (state.reducedMotion) assert.equal(state.transform, "none", "Reduced motion retains hover feedback without tilting");
      else assert.notEqual(state.transform, initialTransform, "Mouse input tilts the portrait, including on touch-capable devices");
      if (name === "mouse") await page.screenshot({ path: "artifacts/hero-hover.png" });
      await page.mouse.move(2, 2);
      await page.waitForFunction(sel => Number(getComputedStyle(document.querySelector(`${sel} .reference-portrait-light`)).opacity) < .01, selector);
      if (options.hasTouch) {
        await page.locator(".reference-portrait-interaction--hero").dispatchEvent("pointerenter", { pointerType: "touch" });
        assert.equal((await readHover()).opacity, 0, "Touch input does not leave hover stuck on");
      }
      assert.deepEqual(errors, [], "No browser runtime errors");
      console.log(`PASS: hero ${name}, white reflection, pointer exit${options.hasTouch ? ", touch ignored" : ""}`);
    }
    await page.close();
  }
} finally {
  if (browser) await browser.close();
  preview?.kill();
}
