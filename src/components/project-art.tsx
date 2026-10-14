import Image from "next/image";
import { Aperture, ArrowUpRight, Film, Image as ImageIcon, Play } from "lucide-react";
import type { Project } from "@/data/portfolio";

export function ProjectArt({ project }: { project: Project }) {
  if (project.image) {
    return <div className={`project-art art-${project.variant}`}><Image src={project.image} alt={project.title} fill sizes="(max-width: 720px) 100vw, 50vw" /></div>;
  }
  return (
    <div className={`project-art art-${project.variant}`} aria-hidden="true">
      <div className="art-topline"><span>CREATIVE EXPLORATION</span><span>{project.number} / 06</span></div>
      {project.variant === "identity" && <div className="identity-composition"><div className="identity-square"><span>a<span className="art-period">.</span></span><span className="identity-small">MAKE YOUR MARK.</span></div><div className="identity-disc"><div /></div><div className="identity-caption">A new perspective.<br />A distinct identity.</div></div>}
      {project.variant === "editorial" && <div className="editorial-composition"><div className="editorial-paper"><span className="editorial-issue">THE EVERYDAY — VOL. 01</span><span className="editorial-title">Less,<br /><i>but better.</i></span><div className="editorial-shape" /><div className="editorial-bottom"><span>A STUDY IN SIMPLICITY</span><ArrowUpRight size={15} /></div></div><div className="editorial-background">Aa</div></div>}
      {project.variant === "film" && <div className="film-composition"><div className="film-frame"><Film size={30} strokeWidth={1} /><span>Stories<br /><i>in motion.</i></span><div className="film-play"><Play size={17} fill="currentColor" /></div><div className="film-time"><span>00:00 / 00:00</span><div /></div></div><span className="film-corner">FRAME 001</span></div>}
      {project.variant === "photo" && <div className="photo-composition"><div className="photo-outline"><span className="photo-corner tl" /><span className="photo-corner tr" /><span className="photo-corner bl" /><span className="photo-corner br" /><Aperture size={66} strokeWidth={0.7} /><span>A different point of view.</span></div><span className="photo-exif">ISO — &nbsp; ƒ/— &nbsp; 1/—</span></div>}
      {project.variant === "digital" && <div className="digital-composition"><div className="browser-art"><div className="browser-bar"><i /><i /><i /><span>your-next-idea.design</span></div><div className="browser-content"><span className="browser-brand">studio.</span><span className="browser-title">Small details.<br /><em>Big difference.</em></span><div className="browser-button">EXPLORE <ArrowUpRight size={10} /></div><div className="browser-orb" /></div></div></div>}
      {project.variant === "social" && <div className="social-composition"><div className="social-tile tile-one"><span>GOOD<br />IDEAS<br /><i>travel.</i></span><ArrowUpRight size={24} /></div><div className="social-tile tile-two"><div className="social-flower">✳</div><span>LET&apos;S MAKE<br />SOMETHING GOOD.</span></div><div className="social-tile tile-three"><ImageIcon size={25} strokeWidth={1} /><span>YOUR STORY,<br />YOUR WAY.</span></div></div>}
      <span className="art-placeholder">CONCEPT PLACEHOLDER</span>
    </div>
  );
}
