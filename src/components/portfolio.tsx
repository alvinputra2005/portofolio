"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { AnimatePresence, MotionConfig, motion } from "motion/react";
import { ArrowDownRight, ArrowUp, ArrowUpRight, Camera, Check, Code2, Copy, Download, Github, Instagram, Linkedin, Mail, MapPin, PenTool, Plus, Sparkles, Video } from "lucide-react";
import { experiences, profile, projectCategories, projects, services, siteSettings, type Project } from "@/data/portfolio";
import { Reveal } from "./reveal";
import { Dialog } from "./dialog";
import { ProjectArt } from "./project-art";
import { SiteHeader } from "./site-header";
import { Hero } from "./hero";

const socialIcons = { instagram: Instagram, linkedin: Linkedin, github: Github };
const serviceIcons = { pen: PenTool, video: Video, camera: Camera, code: Code2 };

function SectionLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return <div className="section-label"><span>{number}</span><span className="label-line" />{children}</div>;
}

export function Portfolio() {
  const [activeSection, setActiveSection] = useState("#beranda");
  const [category, setCategory] = useState<(typeof projectCategories)[number]>("Semua");
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [contactOpen, setContactOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) setActiveSection(`#${entry.target.id}`);
      }
    }, { rootMargin: "-20% 0px -55% 0px", threshold: 0 });
    document.querySelectorAll("main > section[id]").forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!copied) return;
    const timer = window.setTimeout(() => setCopied(false), 2500);
    return () => window.clearTimeout(timer);
  }, [copied]);

  async function copyEmail() {
    if (!profile.email) return;
    try {
      await navigator.clipboard.writeText(profile.email);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  const visibleProjects = category === "Semua" ? projects : projects.filter((project) => project.category === category);

  return (
    <MotionConfig reducedMotion="user">
      <a className="skip-link" href="#main">Langsung ke konten</a>
      <SiteHeader activeSection={activeSection} onNavigate={setActiveSection} />

      <main id="main">
        <Hero onContact={() => setContactOpen(true)} />

        <div className="discipline-strip" aria-label="Bidang kreatif"><div className="container discipline-inner">{["Graphic Design", "Content Creation", "Visual Storytelling", "Digital Experiences"].map((item) => <span key={item}>{item}<span className="discipline-star" aria-hidden="true">✳</span></span>)}</div></div>

        <section className="section container work-section" id="karya" aria-labelledby="work-title">
          <Reveal><SectionLabel number="01">SELECTED WORK</SectionLabel><div className="section-heading"><h2 id="work-title">Ideas made<br /><span className="muted-heading">into something.</span></h2><p>Ruang untuk ide, eksplorasi, dan karya.<br />Setiap detail punya ceritanya sendiri.</p></div></Reveal>
          <Reveal><div className="work-toolbar"><div className="project-filters" aria-label="Filter kategori karya">{projectCategories.map((item) => <button key={item} aria-pressed={category === item} className={`filter-button ${category === item ? "selected" : ""}`} onClick={() => setCategory(item)}>{item}{item === "Semua" && <span>{projects.length.toString().padStart(2, "0")}</span>}</button>)}</div><span className="project-count" aria-live="polite">{visibleProjects.length.toString().padStart(2, "0")} EXPLORATIONS</span></div></Reveal>
          <div className="project-grid" aria-live="polite" aria-atomic="false">
            <AnimatePresence mode="popLayout" initial={false}>
              {visibleProjects.map((project) => <motion.article className="project-card" key={project.id} layout initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }} transition={{ duration: 0.3 }}>
                <button className="project-open" onClick={() => setSelectedProject(project)} aria-label={`Lihat detail ${project.title}`}>
                  <ProjectArt project={project} /><div className="project-card-info"><div><span className="project-category">{project.category} <span> / </span> {project.year}</span><h3>{project.title}</h3></div><span className="project-arrow"><ArrowUpRight size={21} /></span></div>
                </button>
              </motion.article>)}
            </AnimatePresence>
          </div>
          {projects.some((project) => project.isPlaceholder) && <p className="placeholder-caption"><Plus size={13} /> Pilihan konsep sementara. Karya asli akan hadir di sini.</p>}
        </section>

        <section className="about-section" id="tentang" aria-labelledby="about-title">
          <div className="container about-layout">
            <Reveal className="about-visual"><div className="about-photo"><Image src={profile.portrait} alt={`${profile.name}, desainer dan kreator digital`} fill sizes="(max-width: 760px) 90vw, 36vw" /><span className="about-photo-label">THE PERSON BEHIND THE WORK</span></div><div className="about-note"><span className="handwritten">Always curious.</span><ArrowUpRight size={30} strokeWidth={1} /></div></Reveal>
            <Reveal className="about-copy"><SectionLabel number="02">A LITTLE ABOUT ME</SectionLabel><h2 id="about-title">A person.<br />A perspective.<br /><span className="accent-word">A little different.</span></h2>{profile.about.map((paragraph, index) => <p key={index}>{paragraph}</p>)}<div className="about-pills"><span><PenTool size={14} /> Design thinker</span><span><Sparkles size={14} /> Curious creator</span></div><div className="about-actions">{profile.cvUrl ? <a className="button button-outline" href={profile.cvUrl} target="_blank" rel="noreferrer">Lihat CV <Download size={16} /></a> : <button className="button button-outline" onClick={() => setContactOpen(true)}>Kenalan lebih jauh <ArrowUpRight size={16} /></button>}<span className="about-signature">{profile.name}<span>.</span></span></div></Reveal>
          </div>
        </section>

        <section className="section container service-section" aria-labelledby="service-title">
          <Reveal><SectionLabel number="03">WHAT I CAN HELP WITH</SectionLabel><div className="section-heading"><h2 id="service-title">Different skills.<br /><span className="muted-heading">One creative direction.</span></h2><p>Dari ide pertama sampai sentuhan akhir.<br />Mari buat sesuatu yang berarti.</p></div></Reveal>
          <div className="service-grid">{services.map((service, index) => { const Icon = serviceIcons[service.icon]; return <Reveal key={service.number} delay={index * 0.06}><div className="service-card"><div className="service-top"><Icon size={24} strokeWidth={1.4} /><span>{service.number}</span></div><h3>{service.title}</h3><p>{service.description}</p><span className="service-bottom">IDEA TO EXPRESSION <ArrowDownRight size={19} /></span></div></Reveal>; })}</div>
        </section>

        <section className="experience-section" id="pengalaman" aria-labelledby="experience-title"><div className="container experience-layout"><Reveal className="experience-intro"><SectionLabel number="04">THE JOURNEY</SectionLabel><h2 id="experience-title">Learning.<br />Making.<br /><span className="muted-heading">Growing.</span></h2><p>Setiap kesempatan menjadi ruang<br />untuk belajar dan berkembang.</p><span className="experience-star" aria-hidden="true">✳</span></Reveal><div className="experience-list">{experiences.map((experience, index) => <Reveal key={experience.id} delay={index * 0.05}><article className="experience-row"><div className="experience-meta"><span>{experience.period}</span><span className="experience-type">{experience.type}</span></div><h3>{experience.role}</h3><span className="experience-company">{experience.company}</span><p>{experience.description}</p><span className="experience-number">0{index + 1}</span></article></Reveal>)}<p className="experience-placeholder">Ruang untuk perjalanan dan pengalamanmu.</p></div></div></section>

        <section className="section container social-section" id="sosial" aria-labelledby="social-title"><Reveal><div className="social-heading"><div><SectionLabel number="05">BEYOND THE PORTFOLIO</SectionLabel><h2 id="social-title">Let&apos;s stay <span className="muted-heading">connected.</span></h2></div><p>Ide, proses, dan hal menarik lainnya.</p></div></Reveal><div className="social-links-grid">{profile.socialLinks.map((social) => { const Icon = socialIcons[social.icon]; const content = <><span className="social-link-icon"><Icon size={22} strokeWidth={1.4} /></span><div><h3>{social.label}</h3><span>{social.href ? "Ikuti perjalanan kreatifku" : "Profil akan segera hadir"}</span></div><ArrowUpRight className="social-link-arrow" size={20} /></>; return <Reveal key={social.label}>{social.href ? <a className="social-link-card" href={social.href} target="_blank" rel="noreferrer">{content}</a> : <button className="social-link-card" onClick={() => setContactOpen(true)} aria-label={`${social.label}, profil belum ditambahkan`}>{content}</button>}</Reveal>; })}</div></section>

        <section className="contact-section" id="kontak" aria-labelledby="contact-title"><div className="container"><Reveal><div className="contact-top"><span className="contact-eyebrow"><span className="status-dot" /> GOOD THINGS START WITH A CONVERSATION</span><span>HAVE AN IDEA IN MIND?</span></div><div className="contact-main"><h2 id="contact-title">Let&apos;s make<br />something <span>great.</span></h2><button className="contact-orb" aria-label="Buka informasi kontak" onClick={() => setContactOpen(true)}><ArrowUpRight size={56} strokeWidth={1.2} /></button></div><div className="contact-bottom"><p>Proyek baru, ide menarik, atau sekadar menyapa.<br />Aku senang mendengar ceritamu.</p><button className="contact-link" onClick={() => setContactOpen(true)}>Mulai percakapan <ArrowUpRight size={18} /></button></div></Reveal></div></section>
      </main>

      <footer className="site-footer container"><a className="wordmark" href="#beranda">{profile.name.toLowerCase()}<span>.</span></a><p>© {siteSettings.year} {profile.name}. Crafted with intention.</p><a className="back-top" href="#beranda">Kembali ke atas <ArrowUp size={15} /></a></footer>

      <Dialog open={!!selectedProject} onClose={() => setSelectedProject(null)} title={selectedProject?.title ?? "Detail proyek"} className="project-dialog">
        {selectedProject && <><ProjectArt project={selectedProject} /><div className="dialog-content"><span className="project-category">{selectedProject.category} / {selectedProject.year}</span><h2>{selectedProject.title}</h2><p>{selectedProject.description}</p><div className="project-tags">{selectedProject.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>{selectedProject.isPlaceholder && <div className="project-demo-note"><span className="blue-dot" /><p>Ini adalah kartu konsep sementara. Visual dan cerita proyek asli akan ditambahkan di sini.</p></div>}<button className="button button-primary" onClick={() => { setSelectedProject(null); setContactOpen(true); }}>Diskusikan ide serupa <ArrowUpRight size={17} /></button></div></>}
      </Dialog>
      <Dialog open={contactOpen} onClose={() => { setContactOpen(false); setCopied(false); }} title="Mari berkenalan" className="contact-dialog">
        <div className="dialog-content"><div className="contact-dialog-icon"><Mail size={29} strokeWidth={1.3} /></div><span className="section-label">SAY HELLO</span><h2>Mari berkenalan<span className="accent-word">.</span></h2><p>Kolaborasi yang baik dimulai dari percakapan yang sederhana.</p>{profile.email ? <><a className="contact-email" href={`mailto:${profile.email}`}>{profile.email}<ArrowUpRight size={20} /></a><div className="contact-dialog-actions"><a className="button button-primary" href={`mailto:${profile.email}`}>Kirim email <Mail size={16} /></a><button className="button button-outline" onClick={copyEmail}>{copied ? "Tersalin" : "Salin email"}{copied ? <Check size={16} /> : <Copy size={16} />}</button></div><span className="sr-only" role="status">{copied ? "Alamat email berhasil disalin." : ""}</span></> : <div className="contact-coming-soon"><span className="status-dot" /><div><strong>Kontak segera tersedia</strong><p>Alamat email dan profil sosial akan ditambahkan. Sampai jumpa di percakapan berikutnya!</p></div></div>}<div className="dialog-location"><MapPin size={14} />{profile.location}<span>DESIGNING WITH INTENTION.</span></div></div>
      </Dialog>
    </MotionConfig>
  );
}
