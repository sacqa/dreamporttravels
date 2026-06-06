import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { CheckCircle2 } from "lucide-react";
import { z } from "zod";
import { zodValidator, fallback } from "@tanstack/zod-adapter";

export const Route = createFileRoute("/order-confirmed")({
  validateSearch: zodValidator(z.object({ o: fallback(z.string(), "").default("") })),
  component: Confirmed,
});

function Confirmed() {
  const { o } = Route.useSearch();
  return (
    <AppShell>
      <section className="py-24">
        <div className="max-w-xl mx-auto px-6 text-center">
          <div className="size-20 rounded-full bg-success/10 text-success flex items-center justify-center mx-auto mb-6"><CheckCircle2 className="h-10 w-10" /></div>
          <h1 className="text-3xl font-display font-semibold">Order placed successfully!</h1>
          {o && <p className="mt-2 text-muted-foreground">Order Number: <strong className="text-foreground">{o}</strong></p>}
          <p className="mt-6 text-muted-foreground">Our representative will contact you within 24 hours via phone/WhatsApp for payment confirmation and document collection.</p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">Back to Home</Link>
            <Link to="/contact" className="border border-border px-6 py-3 rounded-full font-semibold">Contact Support</Link>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
