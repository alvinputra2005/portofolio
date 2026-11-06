"use client";

import Image from "next/image";
import { useState, type PointerEvent } from "react";
import { ImagePlus } from "lucide-react";

export function DocumentationGallery({ photos, label, photoLabel, placeholder, layout = "grid", caption, cropY = 50 }: {
  photos: (string | null)[];
  label: string;
  photoLabel: string;
  placeholder: string;
  layout?: "grid" | "stacked" | "single";
  caption?: string;
  cropY?: number;
}) {
  const [hoveredPhoto, setHoveredPhoto] = useState<number | null>(null);

  function followPointer(event: PointerEvent<HTMLDivElement>, index: number) {
    // Hybrid laptops can report hover:none even when using a mouse.
    setHoveredPhoto(event.pointerType === "touch" ? null : index);
  }

  return <div className={`reference-experience-gallery${layout !== "grid" ? ` reference-experience-gallery--${layout}` : ""}`} role="group" aria-label={label}>
    {Array.from({ length: layout === "single" ? 1 : layout === "stacked" ? 2 : 4 }, (_, index) => {
      const photo = photos[index];
      return <div className={`reference-experience-photo${photo ? " has-image" : ""}${photo && caption ? " has-caption" : ""}`} key={index}
        data-hovered={photo && caption && hoveredPhoto === index ? "true" : undefined}
        onPointerEnter={photo && caption ? event => followPointer(event, index) : undefined}
        onPointerMove={photo && caption ? event => followPointer(event, index) : undefined}
        onPointerLeave={() => setHoveredPhoto(null)}
        onPointerCancel={() => setHoveredPhoto(null)}>
        {photo ? <Image src={photo} alt={`${photoLabel} ${index + 1}`} fill style={{objectPosition:`center ${cropY}%`}} sizes={layout !== "grid" ? "(max-width: 650px) 90vw, (max-width: 900px) 45vw, 30vw" : "(max-width: 650px) 42vw, (max-width: 1000px) 23vw, 200px"} /> : <>
          <span className="experience-photo-index" aria-hidden="true">0{index + 1}</span>
          <ImagePlus size={30} strokeWidth={1.2} aria-hidden="true" />
          <span className="experience-photo-label">{placeholder}</span>
        </>}
        {photo && caption && <span className="experience-photo-caption">{caption}</span>}
      </div>;
    })}
  </div>;
}
