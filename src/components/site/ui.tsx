import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Logo() {
  return (
    <span className="inline-flex items-center">
      <img src="/logo-light.png" alt="VertiStrat Solutions LLP" width={800} height={351} className="logo-light h-11 w-auto" />
      <img src="/logo-dark.png" alt="VertiStrat Solutions LLP" width={800} height={351} className="logo-dark h-11 w-auto" />
    </span>
  );
}

export function Eyebrow({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <p className={`label-mono flex items-center gap-2 text-muted-foreground ${className}`}>
      <span className="h-1.5 w-1.5 bg-amber" aria-hidden="true" />
      {children}
    </p>
  );
}

export function Section({ id, eyebrow, title, intro, children, className = "" }: {
  id?: string; eyebrow?: string; title?: ReactNode; intro?: ReactNode; children: ReactNode; className?: string;
}) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className={`py-16 md:py-24 ${className}`}>
      <div className="container-site">
        {(eyebrow || title) && (
          <header className="mb-10 max-w-2xl">
            {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
            {title && <h2 id={id ? `${id}-h` : undefined} className="mt-3 text-3xl font-semibold md:text-4xl">{title}</h2>}
            {intro && <p className="mt-4 text-muted-foreground">{intro}</p>}
          </header>
        )}
        {children}
      </div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-md border bg-card p-6 text-card-foreground ${className}`}>{children}</div>;
}

export function Chips({ items }: { items: string[] }) {
  return (
    <ul className="flex flex-wrap gap-2">
      {items.map((s) => (
        <li key={s} className="rounded-sm border bg-card px-3 py-1.5 text-sm">{s}</li>
      ))}
    </ul>
  );
}

export function Placeholder({ children }: { children: ReactNode }) {
  return <span className="label-mono rounded-sm border border-dashed border-amber px-1.5 py-0.5 text-amber">{children}</span>;
}

export const btn = {
  primary: "inline-flex items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90",
  outline: "inline-flex items-center justify-center gap-2 rounded-md border px-5 py-2.5 text-sm font-medium transition-colors hover:bg-muted",
};

export function CTA({ title, text }: { title: string; text: string }) {
  return (
    <section className="py-16">
      <div className="container-site">
        <div className="flex flex-col items-start gap-6 rounded-md bg-ink p-8 text-ink-foreground md:flex-row md:items-center md:justify-between md:p-12">
          <div className="max-w-xl">
            <h2 className="text-2xl font-semibold md:text-3xl">{title}</h2>
            <p className="mt-3 text-ink-muted">{text}</p>
          </div>
          <Link to="/" hash="contact" className="inline-flex shrink-0 items-center rounded-md bg-amber px-5 py-2.5 text-sm font-medium text-amber-foreground hover:opacity-90">
            Start a conversation
          </Link>
        </div>
      </div>
    </section>
  );
}

export const SECTORS = [
  "Automotive and EV components", "Electronics and semiconductors", "Engineering goods",
  "Pharma and medical devices", "Food processing", "Chemicals and specialty materials",
  "Renewable energy equipment", "Global capability centres", "SaaS and IT services",
];

export function pageHead(title: string, description: string, path: string) {
  const t = `${title} | VertiStrat Solutions LLP`;
  return {
    meta: [
      { title: t },
      { name: "description", content: description },
      { property: "og:title", content: t },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { property: "og:url", content: path },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: path }],
  };
}
