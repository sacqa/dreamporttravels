import { createFileRoute } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { umrahQuery } from "@/lib/queries";
import { formatPKR } from "@/lib/site";
import { cart } from "@/lib/cart";
import { toast } from "sonner";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/umrah")({
  head: () => ({ meta: [{ title: "Umrah Packages — DreamPort Travels" }, { name: "description", content: "Premium Umrah packages from Pakistan. Economy, Executive and Luxury tiers with hotels close to Haram." }] }),
  loader: ({ context }) => context.queryClient.ensureQueryData(umrahQuery),
  component: UmrahPage,
});

function UmrahPage() {
  const { data: pkgs } = useSuspenseQuery(umrahQuery);
  return (
    <AppShell>
      <PageHeader
        eyebrow="Pilgrimage"
        title="Sacred journeys, organized with care."
        subtitle="End-to-end Umrah packages including visa, flights, hotels, ground transport and Ziyarat."
      />
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-3 gap-6">
          {pkgs.map((p) => {
            const popular = p.popular;
            return (
              <article key={p.id} className={`rounded-2xl p-8 flex flex-col ring-1 ${popular ? "bg-primary text-primary-foreground ring-primary shadow-2xl shadow-primary/20" : "bg-card ring-border"}`}>
                {popular && <span className="self-start mb-3 text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-2 py-1 rounded">Most Popular</span>}
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className={`text-sm mt-1 ${popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.duration_days} Days</p>
                <div className={`text-3xl font-display font-semibold mt-6 ${popular ? "text-primary-foreground" : "text-accent"}`}>
                  {formatPKR(p.price_pkr)}<span className={`text-sm font-normal ${popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}> / person</span>
                </div>
                <div className={`mt-4 text-xs uppercase tracking-widest ${popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}>Accommodation</div>
                <p className="text-sm mt-1">🕋 Makkah: {p.makkah_hotel}</p>
                <p className="text-sm">🕌 Madinah: {p.madinah_hotel}</p>
                <p className={`text-sm ${popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>📍 {p.distance_from_haram}</p>
                <ul className="mt-6 space-y-2.5 flex-1">
                  {p.inclusions?.map((i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${popular ? "text-primary-foreground" : "text-accent"}`} /> {i}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => { cart.add({ type: "umrah", itemId: p.id, name: p.name, details: `${p.duration_days} days`, unitPrice: p.price_pkr }); toast.success("Added to cart"); }}
                  className={`mt-7 w-full py-3 rounded-lg font-semibold transition-colors ${popular ? "bg-primary-foreground text-primary hover:bg-white" : "bg-primary text-primary-foreground hover:bg-primary-light"}`}
                >
                  Book This Package
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </AppShell>
  );
}
