"use client";

import { useEffect, useMemo, useState } from "react";
import { MotionConfig } from "motion/react";
import { ArrowUpRight, Check, Copy, Mail, MapPin } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { Dialog } from "./dialog";
import { SiteHeader } from "./site-header";
import { Hero } from "./hero";
import { About } from "./about";
import { Experience } from "./experience";
import { Projects } from "./projects";
import { Achievements } from "./achievements";
import { Credentials } from "./credentials";
import { SkillExperience } from "./skill-experience";
import { useLanguage } from "./language-provider";

export function Portfolio() {
  const { locale, copy } = useLanguage();
  const { profile } = useMemo(() => getLocalizedPortfolio(locale), [locale]);
  const [activeSection, setActiveSection] = useState("#beranda");
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const footerVisible = () => window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
    const updateFooter = () => {
      if (footerVisible()) setActiveSection("#kontak");
      else setActiveSection(current => current === "#kontak" ? "#tech-stack" : current);
    };
    const observer = new IntersectionObserver(entries => {
      if (footerVisible()) { setActiveSection("#kontak"); return; }
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
    }, { rootMargin: "-20% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach(section => observer.observe(section));
    updateFooter();
    window.addEventListener("scroll", updateFooter, { passive: true });
    return () => { observer.disconnect(); window.removeEventListener("scroll", updateFooter); };
  }, []);

  useEffect(() => { document.title = `${profile.name} — ${profile.role}`; }, [profile.name, profile.role]);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyEmail() {
    if (!profile.email) return;
    try { await navigator.clipboard.writeText(profile.email); setCopied(true); }
    catch { setCopied(false); }
  }

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">{copy.skip}</a>
      <SiteHeader activeSection={activeSection} onNavigate={setActiveSection} />
      <main id="main">
        <Hero onContact={() => setContactOpen(true)} />

        <About />

        <Experience />

        <Projects />

        <Achievements />

        <Credentials />

        <SkillExperience />

      </main>

      <footer className="site-footer" id="kontak" aria-labelledby="contact-title">
        <div className="container footer-inner">
          <div className="footer-main">
            <div><h2 id="contact-title">{copy.footerInviteTitle}</h2><p>{copy.footerInviteDescription}<span className="footer-invite-note">{copy.footerInviteNote}</span></p></div>
          </div>
        </div>
      </footer>

      <Dialog open={contactOpen} onClose={() => { setContactOpen(false); setCopied(false); }} title={copy.contactTitle} className="contact-dialog">
        <div className="dialog-content">
          <div className="contact-dialog-icon"><Mail size={29} strokeWidth={1.3} /></div><span className="section-label">{copy.sayHello}</span><h2>{copy.contactTitle}<span className="accent-word">.</span></h2><p>{copy.contactDialogIntro}</p>
          {profile.email ? <>
            <a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={20} /></a>
            <div className="contact-dialog-actions"><a className="button button-primary" href={`mailto:${profile.email}`}>{copy.sendEmail}<Mail size={16} /></a><button className="button button-outline" onClick={copyEmail}>{copied ? copy.copied : copy.copyEmail}{copied ? <Check size={16} /> : <Copy size={16} />}</button></div>
            <span className="sr-only" role="status">{copied ? copy.copiedAnnouncement : ""}</span>
          </> : <div className="contact-coming-soon"><span className="status-dot" /><div><strong>{copy.contactComing}</strong><p>{copy.contactComingDescription}</p></div></div>}
          <div className="dialog-location"><MapPin size={14} />{profile.location}<span>{copy.intention}</span></div>
        </div>
      </Dialog>
    </MotionConfig>
  );
}
