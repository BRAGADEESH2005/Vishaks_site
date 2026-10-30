"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { TiltCard } from "@/components/ui/TiltCard";
import type { Project } from "@/data/projects";
import { ensureGsap, gsap, useGSAP } from "@/lib/gsap";

/**
 * Pinned horizontal reel of the four concepts. On wide screens the section
 * holds while vertical scrolling slides the cards sideways; each card's image
 * drifts against the motion. On phones and with reduced motion it becomes a
 * native swipeable row.
 */
export function ProjectReel({ projects }: { projects: Project[] }) {
  const section = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      ensureGsap();
      const mm = gsap.matchMedia();
      mm.add("(min-width: 768px) and (prefers-reduced-motion: no-preference)", () => {
        const t = track.current;
        if (!t) return;
        const distance = () => t.scrollWidth - window.innerWidth;
        const tween = gsap.to(t, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section.current,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });
        // Each image drifts inside its frame as it crosses the screen.
        gsap.utils.toArray<HTMLElement>("[data-reel-img]", t).forEach((img) => {
          gsap.fromTo(
            img,
            { xPercent: -8 },
            {
              xPercent: 8,
              ease: "none",
              scrollTrigger: { trigger: img.parentElement?.parentElement ?? img, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
            },
          );
        });
      });
      return () => mm.revert();
    },
    { scope: section },
  );

  return (
    <div ref={section} className="relative overflow-hidden bg-ink py-16 text-ivory md:flex md:h-[100svh] md:flex-col md:justify-center md:py-0">
      <div className="gutter shell mb-10 flex items-end justify-between gap-6">
        <p className="label text-ivory/60">Four concepts · scroll to move through</p>
        <span className="relative hidden h-px w-48 bg-ivory/20 md:block" aria-hidden="true">
          <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-bronze-light" />
        </span>
      </div>
      <div
        ref={track}
        className="flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 [scrollbar-width:none] md:snap-none md:gap-8 md:overflow-visible md:px-[max(4rem,8vw)] md:pb-0"
      >
        {projects.map((p, i) => (
          <TiltCard key={p.slug} className="w-[82vw] shrink-0 snap-start md:w-[min(46vw,40rem)]">
            <Link href={`/projects/${p.slug}`} data-cursor="view" className="group block">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-3 md:aspect-[5/4]">
                <div className="absolute -inset-x-[10%] -inset-y-[4%]" style={{ transform: "translate3d(var(--px,0),var(--py,0),0)" }}>
                  <div data-reel-img className="absolute inset-0">
                  <Image
                    src={p.cover.src}
                    alt={p.cover.alt}
                    fill
                    placeholder="blur"
                    sizes="(min-width: 768px) 46vw, 82vw"
                    className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-architect)] group-hover:scale-[1.05]"
                  />
                  </div>
                </div>
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/85 via-ink/10 to-transparent" />
                <span className="label absolute left-5 top-5 rounded-full border border-ivory/30 bg-ink/40 px-3 py-1 text-ivory/85 backdrop-blur-sm">
                  {String(i + 1).padStart(2, "0")} · {p.status}
                </span>
                <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4 md:inset-x-7 md:bottom-7" style={{ transform: "translateZ(40px)" }}>
                  <div>
                    <p className="label text-bronze-light">
                      {p.type} · {p.corridor}
                    </p>
                    <h3 className="mt-3 font-display text-[2rem] leading-none md:text-[2.8rem]">{p.name}</h3>
                    <p className="mt-2 text-[0.92rem] italic text-ivory/70">{p.tagline}</p>
                  </div>
                  <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-ivory/40 transition-colors duration-500 group-hover:bg-ivory group-hover:text-ink">
                    <ArrowUpRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.4} />
                  </span>
                </div>
              </div>
            </Link>
          </TiltCard>
        ))}
        <div className="flex w-[60vw] shrink-0 flex-col justify-center gap-6 pr-10 md:w-[28vw]">
          <p className="font-display text-display-m">Each concept is a design study, not a launched project.</p>
          <a href="#enquire" className="link-draw self-start text-ivory">
            Talk to us about a site
          </a>
        </div>
      </div>
    </div>
  );
}
