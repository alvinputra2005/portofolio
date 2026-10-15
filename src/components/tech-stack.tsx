"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useLanguage } from "./language-provider";

const webStack = [
  ["Laravel", "laravel"], ["React", "react"], ["Bootstrap", "bootstrap"],
  ["Next.js", "nextjs"], ["Node.js", "nodejs"], ["Flask", "flask"],
] as const;
const dataAndTools = [
  ["Python", "python"], ["PyTorch", "pytorch"], ["scikit-learn", "scikitlearn"],
  ["TensorFlow", "tensorflow"],
  ["Jupyter", "jupyter"], ["Matplotlib", "matplotlib"], ["VS Code", "vscode"],
  ["Google Colab", "googlecolab"], ["Figma", "figma"], ["Canva", "canva"],
] as const;
type StackItems = readonly (readonly [string, string])[];

function StackRow({ items, label }: { items: StackItems; label: string }) {
  const viewport = useRef<HTMLDivElement>(null);
  const cycle = useRef<HTMLUListElement>(null);
  const [repetitions, setRepetitions] = useState(2);

  useEffect(() => {
    const update = () => {
      if (!viewport.current || !cycle.current) return;
      const cycleWidth = cycle.current.getBoundingClientRect().width;
      if (cycleWidth) setRepetitions(Math.max(1, Math.ceil(viewport.current.clientWidth / cycleWidth)));
    };
    const observer = new ResizeObserver(update);
    if (viewport.current) observer.observe(viewport.current);
    if (cycle.current) observer.observe(cycle.current);
    return () => observer.disconnect();
  }, []);

  return <div ref={viewport} className="tech-stack-window" role="group" aria-label={label} tabIndex={0}>
    <div className="tech-stack-track" style={{ animationDuration: `${items.length * 4 * repetitions}s` }}>
      {[0, 1].map(copy => <div key={copy} className="tech-stack-sequence" aria-hidden={copy === 1 ? true : undefined}>
        {Array.from({ length: repetitions }, (_, repeat) => <ul key={repeat} ref={copy === 0 && repeat === 0 ? cycle : undefined} className="tech-stack-group" aria-hidden={copy === 1 || repeat > 0 ? true : undefined}>
          {items.map(([name, icon]) => <li className="tech-stack-item" key={name}>
            <Image src={`/images/tech/${icon}.svg`} width={30} height={30} alt="" loading="eager" unoptimized />
            <span>{name}</span>
          </li>)}
        </ul>)}
      </div>)}
    </div>
  </div>;
}

export function TechStack() {
  const { locale } = useLanguage();
  const indonesian = locale === "id";
  return <section className="discipline-strip tech-stack-section" aria-labelledby="tech-stack-title">
    <div className="container">
      <div className="tech-stack-heading">
        <h2 id="tech-stack-title">Creative tech stack<span>.</span></h2>
      </div>
      <div className="tech-stack-lanes">
        <StackRow items={webStack} label={indonesian ? "Pengembangan web" : "Web development"} />
        <StackRow items={dataAndTools} label={indonesian ? "Data science dan tools kreatif" : "Data science and creative tools"} />
      </div>
    </div>
  </section>;
}
