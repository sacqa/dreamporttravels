import { createFileRoute, notFound } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { LEGAL } from "@/lib/legal-content";

export const Route = createFileRoute("/$legal")({
  beforeLoad: ({ params }) => {
    if (!LEGAL[params.legal]) throw notFound();
  },
  head: ({ params }) => {
    const p = LEGAL[params.legal!];
    return { meta: p ? [{ title: `${p.title} — DreamPort Travels` }, { name: "description", content: p.description }] : [] };
  },
  component: LegalPage,
});

function LegalPage() {
  const { legal } = Route.useParams();
  const page = LEGAL[legal];
  if (!page) return null;
  return (
    <AppShell>
      <PageHeader eyebrow="Legal" title={page.title} subtitle={page.description} />
      <section className="py-16">
        <div className="max-w-3xl mx-auto px-6 space-y-8">
          {page.sections.map((s) => (
            <div key={s.h}>
              <h2 className="text-xl font-display font-semibold mb-2">{s.h}</h2>
              <p className="text-muted-foreground leading-relaxed">{s.p}</p>
            </div>
          ))}
          <p className="text-xs text-muted-foreground pt-8 border-t border-border">Last updated: {new Date().toLocaleDateString("en-PK", { year: "numeric", month: "long", day: "numeric" })}</p>
        </div>
      </section>
    </AppShell>
  );
}
