import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const url = process.env.PREVIEW_URL || "http://127.0.0.1:3192";
const preview = process.env.PREVIEW_URL ? null : spawn(process.execPath, ["scripts/preview.mjs", "--port", "3192"], { stdio: "ignore", windowsHide: true });
const selector = "#tentang figure button";
let browser;

async function settle(page) {
  await page.waitForFunction(sel => {
    const card = document.querySelector(sel);
    const matrix = new DOMMatrixReadOnly(getComputedStyle(card).transform);
    return Math.abs(matrix.e) < .15 && Math.abs(matrix.f) < .15 && Number(getComputedStyle(card.parentElement).opacity) > .99;
  }, selector);
}

try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(url)).ok) break; } catch { /* Wait for the owned preview. */ }
    if (attempt === 39) throw new Error("ID card preview did not start");
    await delay(150);
  }
  await mkdir("artifacts", { recursive: true });
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || (process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : undefined), headless: true });
  const errors = [];
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  const stage = page.locator("#tentang figure");
  const card = page.locator(selector);
  assert.equal(await stage.getAttribute("data-revealed"), "false", "Card waits for the About section");
  await stage.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => document.querySelector("#tentang figure").dataset.revealed === "true");
  await settle(page);
  assert.equal(await card.locator('img[src="/images/alvin-about-seated-v2.webp"]').count(), 1, "Uses Alvin's second original photo");
  await card.locator("img").evaluateAll(images => Promise.all(images.map(image => image.decode())));
  await page.locator("#tentang").screenshot({ path: "artifacts/about-id-card-desktop.png", style: ".reference-header { visibility: hidden; }" });
  console.log("PASS: card enters on scroll and original portrait plus generated artwork load");

  const initialRope = await stage.locator("svg path").first().getAttribute("d");
  const bounds = await card.boundingBox();
  await page.mouse.move(bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width / 2 + 45, bounds.y + bounds.height / 2 + 45, { steps: 12 });
  const moved = await card.boundingBox();
  assert(moved.x > bounds.x + 15 && moved.y > bounds.y + 15, "Card follows horizontal and vertical dragging");
  assert.notEqual(await stage.locator("svg path").first().getAttribute("d"), initialRope, "Lanyard follows the card");
  await page.screenshot({ path: "artifacts/about-id-card-dragging.png" });
  await page.mouse.up();
  await settle(page);
  await card.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(sel => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).e > 5, selector);
  await settle(page);
  await page.keyboard.press("Enter");
  await page.waitForFunction(sel => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).e > 5, selector);
  await page.keyboard.press("Escape");
  await settle(page);
  console.log("PASS: mouse drag, connected lanyard, spring return, keyboard movement and reset");

  await page.evaluate(sel => {
    window.idCardSyncErrors = [];
    window.sampleIdCard = true;
    const card = document.querySelector(sel);
    const stage = card.closest("figure");
    function sample() {
      if (!window.sampleIdCard) return;
      const matrix = new DOMMatrixReadOnly(getComputedStyle(card).transform);
      const points = stage.querySelector("svg path").getAttribute("d").match(/-?\d+(?:\.\d+)?/g).map(Number);
      const ropeX = points.at(-2) - 5 - stage.getBoundingClientRect().width / 2;
      const ropeY = points.at(-1) - 84;
      window.idCardSyncErrors.push(Math.hypot(matrix.e - ropeX, matrix.f - ropeY));
      requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  }, selector);
  const repeatBounds = await card.boundingBox();
  const dragPoint = { x: repeatBounds.x + repeatBounds.width / 2, y: repeatBounds.y + repeatBounds.height / 2 };
  await page.mouse.move(dragPoint.x, dragPoint.y);
  await page.mouse.down();
  for (const [dx, dy] of [[75, 50], [-75, 10], [45, -25], [-45, 50], [220, 0]]) {
    await page.mouse.move(dragPoint.x + dx, dragPoint.y + dy, { steps: 12 });
  }
  assert.equal(await card.getAttribute("data-dragging"), "true", "Pointer capture keeps the gesture active outside the card");
  await page.mouse.up();
  await delay(60);
  const catchBounds = await card.boundingBox();
  await page.mouse.move(catchBounds.x + catchBounds.width / 2, catchBounds.y + catchBounds.height / 2);
  const beforeCatch = await card.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).e);
  await page.mouse.down();
  const afterCatch = await card.evaluate(el => new DOMMatrixReadOnly(getComputedStyle(el).transform).e);
  assert(Math.abs(afterCatch - beforeCatch) < 6, "Catching the returning card preserves its current position");
  await page.mouse.move(catchBounds.x + catchBounds.width / 2 - 25, catchBounds.y + catchBounds.height / 2 + 20, { steps: 8 });
  await page.mouse.up();
  await settle(page);
  const sync = await page.evaluate(() => {
    window.sampleIdCard = false;
    return { frames: window.idCardSyncErrors.length, maximumError: Math.max(...window.idCardSyncErrors) };
  });
  assert(sync.frames > 20 && sync.maximumError < .75, "Card and rope stay aligned on every sampled frame");
  console.log("PASS: repeated direction changes, dragging outside card, smooth re-grab during return, synchronized rope and card");

  await page.locator(".language-toggle").click();
  assert.equal(await page.locator("html").getAttribute("lang"), "en");
  assert.equal(await stage.locator("figcaption").innerText(), "Give it a pull, then let go");
  assert.match(await card.getAttribute("aria-label"), /Draggable profile/);
  await page.locator(".language-toggle").click();

  for (const width of [320, 390, 651, 768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 900 });
    await stage.scrollIntoViewIfNeeded();
    await settle(page);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `No horizontal overflow at ${width}px`);
    const textFits = await card.evaluate(element => {
      const university = element.querySelector('span[class*="university"]');
      const details = university.parentElement;
      return university.offsetTop + university.offsetHeight <= details.clientHeight + 1;
    });
    assert(textFits, `All card details fit at ${width}px`);
    if ([320, 390, 768].includes(width)) await page.locator("#tentang").screenshot({ path: `artifacts/about-id-card-${width}.png`, style: ".reference-header { visibility: hidden; }" });
  }
  console.log("PASS: Indonesian/English labels and readable card content from 320px to desktop");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.waitForFunction(sel => Math.abs(new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).b) < .001, selector);
  await stage.scrollIntoViewIfNeeded();
  await card.focus();
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(sel => new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).e > 0, selector);
  const reducedMatrix = await card.evaluate(element => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { rotation: matrix.b, x: matrix.e };
  });
  assert(Math.abs(reducedMatrix.rotation) < .001 && reducedMatrix.x > 0, "Reduced motion removes tilt but allows immediate keyboard movement");
  await page.keyboard.press("Escape");
  await settle(page);
  console.log("PASS: reduced-motion preference removes automatic movement and preserves keyboard controls");

  const touchPage = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, reducedMotion: "no-preference" });
  touchPage.on("pageerror", error => errors.push(error.message));
  await touchPage.goto(url, { waitUntil: "networkidle" });
  await touchPage.locator("#tentang figure").scrollIntoViewIfNeeded();
  await settle(touchPage);
  const cdp = await touchPage.context().newCDPSession(touchPage);
  const touchBounds = await touchPage.locator(selector).boundingBox();
  const point = { x: touchBounds.x + touchBounds.width / 2, y: touchBounds.y + touchBounds.height / 2 };
  const scrollBefore = await touchPage.evaluate(() => scrollY);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  for (let step = 1; step <= 8; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x + step * 3, y: point.y + step * 5 }] });
    await delay(20);
  }
  assert((await touchPage.locator(selector).boundingBox()).y > touchBounds.y + 15, "Card responds to touch dragging");
  assert(Math.abs(await touchPage.evaluate(() => scrollY) - scrollBefore) < 2, "Dragging does not scroll the background");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await settle(touchPage);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  for (let step = 1; step <= 4; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: point.x - step * 4, y: point.y + step * 8 }] });
    await delay(20);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchCancel", touchPoints: [] });
  await settle(touchPage);
  assert.equal(await touchPage.locator(selector).getAttribute("data-dragging"), "false", "Cancelled touch releases the card");
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: 8, y: 650 }] });
  for (let step = 1; step <= 6; step++) {
    await cdp.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: 8, y: 650 - step * 25 }] });
    await delay(20);
  }
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await touchPage.waitForFunction(previous => scrollY > previous + 35, scrollBefore);
  console.log("PASS: real touch drag and cancellation return to rest, background stays put during drag, page scroll works outside card");
  assert.deepEqual(errors, [], "Browser errors");
} finally {
  if (browser) await browser.close();
  preview?.kill();
}
