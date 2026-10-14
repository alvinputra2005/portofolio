"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { navigation, profile } from "@/data/portfolio";

export function SiteHeader({ activeSection, onNavigate }: { activeSection: string; onNavigate: (section: string) => void }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const header = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 24);
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    const desktop = window.matchMedia("(min-width: 901px)");
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

  return (
    <header ref={header} className={`reference-header${scrolled ? " is-scrolled" : ""}`}>
      <div className="reference-navbar">
        <div className="navbar-identity">
          <a className="navbar-home" href="#beranda" aria-label="Kembali ke beranda" aria-current={activeSection === "#beranda" ? "location" : undefined} onClick={() => navigate("#beranda")}>
            <svg width="34" height="34" viewBox="0 0 36 36" fill="none" aria-hidden="true"><path d="m3 17 13-13a3 3 0 0 1 4 0l13 13" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M7 16.5 18 5.5l11 11V31a2 2 0 0 1-2 2h-6V23h-6v10H9a2 2 0 0 1-2-2z" fill="currentColor"/></svg>
          </a>
          <a className="navbar-brand" href="#beranda" aria-label={`${profile.name}, beranda`} onClick={() => navigate("#beranda")}>
            <span className="navbar-avatar"><Image src={profile.portrait} alt="" fill sizes="44px" /></span>
            <span>{profile.name}</span>
          </a>
        </div>
        <nav className="pill-desktop-nav" aria-label="Navigasi utama">
          {navigation.map((link) => <a key={link.href} href={link.href} className={activeSection === link.href ? "active" : ""} aria-current={activeSection === link.href ? "location" : undefined} onClick={() => navigate(link.href)}>{link.label}</a>)}
        </nav>
        <button ref={toggle} id="menu-toggle" className="pill-menu-toggle" aria-label={menuOpen ? "Tutup menu" : "Buka menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>
      <AnimatePresence>
        {menuOpen && <motion.nav id="mobile-navigation" className="pill-mobile-nav" aria-label="Navigasi mobile" initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
          {navigation.map((link) => <a key={link.href} href={link.href} className={activeSection === link.href ? "active" : ""} aria-current={activeSection === link.href ? "location" : undefined} onClick={() => navigate(link.href)}>{link.label}<ArrowUpRight size={18} /></a>)}
        </motion.nav>}
      </AnimatePresence>
    </header>
  );
}
