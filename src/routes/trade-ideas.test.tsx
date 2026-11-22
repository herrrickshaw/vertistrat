import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const cfg = vi.hoisted(() => ({ url: "https://raw.example.test/ideas.json" }));
vi.mock("@/config", async (orig) => {
  const actual = await orig<typeof import("@/config")>();
  return {
    ...actual,
    get TRADE_IDEAS_URL() {
      return cfg.url;
    },
  };
});

import { DISCLAIMER, TRADE_STALE_DAYS } from "@/config";
import { Route } from "./trade-ideas";

// Role queries are slow in jsdom; keep generous headroom on busy CI runners.
vi.setConfig({ testTimeout: 15_000 });

const Page = Route.options.component as ComponentType;
const PLACEHOLDER_URL =
  "https://raw.githubusercontent.com/herrrickshaw/REPLACE_REPO/main/trade_ideas.json";

function renderPage() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <Page />
    </QueryClientProvider>,
  );
}
const idea = (o: Record<string, unknown> = {}) => ({
  symbol: "AAA",
  exchange: "NSE",
  action: "BUY",
  entry: 100,
  target: 120,
  stop: 90,
  thesis: "Because",
  asOf: "2026-10-20",
  ...o,
});
function mockFetch(res: Partial<Response> | Error) {
  const f = vi.fn(async () => {
    if (res instanceof Error) throw res;
    return res as Response;
  });
  vi.stubGlobal("fetch", f);
  return f;
}
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
// Plain DOM queries: role-based queries over the table are slow enough in jsdom to flake on busy CI.
const symbols = () =>
  Array.from(document.querySelectorAll("tbody tr")).map((r) => r.querySelector("td")!.textContent);
const cellsOfFirstRow = () =>
  Array.from(document.querySelector("tbody tr")!.querySelectorAll("td"));

