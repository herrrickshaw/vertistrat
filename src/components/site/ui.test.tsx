import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-router", async (orig) => {
  const { LinkStub } = await import("@/test/router-mock");
  return { ...(await orig<typeof import("@tanstack/react-router")>()), Link: LinkStub };
});

import {
  CTA,
  Card,
  Chips,
  Eyebrow,
  Logo,
  Placeholder,
  SECTORS,
  Section,
  btn,
  pageHead,
} from "./ui";

describe("pageHead", () => {
  it("builds title, description, og/twitter meta and canonical link", () => {
    const h = pageHead("About", "Desc", "/about");
    expect(h.meta).toEqual([
      { title: "About | VertiStrat Solutions LLP" },
      { name: "description", content: "Desc" },
      { property: "og:title", content: "About | VertiStrat Solutions LLP" },
      { property: "og:description", content: "Desc" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/about" },
      { name: "twitter:card", content: "summary_large_image" },
    ]);
    expect(h.links).toEqual([{ rel: "canonical", href: "/about" }]);
  });
});

describe("SECTORS / btn", () => {
  it("exposes unique, non-empty sector names", () => {
    expect(SECTORS).toHaveLength(9);
    expect(new Set(SECTORS).size).toBe(SECTORS.length);
  });
  it("defines primary and outline button classes", () => {
    expect(btn.primary).toContain("bg-primary");
    expect(btn.outline).toContain("border");
  });
});

describe("Logo", () => {
  it("renders light and dark variants with alt text", () => {
    render(<Logo />);
    const imgs = screen.getAllByAltText("VertiStrat Solutions LLP");
    expect(imgs.map((i) => i.getAttribute("src"))).toEqual(["/logo-light.png", "/logo-dark.png"]);
  });
});

describe("Eyebrow", () => {
  it("renders children and merges className", () => {
    render(<Eyebrow className="extra">Hello</Eyebrow>);
    const p = screen.getByText("Hello");
    expect(p).toHaveClass("extra");
    expect(p).toHaveClass("label-mono");
  });
  it("defaults className to empty without printing 'undefined'", () => {
    render(<Eyebrow>Hi</Eyebrow>);
    expect(screen.getByText("Hi").className).not.toContain("undefined");
  });
});

describe("Section", () => {
  it("renders a labelled section with eyebrow, title and intro", () => {
    render(
      <Section id="x" eyebrow="EYE" title="Title" intro="Intro">
        child
      </Section>,
    );
    const region = screen.getByRole("region", { name: "Title" });
    expect(region).toHaveAttribute("id", "x");
    expect(screen.getByRole("heading", { level: 2 })).toHaveAttribute("id", "x-h");
    expect(screen.getByText("EYE")).toBeInTheDocument();
    expect(screen.getByText("Intro")).toBeInTheDocument();
    expect(screen.getByText("child")).toBeInTheDocument();
  });
  it("omits header entirely when neither eyebrow nor title is given", () => {
    const { container } = render(<Section>only</Section>);
    expect(container.querySelector("header")).toBeNull();
    expect(container.querySelector("section")).not.toHaveAttribute("aria-labelledby");
  });
  it("renders the header for an eyebrow alone, without heading or intro", () => {
    const { container } = render(
      <Section eyebrow="E" intro="never shown">
        c
      </Section>,
    );
    expect(container.querySelector("header")).not.toBeNull();
    expect(container.querySelector("h2")).toBeNull();
    // intro is only rendered when the header is, and is shown here
    expect(screen.getByText("never shown")).toBeInTheDocument();
  });
  it("renders a title without an id and does not set aria-labelledby or heading id", () => {
    const { container } = render(<Section title="T">c</Section>);
    expect(container.querySelector("h2")).not.toHaveAttribute("id");
    expect(container.querySelector("section")).not.toHaveAttribute("aria-labelledby");
  });
  it("applies a custom className", () => {
    const { container } = render(<Section className="bg-x">c</Section>);
    expect(container.querySelector("section")).toHaveClass("bg-x");
  });
});

describe("Card / Chips / Placeholder", () => {
  it("Card renders children with className", () => {
    render(<Card className="k">body</Card>);
    expect(screen.getByText("body")).toHaveClass("k");
  });
  it("Chips renders one list item per entry in order", () => {
    render(<Chips items={["a", "b", "c"]} />);
    expect(screen.getAllByRole("listitem").map((l) => l.textContent)).toEqual(["a", "b", "c"]);
  });
  it("Chips renders an empty list for no items", () => {
    render(<Chips items={[]} />);
    expect(screen.queryAllByRole("listitem")).toHaveLength(0);
  });
  it("Placeholder renders its children", () => {
    render(<Placeholder>TBD</Placeholder>);
    expect(screen.getByText("TBD")).toBeInTheDocument();
  });
});

describe("CTA", () => {
  it("renders title, text and a link to the contact section", () => {
    render(<CTA title="Talk" text="to us" />);
    expect(screen.getByRole("heading", { name: "Talk" })).toBeInTheDocument();
    expect(screen.getByText("to us")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a conversation" })).toHaveAttribute(
      "href",
      "/#contact",
    );
  });
});
