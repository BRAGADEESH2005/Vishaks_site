import Image from "next/image";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { conceptImages, projects, type Project } from "@/data/projects";
import { DevelopmentIndex } from "./DevelopmentIndex";
import { ProjectReel } from "./ProjectReel";

const bySlug = (slug: string): Project => {
  const p = projects.find((x) => x.slug === slug);
  if (!p) throw new Error(`Unknown project ${slug}`);
  return p;
};

export function SignatureDevelopments() {
  return (
    <section id="developments" aria-labelledby="developments-title" className="bg-ivory pb-28 md:pb-40">
      <div className="gutter shell">
        <div className="grid gap-8 border-t border-line pt-14 md:grid-cols-12 md:pt-20">
          <p className="label text-muted md:col-span-3">Signature developments</p>
          <div className="md:col-span-9">
            <h2 id="developments-title" data-reveal="lines" className="text-display-l">
              Four kinds of space, one way of building.
            </h2>
            <p data-reveal="fade" className="mt-8 max-w-2xl text-lede text-muted">
              Each concept shows how Vishaks would approach a site in one of its target corridors. None of them is a launched
              project yet; they are design studies, and every figure is illustrative.
            </p>
          </div>
        </div>
      </div>
      <div className="mt-16 md:mt-24">
        <ProjectReel projects={projects} />
      </div>
      <div className="gutter shell mt-20 md:mt-28">
        <p className="label mb-6 text-muted">Index</p>
        <DevelopmentIndex projects={projects} />
      </div>
    </section>
  );
}

