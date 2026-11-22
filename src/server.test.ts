import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Fetch = (req: Request, env: unknown, ctx: unknown) => Promise<Response> | Response;
const consume = vi.fn();

async function loadServer(
  entry: { default?: { fetch: Fetch } | undefined; fetch?: Fetch },
  opts: { importCount?: { n: number } } = {},
) {
  vi.resetModules();
  vi.doMock("./lib/error-capture", () => ({ consumeLastCapturedError: consume }));
  vi.doMock("@tanstack/react-start/server-entry", () => {
    if (opts.importCount) opts.importCount.n++;
    return entry;
  });
  return (await import("./server")).default;
}

const req = new Request("http://localhost/");
const h3Body = JSON.stringify({ status: 500, unhandled: true, message: "HTTPError" });
const json = (body: string, status = 500) =>
  new Response(body, { status, headers: { "content-type": "application/json" } });

describe("server entry", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consume.mockReset();
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });
  afterEach(() => {
    errSpy.mockRestore();
    vi.doUnmock("./lib/error-capture");
    vi.doUnmock("@tanstack/react-start/server-entry");
  });

  it("passes request, env and ctx through and returns healthy responses untouched", async () => {
    const fetch = vi.fn(async () => new Response("ok", { status: 200 }));
    const server = await loadServer({ default: { fetch } });
    const env = { e: 1 };
    const ctx = { c: 2 };
    const res = await server.fetch(req, env, ctx);
    expect(fetch).toHaveBeenCalledWith(req, env, ctx);
    expect(await res.text()).toBe("ok");
    expect(errSpy).not.toHaveBeenCalled();
  });

  it("accepts a module without a default export", async () => {
    const fetch = vi.fn(async () => new Response("ok"));
    const server = await loadServer({ default: undefined, fetch });
    expect((await server.fetch(req, {}, {})).status).toBe(200);
  });

  it("loads the server entry only once across requests", async () => {
    const count = { n: 0 };
    const server = await loadServer(
      { default: { fetch: async () => new Response("ok") } },
      { importCount: count },
    );
    await server.fetch(req, {}, {});
    await server.fetch(req, {}, {});
    expect(count.n).toBe(1);
  });

  it("returns the HTML error page and logs when the handler throws", async () => {
    const boom = new Error("boom");
    const server = await loadServer({
      default: {
        fetch: async () => {
          throw boom;
        },
      },
    });
    const res = await server.fetch(req, {}, {});
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await res.text()).toContain("This page didn't load");
    expect(errSpy).toHaveBeenCalledWith(boom);
  });

  it("replaces an h3-swallowed 500 JSON body with the error page and logs the captured error", async () => {
    const captured = new Error("original");
    consume.mockReturnValue(captured);
    const server = await loadServer({ default: { fetch: async () => json(h3Body) } });
    const res = await server.fetch(req, {}, {});
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
    expect(await res.text()).toContain("This page didn't load");
    expect(errSpy).toHaveBeenCalledWith(captured);
  });

  it("logs a synthesised error containing the body when nothing was captured", async () => {
    consume.mockReturnValue(undefined);
    const server = await loadServer({ default: { fetch: async () => json(h3Body) } });
    await server.fetch(req, {}, {});
    const arg = errSpy.mock.calls[0]![0] as Error;
    expect(arg).toBeInstanceOf(Error);
    expect(arg.message).toBe(`h3 swallowed SSR error: ${h3Body}`);
  });

  it("leaves 4xx and other sub-500 responses alone, even with the h3 body", async () => {
    const server = await loadServer({ default: { fetch: async () => json(h3Body, 499) } });
    const res = await server.fetch(req, {}, {});
    expect(res.status).toBe(499);
    expect(consume).not.toHaveBeenCalled();
  });

  it("treats exactly 500 as catastrophic, and also higher 5xx codes", async () => {
    for (const status of [500, 503]) {
      const server = await loadServer({ default: { fetch: async () => json(h3Body, status) } });
      const res = await server.fetch(req, {}, {});
      expect(res.headers.get("content-type")).toContain("text/html");
      expect(res.status).toBe(500);
    }
  });

  it("leaves non-JSON 5xx responses alone", async () => {
    const server = await loadServer({
      default: {
        fetch: async () =>
          new Response(h3Body, { status: 500, headers: { "content-type": "text/plain" } }),
      },
    });
    const res = await server.fetch(req, {}, {});
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toContain("text/plain");
    expect(await res.text()).toBe(h3Body);
  });

  it("leaves 5xx responses without a content-type alone", async () => {
    const server = await loadServer({
      default: { fetch: async () => new Response(null, { status: 500 }) },
    });
    const res = await server.fetch(req, {}, {});
    expect(res.status).toBe(500);
    expect(res.headers.get("content-type")).toBeNull();
  });

  it.each([
    ["different message", JSON.stringify({ unhandled: true, message: "Other" })],
    ["unhandled not true", JSON.stringify({ unhandled: "true", message: "HTTPError" })],
    ["unhandled false", JSON.stringify({ unhandled: false, message: "HTTPError" })],
    ["missing unhandled", JSON.stringify({ message: "HTTPError" })],
    ["invalid JSON", "{not json"],
  ])("does not rewrite a JSON 500 that is a legitimate app error (%s)", async (_n, body) => {
    const server = await loadServer({ default: { fetch: async () => json(body) } });
    const res = await server.fetch(req, {}, {});
    expect(res.headers.get("content-type")).toContain("application/json");
    expect(await res.text()).toBe(body);
    expect(consume).not.toHaveBeenCalled();
  });

  it("leaves the original response body readable after inspection (clone)", async () => {
    const server = await loadServer({ default: { fetch: async () => json('{"ok":false}') } });
    const res = await server.fetch(req, {}, {});
    expect(await res.json()).toEqual({ ok: false });
  });
});
