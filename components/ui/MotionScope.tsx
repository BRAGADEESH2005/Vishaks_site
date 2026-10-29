"use client";

import { useRef } from "react";
import { ensureGsap, gsap, ScrollTrigger, SplitText, useGSAP } from "@/lib/gsap";

/**
 * One place for scroll-linked motion. Sections opt in with data attributes,
 * so they stay server components and their content is fully visible if
 * JavaScript or animation fails:
 *
 *   data-reveal="fade"     rise and fade in once
 *   data-reveal="stagger"  fade the element's children in sequence
 *   data-reveal="clip"     an image plate opens from a narrow band
 *   data-reveal="lines"    a heading rises line by line from a mask
 *   data-parallax          a child image drifts slightly against the scroll
 *
 * Everything is skipped when the visitor prefers reduced motion.
 * useGSAP reverts all tweens and ScrollTriggers on unmount, which also keeps
 * React Strict Mode from creating duplicates in development.
 */
export function MotionScope({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      ensureGsap();
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = gsap.utils.selector(scope);
        const once = (el: Element, start = "top 88%") => ({ trigger: el, start, once: true });

        q('[data-reveal="fade"]').forEach((el) => {
          gsap.from(el, { autoAlpha: 0, y: 28, duration: 1.2, scrollTrigger: once(el) });
        });

        q('[data-reveal="stagger"]').forEach((el) => {
          gsap.from(el.children, { autoAlpha: 0, y: 22, duration: 1, stagger: 0.09, scrollTrigger: once(el) });
        });

        q('[data-reveal="clip"]').forEach((el) => {
          const media = el.querySelector("img");
          const tl = gsap.timeline({ scrollTrigger: once(el, "top 85%") });
          tl.from(el, { clipPath: "inset(22% 12% 22% 12%)", duration: 1.6, ease: "power3.inOut" });
          if (media) tl.from(media, { scale: 1.18, duration: 1.9, ease: "power3.out" }, 0);
        });

        q('[data-reveal="lines"]').forEach((el) => {
          SplitText.create(el, {
            type: "lines",
            mask: "lines",
            linesClass: "line-mask",
            autoSplit: true,
            onSplit: (self) =>
              gsap.from(self.lines, { yPercent: 105, duration: 1.15, stagger: 0.08, ease: "power4.out", scrollTrigger: once(el) }),
          });
        });

        q("[data-parallax]").forEach((el) => {
          const target = el.querySelector("img") ?? el;
          gsap.fromTo(
            target,
            { yPercent: -5, scale: 1.1 },
            { yPercent: 5, scale: 1.1, ease: "none", scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true } },
          );
        });

        // Layout can shift once images decode; keep trigger positions honest.
        const refresh = () => ScrollTrigger.refresh();
        window.addEventListener("load", refresh, { once: true });
        return () => window.removeEventListener("load", refresh);
      });
      return () => mm.revert();
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
