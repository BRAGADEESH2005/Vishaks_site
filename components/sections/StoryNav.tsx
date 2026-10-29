"use client";

import { useEffect, useState } from "react";

/** The chapter list beside the story; marks the chapter currently in view. */
export function StoryNav({ chapters }: { chapters: Array<{ id: string; theme: string }> }) {
  const [active, setActive] = useState(chapters[0]?.id ?? "");

  useEffect(() => {
    const els = chapters
      .map((c) => document.querySelector<HTMLElement>(`[data-chapter="${c.id}"]`))
      .filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive((e.target as HTMLElement).dataset.chapter ?? "");
        });
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [chapters]);

  return (
    <nav aria-label="Chapters" className="mt-14 hidden md:block">
      <ul className="space-y-1 border-l border-line">
        {chapters.map((c) => {
          const on = c.id === active;
          return (
            <li key={c.id}>
              <a
                href={`#chapter-${c.id}`}
                aria-current={on ? "true" : undefined}
                className={`-ml-px block border-l py-2 pl-5 transition-colors duration-500 ${
                  on ? "border-ink text-ink" : "border-transparent text-muted hover:text-ink"
                }`}
              >
                {c.theme}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
