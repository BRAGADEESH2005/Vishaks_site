import type { Metadata } from "next";
import Image from "next/image";
import heroImage from "@/public/images/concepts/cbd-hero.jpg";

export const metadata: Metadata = {
  title: "Notices and credits",
  description: "How the imagery and figures on this website were produced, and the open-source work it relies on.",
};

const credits = [
  { name: "Bodoni Moda", by: "The Bodoni Moda Project Authors", licence: "SIL Open Font License 1.1" },
  { name: "Figtree", by: "The Figtree Project Authors", licence: "SIL Open Font License 1.1" },
  { name: "IBM Plex Mono", by: "IBM Corp.", licence: "SIL Open Font License 1.1" },
  { name: "Three.js, React Three Fiber, Drei", by: "three.js and Poimandres contributors", licence: "MIT" },
  { name: "GSAP and ScrollTrigger", by: "GreenSock (Webflow)", licence: "GSAP standard licence (free)" },
  { name: "HDRI skies: Venice Sunset, Potsdamer Platz, Dikhololo Night", by: "Poly Haven", licence: "CC0" },
  { name: "postprocessing, N8AO, Lenis", by: "Their contributors", licence: "Zlib, CC0, MIT" },
  { name: "Lucide icons", by: "Lucide contributors", licence: "ISC" },
];

export default function NoticesPage() {
  return (
    <main id="main" className="bg-ivory">
      <div className="on-dark relative isolate overflow-hidden bg-ink pb-16 pt-36 text-ivory md:pb-24 md:pt-52">
        <Image src={heroImage} alt="" fill priority sizes="100vw" placeholder="blur" className="-z-20 object-cover opacity-45" />
        <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/30" />
        <div className="gutter shell">
          <p className="label text-bronze-light">Transparency</p>
          <h1 className="mt-5 text-display-l">Notices and credits</h1>
        </div>
      </div>
      <div className="gutter shell grid gap-16 py-20 md:grid-cols-12 md:py-28">
        <section aria-labelledby="concepts" className="md:col-span-7">
          <h2 id="concepts" className="text-display-m">
            About the developments shown
          </h2>
          <div className="mt-8 space-y-5 text-[1.05rem] text-muted">
            <p>
              Office Spaces, Residential Spaces, Coworking Spaces and Retail Spaces are design concepts prepared for this website. They are not
              launched projects and are not offered for sale or lease.
            </p>
            <p>
              Every image is a computer-generated visualisation of a procedural 3D model, rendered in the browser. Vishaks Central, the business district in the skyline sequence, is also a design concept. Figures such as
              storeys, floor areas and plot counts come from those concept models and are illustrative.
            </p>
            <p>No project will be marketed before it is registered with the Tamil Nadu Real Estate Regulatory Authority.</p>
          </div>
          <h2 className="mt-16 text-display-m">Privacy</h2>
          <p className="mt-8 text-[1.05rem] text-muted">
            The enquiry form uses the details you enter only to reply to you. A full privacy notice will be published here before
            the website goes live.
          </p>
        </section>
        <section aria-labelledby="credits" className="md:col-span-4 md:col-start-9">
          <h2 id="credits" className="label text-muted">
            Open-source credits
          </h2>
          <ul className="mt-6 border-t border-line">
            {credits.map((c) => (
              <li key={c.name} className="border-b border-line py-4">
                <p className="font-medium">{c.name}</p>
                <p className="text-[0.92rem] text-muted">
                  {c.by} · {c.licence}
                </p>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </main>
  );
}
