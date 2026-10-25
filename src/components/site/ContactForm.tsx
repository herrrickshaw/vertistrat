import { useState, type FormEvent } from "react";
import { z } from "zod";
import { CONTACT_EMAIL, CONTACT_FORM_ENABLED } from "@/config";
import { btn } from "./ui";

const schema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(100, "Keep it under 100 characters"),
  email: z.string().trim().max(255).email("Enter a valid email").or(z.literal("")),
  company: z.string().trim().max(150),
  message: z.string().trim().min(10, "Tell us a little more (at least 10 characters)").max(2000, "Keep it under 2000 characters"),
});
type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

// TODO: wire to email or a backend. Called only when CONTACT_FORM_ENABLED is true.
async function submitContact(_data: z.infer<typeof schema>) {
  throw new Error("Contact submission not configured");
}

const field = "mt-1.5 w-full rounded-md border bg-background px-3 py-2.5 text-sm focus-visible:outline-2";

export function ContactForm() {
  const [errors, setErrors] = useState<Errors>({});
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    const r = schema.safeParse(fd);
    if (!r.success) {
      const errs: Errors = {};
      for (const i of r.error.issues) errs[i.path[0] as keyof Errors] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    if (CONTACT_FORM_ENABLED) await submitContact(r.data);
    setDone(true);
    e.currentTarget.reset();
  }

  if (done)
    return (
      <div role="status" className="rounded-md border border-success p-6">
        <p className="font-display text-lg font-semibold">Thanks, message received.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This form is not yet connected, so nothing was sent. For now, please also email <a className="underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
        <button className={`${btn.outline} mt-4`} onClick={() => setDone(false)}>Send another</button>
      </div>
    );

  const err = (k: keyof Errors) => errors[k] && <p id={`${k}-err`} className="mt-1 text-sm text-destructive">{errors[k]}</p>;
  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
      <label className="text-sm">Name *
        <input name="name" className={field} aria-invalid={!!errors.name} aria-describedby="name-err" autoComplete="name" />
        {err("name")}
      </label>
      <label className="text-sm">Email
        <input name="email" type="email" className={field} aria-invalid={!!errors.email} aria-describedby="email-err" autoComplete="email" />
        {err("email")}
      </label>
      <label className="text-sm sm:col-span-2">Company
        <input name="company" className={field} autoComplete="organization" />
      </label>
      <label className="text-sm sm:col-span-2">What are you working on? *
        <textarea name="message" rows={5} className={field} aria-invalid={!!errors.message} aria-describedby="message-err" />
        {err("message")}
      </label>
      <div className="sm:col-span-2"><button type="submit" className={btn.primary}>Send message</button></div>
    </form>
  );
}
