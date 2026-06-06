import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { visaBySlugQuery } from "@/lib/queries";
import { formatPKR } from "@/lib/site";
import { cart } from "@/lib/cart";
import { toast } from "sonner";
import { Check, Clock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/visas/$slug")({
  loader: ({ context, params }) => context.queryClient.ensureQueryData(visaBySlugQuery(params.slug)),
  component: VisaDetail,
});

function VisaDetail() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const { data: v } = useSuspenseQuery(visaBySlugQuery(slug));

  const add = (checkout = false) => {
    cart.add({ type: "visa", itemId: v.id, name: `${v.country} — ${v.visa_type}`, details: v.duration ?? "", unitPrice: v.price_pkr });
    toast.success("Added to cart");
    if (checkout) navigate({ to: "/checkout" });
  };

  return (
    <AppShell>
      <section className="hero-gradient border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-10 md:py-16">
          <Link to="/visas" className="text-sm text-muted-foreground hover:text-accent">← All visa services</Link>
          <div className="grid lg:grid-cols-[1fr_400px] gap-10 mt-6 items-start">
            <div>
              <div className="text-8xl mb-4">{v.flag_emoji}</div>
              <h1 className="text-4xl md:text-5xl font-display font-semibold">{v.country}</h1>
              <p className="text-xl text-muted-foreground mt-2">{v.visa_type}</p>
              <p className="mt-6 leading-relaxed">{v.description}</p>
            </div>
            <aside className="bg-card rounded-2xl ring-1 ring-border p-6 sticky top-24">
              <div className="text-3xl font-display font-bold text-accent">{formatPKR(v.price_pkr)}</div>
              <p className="text-sm text-muted-foreground">All-inclusive service fee</p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="flex items-center gap-2"><Clock className="h-4 w-4 text-accent" /> {v.processing_time}</li>
                <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-accent" /> Secure payment via JazzCash/Easypaisa</li>
                <li className="flex items-center gap-2"><Check className="h-4 w-4 text-accent" /> Duration: {v.duration}</li>
              </ul>
              <button onClick={() => add(true)} className="mt-6 w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-light">
                Apply Now
              </button>
              <button onClick={() => add(false)} className="mt-2 w-full border border-border py-3 rounded-lg font-semibold hover:bg-muted">
                Add to Cart
              </button>
            </aside>
          </div>
        </div>
      </section>
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-2xl font-display font-semibold mb-6">Required Documents</h2>
          <ul className="grid sm:grid-cols-2 gap-3">
            {v.requirements?.map((r) => (
              <li key={r} className="flex items-start gap-3 p-4 bg-card rounded-xl ring-1 ring-border">
                <Check className="h-5 w-5 text-accent shrink-0 mt-0.5" /> <span>{r}</span>
              </li>
            ))}
          </ul>
          <div className="mt-10 p-6 bg-muted/40 rounded-xl text-sm text-muted-foreground">
            After payment, our representative will contact you within 24 hours to collect documents and begin processing.
          </div>
        </div>
      </section>
    </AppShell>
  );
}
