import { createFileRoute, Link } from "@tanstack/react-router";
import { Card, Chips, Eyebrow, SECTORS, Section, btn, pageHead } from "@/components/site/ui";
import { ArticleGrid } from "@/components/site/Feeds";
import { ContactForm } from "@/components/site/ContactForm";
import { CONTACT_EMAIL, MAX_FEATURED } from "@/config";

export const Route = createFileRoute("/")({
  head: () => pageHead("Manufacturing, IT and investment advisory", "VertiStrat connects policy, plant, platform and people: advisory for manufacturers, IT services firms and investors setting up in India.", "/"),
  component: Home,
});

const LAYERS = [
  ["L4", "Policy", "Incentives, approvals, state and central schemes"],
  ["L3", "Plant", "Site, capacity, layout, supply chain"],
  ["L2", "Platform", "IT, data, automation, cyber"],
  ["L1", "People", "Hiring, skills, change, governance"],
];

function Home() {
  return (
    <>
      <section className="border-b">
        <div className="container-site grid gap-12 py-16 md:py-24 lg:grid-cols-[1.3fr_1fr] lg:items-center">
          <div className="fade-up">
            <Eyebrow>Manufacturing · IT services · Investment facilitation</Eyebrow>
            <h1 className="mt-5 text-4xl font-bold leading-[1.05] sm:text-5xl lg:text-6xl">
              Strategy that goes from the <span className="highlight">policy desk</span> to the plant floor.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-muted-foreground">
              One team for the plan, the incentive file and the IT landscape, so they agree with each other.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/" hash="contact" className={btn.primary}>Discuss a project</Link>
              <Link to="/about" className={btn.outline}>How we work</Link>
            </div>
          </div>
          <aside aria-label="The four layers" className="rounded-md border bg-card">
            <p className="label-mono border-b px-5 py-3 text-muted-foreground">The stack we advise on</p>
            <ol>
              {LAYERS.map(([k, t, d], i) => (
                <li key={k} className={`flex gap-4 px-5 py-4 ${i < 3 ? "border-b" : ""}`}>
                  <span className={`label-mono mt-0.5 ${i === 0 ? "text-amber" : "text-primary"}`}>{k}</span>
                  <div><p className="font-display font-semibold">{t}</p><p className="text-sm text-muted-foreground">{d}</p></div>
                </li>
              ))}
            </ol>
          </aside>
        </div>
      </section>

      <Section id="services" eyebrow="Services" title="Two practices, one engagement team">
        <div className="grid gap-5 md:grid-cols-2">
          <Card>
            <p className="label-mono text-primary">Practice 01</p>
            <h3 className="mt-2 text-2xl font-semibold">Manufacturing advisory</h3>
            <p className="mt-3 text-muted-foreground">Feasibility, site selection, project reports, approvals and incentives, supply chain localisation and operations improvement.</p>
            <Link to="/manufacturing" className="mt-5 inline-block text-sm text-primary underline-offset-4 hover:underline">See workstreams →</Link>
          </Card>
          <Card>
            <p className="label-mono text-primary">Practice 02</p>
            <h3 className="mt-2 text-2xl font-semibold">IT services advisory</h3>
            <p className="mt-3 text-muted-foreground">Delivery centre and GCC set-up for IT firms; Industry 4.0 roadmaps, vendor selection and programme governance for manufacturers.</p>
            <Link to="/it-services" className="mt-5 inline-block text-sm text-primary underline-offset-4 hover:underline">See engagement models →</Link>
          </Card>
        </div>
      </Section>

      <section aria-labelledby="inv-h" className="bg-ink py-16 text-ink-foreground md:py-24">
        <div className="container-site">
          <p className="label-mono text-ink-muted">Investment facilitation</p>
          <h2 id="inv-h" className="mt-3 max-w-2xl text-3xl font-semibold md:text-4xl">From first briefing to the years after commissioning.</h2>
          <p className="mt-4 max-w-2xl text-ink-muted">The kind of support investment promotion agencies offer, delivered as an independent adviser working for you. We are not affiliated with any government agency.</p>
          <ol className="mt-10 grid gap-px overflow-hidden rounded-md border border-ink-border bg-ink-border sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["Investor briefing", "Market, policy and cost context for your board, in plain language."],
              ["Incentive mapping", "Which central and state schemes apply, and what each one requires of you."],
              ["Agency liaison", "Preparing and following up applications and meetings with the relevant bodies."],
              ["Aftercare", "Claims, compliance milestones and expansion support after you start operating."],
            ].map(([t, d], i) => (
              <li key={t} className="bg-ink p-6">
                <span className="label-mono text-amber">0{i + 1}</span>
                <h3 className="mt-3 text-lg font-semibold">{t}</h3>
                <p className="mt-2 text-sm text-ink-muted">{d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Section id="approach" eyebrow="Approach" title="Four steps, each with a written output">
        <ol className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Diagnose", "Understand the decision, constraints and what has already been done."],
            ["Design", "Options with reasons, costs and risks. One recommendation."],
            ["Deliver", "Run the workstreams, applications and vendor processes."],
            ["Hand over", "Documents, owners and a calendar. Then we step back."],
          ].map(([t, d], i) => (
            <li key={t} className="border-t-2 border-primary pt-4">
              <span className="label-mono text-muted-foreground">Step {i + 1}</span>
              <h3 className="mt-2 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{d}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="sectors" eyebrow="Sectors" title="Where we work" className="border-y bg-card/40">
        <Chips items={SECTORS} />
      </Section>

      <Section id="featured" eyebrow="Featured articles" title="Recent writing">
        <ArticleGrid limit={MAX_FEATURED} />
        <Link to="/insights" className="mt-6 inline-block text-sm text-primary hover:underline">All insights →</Link>
      </Section>

      <Section id="contact" eyebrow="Contact" title="Tell us what you're deciding" intro={<>A short note is enough. Or write to <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.</>}>
        <div className="max-w-2xl"><ContactForm /></div>
      </Section>
    </>
  );
}
