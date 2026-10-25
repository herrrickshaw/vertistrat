import { createFileRoute } from "@tanstack/react-router";
import { CTA, Card, Chips, Eyebrow, SECTORS, Section, pageHead } from "@/components/site/ui";

export const Route = createFileRoute("/manufacturing")({
  head: () => pageHead("Manufacturing advisory", "Feasibility, site selection, project reports, approvals and incentives, supply chain localisation and operations improvement for manufacturers in India.", "/manufacturing"),
  component: Manufacturing,
});

const WORK = [
  ["Feasibility and market entry", "Demand, cost and policy context to decide whether, where and how big."],
  ["Site selection", "Shortlist states and parks against your criteria, then visit and compare."],
  ["Project reports", "Detailed project reports that lenders, boards and agencies can rely on."],
  ["Approvals and incentives", "Map approvals and schemes, prepare applications, track conditions."],
  ["Supply chain localisation", "Identify and qualify local suppliers; plan phased localisation."],
  ["Operations improvement", "Capacity, layout, quality and cost improvements in running plants."],
];

const PHASES = [
  ["Diagnose", "Decision brief, constraints register, data request list"],
  ["Design", "Options comparison, site shortlist, incentive map, draft project report"],
  ["Deliver", "Final project report, applications filed, supplier shortlist, implementation plan"],
  ["Hand over", "Compliance calendar, document set, owner list, claims schedule"],
];

function Manufacturing() {
  return (
    <>
      <section className="border-b">
        <div className="container-site py-16 md:py-24">
          <Eyebrow>Practice 01</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Manufacturing advisory</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">From the first feasibility question to a running plant, with the incentive file and the site plan built on the same numbers.</p>
        </div>
      </section>
      <Section id="work" eyebrow="Workstreams" title="Six workstreams">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {WORK.map(([t, d], i) => (
            <li key={t}><Card className="h-full"><span className="label-mono text-primary">W{i + 1}</span><h3 className="mt-2 text-lg font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></Card></li>
          ))}
        </ol>
      </Section>
      <Section id="deliverables" eyebrow="Deliverables" title="What you get at each phase" className="border-y bg-card/40">
        <div className="overflow-x-auto rounded-md border bg-card">
          <table className="w-full min-w-[320px] text-left text-sm">
            <caption className="sr-only">Deliverables by phase</caption>
            <thead><tr className="border-b"><th scope="col" className="label-mono p-4 text-muted-foreground">Phase</th><th scope="col" className="label-mono p-4 text-muted-foreground">Typical deliverables</th></tr></thead>
            <tbody>{PHASES.map(([p, d]) => <tr key={p} className="border-b last:border-0"><th scope="row" className="p-4 font-display font-semibold">{p}</th><td className="p-4 text-muted-foreground">{d}</td></tr>)}</tbody>
          </table>
        </div>
      </Section>
      <Section id="sectors" eyebrow="Sectors" title="Sectors"><Chips items={SECTORS.slice(0, 7)} /></Section>
      <CTA title="Choosing a site or scheme?" text="Send us the shortlist you have. We'll tell you what we'd check first." />
    </>
  );
}
