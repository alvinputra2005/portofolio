"use client";

import Image from "next/image";
import { Award } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { DocumentationGallery } from "./documentation-gallery";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";

export function Achievements() {
  const { locale, copy } = useLanguage();
  const { achievements } = getLocalizedPortfolio(locale);

  return <section className="reference-experience reference-achievements" id="pencapaian" aria-labelledby="achievements-title">
    <div className="container achievements-layout">
      <Reveal>
        <h2 className="reference-experience-title" id="achievements-title"><mark>{copy.achievementsTitle}</mark></h2>
      </Reveal>
      <div className="reference-experience-grid">
        {achievements.map((achievement, index) => <Reveal key={achievement.id} delay={index * .08} className="reference-experience-column">
          <article className="achievement-card" aria-labelledby={`${achievement.id}-category`}>
            <h3 className="reference-experience-type achievements-category" id={`${achievement.id}-category`}><span>{achievement.category}</span></h3>
            <div className="reference-experience-meta">
              <div className={`reference-experience-logo${achievement.logo ? " has-image" : ""}`}>
                {achievement.logo ? <Image src={achievement.logo} alt={achievement.title} width={50} height={50} /> : <><Award size={24} strokeWidth={1.4} aria-hidden="true" /><span>{copy.experienceLogo}</span></>}
              </div>
              <div><h4 className="reference-experience-company" id={`${achievement.id}-title`}>{achievement.title}</h4><p className="reference-experience-period">{achievement.year} <span aria-hidden="true">·</span> {achievement.role}</p></div>
            </div>
            <DocumentationGallery photos={achievement.photos} label={`${copy.achievementsGallery}: ${achievement.title}`} photoLabel={`${copy.experiencePhoto} ${achievement.title}`} placeholder={copy.experiencePhotoComing} />
            <p className="reference-experience-description">{achievement.description}</p>
          </article>
        </Reveal>)}
      </div>
      {achievements.some(achievement => achievement.isPlaceholder) && <p className="reference-experience-note">{copy.achievementsComing}</p>}
    </div>
  </section>;
}
