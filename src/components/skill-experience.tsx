"use client";

import Image from "next/image";
import { BrainCircuit, Code2, Server } from "lucide-react";
import { skillGroups } from "@/data/portfolio";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";

function duration(months: number, locale: "id" | "en") {
  const years = Math.floor(months / 12);
  const remaining = months % 12;
  return [
    years ? `${years} ${locale === "id" ? "tahun" : years === 1 ? "year" : "years"}` : "",
    remaining ? `${remaining} ${locale === "id" ? "bulan" : remaining === 1 ? "month" : "months"}` : "",
  ].filter(Boolean).join(" ");
}

export function SkillExperience() {
  const { locale, copy } = useLanguage();
  const descriptions = { frontend: copy.frontendDescription, backend: copy.backendDescription, aiml: copy.aimlDescription };
  const icons = { frontend: Code2, backend: Server, aiml: BrainCircuit };

  return <section className="reference-experience skill-experience-section" id="tech-stack" aria-labelledby="skills-title">
    <div className="container skills-layout">
      <Reveal><h2 className="reference-experience-title" id="skills-title"><mark>{copy.skillsTitle}</mark></h2></Reveal>
      <div className="reference-experience-grid skill-experience-grid">
        {skillGroups.map((group, index) => {
          const Icon = icons[group.id];
          return <Reveal key={group.id} delay={index * .08} className="reference-experience-column">
            <article className="skill-experience-card" aria-labelledby={`skills-${group.id}`}>
              <div className="skill-card-heading"><span className="skill-card-icon"><Icon size={25} strokeWidth={1.6} aria-hidden="true" /></span><h3 id={`skills-${group.id}`}>{group.title}</h3></div>
              <p className="skill-card-description">{descriptions[group.id]}</p>
              <p className="skill-duration-label">{copy.skillsDuration}</p>
              <ul className="skill-experience-list">
                {group.skills.map(skill => <li key={skill.name} data-months={skill.months}>
                  <div className="skill-experience-row"><Image src={`/images/tech/${skill.icon}.svg`} width={26} height={26} alt="" unoptimized /><span>{skill.name}</span><span className="skill-duration">{duration(skill.months, locale)}</span></div>
                  <div className="skill-duration-track" aria-hidden="true"><span style={{ width: `${skill.months / 18 * 100}%` }} /></div>
                </li>)}
              </ul>
            </article>
          </Reveal>;
        })}
      </div>
      <p className="reference-experience-note">{copy.skillsDummy}</p>
    </div>
  </section>;
}
