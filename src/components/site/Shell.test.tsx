import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (orig) => {
  const { LinkStub } = await import("@/test/router-mock");
  return { ...(await orig<typeof import("@tanstack/react-router")>()), Link: LinkStub };
});

import { CONTACT_EMAIL, DISCLAIMER } from "@/config";
import { Footer, Header } from "./Shell";

const PAGES = ["/about", "/manufacturing", "/it-services", "/insights", "/trade-ideas"];

describe("Header", () => {
  it("renders the desktop nav with every page plus Contact", () => {
    render(<Header />);
    const nav = screen.getByRole("navigation", { name: "Main" });
    const hrefs = within(nav)
      .getAllByRole("link")
      .map((a) => a.getAttribute("href"));
    expect(hrefs).toEqual([...PAGES, "/#contact"]);
  });

  it("has a skip link and a home link", () => {
    render(<Header />);
    expect(screen.getByRole("link", { name: "Skip to content" })).toHaveAttribute("href", "#main");
    expect(screen.getByRole("link", { name: "VertiStrat home" })).toHaveAttribute("href", "/");
  });

  it("toggles the mobile menu and reflects state in aria-expanded / label", () => {
    render(<Header />);
    const btn = screen.getByRole("button", { name: "Menu" });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();

    fireEvent.click(btn);
    expect(screen.getByRole("button", { name: "Close" })).toHaveAttribute("aria-expanded", "true");
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    const links = within(mobile).getAllByRole("link");
    expect(links.map((a) => a.textContent)).toEqual([
      "About",
      "Manufacturing",
      "IT services",
      "Insights",
      "Trade ideas",
      "Contact",
    ]);
    expect(links.map((a) => a.getAttribute("href"))).toEqual([...PAGES, "/#contact"]);

    fireEvent.click(screen.getByRole("button", { name: "Close" }));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
  });

  it("closes the mobile menu after a link is clicked", () => {
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    fireEvent.click(within(mobile).getByRole("link", { name: "About" }));
    expect(screen.queryByRole("navigation", { name: "Mobile" })).toBeNull();
    expect(screen.getByRole("button", { name: "Menu" })).toBeInTheDocument();
  });

  it("only the Contact link in the mobile menu carries the contact hash", () => {
    render(<Header />);
    fireEvent.click(screen.getByRole("button", { name: "Menu" }));
    const mobile = screen.getByRole("navigation", { name: "Mobile" });
    expect(within(mobile).getByRole("link", { name: "About" }).getAttribute("href")).not.toContain(
      "#",
    );
    expect(within(mobile).getByRole("link", { name: "Contact" })).toHaveAttribute(
      "href",
      "/#contact",
    );
  });
});

describe("Footer", () => {
  it("shows the contact email, page links, disclaimer and current year", () => {
    render(<Footer />);
    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    const nav = screen.getByRole("navigation", { name: "Footer" });
    expect(
      within(nav)
        .getAllByRole("link")
        .map((a) => a.getAttribute("href")),
    ).toEqual(PAGES);
    expect(screen.getByText(DISCLAIMER)).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`© ${new Date().getFullYear()} VertiStrat`)),
    ).toBeInTheDocument();
  });
});
