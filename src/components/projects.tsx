"use client";

import Image from "next/image";
import { Monitor } from "lucide-react";
import { useContent } from "./content-provider";
import { DocumentationGallery } from "./documentation-gallery";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";

export function Projects() {
  const { copy } = useLanguage();
  const { softwareProjects } = useContent();

  return <section className="reference-experience reference-projects" id="proyek" aria-labelledby="projects-title">
    <div className="container projects-layout">
      <Reveal><h2 className="reference-experience-title" id="projects-title"><mark>{copy.projectsTitle}</mark></h2></Reveal>
      <div className="reference-experience-grid">
        {softwareProjects.map((project, index) => <Reveal key={project.id} delay={index * .08} className="reference-experience-column">
          <article className="project-showcase-card" aria-labelledby={`${project.id}-title`}>
            <div className="reference-experience-meta">
              <div className={`reference-experience-logo${project.logo ? " has-image" : ""}`}>
                {project.logo ? <Image src={project.logo} alt={project.title} width={50} height={50} /> : <><Monitor size={24} strokeWidth={1.4} aria-hidden="true" /><span>{copy.experienceLogo}</span></>}
              </div>
              <div><h3 className="reference-experience-company" id={`${project.id}-title`}>{project.title}</h3><p className="reference-experience-period">{project.year} <span aria-hidden="true">·</span> {project.role}</p></div>
            </div>
            <DocumentationGallery photos={project.photos} label={`${copy.projectsGallery}: ${project.category}`} photoLabel={`${copy.experiencePhoto} ${project.title}`} placeholder={copy.experiencePhotoComing} />
            <p className="reference-experience-description">{project.description}</p>
            {(project.url || project.repository) && <div className="project-links">{project.url && <a href={project.url} target="_blank" rel="noreferrer">{copy.viewProject}</a>}{project.repository && <a href={project.repository} target="_blank" rel="noreferrer">Repository</a>}</div>}
          </article>
        </Reveal>)}
      </div>
      {softwareProjects.some(project => project.isPlaceholder) && <p className="reference-experience-note">{copy.projectsComing}</p>}
    </div>
  </section>;
}
