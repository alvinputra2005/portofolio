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
  const sectionOrder = ["#tentang", "#pengalaman", "#proyek", "#pencapaian", "#sertifikat", "#tech-stack", "#kontak"];
  assert.deepEqual(await page.locator(".pill-desktop-nav a").evaluateAll(links => links.map(link => link.getAttribute("href"))), sectionOrder);
  assert.deepEqual(await page.locator('main > section[id]:not(#beranda)').evaluateAll(sections => sections.map(section => `#${section.id}`)), sectionOrder);
  assert.equal(await page.locator(".reference-socials a, .reference-socials button").count(), 5);
  assert.equal(await page.locator("#sosial").count(), 0);
  assert.equal(await page.locator("#karya, #work-title, .project-card, .project-filters, .project-dialog").count(), 0);
  assert(await page.locator("#proyek").evaluate(el => el.previousElementSibling?.id === "pengalaman"));
  assert(await page.locator("#pencapaian").evaluate(el => el.previousElementSibling?.id === "proyek"));
  assert.equal(await page.locator("#projects-title").innerText(), "Proyek");
  assert.deepEqual(await page.locator("#proyek .reference-experience-type").allTextContents(), ["SaaS", "SCM", "ERP"]);
  assert.equal(await page.locator("#proyek .reference-experience-photo").count(), 12);
  assert(await page.locator("#sertifikat").evaluate(el => el.previousElementSibling?.id === "pencapaian"));
  assert(await page.locator("#tech-stack").evaluate(el => el.previousElementSibling?.id === "sertifikat"));
  assert.deepEqual(await page.locator(".credential-filters button").allTextContents(), ["Semua", "Sertifikat", "Penghargaan"]);
  assert.equal(await page.locator(".credential-dots button").count(), 8);
  assert(await page.locator(".credential-slide").evaluateAll(elements => elements.every(el => getComputedStyle(el).transitionDuration.split(",").every(value => parseFloat(value) <= .001))));
  await page.locator(".credential-carousel").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Dokumen berikutnya", exact: true }).click();
  assert.equal(await page.locator('.credential-slide[data-position="0"]').getAttribute("data-slide-index"), "1");
  await page.locator(".credential-carousel").focus();
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator('.credential-slide[data-position="0"]').getAttribute("data-slide-index"), "0");
  await page.keyboard.press("ArrowLeft");
  assert.equal(await page.locator('.credential-slide[data-position="0"]').getAttribute("data-slide-index"), "7");
  await page.getByRole("button", { name: "Ke dokumen 3", exact: true }).click();
  assert.equal(await page.locator('.credential-slide[data-position="0"]').getAttribute("data-slide-index"), "2");
  await page.locator(".credential-filters").getByRole("button", { name: "Penghargaan", exact: true }).click();
  assert.equal(await page.locator(".credential-dots button").count(), 4);
  assert.equal(await page.locator(".credential-caption .credential-kind").innerText(), "Penghargaan");
  await page.locator(".credential-filters").getByRole("button", { name: "Sertifikat", exact: true }).click();
  await page.locator('.credential-slide[data-position="0"]').click();
  await page.getByRole("dialog", { name: "Nama sertifikat atau pelatihan", exact: true }).waitFor();
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert.equal(await page.locator('.credential-slide[data-position="0"]').evaluate(el => document.activeElement === el), true);
  const stage = await page.locator(".credential-stage").boundingBox();
  await page.mouse.move(stage.x + stage.width / 2, stage.y + stage.height / 2);
  await page.mouse.down();
  await page.mouse.move(stage.x + stage.width / 2 - 100, stage.y + stage.height / 2, { steps: 8 });
  await page.mouse.up();
  assert.equal(await page.locator('.credential-slide[data-position="0"]').getAttribute("data-slide-index"), "1");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  await page.locator(".credential-filters").getByRole("button", { name: "Semua", exact: true }).click();
  await goHome();
  await page.waitForFunction(() => !document.querySelector(".reference-header").classList.contains("is-scrolled") && document.querySelector(".reference-navbar").getBoundingClientRect().height >= 63.9);
  assert.deepEqual(await page.locator(".skill-card-heading h3").allTextContents(), ["Front End", "Back End", "AI/ML"]);
  for (const style of await page.locator(".skill-experience-card").evaluateAll(elements => elements.map(el => ({ top: getComputedStyle(el).borderTopWidth, bottom: getComputedStyle(el).borderBottomWidth, background: getComputedStyle(el).backgroundColor })))) {
    assert.equal(style.top, style.bottom);
    assert.equal(style.background, "rgb(255, 255, 255)");
  }
  assert(await page.locator(".skill-card-icon").evaluateAll(elements => elements.every(el => getComputedStyle(el).color === "rgb(255, 255, 255)" && getComputedStyle(el).backgroundColor === "rgb(0, 114, 172)")));
  const durations = await page.locator(".skill-experience-list li").evaluateAll(items => items.map(item => Number(item.dataset.months)));
  assert(durations.length === 10 && durations.every(months => months > 0 && months <= 18));
  assert.match(await page.locator('[aria-labelledby="skills-frontend"]').innerText(), /React/);
  assert.match(await page.locator('[aria-labelledby="skills-backend"]').innerText(), /Laravel/);
  assert.match(await page.locator('[aria-labelledby="skills-aiml"]').innerText(), /PyTorch/);
  assert.match(await page.locator("#about-title").innerText(), /Siapa Alvin/);
  assert.equal(await page.locator(".reference-about-stats dd").count(), 3);
  assert.deepEqual(await page.locator(".reference-about-stats dd").allTextContents(), ["—", "—", "—"]);
  assert(await page.locator(".reference-about").evaluate(el => el.previousElementSibling?.classList.contains("tech-stack-section")));
  assert(await page.locator("#pengalaman").evaluate(el => el.previousElementSibling?.id === "tentang"));
  assert.equal(await page.locator(".reference-experience-card").count(), 3);
  assert.equal(await page.locator("#pengalaman .reference-experience-photo").count(), 12);
  assert.equal(await page.locator(".achievement-card").count(), 3);
  assert.equal(await page.locator("#pencapaian .reference-experience-photo").count(), 12);
  assert.equal(await page.locator("#achievements-title").innerText(), "Pencapaian");
  assert.equal(await page.locator("#experience-title").innerText(), "Pengalaman");
  assert.match(await page.locator("body").evaluate(el => getComputedStyle(el).backgroundImage), /hero-pattern-continuous\.svg/);
  for (const selector of [".reference-about", ".experience-section", ".contact-section", ".site-footer"]) {
    assert.equal(await page.locator(selector).evaluate(el => getComputedStyle(el).backgroundColor), "rgba(0, 0, 0, 0)");
  }
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
  assert.match(heroStyles.photo, /alvin-hero-framed\.webp/);
  assert.equal(await page.locator(".reference-portrait-backdrop").count(), 1);

  const alignedContainers = await page.locator(".navbar-inner, .reference-hero-inner, .about-layout, .projects-layout, .achievements-layout, .credentials-layout, .skills-layout, .experience-layout, .contact-section .container").evaluateAll(elements => elements.map(element => {
    const box = element.getBoundingClientRect();
    return { left: box.left, right: box.right };
  }));
  assert(alignedContainers.every(box => Math.abs(box.left - alignedContainers[0].left) < 1));
  assert(alignedContainers.every(box => Math.abs(box.right - alignedContainers[0].right) < 1));
  const languageBox = await page.locator(".language-toggle").boundingBox();
  assert(Math.abs(alignedContainers[0].right - (languageBox.x + languageBox.width)) < 1);
  assert.equal(await page.locator(".navbar-wordmark").innerText(), "alvin.");
  assert(Math.abs((await page.locator(".navbar-wordmark").boundingBox()).x - alignedContainers[0].left) < 1);
  const portraitBackdrop = await page.locator(".reference-portrait-backdrop").boundingBox();
  assert(Math.abs(portraitBackdrop.x + portraitBackdrop.width - alignedContainers[0].right) < 1);
  const portraitClip = await page.locator(".reference-profile-photo").boundingBox();
  assert(Math.abs(portraitClip.x - portraitBackdrop.x) < 1);
  assert(Math.abs(portraitClip.y - portraitBackdrop.y) < 1);
  assert(Math.abs(portraitClip.width - portraitBackdrop.width) < 1);
  assert(Math.abs(portraitClip.height - portraitBackdrop.height) < 1);
  const portraitImage = await page.locator(".reference-profile-photo img").boundingBox();
  assert(portraitImage.width < portraitClip.width);
  const portraitBottomOffset = portraitImage.y + portraitImage.height - (portraitClip.y + portraitClip.height);
  assert(portraitBottomOffset >= 0 && portraitBottomOffset <= 16);
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
  assert.match(await page.locator("#about-title").innerText(), /Who is Alvin/);
  assert.equal(await page.locator("#experience-title").innerText(), "Experience");
  assert.deepEqual(await page.locator("#pengalaman .reference-experience-type").allTextContents(), ["Internship", "Full Time", "Volunteer"]);
  await page.locator(".reference-about-actions .profile-pill").click();
  await page.getByRole("dialog", { name: "Let's get acquainted" }).waitFor();
  await page.getByRole("button", { name: "Close dialog", exact: true }).click();
  await goHome();
  assert.equal(await page.locator("#achievements-title").innerText(), "Achievements");
  assert.equal(await page.locator("#projects-title").innerText(), "Projects");
  assert.equal(await page.locator("#credentials-title").innerText(), "Certificates & Awards");
  assert.deepEqual(await page.locator(".credential-filters button").allTextContents(), ["All", "Certificates", "Awards"]);
  assert.match(await page.locator(".skill-duration").first().innerText(), /1 year 6 months/);
  const achievementCategories = await page.locator(".achievements-category").allTextContents();
  assert.equal(achievementCategories.length, 3);
  assert(achievementCategories.every(label => label.trim().length > 0));
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => document.documentElement.lang === "en");
  assert.match(await page.locator("h1").innerText(), /Creative Designer/);
  assert.match(await page.title(), /Creative Designer/);
  await page.locator('.pill-desktop-nav a[href="#pengalaman"]').click();
  await page.waitForFunction(() => document.querySelector('.pill-desktop-nav a[href="#pengalaman"]')?.getAttribute("aria-current") === "location");
  await page.locator('.pill-desktop-nav a[href="#pengalaman"]').hover();
  await page.waitForFunction(() => {
    const style = getComputedStyle(document.querySelector('.pill-desktop-nav a[href="#pengalaman"]'));
    return style.color === "rgb(255, 255, 255)" && style.backgroundColor === "rgba(255, 255, 255, 0.19)";
  });
  await goHome();
  await page.locator(".hire-pill").click();
  await page.getByRole("dialog", { name: "Let's get acquainted" }).waitFor();
  assert.match(await page.locator("dialog[open]").innerText(), /Contact details coming soon/);
  await page.keyboard.press("Escape");
  assert.equal(await page.locator("dialog[open]").count(), 0);
  assert(await page.locator(".hire-pill").evaluate(el => document.activeElement === el));
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
      const margins = await page.locator(".navbar-inner, .reference-hero-inner, .about-layout, .experience-layout, .projects-layout, .achievements-layout, .credentials-layout, .skills-layout, .contact-section .container, .site-footer").evaluateAll(elements => elements.map(el => {
        const box = el.getBoundingClientRect();
        return { left: box.left, right: box.right };
      }));
      assert(margins.every(box => Math.abs(box.left - margins[0].left) < 1 && Math.abs(box.right - margins[0].right) < 1), `Shared margins at ${width}px/${locale}`);
      assert(Math.abs(margins[0].left - (overflow.viewport - margins[0].right)) < 1, `Symmetric margins at ${width}px/${locale}`);
      const titleStyles = await page.locator(".reference-title, #about-title, #experience-title, #projects-title, #achievements-title, #credentials-title, #skills-title, #contact-title").evaluateAll(elements => elements.map(el => {
        const style = getComputedStyle(el);
        return { size: style.fontSize, weight: style.fontWeight, family: style.fontFamily };
      }));
      for (const style of titleStyles) assert.deepEqual(style, titleStyles[0], `Main headings match the hero at ${width}px/${locale}`);
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
        const menuBox = await page.locator("#mobile-navigation").boundingBox();
        await page.mouse.click(5, menuBox.y + menuBox.height + 12);
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
      if (width === 1440 || width === 390) {
        await page.locator(".reference-about").scrollIntoViewIfNeeded();
        await delay(750);
        await page.locator(".reference-about").screenshot({ path: `artifacts/about-${width}-${locale}.png`, style: ".reference-header { visibility: hidden; }" });
        await page.locator("#pengalaman").scrollIntoViewIfNeeded();
        await delay(750);
        await page.locator("#pengalaman").screenshot({ path: `artifacts/experience-${width}-${locale}.png`, style: ".reference-header, .skip-link { visibility: hidden; }" });
        await page.locator("#pencapaian").scrollIntoViewIfNeeded();
        await delay(750);
        await page.locator("#pencapaian").screenshot({ path: `artifacts/achievements-${width}-${locale}.png`, style: ".reference-header, .skip-link { visibility: hidden; }" });
        await page.locator("#proyek").scrollIntoViewIfNeeded();
        await delay(750);
        await page.locator("#proyek").screenshot({ path: `artifacts/projects-${width}-${locale}.png`, style: ".reference-header, .skip-link { visibility: hidden; }" });
        for (const [section, name] of [["#sertifikat", "credentials"], ["#tech-stack", "skills"]]) {
          await page.locator(section).scrollIntoViewIfNeeded();
          await delay(750);
          await page.locator(section).screenshot({ path: `artifacts/${name}-${width}-${locale}.png`, style: ".reference-header, .skip-link { visibility: hidden; }" });
        }
        await goHome();
      }
      console.log(`PASS: ${width}px/${locale}, images, layout${width <= 900 ? ", mobile menu and language switching" : ""}`);
    }
  }
  for (const width of [1200, 1101, 1100, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await goHome();
    for (const locale of ["id", "en"]) {
      await setLanguage(locale);
      const desktop = width > 1100;
      assert.equal(await page.locator(".pill-desktop-nav").isVisible(), desktop);
      assert.equal(await page.locator("#menu-toggle").isVisible(), !desktop);
      if (desktop) {
        const brand = await page.locator(".navbar-wordmark").boundingBox();
        const nav = await page.locator(".pill-desktop-nav").boundingBox();
        const language = await page.locator(".language-toggle").boundingBox();
        const content = await page.locator(".reference-hero-inner").boundingBox();
        assert(brand.x + brand.width + 24 <= nav.x, `Navbar fits at ${width}px/${locale}`);
        assert(Math.abs(brand.x - content.x) < 1 && Math.abs(language.x + language.width - content.x - content.width) < 1, `Navbar margins at ${width}px/${locale}`);
      } else {
        await page.locator("#menu-toggle").click();
        assert.equal(await page.locator("#mobile-navigation a").count(), 7);
        await page.locator('#mobile-navigation a[href="#tech-stack"]').click();
        assert.equal(await page.locator("#menu-toggle").getAttribute("aria-expanded"), "false");
        await goHome();
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    console.log(`PASS: ${width}px navbar, both languages, wordmark and responsive menu`);
  }
  const stackNames = await page.locator('.tech-stack-group:not([aria-hidden="true"]) .tech-stack-item > span:last-child').allTextContents();
  assert.equal(stackNames.length, 16);
  for (const name of ["Laravel", "React", "PyTorch", "Google Colab", "Canva"]) assert(stackNames.includes(name));
  for (const name of ["Tailwind CSS", "Express.js", "Redis", "Google AI Studio", "draw.io", "NumPy", "pandas", "REST API"]) assert(!stackNames.includes(name));
  assert.equal(await page.locator(".tech-stack-toggle, .tech-stack-heading p").count(), 0);
  assert.equal(await page.locator(".discipline-inner").count(), 0);
  assert.equal(await page.locator(".tech-stack-track").first().evaluate(el => getComputedStyle(el).animationName), "none");
  await page.emulateMedia({ reducedMotion: "no-preference" });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.locator(".tech-stack-section").scrollIntoViewIfNeeded();
  await page.mouse.move(2, 200);
  const trackX = () => page.locator(".tech-stack-track").first().evaluate(el => el.getBoundingClientRect().x);
  const startX = await trackX();
  await delay(450);
  assert(await trackX() < startX - 2, "Logo strip moves at normal motion preference");
  for (const lane of await page.locator(".tech-stack-window").all()) {
    const dimensions = await lane.evaluate(el => ({ viewport: el.clientWidth, sequence: el.querySelector(".tech-stack-sequence").getBoundingClientRect().width }));
    assert(dimensions.sequence >= dimensions.viewport, "Short logo lanes fill the viewport without blank gaps");
  }
  await page.locator(".tech-stack-lanes").hover();
  const hoverX = await trackX();
  await delay(250);
  assert(Math.abs(await trackX() - hoverX) < 1, "Hover pauses motion");
  await page.screenshot({ path: "artifacts/tech-stack-desktop.png" });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator(".tech-stack-section").scrollIntoViewIfNeeded();
  await page.screenshot({ path: "artifacts/tech-stack-mobile.png" });
  console.log("PASS: 16 tech stack entries, removed items absent, every local logo loaded, continuous marquee, hover pause, reduced motion");
  assert.deepEqual(errors, [], "Browser errors");
  console.log("PASS: SaaS/SCM/ERP projects, certificate carousel arrows, keyboard, wraparound, filters, drag, detail dialog and focus restoration; white skill cards with white icons on blue, durations up to 18 months, navbar, ID/EN translation, symmetric margins, reduced motion and 404.");
} finally {
  if (browser) await browser.close();
  preview.kill();
}
