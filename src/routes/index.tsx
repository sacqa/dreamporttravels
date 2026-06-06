import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { visasQuery, umrahQuery } from "@/lib/queries";
import { formatPKR, SITE } from "@/lib/site";
import { ArrowRight, ShieldCheck, Clock, Globe2, Headphones, CheckCircle2, Star } from "lucide-react";
import { cart } from "@/lib/cart";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  loader: ({ context }) => Promise.all([
    context.queryClient.ensureQueryData(visasQuery),
    context.queryClient.ensureQueryData(umrahQuery),
  ]),
  component: Home,
});

function Home() {
  const { data: visas } = useSuspenseQuery(visasQuery);
  const { data: umrah } = useSuspenseQuery(umrahQuery);
  const featured = visas.filter((v) => v.featured).slice(0, 4);

  return (
    <AppShell>
      {/* Hero */}
      <section className="hero-gradient">
        <div className="max-w-7xl mx-auto px-6 py-20 md:py-28 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-semibold mb-6">
            <span className="size-1.5 rounded-full bg-accent animate-pulse" />
            SECP Registered • SMC-Private Limited
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-semibold leading-[1.05] text-balance max-w-4xl mx-auto">
            Your Gateway to the <span className="text-accent">Global Horizon.</span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {SITE.description}
          </p>
          <div className="mt-10 flex flex-wrap gap-3 justify-center">
            <Link to="/visas" className="bg-primary text-primary-foreground px-7 py-3.5 rounded-full font-semibold hover:bg-primary-light transition-colors inline-flex items-center gap-2">
              Browse Visa Services <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/umrah" className="bg-card text-foreground border border-border px-7 py-3.5 rounded-full font-semibold hover:bg-muted transition-colors">
              Umrah Packages
            </Link>
          </div>
          <div className="mt-12 flex flex-wrap gap-6 justify-center text-sm text-muted-foreground">
            <span className="flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-success" /> Secure Online Payments</span>
            <span className="flex items-center gap-2"><Clock className="h-4 w-4 text-success" /> Fast Processing</span>
            <span className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-success" /> 40+ Countries</span>
          </div>
        </div>
      </section>

      {/* Popular visas */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-end justify-between mb-10 flex-wrap gap-4">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-semibold mb-2">Popular Visa Destinations</h2>
              <p className="text-muted-foreground">Transparent pricing for Pakistani passport holders.</p>
            </div>
            <Link to="/visas" className="text-accent font-semibold inline-flex items-center gap-1 group">
              View all <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featured.map((v) => (
              <article key={v.id} className="bg-card rounded-2xl p-5 ring-1 ring-border hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="aspect-[4/3] rounded-xl bg-gradient-to-br from-accent/10 to-primary/10 mb-4 flex items-center justify-center text-6xl">
                  {v.flag_emoji}
                </div>
                <h3 className="font-semibold text-lg">{v.country}</h3>
                <p className="text-sm text-muted-foreground mb-3">{v.visa_type}</p>
                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <span className="font-bold text-accent">{formatPKR(v.price_pkr)}</span>
                  <Link to="/visas/$slug" params={{ slug: v.slug }} className="text-xs font-semibold text-primary hover:text-accent">
                    Apply →
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Umrah */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Pilgrimage Services</span>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mt-3">Curated Umrah Packages</h2>
            <p className="mt-3 text-muted-foreground max-w-2xl mx-auto">
              From economy to luxury — every package includes visa, flights, hotels, transport and Ziyarat.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {umrah.map((p) => {
              const popular = p.popular;
              return (
                <article
                  key={p.id}
                  className={`rounded-2xl p-8 flex flex-col ring-1 ${popular ? "bg-primary text-primary-foreground ring-primary shadow-2xl shadow-primary/20" : "bg-card ring-border"}`}
                >
                  {popular && <span className="self-start mb-3 text-[10px] font-bold uppercase tracking-widest bg-accent text-accent-foreground px-2 py-1 rounded">Most Popular</span>}
                  <h3 className="text-xl font-semibold">{p.name}</h3>
                  <p className={`text-sm mt-1 ${popular ? "text-primary-foreground/70" : "text-muted-foreground"}`}>{p.duration_days} Days • {p.distance_from_haram}</p>
                  <div className={`text-3xl font-display font-semibold mt-6 ${popular ? "text-primary-foreground" : "text-accent"}`}>
                    {formatPKR(p.price_pkr)}<span className={`text-sm font-normal ${popular ? "text-primary-foreground/60" : "text-muted-foreground"}`}> / person</span>
                  </div>
                  <ul className="mt-6 space-y-2.5 flex-1">
                    {p.inclusions?.slice(0, 5).map((i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className={`h-4 w-4 mt-0.5 shrink-0 ${popular ? "text-primary-foreground" : "text-accent"}`} /> {i}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      cart.add({ type: "umrah", itemId: p.id, name: p.name, details: `${p.duration_days} days`, unitPrice: p.price_pkr });
                      toast.success("Added to cart");
                    }}
                    className={`mt-7 w-full py-3 rounded-lg font-semibold transition-colors ${popular ? "bg-primary-foreground text-primary hover:bg-white" : "bg-primary text-primary-foreground hover:bg-primary-light"}`}
                  >
                    Add to Cart
                  </button>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-display font-semibold mb-4">A Registered, Trusted Pakistani Travel Brand</h2>
            <p className="text-primary-foreground/70 leading-relaxed">
              {SITE.legalName} is registered with SECP under SMC-Private Limited status. Our office in Depalpur, District Okara, offers in-person consultation alongside a fully digital booking and payment experience.
            </p>
            <div className="grid grid-cols-3 mt-8 gap-6">
              <Stat n="10k+" l="Visas Issued" />
              <Stat n="5k+" l="Happy Pilgrims" />
              <Stat n="40+" l="Countries" />
            </div>
          </div>
          <div className="grid gap-4">
            {[
              { icon: ShieldCheck, t: "JazzCash & Easypaisa Integrated", d: "Secure online payments with instant confirmation." },
              { icon: Headphones, t: "Dedicated Support", d: "Direct WhatsApp & phone access to our team." },
              { icon: Clock, t: "Transparent Processing", d: "Clear timelines and itemized pricing for every service." },
            ].map(({ icon: Icon, t, d }) => (
              <div key={t} className="flex gap-4 p-5 rounded-xl bg-white/5 border border-white/10">
                <div className="size-11 rounded-lg bg-accent/20 text-accent flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
                <div><h4 className="font-semibold">{t}</h4><p className="text-sm text-primary-foreground/60">{d}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-display font-semibold text-center mb-12">What our clients say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { n: "Ahmed Raza", c: "Lahore", q: "Got my UAE visa in 4 days. The team kept me updated at every step. Highly recommended for Pakistani travelers." },
              { n: "Fatima Bibi", c: "Okara", q: "Performed Umrah with the Executive package. Hotels were excellent and transport was very organized. JazzakAllah." },
              { n: "Muhammad Bilal", c: "Faisalabad", q: "Schengen visa approved on first attempt. Their documentation guidance is honest and professional." },
            ].map((t) => (
              <div key={t.n} className="bg-card rounded-2xl p-6 ring-1 ring-border">
                <div className="flex gap-0.5 text-accent mb-3">{Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}</div>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">"{t.q}"</p>
                <div className="text-sm"><span className="font-semibold">{t.n}</span> <span className="text-muted-foreground">— {t.c}</span></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function Stat({ n, l }: { n: string; l: string }) {
  return <div><div className="text-3xl font-display font-bold text-accent">{n}</div><div className="text-xs uppercase tracking-widest text-primary-foreground/60 mt-1">{l}</div></div>;
}
