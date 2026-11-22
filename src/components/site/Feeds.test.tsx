import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BLOG_FEED_URL, BLOG_URL, GITHUB_REPOS_URL, GITHUB_USER } from "@/config";
import { ArticleGrid, GithubRepos } from "./Feeds";

function wrap(ui: ReactNode) {
  const client = new QueryClient();
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

const scripts = () => Array.from(document.head.querySelectorAll("script"));
const callbackOf = (s: HTMLScriptElement) => new URL(s.src).searchParams.get("callback")!;
/** Wait for the JSONP script tag, then answer it like Blogger would. */
async function answer(data: unknown) {
  await waitFor(() => expect(scripts().length).toBeGreaterThan(0));
  const s = scripts().at(-1)!;
  const cb = callbackOf(s);
  act(() => (window as unknown as Record<string, (d: unknown) => void>)[cb]!(data));
  return s;
}

const entry = (n: number, cats: string[] = []) => ({
  id: { $t: `id${n}` },
  title: { $t: `Post ${n}` },
  link: [{ rel: "alternate", href: `https://blog/p${n}` }],
  published: { $t: "2026-03-05T12:00:00Z" },
  content: { $t: `<p>Body ${n}</p>` },
  category: cats.map((term) => ({ term })),
});

afterEach(() => {
  scripts().forEach((s) => s.remove());
});

describe("ArticleGrid / useArticles", () => {
  it("requests the Blogger feed as JSONP and shows a loading skeleton meanwhile", async () => {
    wrap(<ArticleGrid limit={2} />);
    const list = screen.getByLabelText("Loading");
    expect(list).toHaveAttribute("aria-busy", "true");
    expect(list.querySelectorAll("li")).toHaveLength(2);
    await waitFor(() => expect(scripts()).toHaveLength(1));
    const src = scripts()[0]!.src;
    expect(src).toContain(BLOG_FEED_URL.replace("alt=json", "alt=json-in-script"));
    expect(src).toMatch(/&callback=__vsFeed\d+$/);
  });

  it("skeleton defaults to 6 cards when no limit is given", () => {
    wrap(<ArticleGrid />);
    expect(screen.getByLabelText("Loading").querySelectorAll("li")).toHaveLength(6);
  });

  it("renders articles, cleans up the script tag and the global callback", async () => {
    wrap(<ArticleGrid />);
    const s = await answer({ feed: { entry: [entry(1, ["News"]), entry(2)] } });
    expect(await screen.findByRole("heading", { name: "Post 1" })).toBeInTheDocument();
    expect(screen.getByText("Body 2")).toBeInTheDocument();
    const link = screen.getAllByRole("link")[0]!;
    expect(link).toHaveAttribute("href", "https://blog/p1");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    expect(link).toHaveTextContent("5 Mar 2026 · News");
    expect(screen.getAllByText(/^5 Mar 2026$/)).toHaveLength(1); // article 2 has no category, no " · "
    expect(document.head.contains(s)).toBe(false);
    expect((window as unknown as Record<string, unknown>)[callbackOf(s)]).toBeUndefined();
  });

  it("limits the number of shown articles", async () => {
    wrap(<ArticleGrid limit={2} />);
    await answer({ feed: { entry: [entry(1), entry(2), entry(3)] } });
    expect(await screen.findAllByRole("heading", { level: 3 })).toHaveLength(2);
    expect(screen.queryByText("Post 3")).toBeNull();
  });

  it("shows an empty notice with a blog link when the feed has no entries", async () => {
    wrap(<ArticleGrid />);
    await answer({ feed: {} });
    const notice = await screen.findByRole("status");
    expect(notice).toHaveTextContent("No articles yet.");
    expect(within(notice).getByRole("link")).toHaveAttribute("href", BLOG_URL);
  });

  it("renders an image when present and a placeholder block otherwise", async () => {
    wrap(<ArticleGrid />);
    const withImg = { ...entry(1), media$thumbnail: { url: "https://h/s72-c/a.jpg" } };
    await answer({ feed: { entry: [withImg, entry(2)] } });
    await screen.findByText("Post 1");
    const imgs = document.querySelectorAll("img");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toHaveAttribute("src", "https://h/w600-h340-c/a.jpg");
    expect(imgs[0]).toHaveAttribute("alt", "");
    expect(document.querySelectorAll('div[aria-hidden="true"].bg-muted')).toHaveLength(1);
  });

  it("shows filter buttons only when filterable, sorted and deduplicated, and filters by category", async () => {
    wrap(<ArticleGrid filterable />);
    await answer({ feed: { entry: [entry(1, ["Zed", "Alpha"]), entry(2, ["Alpha"]), entry(3)] } });
    const group = await screen.findByRole("group", { name: "Filter by category" });
    const buttons = within(group).getAllByRole("button");
    expect(buttons.map((b) => b.textContent)).toEqual(["All", "Alpha", "Zed"]);
    expect(buttons[0]).toHaveAttribute("aria-pressed", "true");
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);

    fireEvent.click(within(group).getByRole("button", { name: "Zed" }));
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Post 1",
    ]);
    expect(within(group).getByRole("button", { name: "Zed" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(within(group).getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );

    fireEvent.click(within(group).getByRole("button", { name: "Alpha" }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(2);

    fireEvent.click(within(group).getByRole("button", { name: "All" }));
    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(3);
  });

  it("does not show filters when not filterable, or when no article has categories", async () => {
    wrap(<ArticleGrid />);
    await answer({ feed: { entry: [entry(1, ["A"])] } });
    await screen.findByText("Post 1");
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("hides the filter group for filterable grids with no categories at all", async () => {
    wrap(<ArticleGrid filterable />);
    await answer({ feed: { entry: [entry(1)] } });
    await screen.findByText("Post 1");
    expect(screen.queryByRole("group")).toBeNull();
  });

  it("applies the limit after filtering", async () => {
    wrap(<ArticleGrid filterable limit={1} />);
    await answer({ feed: { entry: [entry(1, ["A"]), entry(2, ["B"]), entry(3, ["B"])] } });
    const group = await screen.findByRole("group");
    fireEvent.click(within(group).getByRole("button", { name: "B" }));
    expect(screen.getAllByRole("heading", { level: 3 }).map((h) => h.textContent)).toEqual([
      "Post 2",
    ]);
  });

  it("shows the error notice when the script fails to load (after the single retry)", async () => {
    wrap(<ArticleGrid />);
    // Fail every attempt: the query retries once after ~1s.
    await waitFor(
      () => {
        for (const s of scripts()) s.onerror?.(new Event("error"));
        expect(screen.getByRole("status")).toHaveTextContent(
          "We couldn't load the latest articles",
        );
      },
      { timeout: 5000, interval: 100 },
    );
    expect(within(screen.getByRole("status")).getByRole("link")).toHaveAttribute("href", BLOG_URL);
  });

  describe("timeout", () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it("rejects after 10s, removing the script, and the retry then also times out", async () => {
      wrap(<ArticleGrid />);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });
      expect(scripts()).toHaveLength(1);
      const first = scripts()[0]!;
      await act(async () => {
        await vi.advanceTimersByTimeAsync(9_999);
      });
      expect(document.head.contains(first)).toBe(true);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1);
      });
      expect(document.head.contains(first)).toBe(false);
      // retry (1s delay) issues a second request that also times out
      await act(async () => {
        await vi.advanceTimersByTimeAsync(1_000);
      });
      expect(scripts()).toHaveLength(1);
      await act(async () => {
        await vi.advanceTimersByTimeAsync(10_000);
        await vi.advanceTimersByTimeAsync(10);
      });
      expect(screen.getByRole("status")).toHaveTextContent("We couldn't load the latest articles");
    });
  });
});

