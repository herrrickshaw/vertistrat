import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BLOG_FEED_URL, BLOG_URL, GITHUB_REPOS_URL, GITHUB_USER } from "@/config";
import { formatDate, mapFeed } from "@/lib/feeds";

function jsonp(url: string): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const cb = `__vsFeed${Date.now()}`;
    const el = document.createElement("script");
    const w = window as unknown as Record<string, unknown>;
    const done = () => { delete w[cb]; el.remove(); clearTimeout(t); };
    const t = setTimeout(() => { done(); reject(new Error("timeout")); }, 10000);
    w[cb] = (data: unknown) => { done(); resolve(data); };
    el.onerror = () => { done(); reject(new Error("Feed failed")); };
    el.src = `${url}&callback=${cb}`;
    document.head.appendChild(el);
  });
}

export function useArticles() {
  return useQuery({
    queryKey: ["blog"],
    queryFn: async () => {
      // Blogger sends no CORS headers, so load the feed as JSONP.
      return mapFeed(await jsonp(BLOG_FEED_URL.replace("alt=json", "alt=json-in-script")));
    },
    staleTime: 10 * 60_000,
    retry: 1,
  });
}

function Skeleton({ n }: { n: number }) {
  return (
    <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading">
      {Array.from({ length: n }).map((_, i) => (
        <li key={i} className="animate-pulse rounded-md border bg-card">
          <div className="aspect-[16/9] bg-muted" />
          <div className="space-y-2 p-5"><div className="h-3 w-1/3 bg-muted" /><div className="h-4 w-4/5 bg-muted" /><div className="h-3 w-full bg-muted" /></div>
        </li>
      ))}
    </ul>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return <div role="status" className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">{children}</div>;
}

export function ArticleGrid({ limit, filterable = false }: { limit?: number; filterable?: boolean }) {
  const q = useArticles();
  const [label, setLabel] = useState<string | null>(null);
  const labels = useMemo(() => [...new Set((q.data ?? []).flatMap((a) => a.categories))].sort(), [q.data]);

  if (q.isPending) return <Skeleton n={limit ?? 6} />;
  if (q.isError)
    return <Notice>We couldn't load the latest articles right now. <a className="underline" href={BLOG_URL} target="_blank" rel="noopener noreferrer">Read them on the blog</a>.</Notice>;

  let items = q.data.filter((a) => !label || a.categories.includes(label));
  if (limit) items = items.slice(0, limit);

  return (
    <div>
      {filterable && labels.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          {[null, ...labels].map((l) => (
            <button key={l ?? "all"} aria-pressed={label === l} onClick={() => setLabel(l)}
              className={`rounded-sm border px-3 py-1 text-xs ${label === l ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-muted"}`}>
              {l ?? "All"}
            </button>
          ))}
        </div>
      )}
      {items.length === 0 ? (
        <Notice>No articles yet. <a className="underline" href={BLOG_URL} target="_blank" rel="noopener noreferrer">Visit the blog</a>.</Notice>
      ) : (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <li key={a.id}>
              <a href={a.link} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col overflow-hidden rounded-md border bg-card hover:border-primary">
                {a.image ? <img src={a.image} alt="" loading="lazy" className="aspect-[16/9] w-full object-cover" /> : <div className="aspect-[16/9] bg-muted" aria-hidden="true" />}
                <div className="flex flex-1 flex-col p-5">
                  <p className="label-mono text-muted-foreground">{formatDate(a.published)}{a.categories[0] ? ` · ${a.categories[0]}` : ""}</p>
                  <h3 className="mt-2 text-lg font-semibold leading-snug group-hover:text-primary">{a.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{a.excerpt}</p>
                  <span className="mt-auto pt-4 text-sm text-primary">Read on blog <span className="sr-only">(opens in new tab)</span>↗</span>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

type Repo = { id: number; name: string; description: string | null; language: string | null; stargazers_count: number; updated_at: string; html_url: string; fork: boolean };

export function GithubRepos() {
  const q = useQuery({
    queryKey: ["gh"],
    queryFn: async (): Promise<Repo[]> => {
      const r = await fetch(GITHUB_REPOS_URL, { headers: { Accept: "application/vnd.github+json" } });
      if (r.status === 403 || r.status === 429) throw new Error("rate");
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    },
    staleTime: 30 * 60_000,
    retry: false,
  });
  const profile = `https://github.com/${GITHUB_USER}`;
  if (q.isPending) return <Notice>Loading repositories…</Notice>;
  if (q.isError)
    return <Notice>{q.error.message === "rate" ? "GitHub's public rate limit was reached. Try again in a while, or" : "Couldn't reach GitHub right now. You can"} <a className="underline" href={profile} target="_blank" rel="noopener noreferrer">browse the profile directly</a>.</Notice>;
  if (!q.data.length) return <Notice>No public repositories yet.</Notice>;
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {q.data.map((r) => (
        <li key={r.id}>
          <a href={r.html_url} target="_blank" rel="noopener noreferrer" className="flex h-full flex-col rounded-md border bg-card p-5 hover:border-primary">
            <p className="break-words font-mono text-sm font-medium text-primary">{r.name}</p>
            <p className="mt-2 flex-1 text-sm text-muted-foreground">{r.description ?? "No description."}</p>
            <p className="label-mono mt-4 flex flex-wrap gap-3 text-muted-foreground">
              {r.language && <span>{r.language}</span>}<span>★ {r.stargazers_count}</span><span>Updated {formatDate(r.updated_at)}</span>
            </p>
          </a>
        </li>
      ))}
    </ul>
  );
}
