import { ButtonLink } from "@/components/ui/ArrowLink";

export default function NotFound() {
  return (
    <main id="main" className="on-dark flex min-h-[80svh] items-end bg-ink pb-24 pt-40 text-ivory">
      <div className="gutter shell">
        <p className="label text-ivory/55">Page not found</p>
        <h1 className="mt-6 text-display-l">This address has not been built yet.</h1>
        <div className="mt-10">
          <ButtonLink href="/">Back to the home page</ButtonLink>
        </div>
      </div>
    </main>
  );
}
