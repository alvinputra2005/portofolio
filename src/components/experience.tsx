"use client";

import Image from "next/image";
import { Building2 } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";
import { DocumentationGallery } from "./documentation-gallery";

export function Experience() {
  const { locale, copy } = useLanguage();
  const { experiences } = getLocalizedPortfolio(locale);

  return <section className="experience-section reference-experience" id="pengalaman" aria-labelledby="experience-title">
    <div className="container experience-layout">
      <Reveal><h2 className="reference-experience-title" id="experience-title"><mark>{copy.experienceTitle}</mark></h2></Reveal>
      <div className="reference-experience-grid">
        {experiences.map((experience, index) => <Reveal key={experience.id} delay={index * .08} className="reference-experience-column">
          <article className="reference-experience-card" aria-labelledby={`${experience.id}-title`}>
            <h3 className="reference-experience-type" id={`${experience.id}-title`}><span>{experience.type}</span></h3>
            <div className="reference-experience-meta">
              <div className={`reference-experience-logo${experience.logo ? " has-image" : ""}`}>
                {experience.logo ? <Image src={experience.logo} alt={experience.company} width={50} height={50} /> : <><Building2 size={24} strokeWidth={1.4} aria-hidden="true" /><span>{copy.experienceLogo}</span></>}
              </div>
              <div><p className="reference-experience-company">{experience.company}</p><p className="reference-experience-period">{experience.period} <span aria-hidden="true">·</span> {experience.role}</p></div>
            </div>
            <DocumentationGallery photos={experience.photos} label={`${copy.experienceGallery}: ${experience.type}`} photoLabel={`${copy.experiencePhoto} ${experience.type}`} placeholder={copy.experiencePhotoComing} />
            <p className="reference-experience-description">{experience.description}</p>
          </article>
        </Reveal>)}
      </div>
      {experiences.some(experience => experience.isPlaceholder) && <p className="reference-experience-note">{copy.experienceDetailsComing}</p>}
    </div>
  </section>;
}
