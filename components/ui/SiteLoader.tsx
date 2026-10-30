"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/ui/Logo";
import { canRunHero3D } from "@/lib/capability";
import { complete, expect, isLoaded, markLoaded, report, snapshot, subscribe } from "@/lib/loading";

/** If a resource never answers (a dropped connection, a stalled GPU), reveal the site anyway after this long. */
const SAFETY_MS = 20000;

/**
 * The first-visit loading screen. It is part of the server-rendered HTML, so
 * the visitor never sees a blank or half-built page, and it stays until every
 * resource the first screen needs has actually loaded: typefaces, the images
 * in view, the page itself and, on the home page, the 3D engine, the sky
 * lighting and the first rendered frames of the hero district.
 */
export function SiteLoader() {
  const pathname = usePathname();
  const [phase, setPhase] = useState<"loading" | "leaving" | "gone">(() => (isLoaded() ? "gone" : "loading"));
  const count = useRef<HTMLSpanElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const status = useRef<HTMLSpanElement>(null);
  const root = useRef<HTMLDivElement>(null);

  // Declare what the first screen needs, and wire each task to real browser events.
  useEffect(() => {
    if (isLoaded()) return;
    const cleanups: Array<() => void> = [];

    expect("fonts", 1, "Typefaces");
    if (document.fonts) void document.fonts.ready.then(() => complete("fonts"));
    else complete("fonts");

    expect("page", 1, "Page");
    if (document.readyState === "complete") complete("page");
    else {
      const onLoad = () => complete("page");
      window.addEventListener("load", onLoad, { once: true });
      cleanups.push(() => window.removeEventListener("load", onLoad));
    }

    // Images visible in the first screen.
    expect("images", 2, "Imagery");
    const inView = Array.from(document.images).filter((img) => {
      const r = img.getBoundingClientRect();
      return r.bottom > 0 && r.top < window.innerHeight && r.width > 0;
    });
    const settle = () => {
      const ready = inView.filter((img) => img.complete).length;
      report("images", inView.length ? ready / inView.length : 1);
    };
    inView.forEach((img) => {
      if (img.complete) return;
      img.addEventListener("load", settle, { once: true });
      img.addEventListener("error", settle, { once: true });
      cleanups.push(() => {
        img.removeEventListener("load", settle);
        img.removeEventListener("error", settle);
      });
    });
    settle();

    // The live hero, when this device will run it. The hero reports these as they happen.
    if (pathname === "/" && canRunHero3D()) {
      expect("hero-code", 2, "3D engine");
      expect("hero-env", 2, "City lighting");
      expect("hero-scene", 3, "Building the district");
    }

    const safety = window.setTimeout(() => {
      ["fonts", "page", "images", "hero-code", "hero-env", "hero-scene"].forEach(complete);
    }, SAFETY_MS);
    cleanups.push(() => window.clearTimeout(safety));
    return () => cleanups.forEach((c) => c());
    // The loader only runs once, on the first page the visitor lands on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the page still underneath while loading.
  useEffect(() => {
    if (phase === "gone") return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    return () => {
      html.style.overflow = prev;
    };
  }, [phase]);

  // Draw the counter. The number eases toward the real figure but never runs ahead of it.
  useEffect(() => {
    if (phase !== "loading") return;
    let shown = 0;
    let raf = 0;
    let target = snapshot().progress;
    let held = 0;
    let last = performance.now();
    const unsub = subscribe(() => {
      target = snapshot().progress;
    });
    const tick = (now: number) => {
      const snap = snapshot();
      target = snap.progress;
      // Time-based easing, so a busy main thread (the 3D scene compiling) never makes the counter lag behind.
      const dt = Math.min(0.25, (now - last) / 1000);
      last = now;
      shown += (target - shown) * (1 - Math.exp(-dt * 7));
      if (target - shown < 0.002) shown = target;
      const pct = Math.floor(shown * 100);
      if (count.current) count.current.textContent = String(pct).padStart(2, "0");
      if (bar.current) bar.current.style.transform = `scaleX(${shown})`;
      if (status.current) status.current.textContent = target >= 1 ? "Ready" : snap.current || "Preparing";
      if (target >= 1 && shown >= 1 && snap.count > 0) {
        if (!held) held = now;
        if (now - held > 280) {
          setPhase("leaving");
          return;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, [phase]);

  // Reveal the site as the panel lifts, then remove the loader.
  useEffect(() => {
    if (phase !== "leaving") return;
    markLoaded();
    const t = window.setTimeout(() => setPhase("gone"), 1200);
    return () => window.clearTimeout(t);
  }, [phase]);

  if (phase === "gone") return null;
  const leaving = phase === "leaving";

  return (
    <div
      ref={root}
      id="site-loader"
      data-lenis-prevent
      role="status"
      aria-live="polite"
      aria-label="Loading the site"
      className={`on-dark fixed inset-0 z-[200] flex flex-col bg-ink text-ivory transition-[transform,opacity] duration-[1100ms] ease-[cubic-bezier(0.76,0,0.24,1)] motion-reduce:transition-opacity ${
        leaving ? "pointer-events-none -translate-y-full motion-reduce:translate-y-0 motion-reduce:opacity-0" : ""
      }`}
    >
      <div aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[38rem] w-[38rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-bronze/15 blur-[140px]" />
      <div className={`relative flex flex-1 flex-col items-center justify-center gap-6 transition-all duration-700 ${leaving ? "-translate-y-6 opacity-0" : ""}`}>
        <LogoMark className="loader-mark h-14 w-14 text-bronze-light" />
        <span className="font-display text-[1.6rem] leading-none tracking-[0.4em] sm:text-[1.9rem]">VISHAKS</span>
        <span className="label text-ivory/45">Where Chennai grows next</span>
      </div>
      <div className={`gutter relative pb-8 transition-opacity duration-500 sm:pb-10 ${leaving ? "opacity-0" : ""}`}>
        <div className="flex items-end justify-between gap-6">
          <span className="font-display text-[clamp(3.5rem,11vw,7.5rem)] leading-[0.85] tabular-nums">
            <span ref={count}>00</span>
            <span className="text-[0.4em] text-bronze-light">%</span>
          </span>
          <span ref={status} className="label mb-2 text-right text-ivory/55">
            Preparing
          </span>
        </div>
        <span className="mt-6 block h-px w-full bg-ivory/15" aria-hidden="true">
          <span ref={bar} className="block h-px w-full origin-left scale-x-0 bg-gradient-to-r from-bronze to-bronze-light" />
        </span>
      </div>
    </div>
  );
}
