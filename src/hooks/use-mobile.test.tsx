import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useIsMobile } from "./use-mobile";

describe("useIsMobile", () => {
  const original = window.matchMedia;
  let listeners: Array<() => void>;
  let add: ReturnType<typeof vi.fn>;
  let remove: ReturnType<typeof vi.fn>;
  let queries: string[];

  const setWidth = (w: number) =>
    Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: w });

  beforeEach(() => {
    listeners = [];
    queries = [];
    add = vi.fn((_t: string, cb: () => void) => listeners.push(cb));
    remove = vi.fn();
    window.matchMedia = ((q: string) => {
      queries.push(q);
      return { matches: false, media: q, addEventListener: add, removeEventListener: remove };
    }) as unknown as typeof window.matchMedia;
  });
  afterEach(() => {
    window.matchMedia = original;
  });

  it("is false at 768px (breakpoint is exclusive) and true at 767px", () => {
    setWidth(768);
    expect(renderHook(() => useIsMobile()).result.current).toBe(false);
    setWidth(767);
    expect(renderHook(() => useIsMobile()).result.current).toBe(true);
  });

  it("queries max-width 767px", () => {
    setWidth(1000);
    renderHook(() => useIsMobile());
    expect(queries).toEqual(["(max-width: 767px)"]);
  });

  it("updates when the media query changes", () => {
    setWidth(1000);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
    setWidth(500);
    act(() => listeners.forEach((l) => l()));
    expect(result.current).toBe(true);
    setWidth(900);
    act(() => listeners.forEach((l) => l()));
    expect(result.current).toBe(false);
  });

  it("subscribes to 'change' and unsubscribes the same handler on unmount", () => {
    setWidth(1000);
    const { unmount } = renderHook(() => useIsMobile());
    expect(add).toHaveBeenCalledTimes(1);
    expect(add.mock.calls[0]![0]).toBe("change");
    expect(remove).not.toHaveBeenCalled();
    unmount();
    expect(remove).toHaveBeenCalledTimes(1);
    expect(remove).toHaveBeenCalledWith("change", add.mock.calls[0]![1]);
  });
});
