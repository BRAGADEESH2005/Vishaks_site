"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import type { ProjectImage } from "@/data/projects";

/**
 * Editorial gallery: the first image runs wide, the rest sit in an offset
 * pair. Every image opens in a full-screen viewer (native <dialog>, so focus
 * and Escape are handled by the browser); arrow keys move between images.
 */
export function Gallery({ images, title }: { images: ProjectImage[]; title: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [index, setIndex] = useState<number | null>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) d.showModal();
    if (index === null && d.open) d.close();
  }, [index]);

  const step = (dir: 1 | -1) => setIndex((i) => (i === null ? i : (i + dir + images.length) % images.length));
  const current = index !== null ? images[index] : undefined;

  return (
    <>
      <ul className="grid gap-4 md:grid-cols-12 md:gap-6">
        {images.map((img, i) => {
          const lastAlone = i === images.length - 1 && i % 2 === 1;
          const { col, aspect } =
            i === 0
              ? { col: "md:col-span-12", aspect: "aspect-[16/9]" }
              : lastAlone
                ? { col: "md:col-span-8 md:col-start-3 md:mt-10", aspect: "aspect-[3/2]" }
              : i % 2
                ? { col: "md:col-span-7", aspect: "aspect-[4/3]" }
                : { col: "md:col-span-5 md:mt-24", aspect: "aspect-[4/5]" };
          return (
            <li key={img.caption} className={col}>
              <figure>
                <button
                  type="button"
                  onClick={() => setIndex(i)}
                  className={`group relative block w-full overflow-hidden bg-paper ${aspect}`}
                  aria-label={`Open image ${i + 1} of ${images.length} full screen: ${img.caption}`}
                >
                  <Image
                    src={img.src}
                    alt={img.alt}
                    fill
                    placeholder="blur"
                    sizes={i === 0 ? "100vw" : "(min-width: 768px) 55vw, 100vw"}
                    className="object-cover transition-transform duration-[1400ms] ease-[var(--ease-architect)] group-hover:scale-[1.03]"
                  />
                  <span className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-ink/50 text-ivory opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
                    <Expand aria-hidden="true" className="h-4 w-4" strokeWidth={1.5} />
                  </span>
                </button>
                <figcaption className="label mt-3 text-muted">{img.caption}</figcaption>
              </figure>
            </li>
          );
        })}
      </ul>

      <dialog
        ref={dialog}
        onClose={() => setIndex(null)}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") step(1);
          if (e.key === "ArrowLeft") step(-1);
        }}
        aria-label={`${title} gallery`}
        className="on-dark m-0 h-full max-h-none w-full max-w-none bg-ink p-0 text-ivory backdrop:bg-ink/90"
      >
        {current && (
          <div className="flex h-full flex-col">
            <div className="gutter flex items-center justify-between py-4" style={{ paddingTop: "max(1rem, env(safe-area-inset-top, 0px))" }}>
              <p className="label text-ivory/70 tabular-nums">
                {(index ?? 0) + 1} / {images.length}
              </p>
              <button
                type="button"
                onClick={() => setIndex(null)}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/30"
              >
                <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                <span className="sr-only">Close viewer</span>
              </button>
            </div>
            <div className="relative flex-1">
              <Image src={current.src} alt={current.alt} fill sizes="100vw" className="object-contain" />
            </div>
            <div className="gutter flex items-center justify-between gap-6 py-5" style={{ paddingBottom: "max(1.25rem, env(safe-area-inset-bottom, 0px))" }}>
              <button type="button" onClick={() => step(-1)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/30">
                <ChevronLeft aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                <span className="sr-only">Previous image</span>
              </button>
              <p className="text-center text-[0.95rem] text-ivory/75">{current.caption}</p>
              <button type="button" onClick={() => step(1)} className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-ivory/30">
                <ChevronRight aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
                <span className="sr-only">Next image</span>
              </button>
            </div>
          </div>
        )}
      </dialog>
    </>
  );
}
