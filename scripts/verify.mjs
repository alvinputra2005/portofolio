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
    try { if ((await fetch(url)).ok) break; } catch { /* Await the owned preview. */ }
    await delay(150);
    if (attempt === 39) throw new Error("Preview did not start");
  }
  assert.equal((await fetch(`${url}/missing-page/`)).status, 404);
  await mkdir("artifacts", { recursive: true });
  browser = await chromium.launch({ executablePath: process.env.BROWSER_PATH || (process.platform === "win32" ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" : undefined), headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });

  async function setLanguage(locale) {
    if ((await page.locator(".language-toggle span").innerText()).toLowerCase() !== locale) await page.locator(".language-toggle").click();
    await page.waitForFunction(expected => document.documentElement.lang === expected, locale);
    assert.equal((await page.locator(".language-toggle span").innerText()).toLowerCase(), locale);
  }

  async function goHome() {
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForFunction(() => window.scrollY < 10);
  }

  await page.goto(url, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  assert.equal(await page.locator("html").getAttribute("lang"), "id");
  assert.equal(await page.locator(".reference-header img").count(), 0);
  assert.match(await page.locator("h1").innerText(), /Desainer Kreatif/);
  assert.deepEqual(await page.locator(".pill-desktop-nav a").evaluateAll(links => links.map(link => link.getAttribute("href"))), ["#tentang", "#karya", "#pengalaman", "#pencapaian", "#kontak"]);
  assert.equal(await page.locator(".reference-socials a, .reference-socials button").count(), 5);
  assert.equal(await page.locator("#sosial").count(), 0);
  const heroStyles = await page.locator(".reference-hero").evaluate(element => ({
    background: getComputedStyle(element).backgroundImage,
    headingFont: getComputedStyle(element.querySelector("h1")).fontFamily,
    headingWeight: Number(getComputedStyle(element.querySelector("h1")).fontWeight),
    bodyFont: getComputedStyle(element.querySelector(".reference-biography")).fontFamily,
    photoBackground: getComputedStyle(element.querySelector(".reference-profile-photo")).backgroundColor,
    photo: element.querySelector("img").getAttribute("src"),
  }));
  assert.match(heroStyles.background, /hero-pattern\.svg/);
  assert.match(heroStyles.headingFont, /Montserrat/);
  assert(heroStyles.headingWeight >= 600);
  assert.match(heroStyles.bodyFont, /Poppins/);
  assert.equal(heroStyles.photoBackground, "rgba(0, 0, 0, 0)");
  assert.match(heroStyles.photo, /alvin-hero-latest\.webp/);
  assert.equal(await page.locator(".reference-portrait-backdrop").count(), 1);

  const alignedContainers = await page.locator(".reference-hero-inner, .work-section, .about-layout, .service-section, .experience-layout, .contact-section .container").evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right };
  }));
  assert(alignedContainers.every(box => Math.abs(box.left - alignedContainers[0].left) < 1));
  assert(alignedContainers.every(box => Math.abs(box.right - alignedContainers[0].right) < 1));
  const languageDividerX = (await page.locator(".language-toggle").boundingBox()).x;
  assert(Math.abs(alignedContainers[0].right - languageDividerX) < 1);
  const portraitBackdrop = await page.locator(".reference-portrait-backdrop").boundingBox();
  assert(Math.abs(portraitBackdrop.x + portraitBackdrop.width - alignedContainers[0].right) < 1);
  const portraitClip = await page.locator(".reference-profile-photo").boundingBox();
  assert(Math.abs(portraitClip.x - portraitBackdrop.x) < 1);
  assert(Math.abs(portraitClip.y - portraitBackdrop.y) < 1);
  assert(Math.abs(portraitClip.width - portraitBackdrop.width) < 1);
  assert(Math.abs(portraitClip.height - portraitBackdrop.height) < 1);
  const portraitImage = await page.locator(".reference-profile-photo img").boundingBox();
  assert(portraitImage.width < portraitClip.width);
  assert(Math.abs(portraitImage.y + portraitImage.height - (portraitClip.y + portraitClip.height)) < 1);
  const desktopNavItems = await page.locator(".pill-desktop-nav a").evaluateAll(links => links.map(link => {
    const box = link.getBoundingClientRect();
    return { left: box.left, right: box.right };
  }));
  assert(desktopNavItems.slice(1).every((item, index) => Math.abs(item.left - desktopNavItems[index].right) < 1));

  const initialNavbar = await page.locator(".reference-navbar").boundingBox();
  assert.equal(initialNavbar.y, 0);
  assert.equal(initialNavbar.x, 0);
  assert.equal(initialNavbar.width, await page.evaluate(() => document.documentElement.clientWidth));
  assert.equal(await page.locator(".reference-navbar").evaluate(element => getComputedStyle(element).borderRadius), "0px");
  await page.evaluate(() => window.scrollTo(0, 80));
  await page.waitForFunction(initialHeight => document.querySelector(".reference-navbar").getBoundingClientRect().height < initialHeight, initialNavbar.height);
  assert.equal((await page.locator(".reference-navbar").boundingBox()).y, 0);

  await setLanguage("en");
  assert.match(await page.locator("h1").innerText(), /Creative Designer/);
  assert.match(await page.locator("#work-title").innerText(), /Ideas made/);
  assert.match(await page.locator(".service-card").first().innerText(), /Graphic Design/);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.match(await page.locator("h1").innerText(), /Creative Designer/);
  assert.match(await page.title(), /Creative Designer/);
  await page.locator('.pill-desktop-nav a[href="#karya"]').click();
  await page.waitForFunction(() => document.querySelector('.pill-desktop-nav a[href="#karya"]')?.getAttribute("aria-current") === "location");
  await page.locator('.pill-desktop-nav a[href="#karya"]').hover();
  await page.waitForFunction(() => {
    const style = getComputedStyle(document.querySelector('.pill-desktop-nav a[href="#karya"]'));
    return style.color === "rgb(255, 255, 255)" && style.backgroundColor === "rgba(255, 255, 255, 0.19)";
  });
  await page.getByRole("button", { name: "Video", exact: true }).click();
  await page.waitForFunction(() => document.querySelectorAll(".project-card").length === 1);
  await setLanguage("id");
  assert.equal(await page.locator(".project-card").count(), 1);
  assert.match(await page.locator(".project-card").innerText(), /Stories in motion/);
  await page.locator(".project-filters button").first().click();
  await page.waitForFunction(() => document.querySelectorAll(".project-card").length === 6);
  await page.locator(".project-open").first().click();
  await page.getByRole("dialog", { name: "Identity, with purpose." }).waitFor();
  assert.match(await page.locator("dialog[open]").innerText(), /kartu konsep sementara/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.equal(await page.evaluate(() => document.activeElement?.getAttribute("aria-label")), "Lihat detail Identity, with purpose.");

  await setLanguage("en");
  await page.locator(".project-open").first().click();
  await page.getByRole("dialog", { name: "Identity, with purpose." }).waitFor();
  assert.match(await page.locator("dialog[open]").innerText(), /A visual identity concept/);
  assert.match(await page.locator("dialog[open]").innerText(), /This is a concept placeholder/);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await goHome();
  await page.locator(".hire-pill").click();
  await page.getByRole("dialog", { name: "Let's get acquainted" }).waitFor();
  assert.match(await page.locator("dialog[open]").innerText(), /Contact details coming soon/);
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await page.screenshot({ path: "artifacts/desktop-en.png" });
  await setLanguage("id");
  await delay(350);
  await page.screenshot({ path: "artifacts/desktop.png" });

  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: width > 760 ? 1000 : 844 });
    await page.goto(url, { waitUntil: "networkidle" });
    for (const locale of ["id", "en"]) {
      await setLanguage(locale);
      await page.evaluate(() => document.fonts.ready);
      const overflow = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
      assert(overflow.scroll <= overflow.viewport, `Horizontal overflow at ${width}px/${locale}: ${JSON.stringify(overflow)}`);
      if (width <= 900) {
        await page.locator("#menu-toggle").click();
        assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "true");
        await setLanguage(locale === "id" ? "en" : "id");
        assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "true");
        await setLanguage(locale);
        await page.locator('#mobile-navigation a[href="#tentang"]').click();
        assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
        await page.locator("#menu-toggle").click();
        await page.waitForFunction(() => document.querySelector('#mobile-navigation a[href="#tentang"]')?.getAttribute("aria-current") === "location");
        await page.keyboard.press("Escape");
        assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
        await page.locator("#menu-toggle").click();
        await page.mouse.click(5, 400);
        assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
      }
      for (let y = 0; y < await page.evaluate(() => document.body.scrollHeight); y += 650) {
        await page.evaluate(position => window.scrollTo(0, position), y);
        await delay(80);
      }
      await page.waitForFunction(() => Array.from(document.images).every(image => image.complete && image.naturalWidth > 0));
      await goHome();
      await page.evaluate(() => { if (document.activeElement instanceof HTMLElement) document.activeElement.blur(); });
      await delay(600);
      if (width === 1440 || width === 390) await page.screenshot({ path: `artifacts/full-${width}-${locale}.png`, fullPage: true });
      if (width === 390) await page.screenshot({ path: `artifacts/mobile-${locale}.png` });
      console.log(`PASS: ${width}px/${locale}, images, layout${width <= 900 ? ", mobile menu and language switching" : ""}`);
    }
  }
  assert.deepEqual(errors, [], "Browser errors");
  console.log("PASS: ID/EN translation, persistence after reload, shared page margins, hero social links, navigation order, category preservation, translated dialogs, transparent hero portrait, neutral navbar hover, hero type, filters, Escape, focus restoration, and 404.");
} finally {
  if (browser) await browser.close();
  preview.kill();
}
