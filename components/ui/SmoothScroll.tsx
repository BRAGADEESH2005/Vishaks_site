"use client";

import Lenis from "lenis";
import { useEffect } from "react";
import { ensureGsap, gsap, ScrollTrigger } from "@/lib/gsap";

/**
 * Inertial smooth scrolling for wheel and trackpad, kept in step with
 * ScrollTrigger so pinned sections and scrubbed scenes stay in sync.
 * Touch keeps native scrolling, and reduced motion turns it off entirely.
 */
export function SmoothScroll() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    ensureGsap();
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, anchors: { offset: -72 } });
    lenis.on("scroll", ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    document.documentElement.classList.add("lenis-on");
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      document.documentElement.classList.remove("lenis-on");
    };
  }, []);
  return null;
}
