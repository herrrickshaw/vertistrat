import { describe, expect, it } from "vitest";
import * as config from "./config";

describe("config", () => {
  it("derives the blog feed URL from the blog URL", () => {
    expect(config.BLOG_FEED_URL.startsWith(`${config.BLOG_URL}/feeds/posts/default?`)).toBe(true);
    // feeds.ts/Feeds.tsx rely on this exact substring to switch to JSONP
    expect(config.BLOG_FEED_URL).toContain("alt=json");
    expect(config.BLOG_FEED_URL).toContain("max-results=12");
  });
  it("derives the GitHub repos URL from the user", () => {
    expect(config.GITHUB_REPOS_URL).toBe(
      `https://api.github.com/users/${config.GITHUB_USER}/repos?sort=updated&per_page=6`,
    );
  });
  it("keeps the contact form disabled until submitContact is implemented", () => {
    expect(config.CONTACT_FORM_ENABLED).toBe(false);
  });
  it("uses sane numeric limits", () => {
    expect(config.MAX_FEATURED).toBe(3);
    expect(config.TRADE_STALE_DAYS).toBe(7);
  });
  it("carries a not-investment-advice disclaimer", () => {
    expect(config.DISCLAIMER).toMatch(/not investment advice/i);
  });
});
