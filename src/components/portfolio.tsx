"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowDownRight, ArrowUp, ArrowUpRight, Camera, Check, Code2, Copy, Mail, MapPin, PenTool, Plus, Video } from "lucide-react";
import { projectCategories, siteSettings } from "@/data/portfolio";
import { categoryLabel, getLocalizedPortfolio } from "@/data/translations";
import { Reveal } from "./reveal";
import { Dialog } from "./dialog";
import { ProjectArt } from "./project-art";
import { SiteHeader } from "./site-header";
import { Hero } from "./hero";
import { TechStack } from "./tech-stack";
import { About } from "./about";
import { useLanguage } from "./language-provider";

const serviceIcons = { pen: PenTool, video: Video, camera: Camera, code: Code2 };

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="section-label"><span>{number}</span><span className="label-line" />{children}</div>;
}

export function Portfolio() {
  const { locale, copy } = useLanguage();
  const { profile, projects, services, experiences } = useMemo(() => getLocalizedPortfolio(locale), [locale]);
  const [activeSection, setActiveSection] = useState("#beranda");
  const [category, setCategory] = useState<(typeof projectCategories)[number]>("Semua");
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const selectedProject = projects.find(project => project.id === selectedProjectId) ?? null;

  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
    }, { rootMargin: "-20% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach(section => observer.observe(section));
    return () => observer.disconnect();
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

  const visibleProjects = category === "Semua" ? projects : projects.filter(project => project.category === category);

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">{copy.skip}</a>
      <SiteHeader activeSection={activeSection} onNavigate={setActiveSection} />
      <main id="main">
        <Hero onContact={() => setContactOpen(true)} />

        <TechStack />

        <About onContact={() => setContactOpen(true)} />

        <section className="section container work-section" id="karya" aria-labelledby="work-title">
          <Reveal>
            <SectionLabel number="01">{copy.workLabel}</SectionLabel>
            <div className="section-heading"><h2 id="work-title">{copy.workTitle}<br /><span className="muted-heading">{copy.workTitleMuted}</span></h2><p>{copy.workIntro}<br />{copy.workIntroSecond}</p></div>
          </Reveal>
          <Reveal>
            <div className="work-toolbar">
              <div className="project-filters" aria-label={copy.filterLabel}>{projectCategories.map(item => <button key={item} aria-pressed={category === item} className={`filter-button ${category === item ? "selected" : ""}`} onClick={() => setCategory(item)}>{categoryLabel(item, locale)}{item === "Semua" && <span>{projects.length.toString().padStart(2, "0")}</span>}</button>)}</div>
              <span className="project-count" aria-live="polite">{visibleProjects.length.toString().padStart(2, "0")} {copy.explorations}</span>
            </div>
          </Reveal>
          <div className="project-grid" aria-live="polite" aria-atomic="false">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleProjects.map(project => <motion.article className="project-card" key={project.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
                <button className="project-open" onClick={() => setSelectedProjectId(project.id)} aria-label={`${copy.viewProject} ${project.title}`}>
                  <ProjectArt project={project} />
                  <div className="project-card-info"><div><span className="project-category">{categoryLabel(project.category, locale)} <span> / </span> {project.year}</span><h3>{project.title}</h3></div><span className="project-arrow"><ArrowUpRight size={21} /></span></div>
                </button>
              </motion.article>)}
            </AnimatePresence>
          </div>
          {projects.some(project => project.isPlaceholder) && <p className="placeholder-caption"><Plus size={13} />{copy.placeholderCaption}</p>}
        </section>

        <section className="section container service-section" id="pencapaian" aria-labelledby="service-title">
          <Reveal>
            <SectionLabel number="03">{copy.servicesLabel}</SectionLabel>
            <div className="section-heading"><h2 id="service-title">{copy.servicesTitle}<br /><span className="muted-heading">{copy.servicesTitleMuted}</span></h2><p>{copy.servicesIntro}<br />{copy.servicesIntroSecond}</p></div>
          </Reveal>
          <div className="service-grid">{services.map((service, index) => {
            const Icon = serviceIcons[service.icon];
            return <Reveal key={service.number} delay={index * .06}><div className="service-card"><div className="service-top"><Icon size={24} strokeWidth={1.4} /><span>{service.number}</span></div><h3>{service.title}</h3><p>{service.description}</p><span className="service-bottom">{copy.ideaToExpression}<ArrowDownRight size={19} /></span></div></Reveal>;
          })}</div>
        </section>

        <section className="experience-section" id="pengalaman" aria-labelledby="experience-title">
          <div className="container experience-layout">
            <Reveal className="experience-intro"><SectionLabel number="04">{copy.journeyLabel}</SectionLabel><h2 id="experience-title">{copy.journeyFirst}<br />{copy.journeySecond}<br /><span className="muted-heading">{copy.journeyThird}</span></h2><p>{copy.journeyIntro}<br />{copy.journeyIntroSecond}</p><span className="experience-star" aria-hidden="true">✳</span></Reveal>
            <div className="experience-list">{experiences.map((experience, index) => <Reveal key={experience.id} delay={index * .05}><article className="experience-row"><div className="experience-meta"><span>{experience.period}</span><span className="experience-type">{experience.type}</span></div><h3>{experience.role}</h3><span className="experience-company">{experience.company}</span><p>{experience.description}</p><span className="experience-number">0{index + 1}</span></article></Reveal>)}<p className="experience-placeholder">{copy.experiencePlaceholder}</p></div>
          </div>
        </section>

        <section className="contact-section" id="kontak" aria-labelledby="contact-title">
          <div className="container"><Reveal>
            <div className="contact-top"><span className="contact-eyebrow"><span className="status-dot" />{copy.contactEyebrow}</span><span>{copy.contactIdea}</span></div>
            <div className="contact-main"><h2 id="contact-title">{copy.contactFirst}<br />{copy.contactSecond} <span>{copy.contactAccent}</span></h2><button className="contact-orb" aria-label={copy.openContact} onClick={() => setContactOpen(true)}><ArrowUpRight size={56} strokeWidth={1.2} /></button></div>
            <div className="contact-bottom"><p>{copy.contactIntro}<br />{copy.contactIntroSecond}</p><button className="contact-link" onClick={() => setContactOpen(true)}>{copy.startConversation}<ArrowUpRight size={18} /></button></div>
          </Reveal></div>
        </section>
      </main>

      <footer className="site-footer container"><a className="wordmark" href="#beranda">{profile.name.toLowerCase()}<span>.</span></a><p>© {siteSettings.year} {profile.name}. {copy.footer}</p><a className="back-top" href="#beranda">{copy.backTop}<ArrowUp size={15} /></a></footer>

      <Dialog open={!!selectedProject} onClose={() => setSelectedProjectId(null)} title={selectedProject?.title ?? copy.projectDetails} className="project-dialog">
        {selectedProject && <>
          <ProjectArt project={selectedProject} />
          <div className="dialog-content"><span className="project-category">{categoryLabel(selectedProject.category, locale)} / {selectedProject.year}</span><h2>{selectedProject.title}</h2><p>{selectedProject.description}</p><div className="project-tags">{selectedProject.tags.map(tag => <span key={tag}>{tag}</span>)}</div>{selectedProject.isPlaceholder && <div className="project-demo-note"><span className="blue-dot" /><p>{copy.projectNote}</p></div>}<button className="button button-primary" onClick={() => { setSelectedProjectId(null); setContactOpen(true); }}>{copy.discussProject}<ArrowUpRight size={17} /></button></div>
        </>}
      </Dialog>
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
