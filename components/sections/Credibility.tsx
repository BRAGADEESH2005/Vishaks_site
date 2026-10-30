import { ProcessJourney } from "./ProcessJourney";
import { ToConfirm } from "@/components/ui/ConceptNote";
import { site } from "@/data/site";

const stages = [
  {
    step: "Select",
    body: "Shortlist land inside a target corridor against a fixed checklist of title, access and demand.",
    detail: "Every parcel is judged as an investor would judge it: a clean title chain, road access, the zoning it allows and the demand around it, before any design work begins.",
  },
  {
    step: "Secure",
    body: "Buy outright, or sign a joint development agreement with the landowner.",
    detail: "Landowners can sell, or stay invested through a joint development agreement that shares the finished built area or revenue.",
  },
  {
    step: "Approve",
    body: "Planning permission, environmental clearance and TNRERA registration before any marketing.",
    detail: "Nothing is offered for sale until the project is registered with TNRERA, and the registration is shown on the project page.",
  },
  {
    step: "Build",
    body: "Construction with progress published on each project page.",
    detail: "Progress is reported stage by stage with photographs, so buyers, tenants and partners can check the work for themselves.",
  },
  {
    step: "Sell or lease",
    body: "Plots and homes are sold. Offices and retail can be leased and held.",
    detail: "Residential projects are sold. Commercial buildings can be leased to occupiers and held as income-producing assets.",
  },
];

/**
 * Only verified facts appear as facts. Everything the company has not yet
 * supplied is listed openly as pending rather than filled with invented
 * numbers, logos or awards.
 */
export function Credibility() {
  const verified = [
    { label: "Headquarters", value: site.city },
    { label: "What we build", value: site.verticals.join(", ") },
    { label: "Where", value: "The Chennai metropolitan region, along four target corridors" },
    { label: "Where we stand", value: site.stage },
    { label: "Our rule on marketing", value: "No project is marketed before it is registered with TNRERA" },
  ];
  const pending = ["Leadership and their track records", "Delivered projects", "Architects, consultants and partners", "Registered company details"];

  return (
    <section id="company" aria-labelledby="company-title" className="bg-paper py-28 md:py-40">
      <div className="gutter shell">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-5">
            <p className="label text-muted">The company</p>
            <h2 id="company-title" data-reveal="lines" className="mt-5 text-display-l">
              What we can tell you today
            </h2>
            <p className="mt-8 max-w-md text-muted">
              Vishaks is a young developer. We would rather show you a short list of true statements than a long list of
              impressive ones.
            </p>
          </div>

          <div className="md:col-span-6 md:col-start-7">
            <dl data-reveal="stagger" className="border-t border-ink">
              {verified.map((f) => (
                <div key={f.label} className="grid gap-2 border-b border-line py-6 sm:grid-cols-[12rem_1fr] sm:gap-8">
                  <dt className="label pt-1 text-muted">{f.label}</dt>
                  <dd className="text-[1.08rem]">{f.value}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-12">
              <p className="label text-muted">Shared with partners as it is confirmed</p>
              <ul className="mt-5 grid gap-3 sm:grid-cols-2">
                {pending.map((p) => (
                  <li key={p} className="flex flex-col gap-2 border border-dashed border-stone-2 p-5">
                    <span>{p}</span>
                    <ToConfirm />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-28 border-t border-line pt-14 md:mt-36">
          <div className="grid gap-8 md:grid-cols-12">
            <p className="label text-muted md:col-span-3">How a project moves</p>
            <h3 data-reveal="fade" className="text-display-m md:col-span-9">
              From a parcel of land to a finished address, in five stages.
            </h3>
          </div>
          <div className="mt-14">
            <ProcessJourney stages={stages} />
          </div>
        </div>
      </div>
    </section>
  );
}
