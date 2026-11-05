"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Globe, Menu, X } from "lucide-react";
import { navigation, profile } from "@/data/portfolio";
import { navigationLabels } from "@/data/translations";
import { useLanguage } from "./language-provider";

export function SiteHeader({ activeSection, onNavigate }: { activeSection: string; onNavigate: (section: string) => void }) {
  const { locale, setLocale, copy } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 24);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    const desktop = window.matchMedia("(min-width: 1101px)");
    const closeOnDesktop = () => { if (desktop.matches) setMenuOpen(false); };
    desktop.addEventListener("change", closeOnDesktop);
    return () => {
      window.removeEventListener("scroll", updateScroll);
      desktop.removeEventListener("change", closeOnDesktop);
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setMenuOpen(false); toggle.current?.focus(); }
    };
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !header.current?.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [menuOpen]);

  function navigate(section: string) { onNavigate(section); setMenuOpen(false); }
  function linkLabel(href: string, fallback: string) { return navigationLabels[locale][href as keyof typeof navigationLabels.id] ?? fallback; }

  return (
    <header ref={header} className={`reference-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="reference-navbar">
        <div className="container navbar-inner">
          <a className="wordmark navbar-wordmark" href="#beranda" aria-label={`${profile.name} — ${copy.home}`} onClick={() => navigate("#beranda")}>{profile.name.toLowerCase()}<span>.</span></a>
          <div className="navbar-actions">
            <nav className="pill-desktop-nav" aria-label={copy.mainNav}>
              {navigation.map((link) => <a key={link.href} href={link.href} className={activeSection === link.href ? "active" : ""} aria-current={activeSection === link.href ? "location" : undefined} onClick={() => navigate(link.href)}>{linkLabel(link.href, link.label)}</a>)}
            </nav>
            <button className="language-toggle" type="button" aria-label={copy.switchLanguage} title={copy.switchLanguage} onClick={() => setLocale(locale === "id" ? "en" : "id")}><Globe size={18} strokeWidth={1.7} /><span>{locale.toUpperCase()}</span></button>
            <button ref={toggle} id="menu-toggle" className="pill-menu-toggle" aria-label={menuOpen ? copy.closeMenu : copy.openMenu} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
          </div>
        </div>
      </div>
      <AnimatePresence>
        {menuOpen && <motion.nav id="mobile-navigation" data-lenis-prevent className="pill-mobile-nav" aria-label={copy.mobileNav} initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {navigation.map((link) => <a key={link.href} href={link.href} className={activeSection === link.href ? "active" : ""} aria-current={activeSection === link.href ? "location" : undefined} onClick={() => navigate(link.href)}>{linkLabel(link.href, link.label)}<ArrowUpRight size={18} /></a>)}
        </motion.nav>}
      </AnimatePresence>
    </header>
  );
}
