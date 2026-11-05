"use client";

import Image from "next/image";
import { useEffect, useId, useRef, useState, useSyncExternalStore, type KeyboardEvent, type PointerEvent } from "react";
import { animate, motion, useInView, useMotionValue, useSpring, useTransform } from "motion/react";
import { Move } from "lucide-react";
import { useLanguage } from "./language-provider";
import styles from "./about-id-card.module.css";

const followSpring = { stiffness: 850, damping: 42, mass: .5, restDelta: .01, restSpeed: .1 };
const returnSpring = { type: "spring", stiffness: 180, damping: 23, mass: .8, velocity: 0, restDelta: .01, restSpeed: .1 } as const;
const dragTop = 28;
const dragBottom = 64;

// Ease into the edge continuously instead of hitting a hard drag boundary.
function constrain(value: number, negativeLimit: number, positiveLimit = negativeLimit) {
  const limit = value < 0 ? negativeLimit : positiveLimit;
  return limit * Math.tanh(value / limit);
}

function unconstrain(value: number, negativeLimit: number, positiveLimit = negativeLimit) {
  const limit = value < 0 ? negativeLimit : positiveLimit;
  return limit * Math.atanh(Math.max(-.999, Math.min(.999, value / limit)));
}

function subscribeToMotionPreference(callback: () => void) {
  const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
  preference.addEventListener("change", callback);
  return () => preference.removeEventListener("change", callback);
}