beforeEach(() => {
  cfg.url = "https://raw.example.test/ideas.json";
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-23T00:00:00Z"));
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("route head", () => {
  it("sets page metadata", () => {
    const h = (Route.options.head as () => { meta: Array<Record<string, string>> })();
    expect(h.meta[0]).toEqual({ title: "Trade ideas | VertiStrat Solutions LLP" });
  });
});

describe("Trade ideas page", () => {
  it("always shows the disclaimer", () => {
    cfg.url = PLACEHOLDER_URL;
    renderPage();
    expect(screen.getByRole("note")).toHaveTextContent(DISCLAIMER);
  });

  it("does not fetch while the URL is still the placeholder and says so", () => {
    cfg.url = PLACEHOLDER_URL;
    const f = mockFetch(ok([]));
    renderPage();
    expect(f).not.toHaveBeenCalled();
    expect(screen.getByText("No trade ideas published.")).toBeInTheDocument();
    expect(screen.getByText("The URL is still a placeholder.")).toBeInTheDocument();
  });

  it("shows loading, then rows, fetching with cache: no-store", async () => {
    const f = mockFetch(ok([idea({ symbol: "A" }), idea({ symbol: "B", exchange: "BSE" })]));
    renderPage();
    expect(screen.getByText("Loading…")).toBeInTheDocument();
    await screen.findByRole("table");
    expect(f).toHaveBeenCalledWith(cfg.url, { cache: "no-store" });
    expect(symbols().sort()).toEqual(["A", "B"]);
  });

  it("treats a 404 as 'no ideas published' (no error)", async () => {
    mockFetch({ ok: false, status: 404 });
    renderPage();
    expect(await screen.findByText("No trade ideas published.")).toBeInTheDocument();
    expect(screen.queryByText("The URL is still a placeholder.")).toBeNull();
    expect(screen.queryByText(/Couldn't load/)).toBeNull();
  });

  it("shows the load error for non-404 HTTP failures, network errors and invalid JSON shape", async () => {
    mockFetch({ ok: false, status: 500 });
    const a = renderPage();
    expect(await screen.findByText(/Couldn't load the trade ideas file/)).toBeInTheDocument();
    a.unmount();

    mockFetch(new Error("offline"));
    const b = renderPage();
    expect(await screen.findByText(/Couldn't load the trade ideas file/)).toBeInTheDocument();
    b.unmount();

    mockFetch(ok({ not: "an array" }));
    renderPage();
    expect(await screen.findByText(/Couldn't load the trade ideas file/)).toBeInTheDocument();
  });

  it("formats numbers in en-IN grouping and shows an em dash for nulls", async () => {
    mockFetch(ok([idea({ entry: 1234567, target: null, stop: 0 })]));
    renderPage();
    await screen.findByRole("table");
    const cells = cellsOfFirstRow();
    expect(cells[3]).toHaveTextContent("12,34,567");
    expect(cells[4]).toHaveTextContent("—");
    expect(cells[5]).toHaveTextContent("0"); // zero is a value, not missing
    expect(cells[5]).not.toHaveTextContent("—");
  });

  it("shows the latest as-of date and flags stale data beyond the threshold", async () => {
    mockFetch(ok([idea({ asOf: "2026-10-01" }), idea({ symbol: "B", asOf: "2026-10-15" })]));
    renderPage();
    await screen.findByRole("table");
    expect(screen.getByText(/As of 15 Oct 2026/)).toBeInTheDocument();
    expect(screen.getByText(`Stale: older than ${TRADE_STALE_DAYS} days`)).toBeInTheDocument();
  });

  it("does not flag data exactly 7 days old as stale", async () => {
    mockFetch(ok([idea({ asOf: "2026-10-16" })]));
    renderPage();
    await screen.findByRole("table");
    expect(screen.getByText(/As of 16 Oct 2026/)).toBeInTheDocument();
    expect(screen.queryByText(/Stale/)).toBeNull();
  });

  it("filters by action and by exchange, and offers only exchanges present", async () => {
    mockFetch(
      ok([
        idea({ symbol: "A", action: "BUY", exchange: "NSE" }),
        idea({ symbol: "B", action: "SELL", exchange: "BSE" }),
        idea({ symbol: "C", action: "BUY", exchange: "BSE" }),
      ]),
    );
    renderPage();
    await screen.findByRole("table");
    const exchange = screen.getByLabelText(/Exchange/);
    expect(
      within(exchange)
        .getAllByRole("option")
        .map((o) => o.textContent),
    ).toEqual(["ALL", "BSE", "NSE"]);

    fireEvent.change(screen.getByLabelText(/Action/), { target: { value: "BUY" } });
    expect(symbols().sort()).toEqual(["A", "C"]);
    fireEvent.change(exchange, { target: { value: "BSE" } });
    expect(symbols()).toEqual(["C"]);
    fireEvent.change(screen.getByLabelText(/Action/), { target: { value: "SELL" } });
    expect(symbols()).toEqual(["B"]);
    fireEvent.change(screen.getByLabelText(/Action/), { target: { value: "HOLD" } });
    expect(screen.getByText("No trade ideas published.")).toBeInTheDocument();
  });

  it("sorts by as-of descending by default and toggles column sorting with aria-sort", async () => {
    mockFetch(
      ok([
        idea({ symbol: "B", asOf: "2026-10-18" }),
        idea({ symbol: "C", asOf: "2026-10-20" }),
        idea({ symbol: "A", asOf: "2026-10-19" }),
      ]),
    );
    renderPage();
    await screen.findByRole("table");
    expect(symbols()).toEqual(["C", "A", "B"]);
    const header = (name: RegExp) =>
      Array.from(document.querySelectorAll("th")).find((h) => name.test(h.textContent ?? ""))!;
    expect(header(/As of/)).toHaveAttribute("aria-sort", "descending");
    expect(header(/Symbol/)).toHaveAttribute("aria-sort", "none");

    fireEvent.click(header(/Symbol/).querySelector("button")!);
    expect(symbols()).toEqual(["A", "B", "C"]);
    expect(header(/Symbol/)).toHaveAttribute("aria-sort", "ascending");
    expect(header(/Symbol/)).toHaveTextContent("Symbol ↑");
    expect(header(/As of/)).toHaveAttribute("aria-sort", "none");

    fireEvent.click(header(/Symbol/).querySelector("button")!);
    expect(symbols()).toEqual(["C", "B", "A"]);
    expect(header(/Symbol/)).toHaveAttribute("aria-sort", "descending");
    expect(header(/Symbol/)).toHaveTextContent("Symbol ↓");

    // clicking another column starts ascending
    fireEvent.click(header(/As of/).querySelector("button")!);
    expect(symbols()).toEqual(["B", "A", "C"]);
  });

  describe("sample data", () => {
    it("shows 4 clearly-labelled sample rows without fetching, and never flags them stale", () => {
      cfg.url = PLACEHOLDER_URL;
      const f = mockFetch(ok([]));
      renderPage();
      fireEvent.click(screen.getByLabelText("Show sample data"));
      expect(f).not.toHaveBeenCalled();
      expect(symbols().map((s) => s?.replace("Sample", ""))).toEqual([
        "SAMPLE-A",
        "SAMPLE-B",
        "SAMPLE-C",
        "SAMPLE-D",
      ]);
      expect(screen.getByText("Sample data, not a recommendation")).toBeInTheDocument();
      expect(screen.getAllByText("Sample")).toHaveLength(4);
      expect(
        screen.getByRole("table", { name: /sample data, not a recommendation/ }),
      ).toBeInTheDocument();
      expect(screen.getByText(/As of 5 Jan 2026/)).toBeInTheDocument();
      expect(screen.queryByText(/Stale/)).toBeNull(); // 2026-01-05 is long before "now"
    });

    it("resets the exchange filter when toggled, and hides sample data again when unchecked", () => {
      cfg.url = PLACEHOLDER_URL;
      renderPage();
      const box = screen.getByLabelText("Show sample data");
      fireEvent.click(box);
      fireEvent.change(screen.getByLabelText(/Exchange/), { target: { value: "NASDAQ" } });
      expect(symbols().map((s) => s?.replace("Sample", ""))).toEqual(["SAMPLE-D"]);
      fireEvent.click(box);
      expect(screen.getByText("No trade ideas published.")).toBeInTheDocument();
      fireEvent.click(box);
      expect(symbols()).toHaveLength(4); // exchange filter was reset by the toggle
    });

    it("shows sample rows even when the real feed errored", async () => {
      mockFetch({ ok: false, status: 500 });
      renderPage();
      await screen.findByText(/Couldn't load the trade ideas file/);
      fireEvent.click(screen.getByLabelText("Show sample data"));
      expect(symbols()).toHaveLength(4);
      expect(screen.queryByText(/Couldn't load/)).toBeNull();
    });
  });
});
