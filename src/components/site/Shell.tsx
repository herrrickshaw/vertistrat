import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { CONTACT_EMAIL, DISCLAIMER } from "@/config";
import { Logo } from "./ui";

const NAV = [
  { to: "/about", label: "About" },
  { to: "/manufacturing", label: "Manufacturing" },
  { to: "/it-services", label: "IT services" },
  { to: "/insights", label: "Insights" },
  { to: "/trade-ideas", label: "Trade ideas" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:bg-card focus:p-2">Skip to content</a>
      <div className="container-site flex h-16 items-center justify-between">
        <Link to="/" aria-label="VertiStrat home"><Logo /></Link>
        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-6 text-sm">
            {NAV.map((n) => (
              <li key={n.to}>
                <Link to={n.to} className="text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground highlight" }}>{n.label}</Link>
              </li>
            ))}
            <li><Link to="/" hash="contact" className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:opacity-90">Contact</Link></li>
          </ul>
        </nav>
        <button className="rounded-md border px-3 py-1.5 text-sm md:hidden" aria-expanded={open} aria-controls="mnav" onClick={() => setOpen(!open)}>
          {open ? "Close" : "Menu"}
        </button>
      </div>
      {open && (
        <nav id="mnav" aria-label="Mobile" className="border-t md:hidden">
          <ul className="container-site flex flex-col py-2">
            {[...NAV, { to: "/", label: "Contact" } as const].map((n) => (
              <li key={n.label}>
                <Link to={n.to} {...(n.label === "Contact" ? { hash: "contact" } : {})} onClick={() => setOpen(false)} className="block py-3">{n.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

export function Footer() {
  return (
    <footer className="border-t bg-ink text-ink-foreground">
      <div className="container-site grid gap-10 py-14 md:grid-cols-3">
        <div>
          <Logo />
          <p className="mt-4 text-sm text-ink-muted">VertiStrat Solutions LLP. Consulting for manufacturing, IT services and investment facilitation.</p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-3 inline-block text-sm underline">{CONTACT_EMAIL}</a>
        </div>
        <nav aria-label="Footer">
          <p className="label-mono text-ink-muted">Pages</p>
          <ul className="mt-3 grid grid-cols-2 gap-2 text-sm">
            {NAV.map((n) => <li key={n.to}><Link to={n.to} className="hover:underline">{n.label}</Link></li>)}
          </ul>
        </nav>
        <div>
          <p className="label-mono text-ink-muted">Disclaimer</p>
          <p className="mt-3 text-sm text-ink-muted">{DISCLAIMER}</p>
          <p className="mt-3 text-xs text-ink-muted">Not affiliated with any government agency or investment promotion body.</p>
        </div>
      </div>
      <div className="border-t border-ink-border">
        <p className="container-site py-5 text-xs text-ink-muted">© {new Date().getFullYear()} VertiStrat Solutions LLP. LLPIN: [placeholder]. Registered office: [placeholder].</p>
      </div>
    </footer>
  );
}