function getMotionPreference() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function AboutIdCard({ src, alt }: { src: string; alt: string }) {
  const { copy } = useLanguage();
  const reducedMotion = useSyncExternalStore(subscribeToMotionPreference, getMotionPreference, () => true);
  const stage = useRef<HTMLElement>(null);
  const hasDragged = useRef(false);
  const gesture = useRef<{ id: number; startX: number; startY: number; offsetX: number; offsetY: number } | null>(null);
  const animations = useRef<ReturnType<typeof animate>[]>([]);
  const [dragLimit, setDragLimit] = useState(40);
  const [dragging, setDragging] = useState(false);
  const id = useId();
  const inView = useInView(stage, { once: true, amount: .3 });
  const targetX = useMotionValue(0);
  const targetY = useMotionValue(0);
  // One smoothed position drives both the card and its lanyard each frame.
  const x = useSpring(targetX, followSpring);
  const y = useSpring(targetY, followSpring);
  const stageWidth = useMotionValue(420);
  const angle = useTransform(x, [-100, 0, 100], [10, -4, -15]);
  const rotate = useSpring(angle, { stiffness: 170, damping: 24, mass: .65 });
  const rope = useTransform(() => {
    const center = stageWidth.get() / 2;
    const endX = center + x.get();
    const endY = 84 + y.get();
    return `M ${center - 30} -15 C ${center - 38} 24, ${endX - 10} ${endY - 34}, ${endX - 5} ${endY} M ${center + 30} -15 C ${center + 42} 28, ${endX + 18} ${endY - 28}, ${endX + 5} ${endY}`;
  });

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      const width = entry.contentRect.width;
      if (Math.abs(width - stageWidth.get()) < .5) return;
      stageWidth.set(width);
      // Keep the card inside its column, including its rotated corners.
      setDragLimit(Math.max(10, Math.min(85, (width - Math.min(width * .74, 286)) / 2 - 20)));
      animations.current.forEach(animation => animation.stop());
      targetX.set(0);
      targetY.set(0);
      x.jump(0);
      y.jump(0);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [stageWidth, targetX, targetY, x, y]);

  useEffect(() => () => animations.current.forEach(animation => animation.stop()), []);

  useEffect(() => {
    if (!reducedMotion) return;
    animations.current.forEach(animation => animation.stop());
    targetX.set(0);
    targetY.set(0);
    x.jump(0);
    y.jump(0);
  }, [reducedMotion, targetX, targetY, x, y]);

  function stopAnimations() {
    animations.current.forEach(animation => animation.stop());
    animations.current = [];
  }

  function play(direction: "x" | "y" = "x", distance = 25) {
    if (reducedMotion) return;
    stopAnimations();
    const value = direction === "x" ? targetX : targetY;
    animations.current = [animate(value, [value.get(), distance, 0], { duration: .7, ease: "easeInOut" })];
  }

  function returnToRest(immediate = reducedMotion) {
    stopAnimations();
    if (immediate) {
      targetX.set(0);
      targetY.set(0);
      x.jump(0);
      y.jump(0);
    } else {
      animations.current = [animate(targetX, 0, returnSpring), animate(targetY, 0, returnSpring)];
    }
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return;
    stopAnimations();
    const currentX = x.get();
    const currentY = y.get();
    targetX.set(currentX);
    targetY.set(currentY);
    x.jump(currentX);
    y.jump(currentY);
    hasDragged.current = false;
    gesture.current = {
      id: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      offsetX: unconstrain(currentX, dragLimit),
      offsetY: unconstrain(currentY, dragTop, dragBottom),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    const current = gesture.current;
    if (!current || event.pointerId !== current.id) return;
    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    if (Math.hypot(deltaX, deltaY) > 3) hasDragged.current = true;
    // Pointer coordinates stay independent of the card's rotation and scale.
    // Motion batches these values; no layout measurements or React renders here.
    const nextX = constrain(current.offsetX + deltaX, dragLimit);
    const nextY = constrain(current.offsetY + deltaY, dragTop, dragBottom);
    targetX.set(nextX);
    targetY.set(nextY);
    if (reducedMotion) {
      x.jump(nextX);
      y.jump(nextY);
    }
  }

  function endDrag(event: PointerEvent<HTMLButtonElement>) {
    if (gesture.current?.id !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    setDragging(false);
    returnToRest();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    const movement = { ArrowLeft: ["x", -30], ArrowRight: ["x", 30], ArrowUp: ["y", -22], ArrowDown: ["y", 38] } as const;
    if (event.key in movement) {
      event.preventDefault();
      const [axis, distance] = movement[event.key as keyof typeof movement];
      if (reducedMotion) {
        const value = axis === "x" ? targetX : targetY;
        const position = axis === "x" ? x : y;
        const limit = axis === "x" ? dragLimit : 28;
        const next = Math.max(-limit, Math.min(limit, position.get() + distance));
        value.set(next);
        position.jump(next);
      } else {
        play(axis, axis === "x" ? Math.sign(distance) * Math.min(Math.abs(distance), dragLimit) : distance);
      }
    }
    if (event.key === "Escape" || event.key === "Home") {
      event.preventDefault();
      returnToRest(true);
    }
  }

  return (
    <figure ref={stage} className={styles.stage} data-revealed={inView} aria-label={copy.idCardFigure}>
      <div className={styles.halo} aria-hidden="true" />
      <motion.div
        className={styles.scene}
        initial={{ opacity: 0, y: -95 }}
        animate={{ opacity: inView ? 1 : 0, y: inView ? 0 : -95 }}
        transition={reducedMotion ? { duration: 0 } : { type: "spring", stiffness: 85, damping: 15, delay: .08 }}
      >
        <svg className={styles.lanyard} width="100%" height="100%" aria-hidden="true">
          <defs>
            <motion.path id={`${id}-rope`} d={rope} />
            <linearGradient id={`${id}-strap`} x1="0" x2="1">
              <stop offset="0" stopColor="#00456f" />
              <stop offset=".4" stopColor="#169de4" />
              <stop offset=".65" stopColor="#38b4ff" />
              <stop offset="1" stopColor="#006199" />
            </linearGradient>
          </defs>
          <use href={`#${id}-rope`} fill="none" stroke="#003f68" strokeWidth="23" />
          <use href={`#${id}-rope`} fill="none" stroke={`url(#${id}-strap)`} strokeWidth="20" />
          <use href={`#${id}-rope`} fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1" strokeDasharray="2 4" />
        </svg>
        <span className={styles.anchor} aria-hidden="true"><span /></span>
        <motion.button
          type="button"
          className={styles.card}
          aria-label={copy.idCardLabel}
          aria-describedby={`${id}-hint ${id}-keyboard`}
          data-dragging={dragging}
          style={{ x, y, rotate: reducedMotion ? 0 : rotate, transformOrigin: "50% -32px" }}
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onLostPointerCapture={endDrag}
          onClick={event => { if (event.detail === 0 || !hasDragged.current) play("x", Math.min(25, dragLimit)); }}
          onKeyDown={handleKeyDown}
        >
          <span className={styles.clip} aria-hidden="true"><span /></span>
          <span className={styles.face}>
            <Image className={styles.artwork} src="/images/alvin-id-artwork.webp" alt="" fill sizes="286px" draggable={false} />
            <span className={styles.topline}><span className={styles.wordmark}>alvin<span>.</span></span><span>{copy.idCardTag}</span></span>
            <span className={styles.portrait}><Image src={src} alt={alt} fill sizes="(max-width: 650px) 75vw, 320px" draggable={false} /></span>
            <span className={styles.details}>
              <span className={styles.name}>Putu Alvin<span>Mahendra Putra</span></span>
              <span className={styles.role}>Software Engineer<span>&amp; Full Stack Developer</span></span>
              <span className={styles.university}><Image src="/images/logo-um.webp" width={24} height={24} alt="" draggable={false} /><span>Universitas Negeri Malang</span></span>
            </span>
            <span className={styles.sheen} aria-hidden="true" />
          </span>
        </motion.button>
      </motion.div>
      <figcaption className={styles.hint} id={`${id}-hint`}><Move size={15} strokeWidth={1.6} aria-hidden="true" />{copy.idCardHint}</figcaption>
      <span className="sr-only" id={`${id}-keyboard`}>{copy.idCardKeyboard}</span>
    </figure>
  );
}
