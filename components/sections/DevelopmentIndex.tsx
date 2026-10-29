"use client";

import { ArrowUpRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRef, useState } from "react";
import type { Project } from "@/data/projects";
import { ensureGsap, gsap, useGSAP } from "@/lib/gsap";

/**
 * An editorial index of developments. On devices with a fine pointer, a
 * preview plate follows the cursor; on touch screens each row carries its own
 * thumbnail instead.
 */
export function DevelopmentIndex({ projects }: { projects: Project[] }) {
  const list = useRef<HTMLDivElement>(null);
  const preview = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState<number | null>(null);
  const mover = useRef<{ x: (v: number) => void; y: (v: number) => void } | null>(null);

  useGSAP(
    () => {
      ensureGsap();
      if (!preview.current) return;
      mover.current = {
        x: gsap.quickTo(preview.current, "x", { duration: 0.6, ease: "power3" }),
        y: gsap.quickTo(preview.current, "y", { duration: 0.6, ease: "power3" }),
      };
    },
    { scope: list },
  );

  const onMove = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse" || !list.current) return;
    const r = list.current.getBoundingClientRect();
    mover.current?.x(e.clientX - r.left);
    mover.current?.y(e.clientY - r.top);
  };

  return (
    <div ref={list} className="relative" onPointerMove={onMove} onPointerLeave={() => setCurrent(null)}>
      <ul className="border-t border-line">
        {projects.map((p, i) => (
          <li key={p.slug} className="border-b border-line">
            <Link
              href={`/projects/${p.slug}`}
              onPointerEnter={(e) => e.pointerType === "mouse" && setCurrent(i)}
              onFocus={() => setCurrent(i)}
              onBlur={() => setCurrent(null)}
              className="group grid grid-cols-[5.5rem_1fr] items-center gap-x-5 gap-y-2 py-6 md:grid-cols-12 md:gap-6 md:py-9"
            >
              <span className="relative row-span-3 block aspect-[4/5] w-full overflow-hidden bg-paper md:hidden">
                <Image src={p.cover.src} alt="" fill sizes="6rem" className="object-cover" placeholder="blur" />
              </span>
              <span className="md:col-span-5">
                <span className="block font-display text-[1.9rem] leading-none transition-transform duration-700 ease-[var(--ease-architect)] md:text-[3.1rem] md:group-hover:translate-x-3">
                  {p.name}
                </span>
                <span className="mt-2 block text-[0.9rem] italic text-muted">{p.meaning}</span>
              </span>
              <span className="text-[0.95rem] md:col-span-3">{p.type}</span>
              <span className="text-[0.95rem] text-muted md:col-span-2">{p.corridor}</span>
              <span className="flex items-center justify-between gap-4 md:col-span-2">
                <span className="label rounded-full border border-line px-3 py-1 text-muted">{p.status}</span>
                <ArrowUpRight
                  aria-hidden="true"
                  strokeWidth={1.4}
                  className="hidden h-6 w-6 transition-transform duration-500 group-hover:-translate-y-1 group-hover:translate-x-1 md:block"
                />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <div
        ref={preview}
        aria-hidden="true"
        className={`pointer-events-none absolute left-0 top-0 z-10 hidden h-[17rem] w-[24rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden transition-[opacity,clip-path] duration-700 ease-[var(--ease-architect)] md:block ${
          current === null ? "opacity-0 [clip-path:inset(30%_20%_30%_20%)]" : "opacity-100 [clip-path:inset(0%)]"
        }`}
        style={{ marginLeft: "12rem", marginTop: "-2rem" }}
      >
        {projects.map((p, i) => (
          <Image
            key={p.slug}
            src={p.cover.src}
            alt=""
            fill
            sizes="24rem"
            className={`object-cover transition-opacity duration-500 ${current === i ? "opacity-100" : "opacity-0"}`}
          />
        ))}
      </div>
    </div>
  );
}
