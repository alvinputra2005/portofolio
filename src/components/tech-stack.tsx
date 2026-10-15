"use client";

import Image from "next/image";
import { useState } from "react";
import { Pause, Play } from "lucide-react";
import { useLanguage } from "./language-provider";

const webStack = [
  ["Laravel", "laravel"], ["React", "react"], ["Tailwind CSS", "tailwindcss"],
  ["Bootstrap", "bootstrap"], ["Next.js", "nextjs"], ["Redis", "redis"],
  ["Node.js", "nodejs"], ["Express.js", "express"], ["REST API", null], ["Flask", "flask"],
] as const;
const dataAndTools = [
  ["Python", "python"], ["PyTorch", "pytorch"], ["scikit-learn", "scikitlearn"],
  ["NumPy", "numpy"], ["pandas", "pandas"], ["TensorFlow", "tensorflow"],
  ["Jupyter", "jupyter"], ["Matplotlib", "matplotlib"], ["VS Code", "vscode"],
  ["Google Colab", "googlecolab"], ["Google AI Studio", "aistudio"],
  ["draw.io", "drawio"], ["Figma", "figma"], ["Canva", "canva"],
] as const;
type StackItems = readonly (readonly [string, string | null])[];

function StackRow({ items, label }: { items: StackItems; label: string }) {
  return <div className="tech-stack-window" role="group" aria-label={label} tabIndex={0}>
    <div className="tech-stack-track" style={{ animationDuration: `${items.length * 5}s` }}>
      {[0, 1].map(copy => <ul key={copy} className="tech-stack-group" aria-hidden={copy === 1 ? true : undefined}>
        {items.map(([name, icon]) => <li className="tech-stack-item" key={name}>
          {icon ? <Image src={`/images/tech/${icon}.${icon === "aistudio" ? "png" : "svg"}`} width={30} height={30} alt="" loading="eager" unoptimized /> : <span className="tech-stack-api" aria-hidden="true">API</span>}
          <span>{name}</span>
        </li>)}
      </ul>)}
    </div>
  </div>;
}

export function TechStack() {
  const { locale } = useLanguage();
  const [paused, setPaused] = useState(false);
  const indonesian = locale === "id";
  return <section className={`discipline-strip tech-stack-section${paused ? " is-paused" : ""}`} aria-labelledby="tech-stack-title">
    <div className="container">
      <div className="tech-stack-heading">
        <div><p>{indonesian ? "KODE, DATA & DESAIN" : "CODE, DATA & DESIGN"}</p><h2 id="tech-stack-title">Creative tech stack<span>.</span></h2></div>
        <button type="button" className="tech-stack-toggle" aria-pressed={paused} onClick={() => setPaused(!paused)} aria-label={indonesian ? (paused ? "Jalankan animasi logo" : "Jeda animasi logo") : (paused ? "Play logo animation" : "Pause logo animation")}>
          {paused ? <Play size={14} /> : <Pause size={14} />}<span>{indonesian ? (paused ? "Jalankan" : "Jeda") : (paused ? "Play" : "Pause")}</span>
        </button>
      </div>
      <div className="tech-stack-lanes">
        <StackRow items={webStack} label={indonesian ? "Pengembangan web dan API" : "Web development and APIs"} />
        <StackRow items={dataAndTools} label={indonesian ? "Data science dan tools kreatif" : "Data science and creative tools"} />
      </div>
    </div>
  </section>;
}
