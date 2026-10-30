"use client";

import { useRef, useState } from "react";
import { ensureGsap, gsap, ScrollTrigger, useGSAP } from "@/lib/gsap";

type Stage = { step: string; body: string; detail: string };

/** Line drawings for each stage, drawn in as the stage becomes active. */
function StageArt({ i }: { i: number }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.4, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, pathLength: 1, className: "stage-line" };
  switch (i) {
    case 0: // a surveyed plot with pegs
      return (
        <g>
          <path {...common} d="M30 120 L110 80 L190 120 L110 160 Z" />
          <path {...common} d="M70 100 L150 140 M150 100 L70 140" strokeDasharray="0.02 0.02" />
          {[[30, 120], [110, 80], [190, 120], [110, 160]].map(([x, y]) => (
            <path key={`${x}${y}`} {...common} d={`M${x} ${y} L${x} ${y! - 22}`} />
          ))}
          <circle cx="110" cy="120" r="5" fill="currentColor" />
        </g>
      );
    case 1: // an agreement
      return (
        <g>
          <path {...common} d="M62 40 H142 L162 60 V180 H62 Z" />
          <path {...common} d="M142 40 V60 H162 M80 82 H144 M80 102 H144 M80 122 H124" />
          <path {...common} d="M84 156 C 96 140, 104 170, 116 152 S 136 150, 144 158" />
        </g>
      );
    case 2: // an approval seal
      return (
        <g>
          <circle {...common} cx="110" cy="105" r="52" />
          <circle {...common} cx="110" cy="105" r="40" />
          <path {...common} d="M90 106 L104 120 L132 90" />
          <path {...common} d="M84 152 L72 188 L94 178 L106 196 L110 158 M136 152 L148 188 L126 178 L114 196" />
        </g>
      );
    case 3: // a tower under a crane
      return (
        <g>
          <path {...common} d="M84 190 V86 H136 V190 M84 112 H136 M84 138 H136 M84 164 H136 M110 86 V190" />
          <path {...common} d="M162 190 V36 M150 36 H200 M162 36 L60 36 M162 36 L150 20 L174 20 Z M80 36 V62" />
          <path {...common} d="M72 62 H88 V70 H72 Z" />
        </g>
      );
    default: // a key, handed over
      return (
        <g>
          <circle {...common} cx="80" cy="110" r="30" />
          <circle {...common} cx="80" cy="110" r="10" />
          <path {...common} d="M110 110 H190 M168 110 V130 M184 110 V124" />
        </g>
      );
  }
}

/**
 * How a project moves, as a pinned journey on wide screens: scrolling
 * advances a bronze line through five stages, and each stage draws itself in.
 * On phones it is a vertical sequence with the same drawings.
 */
export function ProcessJourney({ stages }: { stages: Stage[] }) {
  const root = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);

  useGSAP(
    () => {
      ensureGsap();
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        let last = -1;
        const st = ScrollTrigger.create({
          trigger: root.current,
          start: "top top",
          end: "+=200%",
          pin: true,
          scrub: 0.8,
          onUpdate: (self) => {
            root.current?.style.setProperty("--journey", String(self.progress));
            const i = Math.min(stages.length - 1, Math.floor(self.progress * stages.length * 0.999));
            if (i !== last) {
              last = i;
              setActive(i);
            }
          },
        });
        return () => st.kill();
      });
      // Draw each stage's art when it scrolls into view on narrow screens.
      mm.add("(max-width: 1023px) and (prefers-reduced-motion: no-preference)", () => {
        gsap.utils.toArray<HTMLElement>("[data-stage-card]").forEach((card) => {
          gsap.fromTo(card.querySelectorAll(".stage-line"), { strokeDashoffset: 1, strokeDasharray: "1 1" }, { strokeDashoffset: 0, duration: 1.6, ease: "power2.out", scrollTrigger: { trigger: card, start: "top 80%", once: true } });
        });
      });
      return () => mm.revert();
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative bg-paper lg:flex lg:min-h-[100svh] lg:flex-col lg:justify-center lg:pt-24" style={{ ["--journey" as string]: 0 }}>
      <div className="w-full">
      {/* Wide screens: the rail and the active stage. */}
      <div className="hidden lg:block">
        <div className="relative mt-4">
          <div className="absolute left-0 right-0 top-[11px] h-px bg-line" aria-hidden="true" />
          <div className="absolute left-0 top-[11px] h-px w-full origin-left bg-bronze" style={{ transform: "scaleX(var(--journey))" }} aria-hidden="true" />
          <ol className="relative grid grid-cols-5">
            {stages.map((s, i) => (
              <li key={s.step}>
                <button type="button" onClick={() => setActive(i)} aria-pressed={i === active} className="group flex flex-col items-start gap-4 text-left">
                  <span
                    className={`flex h-[23px] w-[23px] items-center justify-center rounded-full border transition-all duration-500 ${
                      i <= active ? "border-bronze bg-bronze" : "border-stone-2 bg-paper group-hover:border-bronze"
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${i <= active ? "bg-ivory" : "bg-stone-2"}`} />
                  </span>
                  <span className="font-mono text-[0.75rem] tabular-nums text-bronze">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`font-display text-[1.7rem] leading-tight transition-colors duration-500 ${i === active ? "text-ink" : "text-ink/40 group-hover:text-ink/70"}`}>{s.step}</span>
                </button>
              </li>
            ))}
          </ol>
        </div>
        <div className="relative mt-14 grid min-h-[22rem] border-t border-line pt-12" aria-live="polite">
          {stages.map((s, i) => (
            <div
              key={s.step}
              aria-hidden={i !== active}
              className={`grid grid-cols-12 items-center gap-10 transition-all duration-700 ease-[var(--ease-architect)] [grid-area:1/1] ${
                i === active ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
              }`}
            >
              <svg viewBox="0 0 220 220" aria-hidden="true" className={`col-span-4 h-auto w-full max-w-[18rem] text-bronze ${i === active ? "stage-draw" : ""}`}>
                <StageArt i={i} />
              </svg>
              <div className="col-span-7 col-start-6">
                <p className="label text-muted">Stage {i + 1} of {stages.length}</p>
                <p className="mt-4 font-display text-display-m">{s.body}</p>
                <p className="mt-6 max-w-xl text-muted">{s.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Phones and tablets: a vertical sequence. */}
      <ol className="relative border-l border-line pl-8 lg:hidden">
        {stages.map((s, i) => (
          <li key={s.step} data-stage-card className="relative pb-14 last:pb-0">
            <span className="absolute -left-[41px] top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border border-bronze bg-paper">
              <span className="h-1.5 w-1.5 rounded-full bg-bronze" />
            </span>
            <span className="font-mono text-[0.75rem] tabular-nums text-bronze">{String(i + 1).padStart(2, "0")}</span>
            <h4 className="mt-2 font-display text-[1.9rem] leading-tight">{s.step}</h4>
            <svg viewBox="0 0 220 220" aria-hidden="true" className="my-4 h-auto w-40 text-bronze">
              <StageArt i={i} />
            </svg>
            <p className="text-[1.05rem]">{s.body}</p>
            <p className="mt-3 text-muted">{s.detail}</p>
          </li>
        ))}
      </ol>
      </div>
    </div>
  );
}
