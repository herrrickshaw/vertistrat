import { createFileRoute } from "@tanstack/react-router";
import { Card, Eyebrow, Placeholder, Section, pageHead } from "@/components/site/ui";
import { ArticleGrid, GithubRepos } from "@/components/site/Feeds";

export const Route = createFileRoute("/insights")({
  head: () => pageHead("Insights", "Articles, explainers and open-source work from VertiStrat on manufacturing, incentives and IT delivery.", "/insights"),
  component: Insights,
});

const SAMPLES = [
  ["Comparing states for a plant site", "Which factors actually differ between states once you look past headline incentives: power, land conversion, labour and approval timelines."],
  ["Build-operate-transfer, explained", "How a BOT arrangement for a delivery centre works, where the risks sit, and what to put in the transfer clause."],
  ["Reading incentive conditions", "Investment thresholds, employment commitments and clawbacks: how to read the conditions before you count the benefit."],
];

function Insights() {
  return (
    <>
      <section className="border-b">
        <div className="container-site py-16 md:py-20">
          <Eyebrow>Insights</Eyebrow>
          <h1 className="mt-4 text-4xl font-bold md:text-5xl">Insights</h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground">Featured articles, short explainers and code we've published.</p>
        </div>
      </section>
      <Section id="articles" eyebrow="Featured articles" title="From the blog"><ArticleGrid filterable /></Section>
      <Section id="explainers" eyebrow="Explainers" title="Short explainers" className="border-y bg-card/40">
        <ul className="grid gap-5 md:grid-cols-3">
          {SAMPLES.map(([t, d]) => <li key={t}><Card className="h-full"><Placeholder>Sample draft</Placeholder><h3 className="mt-3 text-lg font-semibold">{t}</h3><p className="mt-2 text-sm text-muted-foreground">{d}</p></Card></li>)}
        </ul>
      </Section>
      <Section id="github" eyebrow="Open source" title="From our GitHub"><GithubRepos /></Section>
    </>
  );
}
