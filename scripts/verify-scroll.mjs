import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "@playwright/test";

const url = "http://127.0.0.1:3190";
const preview = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "--hostname", "127.0.0.1", "--port", "3190"], { stdio: "ignore", windowsHide: true });
let browser;

try {
  for (let attempt = 0; attempt < 40; attempt++) {
    try { if ((await fetch(url)).ok) break; } catch { /* Await preview. */ }
    if (attempt === 39) throw new Error("Preview did not start");
    await delay(150);
  }
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || (process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : undefined), headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: "no-preference" });
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto(url, { waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis"));
  const settle = () => page.waitForFunction(() => !document.documentElement.classList.contains("lenis-scrolling"));

  await page.mouse.move(10, 400);
  await page.mouse.wheel(0, 600);
  await page.waitForFunction(() => scrollY > 0 && scrollY < 590);
  const first = await page.evaluate(() => scrollY);
  await settle();
  assert(Math.abs(await page.evaluate(() => scrollY) - 600) < 3);
  assert(first < 590, "Wheel scroll progresses gradually");
  console.log("PASS: mouse wheel scroll eases toward its target");

  await page.locator(".navbar-wordmark").click();
  await page.waitForFunction(() => scrollY < 2);
  await settle();
  await page.locator('.reference-hero-actions a[href="#proyek"]').click();
  await page.waitForFunction(() => location.hash === "#proyek" && scrollY > 100);
  await settle();
  assert(await page.locator("#proyek").evaluate(el => Math.abs(el.getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)) < 3));
  console.log("PASS: anchor URL, navigation and fixed-header clearance");

  await page.locator(".navbar-wordmark").click();
  await page.waitForFunction(() => scrollY < 2);
  await settle();
  await page.setViewportSize({ width: 1440, height: 360 });
  await page.evaluate(() => document.querySelector("#beranda .profile-pill").click());
  await page.locator(".contact-dialog[open]").waitFor();
  await page.waitForFunction(() => document.documentElement.classList.contains("lenis-stopped"));
  const frozen = await page.evaluate(() => scrollY);
  await page.mouse.move(5, 180);
  await page.mouse.wheel(0, 450);
  await delay(150);
  assert.equal(await page.evaluate(() => scrollY), frozen);
  await page.locator(".contact-dialog").hover();
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(() => document.querySelector(".contact-dialog").scrollTop > 0);
  assert.equal(await page.evaluate(() => scrollY), frozen);
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.documentElement.classList.contains("lenis-stopped"));
  await page.mouse.move(5, 180);
  await page.mouse.wheel(0, 300);
  await page.waitForFunction(previous => scrollY > previous + 20, frozen);
  await settle();
  console.log("PASS: dialog locks background, allows internal scrolling, then resumes page scrolling");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.locator(".navbar-wordmark").click();
  await page.waitForFunction(() => scrollY < 2, null, { timeout: 500 });
  await page.locator('.reference-hero-actions a[href="#proyek"]').click();
  await page.waitForFunction(() => Math.abs(document.getElementById("proyek").getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)) < 3, null, { timeout: 500 });
  console.log("PASS: live reduced-motion preference makes anchor navigation immediate");

  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator("#menu-toggle").click();
  await page.locator('#mobile-navigation a[href="#pengalaman"]').click();
  await page.waitForFunction(() => Math.abs(document.getElementById("pengalaman").getBoundingClientRect().top - parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop)) < 3);
  assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  console.log("PASS: mobile navigation closes and reaches its section without overflow");
  assert.deepEqual(errors, []);
} finally {
  if (browser) await browser.close();
  preview.kill();
}
