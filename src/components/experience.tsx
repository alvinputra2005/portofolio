"use client";

import Image from "next/image";
import { Building2, ImagePlus } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";

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
            <div className="reference-experience-gallery" role="group" aria-label={`${copy.experienceGallery}: ${experience.type}`}>
              {Array.from({ length: 4 }, (_, photoIndex) => {
                const photo = experience.photos[photoIndex];
                return <div className={`reference-experience-photo${photo ? " has-image" : ""}`} key={photoIndex}>
                  {photo ? <Image src={photo} alt={`${copy.experiencePhoto} ${experience.type} ${photoIndex + 1}`} fill sizes="(max-width: 650px) 42vw, (max-width: 1000px) 23vw, 200px" /> : <>
                    <span className="experience-photo-index" aria-hidden="true">0{photoIndex + 1}</span>
                    <ImagePlus size={30} strokeWidth={1.2} aria-hidden="true" />
                    <span className="experience-photo-label">{copy.experiencePhotoComing}</span>
                  </>}
                </div>;
              })}
            </div>
            <p className="reference-experience-description">{experience.description}</p>
          </article>
        </Reveal>)}
      </div>
      {experiences.some(experience => experience.isPlaceholder) && <p className="reference-experience-note">{copy.experienceDetailsComing}</p>}
    </div>
  </section>;
}
