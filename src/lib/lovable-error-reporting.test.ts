import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { reportLovableError } from "./lovable-error-reporting";

describe("reportLovableError", () => {
  const capture = vi.fn();
  const runtime = vi.fn();

  beforeEach(() => {
    capture.mockReset();
    runtime.mockReset();
    window.__lovableEvents = { captureException: capture };
    window.__lovableReportRuntimeError = runtime;
    window.history.pushState({}, "", "/some/path");
  });
  afterEach(() => {
    delete window.__lovableEvents;
    delete window.__lovableReportRuntimeError;
  });

  it("does nothing without a window (SSR)", () => {
    vi.stubGlobal("window", undefined);
    try {
      expect(() => reportLovableError(new Error("x"))).not.toThrow();
    } finally {
      vi.unstubAllGlobals();
    }
    expect(capture).not.toHaveBeenCalled();
    expect(runtime).not.toHaveBeenCalled();
  });

  it("captures the exception with boundary metadata and merged context", () => {
    const err = new Error("boom");
    reportLovableError(err, { boundary: "b", route: "/override" });
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith(
      err,
      { source: "react_error_boundary", route: "/override", boundary: "b" },
      { mechanism: "react_error_boundary", handled: false, severity: "error" },
    );
  });

  it("defaults the route to the current pathname and context to {}", () => {
    reportLovableError(new Error("x"));
    expect(capture.mock.calls[0]![1]).toEqual({
      source: "react_error_boundary",
      route: "/some/path",
    });
  });

  it("forwards message, stack and filename to the runtime hook for Errors", () => {
    const err = new Error("boom");
    reportLovableError(err);
    expect(runtime).toHaveBeenCalledWith({
      message: "boom",
      stack: err.stack,
      filename: "/some/path",
    });
  });

  it("omits the stack key for non-Error throwables", () => {
    reportLovableError("plain");
    const payload = runtime.mock.calls[0]![0];
    expect(payload).toEqual({ message: "plain", filename: "/some/path" });
    expect("stack" in payload).toBe(false);
  });

  it("describes a thrown Response with status and url when present", () => {
    const res = new Response("x", { status: 404 });
    reportLovableError(res);
    expect(runtime.mock.calls[0]![0].message).toBe("Response 404");
    const withUrl = {
      __proto__: Response.prototype,
      status: 500,
      url: "https://a/b",
    } as unknown as Response;
    reportLovableError(withUrl);
    expect(runtime.mock.calls[1]![0].message).toBe("Response 500 at https://a/b");
  });

  it("uses a string `message` property from plain objects, ignoring empty/non-string ones", () => {
    reportLovableError({ message: "db down", code: 1 });
    expect(runtime.mock.calls[0]![0].message).toBe("db down");
    reportLovableError({ message: "", code: 1 });
    expect(runtime.mock.calls[1]![0].message).toBe('{"message":"","code":1}');
    reportLovableError({ message: "x" }); // one-character messages are still used
    expect(runtime.mock.calls[2]![0].message).toBe("x");
    reportLovableError({ message: 5 });
    expect(runtime.mock.calls[3]![0].message).toBe('{"message":5}');
  });

  it("JSON-serialises other values, truncated to 2000 chars", () => {
    reportLovableError({ a: "x".repeat(5000) });
    const msg = runtime.mock.calls[0]![0].message as string;
    expect(msg.length).toBe(2000);
    expect(msg.startsWith('{"a":"xxx')).toBe(true);
  });

  it("handles null/undefined and unserialisable values", () => {
    reportLovableError(null);
    reportLovableError(undefined);
    expect(runtime.mock.calls[0]![0].message).toBe("null");
    expect(runtime.mock.calls[1]![0].message).toBe("undefined");
    const cyc: Record<string, unknown> = {};
    cyc["self"] = cyc;
    reportLovableError(cyc);
    expect(runtime.mock.calls[2]![0].message).toBe("[object Object]");
  });

  it("tolerates missing editor hooks", () => {
    delete window.__lovableEvents;
    delete window.__lovableReportRuntimeError;
    expect(() => reportLovableError(new Error("x"))).not.toThrow();
    window.__lovableEvents = {};
    expect(() => reportLovableError(new Error("x"))).not.toThrow();
  });
});
