import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Eyebrow, pageHead } from "@/components/site/ui";
import { DISCLAIMER, TRADE_IDEAS_URL, TRADE_STALE_DAYS } from "@/config";
import { formatDate, isStale, parseTradeIdeas, type Action, type TradeIdea } from "@/lib/feeds";

export const Route = createFileRoute("/trade-ideas")({
  head: () => pageHead("Trade ideas", "Informational trade ideas published from a JSON file. Not investment advice.", "/trade-ideas"),
  component: TradeIdeas,
});

const SAMPLE: TradeIdea[] = [
  { symbol: "SAMPLE-A", exchange: "NSE", action: "WATCH", entry: 100, target: 120, stop: 92, thesis: "Placeholder row to preview the layout.", asOf: "2026-01-05" },
  { symbol: "SAMPLE-B", exchange: "BSE", action: "HOLD", entry: null, target: null, stop: null, thesis: "Placeholder row to preview the layout.", asOf: "2026-01-05" },
  { symbol: "SAMPLE-C", exchange: "NSE", action: "BUY", entry: 250, target: 290, stop: 235, thesis: "Placeholder row to preview the layout.", asOf: "2026-01-05" },
  { symbol: "SAMPLE-D", exchange: "NASDAQ", action: "SELL", entry: 40, target: 32, stop: 44, thesis: "Placeholder row to preview the layout.", asOf: "2026-01-05" },
];

const PILL: Record<Action, string> = {
  BUY: "bg-success text-success-foreground",
  SELL: "bg-destructive text-destructive-foreground",
  WATCH: "bg-amber text-amber-foreground",
  HOLD: "bg-muted text-foreground border",
};

type SortKey = "symbol" | "exchange" | "action" | "asOf";
const fmt = (n: number | null) => (n == null ? "—" : n.toLocaleString("en-IN"));
const sel = "rounded-md border bg-card px-3 py-2 text-sm";

