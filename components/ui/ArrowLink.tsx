import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

type Props = { href: string; children: React.ReactNode; tone?: "dark" | "light"; className?: string };

/** Text link with a drawn underline and a small arrow that steps forward on hover. */
export function ArrowLink({ href, children, tone = "dark", className = "" }: Props) {
  const color = tone === "light" ? "text-ivory" : "text-ink";
  return (
    <Link href={href} className={`group inline-flex items-center gap-2 font-medium ${color} ${className}`}>
      <span className="link-draw pb-0.5">{children}</span>
      <ArrowUpRight
        aria-hidden="true"
        className="h-4 w-4 transition-transform duration-500 ease-[var(--ease-architect)] group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
        strokeWidth={1.5}
      />
    </Link>
  );
}

/** Primary and secondary buttons rendered as links. */
export function ButtonLink({
  href,
  children,
  variant = "solid",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "outline";
  className?: string;
}) {
  const base =
    "group inline-flex items-center justify-center gap-3 rounded-full px-6 py-3.5 text-[0.95rem] font-medium tracking-wide transition-colors duration-500";
  const styles =
    variant === "solid"
      ? "bg-ivory text-ink hover:bg-bronze-light"
      : "border border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory/10";
  return (
    <Link href={href} className={`${base} ${styles} ${className}`}>
      {children}
    </Link>
  );
}
