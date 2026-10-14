import assert from "node:assert/strict";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const url = "http://127.0.0.1:3187";
const preview = spawn(process.execPath, ["scripts/preview.mjs", "--port", "3187"], { stdio: "pipe", windowsHide: true });
const errors = [];
let browser;

try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(url)).ok) break; } catch { /* Await owned preview startup. */ }
    await delay(150);
    if (attempt === 39) throw new Error("Preview did not start");
  }
  assert.equal((await fetch(`${url}/missing-page/`)).status, 404);
  await mkdir("artifacts", { recursive: true });
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || (process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : undefined), headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.getByRole("heading", { level: 1 }).waitFor();
  const heroStyles = await page.locator(".reference-hero").evaluate((element) => ({
    background: getComputedStyle(element).backgroundImage,
    headingFont: getComputedStyle(element.querySelector("h1")).fontFamily,
    bodyFont: getComputedStyle(element.querySelector(".reference-biography")).fontFamily,
  }));
  assert.match(heroStyles.background, /hero-pattern\.svg/);
  assert.match(heroStyles.headingFont, /Montserrat/);
  assert.match(heroStyles.bodyFont, /Poppins/);
  assert.equal(await page.locator(".pill-desktop-nav a").count(), 4);
  await page.locator(".pill-desktop-nav").getByRole("link", { name: "Project", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.pill-desktop-nav a[href="#karya"]')?.getAttribute("aria-current") === "location");
  await page.locator(".pill-desktop-nav").getByRole("link", { name: "Social Media", exact: true }).click();
  await page.waitForFunction(() => document.querySelector('.pill-desktop-nav a[href="#sosial"]')?.getAttribute("aria-current") === "location");
  await page.locator(".pill-desktop-nav").getByRole("link", { name: "Contact", exact: true }).hover();
  await page.waitForFunction(() => getComputedStyle(document.querySelector('.pill-desktop-nav a[href="#kontak"]')).color === "rgb(255, 224, 0)");
  assert.equal(await page.locator('.pill-desktop-nav a[href="#kontak"]').evaluate((element) => getComputedStyle(element).color), "rgb(255, 224, 0)");
  await page.getByRole("link", { name: "Kembali ke beranda", exact: true }).click();
  await page.waitForFunction(() => window.scrollY < 10);
  await page.getByRole("button", { name: "Hire Me", exact: true }).click();
  await page.getByRole("dialog", { name: "Mari berkenalan" }).waitFor();
  await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
  assert.equal(await page.locator(".project-card").count(), 6);
  await page.getByRole("button", { name: "Video", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".project-card").length === 1);
  assert.match(await page.locator(".project-card").innerText(), /Stories in motion/);
  await page.getByRole("button", { name: /Semua/ }).click();
  await page.waitForFunction(() => document.querySelectorAll(".project-card").length === 6);
  await page.getByRole("button", { name: "Lihat detail Identity, with purpose." }).click();
  await page.getByRole("dialog", { name: "Identity, with purpose." }).waitFor();
  assert.match(await page.getByRole("dialog", { name: "Identity, with purpose." }).innerText(), /kartu konsep sementara/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Lihat detail Identity, with purpose.");
  await page.getByRole("button", { name: "Buka informasi kontak" }).click();
  await page.getByRole("dialog", { name: "Mari berkenalan" }).waitFor();
  assert.match(await page.getByRole("dialog", { name: "Mari berkenalan" }).innerText(), /Kontak segera tersedia/);
  await page.getByRole("button", { name: "Tutup dialog", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await delay(350);
  await page.screenshot({ path: "artifacts/desktop.png" });

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 760 ? 1000 : 844 });
    await page.goto(url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    const overflow = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    assert(overflow.scroll <= overflow.viewport, `Horizontal overflow at ${width}px: ${JSON.stringify(overflow)}`);
    if (width <= 900) {
      await page.getByRole("button", { name: "Buka menu", exact: true }).click();
      assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "true");
      await page.locator("#mobile-navigation").getByRole("link", { name: "About Me" }).click();
      assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
      await page.getByRole("button", { name: "Buka menu", exact: true }).click();
      await page.keyboard.press("Escape");
      assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
      await page.getByRole("button", { name: "Buka menu", exact: true }).click();
      await page.getByRole("heading", { level: 1 }).click();
      assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
      if (width === 768) {
        await page.getByRole("button", { name: "Buka menu", exact: true }).click();
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.waitForFunction(() => document.getElementById("menu-toggle")?.getAttribute("aria-expanded") === "false");
        await page.setViewportSize({ width, height: 1000 });
      }
    }
    for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 650) {
      await page.evaluate((position) => window.scrollTo(0, position), y);
      await delay(100);
    }
    await page.waitForFunction(() => Array.from(document.images).every((image) => image.complete && image.naturalWidth > 0));
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
    await delay(700);
    if (width === 1440 || width === 390) await page.screenshot({ path: `artifacts/full-${width}.png`, fullPage: true });
    if (width === 390) await page.screenshot({ path: "artifacts/mobile.png" });
    console.log(`PASS: ${width}px, images, layout${width <= 900 ? ", mobile navigation" : ""}`);
  }
  assert.deepEqual(errors, [], "Browser errors");
  console.log("PASS: patterned hero, fonts, navbar active/hover/home, Hire Me, category filter, project/contact dialogs, Escape, focus restoration, 404, no browser errors.");
} finally {
  if (browser) await browser.close();
  preview.kill();
}
