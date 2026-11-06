"use client";

import { useState } from "react";
import { Download, FileText } from "lucide-react";
import { useContent } from "./content-provider";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";
import { Dialog } from "./dialog";
import { AboutIdCard } from "./about-id-card";

export function About() {
  const { locale, copy } = useLanguage();
  const { profile } = useContent();
  const [cvOpen, setCvOpen] = useState(false);
  const metrics = [
    { value: profile.statistics.projects, label: copy.aboutProjects, second: copy.aboutProjectsSecond },
    { value: profile.statistics.competitions, label: copy.aboutCompetitions, second: copy.aboutCompetitionsSecond },
    { value: profile.statistics.experience === null ? null : new Intl.NumberFormat(locale).format(profile.statistics.experience), label: copy.aboutExperience, second: copy.aboutExperienceSecond },
  ];

  return <section className="reference-about" id="tentang" aria-labelledby="about-title">
    <div className="container about-layout">
      {profile.aboutPortrait && <AboutIdCard src={profile.aboutPortrait} alt={`${copy.portraitAlt} ${profile.name}`} />}
      <Reveal delay={.1} className="reference-about-copy">
        <p className="reference-about-badge"><mark>{copy.aboutBadge}</mark></p>
        <h2 id="about-title">{copy.aboutQuestion} {profile.name}?</h2>
        <div className="reference-about-description">{profile.about.map(paragraph => <p key={paragraph}>{paragraph}</p>)}</div>
        <dl className="reference-about-stats" aria-label={copy.aboutStatsLabel}>
          {metrics.map(metric => <div key={metric.label}>
            <dt>{metric.label}<br />{metric.second}</dt><dd>{metric.value ?? "—"}</dd>
          </div>)}
        </dl>
        {metrics.some(metric => metric.value === null) && <p className="reference-about-stats-note">{copy.aboutStatsComing}</p>}
        <div className="reference-about-actions">
          {profile.cvUrl
            ? <a className="profile-pill about-cv" href={profile.cvUrl} download>{copy.downloadCv}<span className="profile-play"><Download size={19} aria-hidden="true" /></span></a>
            : <button className="profile-pill about-cv" type="button" onClick={() => setCvOpen(true)}>{copy.downloadCv}<span className="profile-play"><Download size={19} aria-hidden="true" /></span></button>}
        </div>
      </Reveal>
    </div>
    <Dialog open={cvOpen} onClose={() => setCvOpen(false)} title={copy.downloadCv} className="cv-dialog">
      <div className="dialog-content"><div className="contact-dialog-icon"><FileText size={29} strokeWidth={1.3} aria-hidden="true" /></div><h2>{copy.cvComing}</h2><p>{copy.cvComingDescription}</p></div>
    </Dialog>
  </section>;
}
