import Image from "next/image";
import { ButtonLink } from "@/components/ui/ArrowLink";
import night from "@/public/images/concepts/district-night.jpg";

export default function NotFound() {
  return (
    <main id="main" className="on-dark relative isolate flex min-h-[88svh] items-end overflow-hidden bg-ink pb-24 pt-40 text-ivory">
      <Image src={night} alt="" fill priority sizes="100vw" placeholder="blur" className="-z-20 object-cover opacity-60" />
      <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/60 to-ink/20" />
      <div className="gutter shell">
        <p className="label text-ivory/55">Page not found</p>
        <h1 className="mt-6 text-display-l">This address has not been built yet.</h1>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/">Back to the home page</ButtonLink>
          <ButtonLink href="/#developments" variant="outline">
            See the developments
          </ButtonLink>
        </div>
      </div>
    </main>
  );
}
