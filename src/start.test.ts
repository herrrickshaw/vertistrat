import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Capture the server handler and the options passed to createStart/createCsrfMiddleware.
const state = vi.hoisted(() => ({
  handler: undefined as undefined | ((a: { next: () => Promise<unknown> }) => Promise<unknown>),
  csrfOpts: undefined as undefined | { filter: (ctx: { handlerType: string }) => boolean },
  startFactory: undefined as undefined | (() => { requestMiddleware: unknown[] }),
}));

vi.mock("@tanstack/react-start", () => ({
  createMiddleware: () => ({
    server: (fn: typeof state.handler) => {
      state.handler = fn;
      return { kind: "error-middleware" };
    },
  }),
  createCsrfMiddleware: (opts: NonNullable<typeof state.csrfOpts>) => {
    state.csrfOpts = opts;
    return { kind: "csrf-middleware" };
  },
  createStart: (factory: NonNullable<typeof state.startFactory>) => {
    state.startFactory = factory;
    return { factory };
  },
}));

describe("start.ts", () => {
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(async () => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    await import("./start");
  });
  afterEach(() => errSpy.mockRestore());

  it("registers the error middleware before the CSRF middleware", () => {
    expect(state.startFactory!().requestMiddleware).toEqual([
      { kind: "error-middleware" },
      { kind: "csrf-middleware" },
    ]);
  });

  it("applies CSRF protection to server functions only", () => {
    expect(state.csrfOpts!.filter({ handlerType: "serverFn" })).toBe(true);
    expect(state.csrfOpts!.filter({ handlerType: "router" })).toBe(false);
    expect(state.csrfOpts!.filter({ handlerType: "" })).toBe(false);
  });

  describe("error middleware", () => {
    it("returns next()'s result when nothing throws", async () => {
      const result = { ok: true };
      await expect(state.handler!({ next: async () => result })).resolves.toBe(result);
      expect(errSpy).not.toHaveBeenCalled();
    });

    it("rethrows errors that carry a statusCode (framework redirects / HTTP errors)", async () => {
      const e = Object.assign(new Error("nf"), { statusCode: 404 });
      await expect(state.handler!({ next: () => Promise.reject(e) })).rejects.toBe(e);
      const obj = { statusCode: 0 };
      await expect(state.handler!({ next: () => Promise.reject(obj) })).rejects.toBe(obj);
      expect(errSpy).not.toHaveBeenCalled();
    });

    it("converts other errors into a logged 500 HTML page", async () => {
      const e = new Error("kaboom");
      const res = (await state.handler!({ next: () => Promise.reject(e) })) as Response;
      expect(res.status).toBe(500);
      expect(res.headers.get("content-type")).toBe("text/html; charset=utf-8");
      expect(await res.text()).toContain("This page didn't load");
      expect(errSpy).toHaveBeenCalledWith(e);
    });

    it("does not treat null, primitives or objects without statusCode as passthrough", async () => {
      for (const thrown of [null, undefined, "str", 7, { status: 404 }]) {
        const res = (await state.handler!({ next: () => Promise.reject(thrown) })) as Response;
        expect(res.status).toBe(500);
      }
    });
  });
});
