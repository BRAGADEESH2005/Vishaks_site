"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Logo } from "@/components/ui/Logo";
import { nav } from "@/data/site";

function subscribeScroll(callback: () => void) {
  window.addEventListener("scroll", callback, { passive: true });
  return () => window.removeEventListener("scroll", callback);
}
const scrolledPastTop = () => window.scrollY > 24;

export function SiteHeader() {
  const pathname = usePathname();
  const isHome = pathname === "/";
  const scrolled = useSyncExternalStore(subscribeScroll, scrolledPastTop, () => false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Highlight the section in view (home page only).
  useEffect(() => {
    if (!isHome) return;
    const sections = nav.map((n) => document.getElementById(n.id)).filter((el): el is HTMLElement => !!el);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: [0, 0.25, 0.5] },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [isHome]);

  // Mobile menu: lock scroll, close on Escape, keep focus inside, restore focus on close.
  useEffect(() => {
    if (!open) return;
    const button = menuButton.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("a")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      if (e.key === "Tab" && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>("a, button"));
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
      button?.focus();
    };
  }, [open]);

  const solid = scrolled;
  const shell = solid ? "bg-ivory/92 text-ink border-line backdrop-blur-md" : "bg-transparent text-ivory border-transparent";

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-500 ${shell}`}
      style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
    >
      <div className="gutter shell flex h-[4.25rem] items-center justify-between gap-6 md:h-20">
        <Link href="/" aria-label="Vishaks, home" className="shrink-0">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-9 lg:flex">
          {nav.map((item) => {
            const isActive = isHome && active === item.id;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "true" : undefined}
                className={`relative py-2 text-[0.92rem] tracking-wide transition-opacity duration-300 hover:opacity-100 ${
                  isActive ? "opacity-100" : "opacity-70"
                }`}
              >
                {item.label}
                <span
                  aria-hidden="true"
                  className={`absolute -bottom-0.5 left-0 h-px bg-current transition-all duration-500 ${isActive ? "w-full" : "w-0"}`}
                />
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/#enquire"
            className={`hidden rounded-full border px-5 py-2.5 text-[0.9rem] font-medium transition-colors duration-500 sm:inline-flex ${
              solid ? "border-ink bg-ink text-ivory hover:bg-coffee" : "border-ivory/50 hover:bg-ivory hover:text-ink"
            }`}
          >
            Enquire
          </Link>
          <button
            ref={menuButton}
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-current/30 lg:hidden"
          >
            <Menu aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
            <span className="sr-only">Open menu</span>
          </button>
        </div>
      </div>

      {open && (
        <div
          id="mobile-menu"
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="on-dark fixed inset-0 z-50 flex flex-col bg-ink text-ivory"
          style={{ paddingTop: "env(safe-area-inset-top, 0px)", paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        >
          <div className="gutter flex h-[4.25rem] items-center justify-between md:h-20">
            <Logo />
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ivory/30"
            >
              <X aria-hidden="true" className="h-5 w-5" strokeWidth={1.5} />
              <span className="sr-only">Close menu</span>
            </button>
          </div>
          <nav aria-label="Main" className="gutter flex flex-1 flex-col justify-center gap-2">
            {[...nav, { href: "/#enquire", label: "Enquire", id: "enquire" }].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="font-display border-b border-line-light py-4 text-[2.4rem] leading-none"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="gutter label pb-8 text-ivory/60">Chennai, Tamil Nadu</p>
        </div>
      )}
    </header>
  );
}
