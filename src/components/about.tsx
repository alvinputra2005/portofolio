"use client";

import Image from "next/image";
import { Instagram, Linkedin, Play } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";

export function About({ onContact }: { onContact: () => void }) {
  const { locale, copy } = useLanguage();
  const { profile } = getLocalizedPortfolio(locale);
  const metrics = [
    { value: profile.statistics.projects, label: copy.aboutProjects, second: copy.aboutProjectsSecond },
    { value: profile.statistics.community, label: copy.aboutCommunity, second: copy.aboutCommunitySecond },
    { value: profile.statistics.experience, label: copy.aboutExperience, second: copy.aboutExperienceSecond },
  ];
  const socials = profile.socialLinks.filter(social => social.icon === "instagram" || social.icon === "linkedin");

  return <section className="reference-about" id="tentang" aria-labelledby="about-title">
    <div className="container about-layout">
      <Reveal className="reference-about-visual">
        <div className="reference-about-card">
          <span className="reference-about-ring about-ring-large" aria-hidden="true" />
          <span className="reference-about-ring about-ring-small" aria-hidden="true" />
          <Image src={profile.aboutPortrait} alt={`${copy.portraitAlt} ${profile.name}`} fill sizes="(max-width: 650px) 85vw, (max-width: 900px) 40vw, 420px" />
        </div>
      </Reveal>
      <Reveal delay={.1} className="reference-about-copy">
        <p className="reference-about-badge"><mark>{copy.aboutBadge}</mark></p>
        <h2 id="about-title">{copy.aboutQuestion} {profile.name}?</h2>
        <div className="reference-about-description"><p>{profile.about[0]}</p><p>{profile.bio}</p></div>
        <dl className="reference-about-stats" aria-label={copy.aboutStatsLabel}>
          {metrics.map(metric => <div key={metric.label}>
            <dt>{metric.label}<br />{metric.second}</dt><dd>{metric.value ?? "—"}</dd>
          </div>)}
        </dl>
        {metrics.some(metric => metric.value === null) && <p className="reference-about-stats-note">{copy.aboutStatsComing}</p>}
        <div className="reference-about-actions">
          <button className="profile-pill" type="button" onClick={onContact}>{copy.aboutSocial}<span className="profile-play"><Play size={17} fill="currentColor" strokeWidth={0} /></span></button>
          <div className="reference-about-socials" aria-label={copy.socialLabel}>
            {socials.map(social => {
              const Icon = social.icon === "instagram" ? Instagram : Linkedin;
              return social.href
                ? <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}><Icon size={27} strokeWidth={1.8} /></a>
                : <button key={social.label} type="button" onClick={onContact} aria-label={`${social.label}, ${copy.socialUnavailable}`} title={social.label}><Icon size={27} strokeWidth={1.8} /></button>;
            })}
          </div>
        </div>
      </Reveal>
    </div>
  </section>;
}
