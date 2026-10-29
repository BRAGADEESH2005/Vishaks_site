/** A small, consistent label for anything illustrative. */
export function ConceptNote({ children = "Concept visualisation", tone = "dark" }: { children?: React.ReactNode; tone?: "dark" | "light" }) {
  const color = tone === "light" ? "text-ivory/75 border-ivory/25" : "text-muted border-line";
  return (
    <span className={`label inline-flex items-center gap-2 rounded-full border px-3 py-1 ${color}`}>
      <span aria-hidden="true" className="h-1 w-1 rounded-full bg-bronze-light" />
      {children}
    </span>
  );
}

/** Marks a fact the company still has to supply. */
export function ToConfirm({ children = "To be confirmed" }: { children?: React.ReactNode }) {
  return <span className="label inline-block border-b border-dashed border-current pb-0.5 opacity-70">{children}</span>;
}
