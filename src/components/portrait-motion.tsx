"use client";

import Image from "next/image";
import type { PointerEvent } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";

export function PortraitMotion({ src, alt, variant = "hero" }: { src: string; alt: string; variant?: "hero" | "about" }) {
  const isAbout = variant === "about";
  const reducedMotion = useReducedMotion();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const hoverOpacity = useMotionValue(0);
  const lightOpacity = useSpring(hoverOpacity, { stiffness: 180, damping: 26 });
  // A heavier, well-damped spring lets the photo catch up with the pointer.
  const tiltSpring = isAbout ? { stiffness: 150, damping: 24 } : { stiffness: 120, damping: 26, mass: 1.6 };
  const smoothX = useSpring(pointerX, tiltSpring);
  const smoothY = useSpring(pointerY, tiltSpring);
  const ringX = useTransform(smoothX, [-1, 1], [-12, 12]);
  const ringY = useTransform(smoothY, [-1, 1], [-10, 10]);
  const oppositeX = useTransform(smoothX, [-1, 1], [10, -10]);
  const oppositeY = useTransform(smoothY, [-1, 1], [12, -12]);
  // The corner under the cursor recedes, like a light press on the photo.
  const tilt = isAbout ? 3 : 6;
  const rotateX = useTransform(smoothY, [-1, 1], [tilt, -tilt]);
  const rotateY = useTransform(smoothX, [-1, 1], [-tilt, tilt]);
  const lift = useTransform(lightOpacity, [0, 1], [0, -4]);
  const shadowOpacity = useTransform(lightOpacity, [0, 1], [0, 0.22]);
  const shadowX = useTransform(smoothX, [-1, 1], [12, -12]);
  const shadowY = useTransform(smoothY, [-1, 1], [28, 12]);
  const shadow = useMotionTemplate`${shadowX}px ${shadowY}px 38px rgb(0 40 65 / ${shadowOpacity})`;
  const lightX = useTransform(smoothX, [-1, 1], [0, 100]);
  const lightY = useTransform(smoothY, [-1, 1], [0, 100]);
  const sheenPosition = useTransform(smoothX, [-1, 1], [15, 85]);
  const sheenStart = useTransform(sheenPosition, value => value - 20);
  const sheenEnd = useTransform(sheenPosition, value => value + 20);
  const heroLight = useMotionTemplate`radial-gradient(ellipse at ${lightX}% ${lightY}%, rgb(255 255 255 / 38%), rgb(255 255 255 / 12%) 35%, transparent 72%), linear-gradient(115deg, transparent ${sheenStart}%, rgb(255 255 255 / 16%) ${sheenPosition}%, transparent ${sheenEnd}%)`;
  const aboutLight = useMotionTemplate`radial-gradient(ellipse at ${lightX}% ${lightY}%, rgb(255 255 255 / 24%), rgb(210 240 255 / 9%) 35%, transparent 70%)`;

  function followPointer(event: PointerEvent<HTMLDivElement>) {
    // Use the actual input: a touch-capable laptop can still send mouse events
    // while its primary-pointer media query reports a coarse pointer.
    if (event.pointerType === "touch") {
      resetPointer();
      return;
    }
    hoverOpacity.set(1);
    if (reducedMotion) return;
    // Measure the stationary surface so the tilt cannot feed back into itself.
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(Math.max(-1, Math.min(1, ((event.clientX - bounds.left) / bounds.width) * 2 - 1)));
    pointerY.set(Math.max(-1, Math.min(1, ((event.clientY - bounds.top) / bounds.height) * 2 - 1)));
  }

  function resetPointer() {
    pointerX.set(0);
    pointerY.set(0);
    hoverOpacity.set(0);
  }

  const rings = <>
    <motion.span className="portrait-ring-parallax" aria-hidden="true" style={{ x: reducedMotion ? 0 : ringX, y: reducedMotion ? 0 : ringY }}><span className={isAbout ? "reference-about-ring about-ring-large" : "portrait-ring ring-top"} /></motion.span>
    <motion.span className="portrait-ring-parallax" aria-hidden="true" style={{ x: reducedMotion ? 0 : oppositeX, y: reducedMotion ? 0 : oppositeY }}><span className={isAbout ? "reference-about-ring about-ring-small" : "portrait-ring ring-bottom"} /></motion.span>
  </>;
  // Reduced motion keeps a static white reflection as visible hover feedback.
  const reducedLight = "radial-gradient(ellipse at 65% 25%, rgb(255 255 255 / 38%), rgb(255 255 255 / 12%) 35%, transparent 72%)";
  const lightLayer = <motion.span className="reference-portrait-light" aria-hidden="true" style={{ background: isAbout ? aboutLight : reducedMotion ? reducedLight : heroLight, opacity: reducedMotion ? isAbout ? 0 : hoverOpacity : lightOpacity }} />;

  return (
    <div className={`reference-portrait-interaction${isAbout ? "" : " reference-portrait-interaction--hero"}`} onPointerEnter={followPointer} onPointerMove={followPointer} onPointerLeave={resetPointer} onPointerCancel={resetPointer}>
      <motion.div className="reference-portrait-motion" style={{ rotateX: reducedMotion ? 0 : rotateX, rotateY: reducedMotion ? 0 : rotateY, y: reducedMotion || isAbout ? 0 : lift, transformPerspective: 1100 }}>
        {isAbout ? <div className="reference-about-card">
          {rings}
          <Image src={src} alt={alt} fill draggable={false} sizes="(max-width: 650px) 280px, (max-width: 900px) 270px, (max-width: 1200px) 300px, 330px" />
          {lightLayer}
        </div> : <motion.div className="reference-portrait-backdrop" style={{ boxShadow: reducedMotion ? "none" : shadow }}>
          {rings}
          <div className="reference-profile-photo">
            <Image src={src} alt={alt} fill priority draggable={false} sizes="(max-width: 900px) 80vw, 470px" />
          </div>
          {lightLayer}
        </motion.div>}
      </motion.div>
    </div>
  );
}
