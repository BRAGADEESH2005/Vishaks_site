import { site } from "@/data/site";
import { CorridorModel } from "./CorridorModel";
import { VisionModel } from "./VisionModel";

const principles = [
  {
    title: "Land first",
    body: "We judge land the way an investor would: clear title, access, approvals and real demand, before any design begins.",
  },
  {
    title: "Climate before style",
    body: "Chennai is hot, humid and coastal. Deep slabs, fins, colonnades and screens shade the glass and the pavement, and buildings turn to catch the sea breeze.",
  },
  {
    title: "Built in the open",
    body: "Approvals, registrations and construction progress are published stage by stage, so buyers and partners can check the work for themselves.",
  },
];

export function Introduction() {
  return (
    <section id="vision" aria-labelledby="vision-title" className="relative bg-ivory py-28 md:py-40">
      <div className="gutter shell">
        <div className="grid gap-10 md:grid-cols-12">
          <p className="label text-muted md:col-span-3 md:pt-4">Our vision</p>
          <h2 id="vision-title" data-reveal="lines" className="text-display-l md:col-span-9">
            We buy land slowly, design every square foot with care, and build in the open.
          </h2>
        </div>

        <div data-vision-track className="mt-24 grid items-start gap-14 md:mt-36 md:grid-cols-12 md:gap-10">
          <div className="md:sticky md:top-24 md:col-span-5">
            <VisionModel />
          </div>

          <div className="md:col-span-6 md:col-start-7 md:pt-24 md:pb-[30vh]">
            <p data-reveal="fade" className="text-lede text-ink/85">
              {site.name} develops across four kinds of property in the Chennai metropolitan region. Each project begins with the
              same three commitments.
            </p>
            <ol data-reveal="stagger" className="mt-14 border-t border-line">
              {principles.map((p, i) => (
                <li
                  key={p.title}
                  data-stage={i}
                  data-active={i === 0 ? "true" : "false"}
                  className="group relative grid gap-3 border-b border-line py-10 transition-colors duration-500 sm:grid-cols-[11rem_1fr] sm:gap-8 md:min-h-[62vh] md:content-center md:py-16"
                >
                  <span
                    aria-hidden="true"
                    className="absolute -left-5 top-10 hidden h-0 w-0.5 bg-bronze transition-all duration-700 group-data-[active=true]:h-[calc(100%-5rem)] md:block md:top-16 md:group-data-[active=true]:h-[calc(100%-8rem)]"
                  />
                  <h3 className="text-[1.6rem] leading-tight text-ink/45 transition-colors duration-500 group-data-[active=true]:text-ink">
                    <span className="label mb-3 block text-bronze">{String(i + 1).padStart(2, "0")}</span>
                    {p.title}
                  </h3>
                  <p className="text-muted/70 transition-colors duration-500 group-data-[active=true]:text-muted">{p.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>

        <CorridorModel />
      </div>
    </section>
  );
}
