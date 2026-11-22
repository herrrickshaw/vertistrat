import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

type Mod = typeof import("./error-capture");

describe("error-capture", () => {
  const realConsoleError = console.error;
  let sink: ReturnType<typeof vi.fn>;
  let mod: Mod;

  async function load(): Promise<Mod> {
    vi.resetModules();
    return import("./error-capture");
  }

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    sink = vi.fn();
    console.error = sink as unknown as typeof console.error;
    mod = await load(); // wraps `sink`
  });
  afterEach(() => {
    console.error = realConsoleError;
    vi.useRealTimers();
  });

  describe("describeError", () => {
    it("includes the stack of an Error", () => {
      const e = new Error("boom");
      expect(mod.describeError(e)).toBe(e.stack);
    });
    it("falls back to 'Name: message' when the stack is missing", () => {
      const e = new TypeError("bad");
      e.stack = undefined as unknown as string;
      expect(mod.describeError(e)).toBe("TypeError: bad");
    });
    it("appends status or statusCode (status wins) only when numeric", () => {
      const a = Object.assign(new Error("a"), { status: 404, statusCode: 500 });
      a.stack = "A";
      expect(mod.describeError(a)).toBe("A (status 404)");
      const b = Object.assign(new Error("b"), { statusCode: 502 });
      b.stack = "B";
      expect(mod.describeError(b)).toBe("B (status 502)");
      const c = Object.assign(new Error("c"), { status: "404" });
      c.stack = "C";
      expect(mod.describeError(c)).toBe("C");
      const d = Object.assign(new Error("d"), { status: 0 });
      d.stack = "D";
      expect(mod.describeError(d)).toBe("D (status 0)");
    });
    it("walks the cause chain with 'caused by:' labels", () => {
      const root = new Error("root");
      root.stack = "ROOT";
      const mid = new Error("mid", { cause: root });
      mid.stack = "MID";
      const top = new Error("top", { cause: mid });
      top.stack = "TOP";
      expect(mod.describeError(top)).toBe("TOP\ncaused by: MID\ncaused by: ROOT");
    });
    it("stops at depth 5", () => {
      let e: Error | undefined;
      for (let i = 7; i >= 0; i--) {
        const n = new Error(`e${i}`, e ? { cause: e } : undefined);
        n.stack = `S${i}`;
        e = n;
      }
      const lines = mod.describeError(e).split("\n");
      expect(lines).toEqual([
        "S0",
        "caused by: S1",
        "caused by: S2",
        "caused by: S3",
        "caused by: S4",
      ]);
    });
    it("renders a non-Error cause as a string or JSON and stops", () => {
      const e = new Error("x", { cause: "why" });
      e.stack = "X";
      expect(mod.describeError(e)).toBe("X\nwhy");
      const f = new Error("f", { cause: { code: 1 } });
      f.stack = "F";
      expect(mod.describeError(f)).toBe('F\n{"code":1}');
    });
    it("handles non-Error top-level values", () => {
      expect(mod.describeError("str")).toBe("str");
      expect(mod.describeError({ a: 1 })).toBe('{"a":1}');
      expect(mod.describeError(42)).toBe("42");
      expect(mod.describeError(undefined)).toBe("");
      expect(mod.describeError(null)).toBe("");
    });
    it("falls back to String() for values JSON cannot serialise", () => {
      const cyc: Record<string, unknown> = {};
      cyc["self"] = cyc;
      expect(mod.describeError(cyc)).toBe("[object Object]");
      expect(mod.describeError(() => 1)).toBe("() => 1"); // JSON.stringify(fn) === undefined
    });
    it("truncates to 8000 characters", () => {
      const e = new Error("x");
      e.stack = "y".repeat(9000);
      expect(mod.describeError(e)).toHaveLength(8000);
      e.stack = "y".repeat(8000);
      expect(mod.describeError(e)).toHaveLength(8000);
    });
  });

  describe("console.error wrapper", () => {
    it("passes non-Error args through untouched", () => {
      console.error("a", 1, { b: 2 });
      expect(sink).toHaveBeenCalledWith("a", 1, { b: 2 });
    });
    it("expands Error args into described strings and records them", () => {
      const e = new Error("boom");
      console.error("ctx", e);
      expect(sink).toHaveBeenCalledWith("ctx", mod.describeError(e));
      expect(mod.consumeLastCapturedError()).toBe(e);
    });
    it("records the last Error when several are logged", () => {
      const a = new Error("a");
      const b = new Error("b");
      console.error(a, b);
      expect(mod.consumeLastCapturedError()).toBe(b);
    });
    it("does not record non-Error logs", () => {
      console.error("just text");
      expect(mod.consumeLastCapturedError()).toBeUndefined();
    });
  });

  describe("consumeLastCapturedError", () => {
    it("returns undefined when nothing was captured", () => {
      expect(mod.consumeLastCapturedError()).toBeUndefined();
    });
    it("returns the error once and then clears it", () => {
      const e = new Error("once");
      console.error(e);
      expect(mod.consumeLastCapturedError()).toBe(e);
      expect(mod.consumeLastCapturedError()).toBeUndefined();
    });
    it("is still valid at exactly 5s and expired after 5s", () => {
      const e = new Error("ttl");
      console.error(e);
      vi.advanceTimersByTime(5_000);
      expect(mod.consumeLastCapturedError()).toBe(e);

      const f = new Error("ttl2");
      console.error(f);
      vi.advanceTimersByTime(5_001);
      expect(mod.consumeLastCapturedError()).toBeUndefined();
      expect(mod.consumeLastCapturedError()).toBeUndefined();
    });
  });

  describe("global listeners", () => {
    it("records window error events (using event.error, or the event itself)", () => {
      const e = new Error("win");
      window.dispatchEvent(new ErrorEvent("error", { error: e }));
      expect(mod.consumeLastCapturedError()).toBe(e);

      const ev = new ErrorEvent("error", { message: "no error obj" });
      window.dispatchEvent(ev);
      expect(mod.consumeLastCapturedError()).toBe(ev);
    });
    it("records unhandledrejection reasons", () => {
      const reason = new Error("rej");
      const ev = new Event("unhandledrejection") as Event & { reason: unknown };
      ev.reason = reason;
      window.dispatchEvent(ev);
      expect(mod.consumeLastCapturedError()).toBe(reason);
    });
  });

  it("skips listener registration when addEventListener is unavailable", async () => {
    const orig = globalThis.addEventListener;
    // @ts-expect-error simulate a runtime without addEventListener
    globalThis.addEventListener = undefined;
    try {
      const m = await load();
      expect(m.consumeLastCapturedError()).toBeUndefined();
    } finally {
      globalThis.addEventListener = orig;
    }
  });
});
