import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell, PageHeader } from "@/components/AppShell";
import { visasQuery } from "@/lib/queries";
import { formatPKR } from "@/lib/site";
import { Clock } from "lucide-react";

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
              <Link
                key={v.id}
                to="/visas/$slug"
                params={{ slug: v.slug }}
                className="group bg-card rounded-2xl p-5 ring-1 ring-border hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
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
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
                  <span className="font-bold text-accent">{formatPKR(v.price_pkr)}</span>
                  <span className="text-xs font-semibold text-primary group-hover:text-accent">View →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}
