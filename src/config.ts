export const SITE_NAME = "VertiStrat Solutions LLP";
export const CONTACT_EMAIL = "hello@vertistrat.example"; // PLACEHOLDER: replace with real address

export const BLOG_URL = "https://masaladeutsch.blogspot.com";
export const BLOG_FEED_URL = `${BLOG_URL}/feeds/posts/default?alt=json&max-results=12`;
export const MAX_FEATURED = 3;

export const GITHUB_USER = "herrrickshaw";
export const GITHUB_REPOS_URL = `https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=6`;

// PLACEHOLDER: replace REPLACE_REPO with the repository that hosts trade_ideas.json
export const TRADE_IDEAS_URL =
  "https://raw.githubusercontent.com/herrrickshaw/REPLACE_REPO/main/trade_ideas.json";
export const TRADE_STALE_DAYS = 7;

// When false, the contact form only validates and shows a success message.
// TODO: set true and implement submitContact() in src/components/site/ContactForm.tsx
export const CONTACT_FORM_ENABLED = false;

export const DISCLAIMER =
  "Information only. Not investment advice. Not a recommendation to buy or sell any security. Replace with the firm's regulatory registration details and risk disclosures before publishing.";
