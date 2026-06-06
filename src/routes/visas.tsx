import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { visasQuery } from "@/lib/queries";
import { formatPKR } from "@/lib/site";
import { cart } from "@/lib/cart";
import { toast } from "sonner";
import { Clock, ShoppingCart } from "lucide-react";

export const Route = createFileRoute("/visas")({
  head: () => ({ meta: [{ title: "Visa Services — DreamPort Travels" }, { name: "description", content: "Browse visa services for UAE, Turkey, Saudi Arabia, UK, Schengen and more. Transparent pricing in PKR." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(visasQuery),
  component: VisasPage,
});

function VisasPage() {
  const { data: visas } = useSuspenseQuery(visasQuery);
  return (
    <AppShell>
      <PageHeader
        eyebrow="Visa Services"
        title="Visa solutions for every destination."
        subtitle="Complete documentation, appointment scheduling, and processing support for Pakistani passport holders."
      />
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {visas.map((v: typeof visas[number] & { image_url?: string | null }) => (
              <div
                key={v.id}
                className="group bg-card rounded-2xl p-5 ring-1 ring-border hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
              >
                <Link to="/visas/$slug" params={{ slug: v.slug }} className="block">
                  <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 mb-4 flex items-center justify-center text-7xl overflow-hidden relative">
                    {v.image_url ? (
                      <img src={v.image_url} alt={v.country} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    ) : (
                      <span>{v.flag_emoji}</span>
                    )}
                  </div>
                  <h3 className="font-semibold text-lg">{v.country}</h3>
                  <p className="text-sm text-muted-foreground">{v.visa_type}</p>
                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Clock className="h-3 w-3" /> {v.processing_time}</p>
                </Link>
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <span className="font-bold text-accent">{formatPKR(v.price_pkr)}</span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      cart.add({ type: "visa", itemId: v.id, name: `${v.country} — ${v.visa_type}`, details: v.duration ?? "", unitPrice: v.price_pkr });
                      toast.success(`${v.country} added to cart`);
                    }}
                    className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground px-3 py-1.5 rounded-full text-xs font-semibold hover:bg-primary-light"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" /> Add
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
