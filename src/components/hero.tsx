"use client";

import Image from "next/image";
import { Github, Instagram, Linkedin, Mail, MessageCircleMore, Play } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { Reveal } from "./reveal";
import { useLanguage } from "./language-provider";

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
          <Reveal delay={0.19}><div className="reference-biography"><p>{profile.bio}</p><p>{profile.about[0]}</p></div></Reveal>
          <Reveal delay={0.25} className="reference-hero-actions"><a className="profile-pill" href="#tentang">{copy.viewProfile}<span className="profile-play"><Play size={18} fill="currentColor" strokeWidth={0} /></span></a><button className="hire-pill" onClick={onContact}>{copy.hire}</button></Reveal>
        </div>
        <Reveal className="reference-hero-portrait" delay={0.16}>
          <div className="reference-portrait-backdrop" aria-hidden="true"><span className="portrait-ring ring-top" /><span className="portrait-ring ring-bottom" /></div>
          <div className="reference-profile-photo"><Image src={profile.heroPortrait} alt={`${copy.portraitAlt} ${profile.name}`} fill priority sizes="(max-width: 900px) 80vw, 470px" /></div>
        </Reveal>
      </div>
    </section>
  );
}