function Facts({ project }: { project: Project }) {
  const highlights = project.specs.flatMap((g) => g.items).slice(0, 3);
  return (
    <dl className="mt-10 divide-y divide-line border-y border-line">
      {highlights.map((f) => (
        <div key={f.label} className="grid grid-cols-[9rem_1fr] gap-4 py-4 text-[0.95rem]">
          <dt className="text-muted">{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ResidentialPortfolio() {
  const residential = bySlug("residential-spaces");
  const coworking = bySlug("coworking-spaces");
  return (
    <section aria-labelledby="residential-title" className="bg-paper py-28 md:py-40">
      <div className="gutter shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="residential-title" data-reveal="lines" className="max-w-3xl text-display-l">
            Homes and workspace
          </h2>
          <p className="label text-muted">Residential towers and coworking campuses</p>
        </div>

        {/* Residential: a tall plate, text set low beside it. */}
        <article className="mt-16 grid items-end gap-12 md:mt-24 md:grid-cols-12 md:gap-10">
          <figure className="md:col-span-7">
            <div data-reveal="clip" className="relative aspect-[5/6] overflow-hidden bg-stone md:aspect-[6/7]">
              <Image src={conceptImages.residentialDeck.src} alt={conceptImages.residentialDeck.alt} fill sizes="(min-width: 768px) 58vw, 100vw" placeholder="blur" className="object-cover" />
            </div>
            <figcaption className="label mt-4 text-muted">{conceptImages.residentialDeck.caption}</figcaption>
          </figure>
          <div className="md:col-span-4 md:col-start-9 md:pb-16">
            <p className="label text-bronze">
              {residential.type} · {residential.corridor}
            </p>
            <h3 data-reveal="fade" className="mt-5 text-display-m">
              {residential.name}
            </h3>
            <p className="mt-6 text-muted">{residential.description[0]}</p>
            <Facts project={residential} />
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <ArrowLink href={`/projects/${residential.slug}`}>Explore {residential.name}</ArrowLink>
              <ConceptNote>Concept</ConceptNote>
            </div>
          </div>
        </article>

        {/* Coworking: a wide aerial plate with the text overlapping its lower edge. */}
        <article className="relative mt-28 md:mt-44">
          <figure>
            <div data-reveal="clip" className="relative aspect-[4/3] overflow-hidden bg-stone md:ml-[16%] md:aspect-[16/9]">
              <Image src={conceptImages.coworkingExterior.src} alt={conceptImages.coworkingExterior.alt} fill sizes="(min-width: 768px) 84vw, 100vw" placeholder="blur" className="object-cover" />
            </div>
            <figcaption className="label mt-4 text-muted md:ml-[16%]">{conceptImages.coworkingExterior.caption}</figcaption>
          </figure>
          <div data-reveal="fade" className="relative mt-10 bg-ivory md:-mt-40 md:w-[40%] md:p-12">
            <p className="label text-bronze">
              {coworking.type} · {coworking.corridor}
            </p>
            <h3 className="mt-5 text-display-m">{coworking.name}</h3>
            <p className="mt-6 text-muted">{coworking.description[0]}</p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <ArrowLink href={`/projects/${coworking.slug}`}>Explore {coworking.name}</ArrowLink>
              <ConceptNote>Concept</ConceptNote>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function CommercialPortfolio() {
  const office = bySlug("office-spaces");
  const retail = bySlug("retail-spaces");
  const ledger = office.specs.flatMap((g) => g.items);
  return (
    <section aria-labelledby="commercial-title" data-reveal="curtain" className="on-dark bg-ink py-28 text-ivory md:py-40">
      <div className="gutter shell">
        <div className="grid gap-8 md:grid-cols-12">
          <h2 id="commercial-title" data-reveal="lines" className="text-display-l md:col-span-7">
            Workplaces and streets
          </h2>
          <p data-reveal="fade" className="text-lede text-ivory/70 md:col-span-4 md:col-start-9 md:self-end">
            For occupiers, the brief is efficient floor plates, shade and a good arrival. For investors, it is buildings that can
            be leased and held for the long term.
          </p>
        </div>

        <article className="mt-16 md:mt-24">
          <figure>
            <div data-reveal="clip" className="relative aspect-[4/3] overflow-hidden bg-ink-3 md:aspect-[21/9]">
              <div data-parallax className="absolute inset-0">
                <Image src={conceptImages.officeExterior.src} alt={conceptImages.officeExterior.alt} fill sizes="100vw" placeholder="blur" className="object-cover" />
              </div>
            </div>
            <figcaption className="label mt-4 text-ivory/55">{conceptImages.officeExterior.caption}</figcaption>
          </figure>
          <div className="mt-14 grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="label text-bronze-light">
                {office.type} · {office.corridor}
              </p>
              <h3 className="mt-5 text-display-m">{office.name}</h3>
              <p className="mt-6 text-ivory/70">{office.description[1]}</p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <ArrowLink href={`/projects/${office.slug}`} tone="light">
                  Explore {office.name}
                </ArrowLink>
                <ConceptNote tone="light">Concept</ConceptNote>
              </div>
            </div>
            <dl className="divide-y divide-line-light border-y border-line-light md:col-span-6 md:col-start-7">
              {ledger.map((f) => (
                <div key={f.label} className="grid grid-cols-[10rem_1fr] gap-4 py-4">
                  <dt className="text-ivory/55">{f.label}</dt>
                  <dd className="tabular-nums">{f.value}</dd>
                </div>
              ))}
              <div className="py-4 text-[0.85rem] text-ivory/45">Figures are taken from the concept model and are illustrative.</div>
            </dl>
          </div>
        </article>

        <article className="mt-28 grid items-center gap-12 md:mt-40 md:grid-cols-12 md:gap-10">
          <div className="order-2 md:order-1 md:col-span-4">
            <p className="label text-bronze-light">
              {retail.type} · {retail.corridor}
            </p>
            <h3 data-reveal="fade" className="mt-5 text-display-m">
              {retail.name}
            </h3>
            <p className="mt-6 text-ivory/70">{retail.description[1]}</p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <ArrowLink href={`/projects/${retail.slug}`} tone="light">
                Explore {retail.name}
              </ArrowLink>
              <ConceptNote tone="light">Concept</ConceptNote>
            </div>
          </div>
          <div className="order-1 grid grid-cols-12 gap-4 md:order-2 md:col-span-7 md:col-start-6">
            <figure className="col-span-12 sm:col-span-8">
              <div data-reveal="clip" className="relative aspect-[3/2] overflow-hidden bg-ink-3">
                <Image src={conceptImages.retailStreet.src} alt={conceptImages.retailStreet.alt} fill sizes="(min-width: 768px) 38vw, 100vw" placeholder="blur" className="object-cover" />
              </div>
            </figure>
            <figure className="col-span-8 col-start-5 sm:col-span-4 sm:mt-40">
              <div data-reveal="clip" className="relative aspect-[3/4] overflow-hidden bg-ink-3">
                <Image src={conceptImages.retailArcade.src} alt={conceptImages.retailArcade.alt} fill sizes="(min-width: 768px) 20vw, 66vw" placeholder="blur" className="object-cover" />
              </div>
              <figcaption className="label mt-4 text-ivory/55">Retail Spaces. Concept visualisations.</figcaption>
            </figure>
          </div>
        </article>
      </div>
    </section>
  );
}
