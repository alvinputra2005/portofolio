import Image from "next/image";
import { ImagePlus } from "lucide-react";

export function DocumentationGallery({ photos, label, photoLabel, placeholder }: {
  photos: (string | null)[];
  label: string;
  photoLabel: string;
  placeholder: string;
}) {
  return <div className="reference-experience-gallery" role="group" aria-label={label}>
    {Array.from({ length: 4 }, (_, index) => {
      const photo = photos[index];
      return <div className={`reference-experience-photo${photo ? " has-image" : ""}`} key={index}>
        {photo ? <Image src={photo} alt={`${photoLabel} ${index + 1}`} fill sizes="(max-width: 650px) 42vw, (max-width: 1000px) 23vw, 200px" /> : <>
          <span className="experience-photo-index" aria-hidden="true">0{index + 1}</span>
          <ImagePlus size={30} strokeWidth={1.2} aria-hidden="true" />
          <span className="experience-photo-label">{placeholder}</span>
        </>}
      </div>;
    })}
  </div>;
}
