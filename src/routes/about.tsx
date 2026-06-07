import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { SITE } from "@/lib/site";
import { Award, Globe2, HeartHandshake, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [{ title: `About — ${SITE.name}` }, { name: "description", content: `Learn about ${SITE.legalName}, a registered Pakistani travel company in Depalpur.` }] }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <AppShell>
      <PageHeader eyebrow="About Us" title={SITE.legalName} subtitle="A registered Pakistani travel management company dedicated to seamless global travel and meaningful spiritual journeys." />
      <section className="py-16">
        <div className="max-w-4xl mx-auto px-6 prose prose-neutral">
          <p>
            DreamPort Travels (SMC-Private) Limited is a Pakistani travel services company registered under the Securities & Exchange Commission of Pakistan (SECP) as a Single Member Company. From our office in Depalpur, District Okara, we serve clients across Punjab and beyond with two specialised practice areas: international visa processing and Umrah pilgrimage management.
          </p>
          <p>
            Our mission is simple: make international travel accessible, transparent and stress-free for ordinary Pakistanis. We combine in-person consultation at our physical office with a fully digital booking and secure online payment experience — so customers from any corner of the country can engage with us conveniently and securely.
          </p>
          <h2>Our Commitment</h2>
          <ul>
            <li>Transparent, all-inclusive pricing in PKR — no hidden charges.</li>
            <li>Honest documentation guidance to maximise visa approval rates.</li>
            <li>Dedicated representative for every order — by phone and WhatsApp.</li>
            <li>Compliance with Pakistani consumer-protection and travel-services regulations.</li>
          </ul>
        </div>
        <div className="max-w-5xl mx-auto px-6 mt-12 grid md:grid-cols-4 gap-4">
          {[
            { i: ShieldCheck, t: "SECP Registered", d: "SMC-Private Limited" },
            { i: Globe2, t: "40+ Destinations", d: "Worldwide visa services" },
            { i: HeartHandshake, t: "Pakistan-Wide", d: "Serving every district" },
            { i: Award, t: "10k+ Clients", d: "Trusted since inception" },
          ].map(({ i: I, t, d }) => (
            <div key={t} className="bg-card ring-1 ring-border rounded-xl p-5 text-center">
              <I className="h-7 w-7 text-accent mx-auto mb-2" />
              <div className="font-semibold">{t}</div>
              <div className="text-xs text-muted-foreground mt-1">{d}</div>
            </div>
          ))}
        </div>
      </section>
    </AppShell>
  );
}
