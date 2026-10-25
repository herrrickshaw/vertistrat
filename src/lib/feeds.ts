export type Article = {
  id: string;
  title: string;
  link: string;
  published: string;
  image: string | null;
  excerpt: string;
  categories: string[];
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>|<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function excerpt(text: string, max = 160): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  const sp = cut.lastIndexOf(" ");
  return `${(sp > 80 ? cut.slice(0, sp) : cut).trim()}…`;
}

export function mapFeed(json: any): Article[] {
  const entries: any[] = json?.feed?.entry ?? [];
  return entries.map((e, i) => {
    const html: string = e?.content?.$t ?? e?.summary?.$t ?? "";
    const thumb: string | undefined = e?.media$thumbnail?.url;
    const imgMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i);
    const link = (e?.link ?? []).find((l: any) => l.rel === "alternate")?.href ?? "";
    return {
      id: e?.id?.$t ?? String(i),
      title: e?.title?.$t || "Untitled",
      link,
      published: e?.published?.$t ?? "",
      image: (thumb ? thumb.replace(/\/s72(-c)?\//, "/w600-h340-c/") : null) ?? imgMatch?.[1] ?? null,
      excerpt: excerpt(stripHtml(html)),
      categories: (e?.category ?? []).map((c: any) => c.term).filter(Boolean),
    };
  });
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export type Action = "BUY" | "WATCH" | "SELL" | "HOLD";
export type TradeIdea = {
  symbol: string;
  exchange: string;
  action: Action;
  entry: number | null;
  target: number | null;
  stop: number | null;
  thesis: string;
  asOf: string;
};

const ACTIONS: Action[] = ["BUY", "WATCH", "SELL", "HOLD"];

export function parseTradeIdeas(json: unknown): TradeIdea[] {
  if (!Array.isArray(json)) throw new Error("Expected a JSON array");
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : null);
  return json
    .filter((r: any) => r && typeof r.symbol === "string" && ACTIONS.includes(r.action))
    .map((r: any) => ({
      symbol: r.symbol,
      exchange: String(r.exchange ?? ""),
      action: r.action,
      entry: num(r.entry),
      target: num(r.target),
      stop: num(r.stop),
      thesis: String(r.thesis ?? ""),
      asOf: String(r.asOf ?? ""),
    }));
}

export function isStale(asOf: string, now: Date = new Date(), days = 7): boolean {
  const d = new Date(`${asOf}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return true;
  return now.getTime() - d.getTime() > days * 86_400_000;
}
