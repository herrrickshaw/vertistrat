import { createFileRoute } from "@tanstack/react-router";
import { CTA, Card, Eyebrow, Placeholder, Section, pageHead } from "@/components/site/ui";

export const Route = createFileRoute("/about")({
  head: () => pageHead("About", "Why VertiStrat exists, the principles we work by, who we work with and the partners who lead engagements.", "/about"),
  component: About,
});

function About() {
  return (
    <>
      <section className="border-b">
        <div className="container-site py-16 md:py-24">
          <Eyebrow>About</Eyebrow>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight md:text-5xl">Projects stall <span className="highlight">between</span> the layers.</h1>
          <div className="mt-8 grid max-w-4xl gap-6 text-muted-foreground md:grid-cols-2">
            <p>A plant plan, an incentive application and an IT landscape are often written by three different advisers. Each is reasonable on its own. Together they contradict each other: a capacity the scheme won't recognise, a site the network can't serve, a timeline the hiring plan can't meet.</p>
            <p>VertiStrat exists to keep those documents consistent. One team works across policy, plant, platform and people, and is accountable for the whole picture.</p>
          </div>
        </div>
      </section>

      <Section id="principles" eyebrow="Principles" title="How we work">
        <ol className="grid gap-5 sm:grid-cols-2">
          {[
            ["Recommend with reasons", "We give one recommendation, the alternatives we rejected, and why."],
            ["Scope in writing", "Deliverables, assumptions and exclusions agreed before work starts."],
            ["Independent of vendors and sites", "We take no commissions from vendors, landowners or parks we evaluate."],
            ["Hand over, then step back", "Your team owns the outputs. We don't build dependence."],
          ].map(([t, d], i) => (
            <li key={t}><Card className="h-full"><span className="label-mono text-amber">0{i + 1}</span><h3 className="mt-2 text-xl font-semibold">{t}</h3><p className="mt-2 text-muted-foreground">{d}</p></Card></li>
          ))}
        </ol>
      </Section>

      <Section id="clients" eyebrow="Who we work with" title="Three kinds of client" className="border-y bg-card/40">
        <div className="grid gap-5 md:grid-cols-3">
          {[
            ["Overseas manufacturers", "Entering India or adding capacity, and needing a site, incentives and a credible project report."],
            ["Indian manufacturers", "Expanding, relocating or modernising, often across more than one state."],
            ["IT services firms", "Setting up delivery centres or GCCs, or selling into manufacturing."],
          ].map(([t, d]) => <Card key={t}><h3 className="text-lg font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></Card>)}
        </div>
      </Section>

      <Section id="partners" eyebrow="Partners" title="Who leads engagements">
        <ul className="grid gap-5 md:grid-cols-3">
          {[1, 2, 3].map((n) => (
            <li key={n}>
              <Card className="h-full">
                <div className="flex aspect-square w-16 items-center justify-center rounded-md border border-dashed text-muted-foreground" aria-hidden="true">?</div>
                <h3 className="mt-4 text-lg font-semibold">Partner name</h3>
                <p className="mt-1 text-sm text-muted-foreground">Role and focus area</p>
                <p className="mt-3"><Placeholder>Add real bio and credentials</Placeholder></p>
              </Card>
            </li>
          ))}
        </ul>
      </Section>
      <CTA title="Have a project that crosses layers?" text="Tell us what's been decided and what hasn't. We'll say whether we can help." />
    </>
  );
}
