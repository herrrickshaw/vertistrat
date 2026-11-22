import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CONTACT_EMAIL } from "@/config";
import { ContactForm } from "./ContactForm";

function fill(values: { name?: string; email?: string; company?: string; message?: string }) {
  const set = (label: RegExp, v: string | undefined) => {
    if (v !== undefined) fireEvent.change(screen.getByLabelText(label), { target: { value: v } });
  };
  set(/^Name/, values.name);
  set(/^Email/, values.email);
  set(/^Company/, values.company);
  set(/What are you working on/, values.message);
}
const submit = () => fireEvent.click(screen.getByRole("button", { name: "Send message" }));
const GOOD = { name: "Ada", email: "ada@example.com", company: "Acme", message: "0123456789" };

describe("ContactForm", () => {
  it("shows required-field errors on an empty submit and no success state", () => {
    render(<ContactForm />);
    submit();
    expect(screen.getByText("Please enter your name")).toBeInTheDocument();
    expect(screen.getByText("Tell us a little more (at least 10 characters)")).toBeInTheDocument();
    expect(screen.queryByText("Enter a valid email")).toBeNull(); // empty email is allowed
    expect(screen.queryByRole("status")).toBeNull();
    expect(screen.getByLabelText(/^Name/)).toHaveAttribute("aria-invalid", "true");
    expect(screen.getByLabelText(/^Email/)).toHaveAttribute("aria-invalid", "false");
  });

  it("links error text to inputs via ids matching aria-describedby", () => {
    const { container } = render(<ContactForm />);
    submit();
    expect(container.querySelector("#name-err")).toHaveTextContent("Please enter your name");
    expect(container.querySelector("#message-err")).not.toBeNull();
    expect(screen.getByLabelText(/^Name/)).toHaveAttribute("aria-describedby", "name-err");
  });

  it("rejects an invalid email", () => {
    render(<ContactForm />);
    fill({ ...GOOD, email: "not-an-email" });
    submit();
    expect(screen.getByText("Enter a valid email")).toBeInTheDocument();
    expect(screen.queryByText("Please enter your name")).toBeNull();
  });

  it("treats whitespace-only name as empty (trim)", () => {
    render(<ContactForm />);
    fill({ ...GOOD, name: "   " });
    submit();
    expect(screen.getByText("Please enter your name")).toBeInTheDocument();
  });

  it("message must be at least 10 characters after trimming", () => {
    render(<ContactForm />);
    fill({ ...GOOD, message: "123456789" });
    submit();
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument();
    fill({ message: "  123456789  " });
    submit();
    expect(screen.getByText(/at least 10 characters/)).toBeInTheDocument();
  });

  it("accepts exactly 10 characters of message", async () => {
    render(<ContactForm />);
    fill(GOOD);
    submit();
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("enforces max lengths: name 100, message 2000, email 255, company 150", () => {
    render(<ContactForm />);
    fill({ ...GOOD, name: "n".repeat(101) });
    submit();
    expect(screen.getByText("Keep it under 100 characters")).toBeInTheDocument();
    fill({ name: "n".repeat(100), message: "m".repeat(2001) });
    submit();
    expect(screen.queryByText("Keep it under 100 characters")).toBeNull();
    expect(screen.getByText("Keep it under 2000 characters")).toBeInTheDocument();
  });

  it("accepts boundary lengths of exactly 100 / 2000 characters", async () => {
    render(<ContactForm />);
    fill({ ...GOOD, name: "n".repeat(100), message: "m".repeat(2000) });
    submit();
    expect(await screen.findByRole("status")).toBeInTheDocument();
  });

  it("rejects an over-long company (150) and email (255) without a per-field message from the form", () => {
    render(<ContactForm />);
    fill({ ...GOOD, company: "c".repeat(151) });
    submit();
    expect(screen.queryByRole("status")).toBeNull();
    fill({ company: "c".repeat(150), email: `${"e".repeat(251)}@x.io` });
    submit();
    expect(screen.queryByRole("status")).toBeNull();
  });

  it("shows only the first error per field", () => {
    render(<ContactForm />);
    fill({ ...GOOD, email: `${"e".repeat(260)}-bad` });
    submit();
    expect(document.querySelectorAll("#email-err")).toHaveLength(1);
  });

  it("clears previous errors once the form becomes valid, and shows the success state (form disabled, nothing sent)", async () => {
    render(<ContactForm />);
    submit();
    expect(screen.getByText("Please enter your name")).toBeInTheDocument();
    fill(GOOD);
    submit();
    await waitFor(() => expect(screen.getByRole("status")).toBeInTheDocument());
    expect(screen.getByText("Thanks, message received.")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: CONTACT_EMAIL })).toHaveAttribute(
      "href",
      `mailto:${CONTACT_EMAIL}`,
    );
    expect(screen.queryByText("Please enter your name")).toBeNull();
    expect(screen.queryByRole("button", { name: "Send message" })).toBeNull();
  });

  it("'Send another' returns to a blank, error-free form", async () => {
    render(<ContactForm />);
    fill(GOOD);
    submit();
    fireEvent.click(await screen.findByRole("button", { name: "Send another" }));
    expect(screen.getByRole("button", { name: "Send message" })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Name/)).toHaveValue("");
    expect(screen.queryByText("Please enter your name")).toBeNull();
  });
});
