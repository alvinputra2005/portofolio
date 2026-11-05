"use client";

import { ArrowUpRight, Github, Instagram, Linkedin, Mail, MessageCircleMore } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { Reveal } from "./reveal";
import { useLanguage } from "./language-provider";
import { PortraitMotion } from "./portrait-motion";

const heroSocialIcons = {
  whatsapp: MessageCircleMore,
  instagram: Instagram,
  email: Mail,
  github: Github,
  linkedin: Linkedin,
};

export function Hero({ onContact }: { onContact: () => void }) {
  const { locale, copy } = useLanguage();
  const { profile } = getLocalizedPortfolio(locale);
  const [firstRole, ...remainingRoles] = profile.role.split(/\s*&\s*/);

  return (
    <section className="reference-hero" id="beranda" aria-labelledby="hero-title">
      <div className="reference-hero-inner">
        <div className="reference-hero-copy">
          <Reveal><p className="reference-greeting">{copy.hello} <mark>{profile.name}</mark></p></Reveal>
          <Reveal delay={0.08}><h1 id="hero-title" className="reference-title"><span>{firstRole}</span>{remainingRoles.map((role) => <span key={role}>&amp; {role}</span>)}</h1></Reveal>
          <Reveal delay={0.13}>
            <div className="reference-socials" aria-label={copy.socialLabel}>
              {profile.socialLinks.map(social => {
                const Icon = heroSocialIcons[social.icon];
                const href = social.icon === "email" && profile.email ? `mailto:${profile.email}` : social.href;
                const icon = <Icon size={18} strokeWidth={1.8} />;
                return href
                  ? <a key={social.label} href={href} target={href.startsWith("http") ? "_blank" : undefined} rel={href.startsWith("http") ? "noreferrer" : undefined} aria-label={social.label} title={social.label}>{icon}</a>
                  : <button key={social.label} type="button" onClick={onContact} aria-label={`${social.label}, ${copy.socialUnavailable}`} title={social.label}>{icon}</button>;
              })}
            </div>
          </Reveal>
          <Reveal delay={0.19}><div className="reference-biography"><p>{profile.bio}</p></div></Reveal>
          <Reveal delay={0.25} className="reference-hero-actions">
            <button className="profile-pill" type="button" onClick={onContact}>{copy.contactMe}<span className="profile-play"><ArrowUpRight size={20} aria-hidden="true" /></span></button>
            <a className="hire-pill" href="#proyek">{copy.viewProjects}</a>
          </Reveal>
        </div>
        <Reveal className="reference-hero-portrait" delay={0.16}>
          <PortraitMotion src={profile.heroPortrait} alt={`${copy.portraitAlt} ${profile.name}`} />
        </Reveal>
      </div>
    </section>
  );
}
