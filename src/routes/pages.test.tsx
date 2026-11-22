import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, within } from "@testing-library/react";
import type { ComponentType } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const router = vi.hoisted(() => ({ invalidate: vi.fn() }));
vi.mock("@tanstack/react-router", async (orig) => {
  const { LinkStub } = await import("@/test/router-mock");
  return {
    ...(await orig<typeof import("@tanstack/react-router")>()),
    Link: LinkStub,
    Outlet: () => <div data-testid="outlet" />,
    useRouter: () => ({ invalidate: router.invalidate }),
  };
});

import { CONTACT_EMAIL, MAX_FEATURED } from "@/config";
import { Route as AboutRoute } from "./about";
import { Route as IndexRoute } from "./index";
import { Route as InsightsRoute } from "./insights";
import { Route as ItRoute } from "./it-services";
import { Route as ManufacturingRoute } from "./manufacturing";
import { Route as RootRoute } from "./__root";

// Role queries are slow in jsdom; keep generous headroom on busy CI runners.
vi.setConfig({ testTimeout: 15_000 });

type Head = () => { meta: Array<Record<string, string>>; links: Array<Record<string, string>> };
type AnyRoute = { options: { head?: unknown; component?: unknown } };

const wrap = (ui: React.ReactNode) =>
  render(<QueryClientProvider client={new QueryClient()}>{ui}</QueryClientProvider>);
const comp = (r: AnyRoute) => r.options.component as ComponentType;

describe("route heads", () => {
  it.each([
    [AboutRoute, "About", "/about"],
    [ManufacturingRoute, "Manufacturing advisory", "/manufacturing"],
    [ItRoute, "IT services advisory", "/it-services"],
    [InsightsRoute, "Insights", "/insights"],
    [IndexRoute, "Manufacturing, IT and investment advisory", "/"],
  ])("sets title, og:url and canonical for %#", (route, title, path) => {
    const h = (route.options.head as Head)();
    expect(h.meta[0]).toEqual({ title: `${title} | VertiStrat Solutions LLP` });
    expect(h.meta).toContainEqual({ property: "og:url", content: path });
    expect(h.links).toEqual([{ rel: "canonical", href: path }]);
    expect(h.meta.find((m) => m["name"] === "description")!["content"]!.length).toBeGreaterThan(40);
  });

  it("root head declares viewport, charset, stylesheet and icon", () => {
    const h = (
      RootRoute.options.head as unknown as () => {
        meta: Array<Record<string, string>>;
        links: Array<Record<string, string>>;
      }
    )();
    expect(h.meta).toContainEqual({ charSet: "utf-8" });
    expect(h.meta).toContainEqual({
      name: "viewport",
      content: "width=device-width, initial-scale=1",
    });
    expect(h.links.filter((l) => l["rel"] === "stylesheet")).toHaveLength(2);
    expect(h.links).toContainEqual({ rel: "icon", href: "/favicon.png", type: "image/png" });
  });
});

describe("static pages", () => {
  beforeEach(() =>
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, status: 200, json: async () => [] })),
    ),
  );
  afterEach(() => vi.unstubAllGlobals());

  it("About renders one h1, the principles list and a CTA", () => {
    const C = comp(AboutRoute);
    wrap(<C />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { name: "How we work" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a conversation" })).toHaveAttribute(
      "href",
      "/#contact",
    );
  });

  it("Manufacturing renders its workstreams and a CTA", () => {
    const C = comp(ManufacturingRoute);
    wrap(<C />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByText("Site selection")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a conversation" })).toBeInTheDocument();
  });

  it("IT services renders both audiences", () => {
    const C = comp(ItRoute);
    wrap(<C />);
    expect(screen.getByText("IT services firms")).toBeInTheDocument();
    expect(screen.getByText("Manufacturers")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Start a conversation" })).toBeInTheDocument();
  });

  it("Insights renders the blog grid, three sample explainers and the GitHub section", async () => {
    const C = comp(InsightsRoute);
    wrap(<C />);
    expect(screen.getByRole("heading", { name: "From the blog" })).toBeInTheDocument();
    expect(screen.getAllByText("Sample draft")).toHaveLength(3);
    expect(await screen.findByText("No public repositories yet.")).toBeInTheDocument();
  });

  it("Home renders the four layers, links, featured section and the contact form", () => {
    const C = comp(IndexRoute);
    wrap(<C />);
    const aside = screen.getByLabelText("The four layers");
    expect(within(aside).getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Discuss a project" })).toHaveAttribute(
      "href",
      "/#contact",
    );
    expect(screen.getByRole("link", { name: "How we work" })).toHaveAttribute("href", "/about");
    expect(screen.getByRole("link", { name: "See workstreams →" })).toHaveAttribute(
      "href",
      "/manufacturing",
    );
    expect(screen.getByRole("link", { name: "See engagement models →" })).toHaveAttribute(
      "href",
      "/it-services",
    );
    expect(screen.getByRole("link", { name: "All insights →" })).toHaveAttribute(
      "href",
      "/insights",
    );
    // featured grid is limited to MAX_FEATURED skeleton cards while loading
    expect(screen.getByLabelText("Loading").querySelectorAll("li")).toHaveLength(MAX_FEATURED);
    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
  });
});

describe("root route", () => {
  const Root = comp(RootRoute as AnyRoute);
  const NotFound = RootRoute.options.notFoundComponent as ComponentType;
  const ErrorC = RootRoute.options.errorComponent as ComponentType<{
    error: Error;
    reset: () => void;
  }>;
  let errSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    router.invalidate.mockReset();
  });
  afterEach(() => {
    errSpy.mockRestore();
    delete window.__lovableEvents;
  });

  it("wraps pages with header, main#main outlet and footer inside the query provider", () => {
    const queryClient = new QueryClient();
    vi.spyOn(RootRoute, "useRouteContext").mockReturnValue({ queryClient } as never);
    const { container } = render(<Root />);
    expect(container.querySelector("main#main")).not.toBeNull();
    expect(within(container.querySelector("main")!).getByTestId("outlet")).toBeInTheDocument();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
  });

  it("not-found page shows 404 and a way home", () => {
    render(<NotFound />);
    expect(screen.getByRole("heading", { name: "404" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");
  });

  it("error page logs and reports the error once, and 'Try again' invalidates then resets", () => {
    const capture = vi.fn();
    window.__lovableEvents = { captureException: capture };
    const error = new Error("render failed");
    const reset = vi.fn();
    render(<ErrorC error={error} reset={reset} />);
    expect(errSpy).toHaveBeenCalledWith(error);
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture.mock.calls[0]![0]).toBe(error);
    expect(capture.mock.calls[0]![1]).toMatchObject({ boundary: "tanstack_root_error_component" });
    expect(screen.getByRole("link", { name: "Go home" })).toHaveAttribute("href", "/");

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    expect(router.invalidate).toHaveBeenCalledTimes(1);
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
