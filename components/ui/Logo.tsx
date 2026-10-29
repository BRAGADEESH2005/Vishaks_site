/**
 * The Vishaks mark: two corridor lines converging on a horizon, set beside a
 * spaced Bodoni wordmark. Original artwork for this prototype.
 */
export function LogoMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.4">
      <path d="M5 6 L16 26 L27 6" strokeLinejoin="miter" />
      <path d="M2 19.5 H30" strokeWidth="1" opacity="0.55" />
      <circle cx="16" cy="26" r="1.6" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function Logo({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark className="h-7 w-7" />
      <span className="font-display text-[1.35rem] leading-none tracking-[0.32em]">VISHAKS</span>
    </span>
  );
}
