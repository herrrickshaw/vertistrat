import { createFileRoute } from "@tanstack/react-router";
import { CTA, Card, Eyebrow, Section, pageHead } from "@/components/site/ui";

export const Route = createFileRoute("/it-services")({
  head: () => pageHead("IT services advisory", "Delivery centre and GCC set-up for IT services firms; Industry 4.0 roadmaps, vendor selection and programme governance for manufacturers.", "/it-services"),
  component: ITServices,
});

const AUD = [
  { t: "IT services firms", items: ["Delivery centre and GCC set-up", "Entity structure and incentives", "Hiring plan", "Build-operate-transfer", "Go-to-market into manufacturing"] },
  { t: "Manufacturers", items: ["Industry 4.0 roadmap", "Vendor selection", "Programme governance", "Cloud, data and cyber readiness", "Change management"] },
];

function ITServices() {
  return (
    <>
      <section className="border-b">
        <div className="container-site py-16 md:py-24">
          <Eyebrow>Practice 02</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">IT services advisory</h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">For firms building delivery capacity in India, and for manufacturers buying technology they need to work on the plant floor.</p>
        </div>
      </section>
      <Section id="audiences" eyebrow="Who it's for" title="Two audiences">
        <div className="grid gap-5 md:grid-cols-2">
          {AUD.map((a) => (
            <Card key={a.t}>
              <h3 className="text-2xl font-semibold">{a.t}</h3>
              <ul className="mt-4 divide-y">{a.items.map((i) => <li key={i} className="flex items-center gap-3 py-3"><span className="h-1.5 w-1.5 shrink-0 bg-primary" aria-hidden="true" />{i}</li>)}</ul>
            </Card>
          ))}
        </div>
      </Section>
      <Section id="models" eyebrow="Engagement models" title="Three ways to work with us" className="border-y bg-card/40">
        <ol className="grid gap-5 md:grid-cols-3">
          {[
            ["Assess", "A fixed-scope review with a written recommendation."],
            ["Set up", "We run the set-up or programme with your team until it's operating."],
            ["Assure", "Independent oversight of a programme others are delivering."],
          ].map(([t, d], i) => <li key={t}><Card className="h-full"><span className="label-mono text-amber">0{i + 1}</span><h3 className="mt-2 text-xl font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></Card></li>)}
        </ol>
      </Section>
      <CTA title="Planning a centre or a digital programme?" text="Share the brief. We'll reply with what we'd scope and what we wouldn't." />
    </>
  );
}
