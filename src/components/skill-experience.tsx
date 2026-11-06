"use client";

import Image from "next/image";
import { BrainCircuit, Code2, Server } from "lucide-react";
import { useContent } from "./content-provider";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";
import { TechStack } from "./tech-stack";

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
  const {skillGroups,settings}=useContent();
  const icons = { frontend: Code2, backend: Server, aiml: BrainCircuit };

  return <section className="reference-experience skill-experience-section" id="tech-stack" aria-labelledby="skills-title">
    <div className="container skills-layout">
      <Reveal><h2 className="reference-experience-title" id="skills-title"><mark>{copy.skillsTitle}</mark></h2></Reveal>
      <TechStack />
      <div className="reference-experience-grid skill-experience-grid">
        {skillGroups.map((group, index) => {
          const Icon = icons[group.icon] || Code2;
          return <Reveal key={group.id} delay={index * .08} className="reference-experience-column">
            <article className="skill-experience-card" aria-labelledby={`skills-${group.id}`}>
              <div className="skill-card-heading"><span className="skill-card-icon"><Icon size={25} strokeWidth={1.6} aria-hidden="true" /></span><h3 id={`skills-${group.id}`}>{group.title}</h3></div>
              <p className="skill-card-description">{group.description}</p>
              <p className="skill-duration-label">{copy.skillsDuration}</p>
              <ul className="skill-experience-list">
                {group.skills.map(skill => <li key={skill.name} data-months={skill.months}>
                  <div className="skill-experience-row">{skill.icon && <Image src={skill.icon} width={26} height={26} alt="" unoptimized />}<span>{skill.name}</span><span className="skill-duration">{duration(skill.months, locale)}</span></div>
                  <div className="skill-duration-track" aria-hidden="true"><span style={{ width: `${Math.min(100,skill.months / 18 * 100)}%` }} /></div>
                </li>)}
              </ul>
            </article>
          </Reveal>;
        })}
      </div>
      <p className="reference-experience-note">{settings.skillsNote}</p>
    </div>
  </section>;
}
