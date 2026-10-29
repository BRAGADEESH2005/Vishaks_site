import Image from "next/image";
import { ArrowLink } from "@/components/ui/ArrowLink";
import { ConceptNote } from "@/components/ui/ConceptNote";
import { conceptImages, projects, type Project } from "@/data/projects";
import { DevelopmentIndex } from "./DevelopmentIndex";

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
              Four concepts, one way of building.
            </h2>
            <p data-reveal="fade" className="mt-8 max-w-2xl text-lede text-muted">
              Each concept shows how Vishaks would approach a site in one of its target corridors. None of them is a launched
              project yet; they are design studies, and every figure is illustrative.
            </p>
          </div>
        </div>
        <div className="mt-16 md:mt-24">
          <DevelopmentIndex projects={projects} />
        </div>
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
  const kadal = bySlug("kadal-residences");
  const marutham = bySlug("marutham");
  return (
    <section aria-labelledby="residential-title" className="bg-paper py-28 md:py-40">
      <div className="gutter shell">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 id="residential-title" data-reveal="lines" className="max-w-3xl text-display-l">
            Residences
          </h2>
          <p className="label text-muted">Towers and plotted communities</p>
        </div>

        {/* Kadal: a tall plate, text set low beside it. */}
        <article className="mt-16 grid items-end gap-12 md:mt-24 md:grid-cols-12 md:gap-10">
          <figure className="md:col-span-7">
            <div data-reveal="clip" className="relative aspect-[5/6] overflow-hidden bg-stone md:aspect-[6/7]">
              <Image src={conceptImages.kadalDeck.src} alt={conceptImages.kadalDeck.alt} fill sizes="(min-width: 768px) 58vw, 100vw" placeholder="blur" className="object-cover" />
            </div>
            <figcaption className="label mt-4 text-muted">{conceptImages.kadalDeck.caption}</figcaption>
          </figure>
          <div className="md:col-span-4 md:col-start-9 md:pb-16">
            <p className="label text-bronze">
              {kadal.type} · {kadal.corridor}
            </p>
            <h3 data-reveal="fade" className="mt-5 text-display-m">
              {kadal.name}
            </h3>
            <p className="mt-6 text-muted">{kadal.description[0]}</p>
            <Facts project={kadal} />
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <ArrowLink href={`/projects/${kadal.slug}`}>Explore {kadal.name}</ArrowLink>
              <ConceptNote>Concept</ConceptNote>
            </div>
          </div>
        </article>

        {/* Marutham: a wide aerial plate with the text overlapping its lower edge. */}
        <article className="relative mt-28 md:mt-44">
          <figure>
            <div data-reveal="clip" className="relative aspect-[4/3] overflow-hidden bg-stone md:ml-[16%] md:aspect-[16/9]">
              <Image src={conceptImages.maruthamAerial.src} alt={conceptImages.maruthamAerial.alt} fill sizes="(min-width: 768px) 84vw, 100vw" placeholder="blur" className="object-cover" />
            </div>
            <figcaption className="label mt-4 text-muted md:ml-[16%]">{conceptImages.maruthamAerial.caption}</figcaption>
          </figure>
          <div data-reveal="fade" className="relative mt-10 bg-ivory md:-mt-40 md:w-[40%] md:p-12">
            <p className="label text-bronze">
              {marutham.type} · {marutham.corridor}
            </p>
            <h3 className="mt-5 text-display-m">{marutham.name}</h3>
            <p className="mt-6 text-muted">{marutham.description[0]}</p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <ArrowLink href={`/projects/${marutham.slug}`}>Explore {marutham.name}</ArrowLink>
              <ConceptNote>Concept</ConceptNote>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}

export function CommercialPortfolio() {
  const ambalam = bySlug("ambalam-offices");
  const sandhai = bySlug("sandhai");
  const ledger = ambalam.specs.flatMap((g) => g.items);
  return (
    <section aria-labelledby="commercial-title" className="on-dark bg-ink py-28 text-ivory md:py-40">
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
                <Image src={conceptImages.ambalamExterior.src} alt={conceptImages.ambalamExterior.alt} fill sizes="100vw" placeholder="blur" className="object-cover" />
              </div>
            </div>
            <figcaption className="label mt-4 text-ivory/55">{conceptImages.ambalamExterior.caption}</figcaption>
          </figure>
          <div className="mt-14 grid gap-12 md:grid-cols-12">
            <div className="md:col-span-5">
              <p className="label text-bronze-light">
                {ambalam.type} · {ambalam.corridor}
              </p>
              <h3 className="mt-5 text-display-m">{ambalam.name}</h3>
              <p className="mt-6 text-ivory/70">{ambalam.description[1]}</p>
              <div className="mt-10 flex flex-wrap items-center gap-6">
                <ArrowLink href={`/projects/${ambalam.slug}`} tone="light">
                  Explore {ambalam.name}
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
              {sandhai.type} · {sandhai.corridor}
            </p>
            <h3 data-reveal="fade" className="mt-5 text-display-m">
              {sandhai.name}
            </h3>
            <p className="mt-6 text-ivory/70">{sandhai.description[1]}</p>
            <div className="mt-10 flex flex-wrap items-center gap-6">
              <ArrowLink href={`/projects/${sandhai.slug}`} tone="light">
                Explore {sandhai.name}
              </ArrowLink>
              <ConceptNote tone="light">Concept</ConceptNote>
            </div>
          </div>
          <div className="order-1 grid grid-cols-12 gap-4 md:order-2 md:col-span-7 md:col-start-6">
            <figure className="col-span-12 sm:col-span-8">
              <div data-reveal="clip" className="relative aspect-[3/2] overflow-hidden bg-ink-3">
                <Image src={conceptImages.sandhaiStreet.src} alt={conceptImages.sandhaiStreet.alt} fill sizes="(min-width: 768px) 38vw, 100vw" placeholder="blur" className="object-cover" />
              </div>
            </figure>
            <figure className="col-span-8 col-start-5 sm:col-span-4 sm:mt-40">
              <div data-reveal="clip" className="relative aspect-[3/4] overflow-hidden bg-ink-3">
                <Image src={conceptImages.sandhaiArcade.src} alt={conceptImages.sandhaiArcade.alt} fill sizes="(min-width: 768px) 20vw, 66vw" placeholder="blur" className="object-cover" />
              </div>
              <figcaption className="label mt-4 text-ivory/55">Sandhai. Concept visualisations.</figcaption>
            </figure>
          </div>
        </article>
      </div>
    </section>
  );
}
