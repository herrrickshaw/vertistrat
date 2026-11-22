import { describe, expect, it } from "vitest";
import { renderErrorPage } from "./error-page";

describe("renderErrorPage", () => {
  const html = renderErrorPage();
  it("is a complete HTML5 document", () => {
    expect(html.startsWith("<!doctype html>")).toBe(true);
    expect(html).toContain('<html lang="en">');
    expect(html.trimEnd().endsWith("</html>")).toBe(true);
  });
  it("tells the user the page failed and offers retry and home actions", () => {
    expect(html).toContain("<title>This page didn't load</title>");
    expect(html).toContain('onclick="location.reload()"');
    expect(html).toContain('href="/"');
  });
  it("is deterministic and self-contained (no external resources)", () => {
    expect(renderErrorPage()).toBe(html);
    expect(html).not.toMatch(/<script|<link|src=|https?:\/\//i);
  });
});
