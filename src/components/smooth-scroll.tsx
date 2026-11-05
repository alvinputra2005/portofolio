"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScroll() {
  useEffect(() => {
    const lenis = new Lenis({
      autoRaf: true,
      anchors: true,
      lerp: .075,
      smoothWheel: true,
      syncTouch: false,
      respectReducedMotion: true,
    });

    // Native dialogs lock body scrolling; pause any remaining scroll inertia too.
    const syncDialogs = () => {
      if (document.querySelector("dialog[open]")) lenis.stop();
      else lenis.start();
    };
    const observer = new MutationObserver(syncDialogs);
    observer.observe(document.body, { subtree: true, attributes: true, attributeFilter: ["open"] });
    syncDialogs();

    return () => {
      observer.disconnect();
      lenis.destroy();
    };
  }, []);

  return null;
}
