"use client";

import Image from "next/image";
import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import { BadgeCheck, ChevronLeft, ChevronRight, ImagePlus, Maximize2, Trophy } from "lucide-react";
import { getLocalizedPortfolio } from "@/data/translations";
import { Dialog } from "./dialog";
import { useLanguage } from "./language-provider";
import { Reveal } from "./reveal";

export function Credentials() {
  const { locale, copy } = useLanguage();
  const { credentials } = getLocalizedPortfolio(locale);
  const [filter, setFilter] = useState<"all" | "certificate" | "award">("all");
  const [cursor, setCursor] = useState(0);
  const [detailOpen, setDetailOpen] = useState(false);
  const gesture = useRef<{ x: number; y: number } | null>(null);
  const suppressClick = useRef(false);
  const slides = credentials.filter(item => filter === "all" || item.kind === filter).flatMap(credential =>
    (credential.photos.length ? credential.photos : [null]).map((photo, index) => ({ ...credential, photo, photoIndex: index })),
  );
  const count = slides.length;
  const wrap = (index: number) => (index % count + count) % count;
  const activeIndex = count ? wrap(cursor) : 0;
  const active = slides[activeIndex];
  const category = (kind: "certificate" | "award") => kind === "certificate" ? copy.certificate : copy.award;

  function move(direction: number) { if (count > 1) setCursor(value => value + direction); }
  function select(index: number) {
    const forward = (index - activeIndex + count) % count;
    move(forward > count / 2 ? forward - count : forward);
  }
  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    event.currentTarget.focus({ preventScroll: true });
    if (event.key === "ArrowLeft") move(-1);
    else if (event.key === "ArrowRight") move(1);
    else select(event.key === "Home" ? 0 : count - 1);
  }
  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    gesture.current = { x: event.clientX, y: event.clientY };
    suppressClick.current = false;
  }
  function onPointerUp(event: PointerEvent<HTMLDivElement>) {
    const start = gesture.current;
    gesture.current = null;
    if (!start) return;
    const distance = event.clientX - start.x;
    if (Math.abs(distance) > 40 && Math.abs(distance) > Math.abs(event.clientY - start.y)) {
      suppressClick.current = true;
      move(distance < 0 ? 1 : -1);
    }
  }

  return <section className="reference-experience credentials-section" id="sertifikat" aria-labelledby="credentials-title">
    <div className="container credentials-layout">
      <Reveal><h2 className="reference-experience-title" id="credentials-title"><mark>{copy.credentialsTitle}</mark></h2></Reveal>
      <div className="credential-filters" role="group" aria-label={copy.credentialFilter}>
        {([ ["all", copy.all], ["certificate", copy.certificate], ["award", copy.award] ] as const).map(([value, label]) =>
          <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setCursor(0); }}>{label}</button>)}
      </div>
      {active && <>
        <div className="credential-carousel" role="group" aria-roledescription={copy.credentialCarousel} aria-label={copy.credentialsGallery} tabIndex={0} onKeyDown={onKeyDown}>
          <div className="credential-stage" onPointerDown={onPointerDown} onPointerUp={onPointerUp} onPointerCancel={() => { gesture.current = null; }}>
            {Array.from({ length: Math.min(count, 5) }, (_, slot) => {
              const position = slot - Math.floor(Math.min(count, 5) / 2);
              const virtualIndex = cursor + position;
              const slideIndex = wrap(virtualIndex);
              const slide = slides[slideIndex];
              const Icon = slide.kind === "certificate" ? BadgeCheck : Trophy;
              const selected = position === 0;
              return <button key={`${filter}-${virtualIndex}`} type="button" className="credential-slide" data-position={position} data-slide-index={slideIndex} aria-pressed={selected} tabIndex={selected ? 0 : -1} aria-label={`${selected ? copy.credentialView : copy.credentialSelect}: ${slide.title} (${slide.photoIndex + 1})`} style={{ "--slide-offset": position, "--slide-scale": selected ? 1 : Math.abs(position) === 1 ? .85 : .7, zIndex: 3 - Math.abs(position) } as CSSProperties} onClick={() => {
                if (suppressClick.current) { suppressClick.current = false; return; }
                if (selected) setDetailOpen(true); else move(position);
              }}>
                {slide.photo ? <Image src={slide.photo} alt={`${slide.title} ${slide.photoIndex + 1}`} fill sizes="(max-width: 650px) 85vw, 520px" draggable={false} /> : <span className="credential-document-placeholder">
                  <span className="credential-document-heading"><Icon size={21} strokeWidth={1.5} aria-hidden="true" /><span>{category(slide.kind)}</span><span>{String(slide.photoIndex + 1).padStart(2, "0")}</span></span>
                  <span className="credential-document-body"><ImagePlus size={36} strokeWidth={1.2} aria-hidden="true" /><strong>{slide.title}</strong><span>{copy.credentialDocumentComing}</span></span>
                  <span className="credential-document-issuer">{slide.issuer}</span>
                </span>}
                <span className="credential-expand"><Maximize2 size={16} aria-hidden="true" /></span>
              </button>;
            })}
          </div>
          <div className="credential-controls">
            <button className="credential-control" type="button" aria-label={copy.credentialPrevious} disabled={count < 2} onClick={() => move(-1)}><ChevronLeft size={21} aria-hidden="true" /></button>
            <div className="credential-dots" role="group" aria-label={copy.credentialChoose}>
              {slides.map((slide, index) => <button key={`${slide.id}-${slide.photoIndex}`} type="button" aria-label={`${copy.credentialGoTo} ${index + 1}`} aria-current={index === activeIndex ? "true" : undefined} onClick={() => select(index)} />)}
            </div>
            <button className="credential-control" type="button" aria-label={copy.credentialNext} disabled={count < 2} onClick={() => move(1)}><ChevronRight size={21} aria-hidden="true" /></button>
          </div>
          <p className="credential-counter" role="status">{String(activeIndex + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}<span className="sr-only"> — {active.title}</span></p>
        </div>
        <Dialog open={detailOpen} onClose={() => setDetailOpen(false)} title={active.title} className="credential-dialog">
          <div className="credential-detail-image">{active.photo ? <Image src={active.photo} alt={active.title} fill sizes="90vw" /> : <div className="credential-detail-placeholder"><ImagePlus size={48} strokeWidth={1.2} aria-hidden="true" /><span>{copy.credentialDocumentComing}</span></div>}</div>
          <div className="credential-detail-copy"><span className="credential-kind">{category(active.kind)}</span><h2>{active.title}</h2><p>{active.issuer} · {active.year}</p><p>{active.description}</p></div>
        </Dialog>
      </>}
    </div>
  </section>;
}
