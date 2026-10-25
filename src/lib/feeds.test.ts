import { describe, expect, it } from "vitest";
import { isStale, mapFeed, parseTradeIdeas } from "./feeds";

describe("trade ideas staleness", () => {
  const now = new Date("2026-10-23T00:00:00Z");
  it("is fresh at 7 days", () => expect(isStale("2026-10-16", now)).toBe(false));
  it("is stale beyond 7 days", () => expect(isStale("2026-10-15", now)).toBe(true));
});

describe("parseTradeIdeas", () => {
  it("drops rows with invalid action", () => {
    const rows = parseTradeIdeas([
      { symbol: "A", exchange: "NSE", action: "BUY", entry: 1, target: null, stop: null, thesis: "", asOf: "2026-10-01" },
      { symbol: "B", exchange: "NSE", action: "MAYBE" },
    ]);
    expect(rows.map((r) => r.symbol)).toEqual(["A"]);
  });
});

describe("mapFeed", () => {
  it("uses the alternate link and first image", () => {
    const a = mapFeed({
      feed: { entry: [{ title: { $t: "T" }, link: [{ rel: "self", href: "x" }, { rel: "alternate", href: "y" }], content: { $t: '<img src="i.jpg"><p>Hi</p>' } }] },
    })[0]!;
    expect(a.link).toBe("y");
    expect(a.image).toBe("i.jpg");
  });
});
