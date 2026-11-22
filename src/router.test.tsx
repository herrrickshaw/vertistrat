import { QueryClient } from "@tanstack/react-query";
import { describe, expect, it } from "vitest";
import { getRouter } from "./router";

describe("getRouter", () => {
  it("creates a fresh router (and query client) per call", () => {
    const a = getRouter();
    const b = getRouter();
    expect(a).not.toBe(b);
    expect(a.options.context.queryClient).toBeInstanceOf(QueryClient);
    expect(a.options.context.queryClient).not.toBe(b.options.context.queryClient);
  });

  it("enables scroll restoration and always-stale preloads", () => {
    const r = getRouter();
    expect(r.options.scrollRestoration).toBe(true);
    expect(r.options.defaultPreloadStaleTime).toBe(0);
  });

  it("registers every site page in the route tree", () => {
    const r = getRouter();
    for (const path of [
      "/",
      "/about",
      "/manufacturing",
      "/it-services",
      "/insights",
      "/trade-ideas",
    ]) {
      const last = r.matchRoutes(path).at(-1)!;
      expect(last.routeId, path).not.toBe("__root__");
    }
    expect(r.matchRoutes("/nope").at(-1)!.routeId).toBe("__root__");
  });
});