describe("GithubRepos", () => {
  const repo = (o: Partial<Record<string, unknown>> = {}) => ({
    id: 1,
    name: "alpha",
    description: "A repo",
    language: "TypeScript",
    stargazers_count: 7,
    updated_at: "2026-03-05T00:00:00Z",
    html_url: "https://github.com/x/alpha",
    fork: false,
    ...o,
  });
  const mockFetch = (res: Partial<Response> | Error) => {
    const f = vi.fn(async () => {
      if (res instanceof Error) throw res;
      return res as Response;
    });
    vi.stubGlobal("fetch", f);
    return f;
  };
  afterEach(() => vi.unstubAllGlobals());

  it("calls the GitHub API with the vnd.github accept header and shows a loading notice", async () => {
    const f = mockFetch({ ok: true, status: 200, json: async () => [] });
    wrap(<GithubRepos />);
    expect(screen.getByRole("status")).toHaveTextContent("Loading repositories…");
    await screen.findByText("No public repositories yet.");
    expect(f).toHaveBeenCalledWith(GITHUB_REPOS_URL, {
      headers: { Accept: "application/vnd.github+json" },
    });
  });

  it("renders repo cards with language, stars and update date", async () => {
    mockFetch({
      ok: true,
      status: 200,
      json: async () => [
        repo(),
        repo({ id: 2, name: "beta", description: null, language: null, stargazers_count: 0 }),
      ],
    });
    wrap(<GithubRepos />);
    const alpha = await screen.findByRole("link", { name: /alpha/ });
    expect(alpha).toHaveAttribute("href", "https://github.com/x/alpha");
    expect(alpha).toHaveAttribute("rel", "noopener noreferrer");
    expect(alpha).toHaveTextContent("A repo");
    expect(alpha).toHaveTextContent("TypeScript");
    expect(alpha).toHaveTextContent("★ 7");
    expect(alpha).toHaveTextContent("Updated 5 Mar 2026");
    const beta = screen.getByRole("link", { name: /beta/ });
    expect(beta).toHaveTextContent("No description.");
    expect(beta).toHaveTextContent("★ 0");
    expect(beta).not.toHaveTextContent("TypeScript");
  });

  it.each([403, 429])("shows the rate-limit message for HTTP %i", async (status) => {
    mockFetch({ ok: false, status });
    wrap(<GithubRepos />);
    const n = await screen.findByText(/rate limit was reached/);
    expect(n.parentElement).toHaveTextContent(
      "Try again in a while, or browse the profile directly",
    );
    expect(within(n.parentElement!).getByRole("link")).toHaveAttribute(
      "href",
      `https://github.com/${GITHUB_USER}`,
    );
  });

  it("shows the generic error for other HTTP failures and for network errors", async () => {
    mockFetch({ ok: false, status: 500 });
    const a = wrap(<GithubRepos />);
    expect(await screen.findByText(/Couldn't reach GitHub right now/)).toBeInTheDocument();
    expect(screen.queryByText(/rate limit/)).toBeNull();
    a.unmount();

    mockFetch(new Error("offline"));
    wrap(<GithubRepos />);
    expect(await screen.findByText(/Couldn't reach GitHub right now/)).toBeInTheDocument();
  });
});
