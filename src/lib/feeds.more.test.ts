import { describe, expect, it } from "vitest";
import { excerpt, formatDate, isStale, mapFeed, parseTradeIdeas, stripHtml } from "./feeds";

describe("stripHtml", () => {
  it("removes tags and collapses whitespace", () => {
    expect(stripHtml("<p>Hello   <b>world</b></p>\n<br/>!")).toBe("Hello world !");
  });
  it("drops script and style blocks entirely, case-insensitively and across lines", () => {
    expect(stripHtml("a<script>\nalert(1)\n</script>b<STYLE>x{}\n</STYLE>c")).toBe("a b c");
  });
  it("decodes the supported entities", () => {
    expect(stripHtml("a&nbsp;b &amp; c &quot;d&quot; &#39;e&#39; &lt;f&gt;")).toBe(
      `a b & c "d" 'e' <f>`,
    );
  });
  // Source bug: &amp; is decoded before &lt;/&gt;/&quot;, so "&amp;lt;" (the literal text "&lt;")
  // is double-decoded into "<".
  it.fails(
    "does not double-decode entities ('&amp;lt;' must become the literal text '&lt;')",
    () => {
      expect(stripHtml("&amp;lt;")).toBe("&lt;");
    },
  );
  it("returns an empty string for empty or tag-only input", () => {
    expect(stripHtml("")).toBe("");
    expect(stripHtml("<div><br></div>")).toBe("");
  });
});

describe("excerpt", () => {
  it("returns text unchanged when at or below the limit", () => {
    const t = "a".repeat(160);
    expect(excerpt(t)).toBe(t);
    expect(excerpt("short", 5)).toBe("short");
  });
  it("cuts at the last space when it falls after position 80", () => {
    const text = `${"a".repeat(90)} ${"b".repeat(100)}`;
    expect(excerpt(text)).toBe(`${"a".repeat(90)}…`);
  });
  it("hard-cuts when the last space is at or before position 80", () => {
    // space at index 80 => sp > 80 is false => hard cut at max
    const text = `${"a".repeat(80)} ${"b".repeat(200)}`;
    expect(excerpt(text)).toBe(`${"a".repeat(80)} ${"b".repeat(79)}…`);
  });
  it("hard-cuts when there is no space at all", () => {
    expect(excerpt("x".repeat(200))).toBe(`${"x".repeat(160)}…`);
  });
  it("cuts at a space at index 81 (first index that passes the >80 check)", () => {
    const text = `${"a".repeat(81)} ${"b".repeat(200)}`;
    expect(excerpt(text)).toBe(`${"a".repeat(81)}…`);
  });
  it("honours a custom max and trims trailing whitespace before the ellipsis", () => {
    expect(excerpt("x".repeat(100), 90)).toBe(`${"x".repeat(90)}…`);
    const text = `${"a".repeat(85)}  ${"b".repeat(50)}`;
    expect(excerpt(text, 100)).toBe(`${"a".repeat(85)}…`);
  });
});

describe("mapFeed", () => {
  it("returns [] for missing, empty or malformed feeds", () => {
    expect(mapFeed(undefined)).toEqual([]);
    expect(mapFeed(null)).toEqual([]);
    expect(mapFeed({})).toEqual([]);
    expect(mapFeed({ feed: {} })).toEqual([]);
    expect(mapFeed({ feed: { entry: [] } })).toEqual([]);
  });

  it("maps a full entry", () => {
    const [a] = mapFeed({
      feed: {
        entry: [
          {
            id: { $t: "id-1" },
            title: { $t: "Title" },
            link: [{ rel: "alternate", href: "https://x/y" }],
            published: { $t: "2026-01-02T00:00:00Z" },
            content: { $t: "<p>Body text</p>" },
            category: [{ term: "A" }, { term: "" }, {}, { term: "B" }],
          },
        ],
      },
    });
    expect(a).toEqual({
      id: "id-1",
      title: "Title",
      link: "https://x/y",
      published: "2026-01-02T00:00:00Z",
      image: null,
      excerpt: "Body text",
      categories: ["A", "B"],
    });
  });

  it("falls back to index id, 'Untitled', empty link/published/categories", () => {
    const out = mapFeed({ feed: { entry: [{}, { title: { $t: "" } }] } });
    expect(out.map((a) => a.id)).toEqual(["0", "1"]);
    expect(out[0]).toMatchObject({
      title: "Untitled",
      link: "",
      published: "",
      image: null,
      excerpt: "",
      categories: [],
    });
    expect(out[1]!.title).toBe("Untitled");
  });

  it("uses summary when content is absent, and content wins when both exist", () => {
    const [s] = mapFeed({ feed: { entry: [{ summary: { $t: "<b>sum</b>" } }] } });
    expect(s!.excerpt).toBe("sum");
    const [c] = mapFeed({ feed: { entry: [{ content: { $t: "con" }, summary: { $t: "sum" } }] } });
    expect(c!.excerpt).toBe("con");
  });

  it("returns an empty link when there is no alternate link", () => {
    const [a] = mapFeed({ feed: { entry: [{ link: [{ rel: "self", href: "x" }] }] } });
    expect(a!.link).toBe("");
  });

  it("upsizes the Blogger thumbnail (/s72/ and /s72-c/) and prefers it over the inline img", () => {
    const base = { content: { $t: '<img src="inline.jpg">' } };
    const [a] = mapFeed({
      feed: { entry: [{ ...base, media$thumbnail: { url: "https://h/a/s72-c/p.jpg" } }] },
    });
    expect(a!.image).toBe("https://h/a/w600-h340-c/p.jpg");
    const [b] = mapFeed({
      feed: { entry: [{ ...base, media$thumbnail: { url: "https://h/a/s72/p.jpg" } }] },
    });
    expect(b!.image).toBe("https://h/a/w600-h340-c/p.jpg");
  });

  it("leaves non-matching thumbnail URLs untouched", () => {
    const [a] = mapFeed({
      feed: { entry: [{ media$thumbnail: { url: "https://h/a/s200/p.jpg" } }] },
    });
    expect(a!.image).toBe("https://h/a/s200/p.jpg");
  });

  it("falls back to the first inline image (single or double quotes) when no thumbnail", () => {
    const [a] = mapFeed({
      feed: { entry: [{ content: { $t: "<IMG alt='x' src='one.png'><img src=\"two.png\">" } }] },
    });
    expect(a!.image).toBe("one.png");
  });
});