function TradeIdeas() {
  const placeholder = TRADE_IDEAS_URL.includes("REPLACE_REPO");
  const q = useQuery({
    queryKey: ["trades"],
    enabled: !placeholder,
    retry: false,
    queryFn: async () => {
      const r = await fetch(TRADE_IDEAS_URL, { cache: "no-store" });
      if (r.status === 404) return [];
      if (!r.ok) throw new Error(String(r.status));
      return parseTradeIdeas(await r.json());
    },
  });
  const [sample, setSample] = useState(false);
  const [action, setAction] = useState("ALL");
  const [exchange, setExchange] = useState("ALL");
  const [sort, setSort] = useState<{ k: SortKey; dir: 1 | -1 }>({ k: "asOf", dir: -1 });

  const source = sample ? SAMPLE : (q.data ?? []);
  const exchanges = useMemo(() => [...new Set(source.map((r) => r.exchange))].sort(), [source]);
  const rows = useMemo(
    () => source.filter((r) => (action === "ALL" || r.action === action) && (exchange === "ALL" || r.exchange === exchange))
      .sort((a, b) => a[sort.k].localeCompare(b[sort.k]) * sort.dir),
    [source, action, exchange, sort],
  );
  const latest = source.reduce((m, r) => (r.asOf > m ? r.asOf : m), "");
  const stale = !sample && latest !== "" && isStale(latest, new Date(), TRADE_STALE_DAYS);

  const th = (k: SortKey, label: string) => (
    <th scope="col" aria-sort={sort.k === k ? (sort.dir === 1 ? "ascending" : "descending") : "none"} className="p-3">
      <button className="label-mono text-muted-foreground hover:text-foreground" onClick={() => setSort((s) => ({ k, dir: s.k === k ? ((-s.dir) as 1 | -1) : 1 }))}>
        {label}{sort.k === k ? (sort.dir === 1 ? " ↑" : " ↓") : ""}
      </button>
    </th>
  );

  return (
    <div className="container-site py-16 md:py-20">
      <Eyebrow>Trade ideas</Eyebrow>
      <h1 className="mt-4 text-4xl font-bold md:text-5xl">Trade ideas</h1>

      <div role="note" className="mt-8 rounded-md border-2 border-amber bg-card p-5">
        <p className="label-mono text-amber">Important disclaimer</p>
        <p className="mt-2 font-medium">{DISCLAIMER}</p>
      </div>

      <div className="mt-8 flex flex-wrap items-end gap-4">
        <label className="text-sm">Action<br />
          <select className={sel} value={action} onChange={(e) => setAction(e.target.value)}>
            {["ALL", "BUY", "WATCH", "HOLD", "SELL"].map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="text-sm">Exchange<br />
          <select className={sel} value={exchange} onChange={(e) => setExchange(e.target.value)}>
            {["ALL", ...exchanges].map((a) => <option key={a}>{a}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={sample} onChange={(e) => { setSample(e.target.checked); setExchange("ALL"); }} className="h-4 w-4 accent-primary" />
          Show sample data
        </label>
        {latest && (
          <p className="label-mono ml-auto flex items-center gap-2 text-muted-foreground">
            As of {formatDate(latest)}
            {stale && <span className="rounded-sm bg-destructive px-2 py-0.5 text-destructive-foreground">Stale: older than {TRADE_STALE_DAYS} days</span>}
          </p>
        )}
      </div>

      {sample && <p className="label-mono mt-4 rounded-sm bg-destructive px-3 py-2 text-destructive-foreground">Sample data, not a recommendation</p>}

      <div className="mt-6">
        {!sample && q.isLoading ? (
          <p role="status" className="rounded-md border p-6 text-sm text-muted-foreground">Loading…</p>
        ) : !sample && q.isError ? (
          <p role="status" className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">Couldn't load the trade ideas file. Check the URL and that the file is valid JSON.</p>
        ) : rows.length === 0 ? (
          <div role="status" className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">No trade ideas published.</p>
            <p className="mt-2">To publish, commit a <code className="font-mono">trade_ideas.json</code> file to a public GitHub repo and set <code className="font-mono">TRADE_IDEAS_URL</code> in the site config to its raw URL. Each row needs: symbol, exchange, action (BUY, WATCH, SELL or HOLD), entry, target, stop (numbers or null), thesis and asOf (YYYY-MM-DD).</p>
            {placeholder && <p className="mt-2 text-amber">The URL is still a placeholder.</p>}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border bg-card">
            <table className="w-full min-w-[720px] text-left text-sm">
              <caption className="sr-only">Trade ideas{sample ? " (sample data, not a recommendation)" : ""}</caption>
              <thead className="border-b"><tr>{th("symbol", "Symbol")}{th("exchange", "Exchange")}{th("action", "Action")}<th className="label-mono p-3 text-muted-foreground">Entry</th><th className="label-mono p-3 text-muted-foreground">Target</th><th className="label-mono p-3 text-muted-foreground">Stop</th><th className="label-mono p-3 text-muted-foreground">Thesis</th>{th("asOf", "As of")}</tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={`${r.symbol}-${i}`} className="border-b last:border-0 align-top">
                    <td className="p-3 font-mono font-medium">{r.symbol}{sample && <span className="label-mono block text-destructive">Sample</span>}</td>
                    <td className="p-3">{r.exchange}</td>
                    <td className="p-3"><span className={`label-mono rounded-sm px-2 py-0.5 ${PILL[r.action]}`}>{r.action}</span></td>
                    <td className="p-3 font-mono">{fmt(r.entry)}</td><td className="p-3 font-mono">{fmt(r.target)}</td><td className="p-3 font-mono">{fmt(r.stop)}</td>
                    <td className="p-3 text-muted-foreground">{r.thesis}</td>
                    <td className="p-3 font-mono whitespace-nowrap">{r.asOf}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
