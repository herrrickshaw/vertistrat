import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  const off: boolean = JSON.parse("false");
  it("joins truthy class values and drops falsy ones", () => {
    expect(cn("a", off ? "b" : false, undefined, null, "c")).toBe("a c");
  });
  it("supports object and array inputs", () => {
    expect(cn({ a: true, b: false }, ["c", { d: true }])).toBe("a c d");
  });
  it("lets later tailwind classes override conflicting earlier ones", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });
  it("returns an empty string for no input", () => {
    expect(cn()).toBe("");
  });
});