describe("formatDate", () => {
  it("formats valid ISO dates in en-GB style", () => {
    expect(formatDate("2026-03-05T12:00:00Z")).toBe("5 Mar 2026");
  });
  it("returns an empty string for invalid or empty input", () => {
    expect(formatDate("not a date")).toBe("");
    expect(formatDate("")).toBe("");
  });
});

describe("parseTradeIdeas", () => {
  it("throws on non-arrays", () => {
    for (const bad of [null, undefined, {}, "x", 3]) {
      expect(() => parseTradeIdeas(bad)).toThrow("Expected a JSON array");
    }
  });
  it("accepts each valid action and rejects lowercase / unknown actions", () => {
    const rows = parseTradeIdeas(
      ["BUY", "WATCH", "SELL", "HOLD", "buy", "", null].map((action) => ({ symbol: "S", action })),
    );
    expect(rows.map((r) => r.action)).toEqual(["BUY", "WATCH", "SELL", "HOLD"]);
  });
  it("drops falsy rows and rows whose symbol is not a string", () => {
    const rows = parseTradeIdeas([
      null,
      0,
      "",
      { action: "BUY" },
      { symbol: 1, action: "BUY" },
      { symbol: "", action: "BUY" },
    ]);
    expect(rows.map((r) => r.symbol)).toEqual([""]);
  });
  it("applies defaults for missing optional fields", () => {
    expect(parseTradeIdeas([{ symbol: "S", action: "BUY" }])).toEqual([
      {
        symbol: "S",
        exchange: "",
        action: "BUY",
        entry: null,
        target: null,
        stop: null,
        thesis: "",
        asOf: "",
      },
    ]);
  });
  it("keeps finite numbers (including 0 and negatives) and nulls everything else", () => {
    const [r] = parseTradeIdeas([
      { symbol: "S", action: "BUY", entry: 0, target: -5.5, stop: Infinity },
    ]);
    expect(r).toMatchObject({ entry: 0, target: -5.5, stop: null });
    const [q] = parseTradeIdeas([
      { symbol: "S", action: "BUY", entry: "12", target: NaN, stop: undefined },
    ]);
    expect(q).toMatchObject({ entry: null, target: null, stop: null });
  });
  it("stringifies non-string exchange / thesis / asOf", () => {
    const [r] = parseTradeIdeas([
      { symbol: "S", action: "SELL", exchange: 5, thesis: 7, asOf: 20260101 },
    ]);
    expect(r).toMatchObject({ exchange: "5", thesis: "7", asOf: "20260101" });
  });
});

describe("isStale", () => {
  const now = new Date("2026-10-23T00:00:00Z");
  it("is stale for invalid / empty dates", () => {
    expect(isStale("garbage", now)).toBe(true);
    expect(isStale("", now)).toBe(true);
  });
  it("is not stale for exactly the limit and stale 1ms after it", () => {
    expect(isStale("2026-10-16", now)).toBe(false);
    expect(isStale("2026-10-16", new Date(now.getTime() + 1))).toBe(true);
  });
  it("honours a custom day count", () => {
    expect(isStale("2026-10-22", now, 1)).toBe(false);
    expect(isStale("2026-10-21", now, 1)).toBe(true);
  });
  it("is fresh for future dates", () => {
    expect(isStale("2027-01-01", now)).toBe(false);
  });
  it("defaults now to the current time", () => {
    const today = new Date().toISOString().slice(0, 10);
    expect(isStale(today)).toBe(false);
    expect(isStale("2000-01-01")).toBe(true);
  });
});
