import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/site";
import { generateServiceImage } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — DreamPort Travels" }] }),
  component: AdminPage,
});

type Row = {
  id: string;
  country?: string;
  name?: string;
  flag_emoji?: string | null;
  visa_type?: string;
  tier?: string;
  price_pkr: number;
  image_url?: string | null;
  active: boolean;
};

function AdminPage() {
  const [tab, setTab] = useState<"orders" | "visas" | "umrah">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [visas, setVisas] = useState<Row[]>([]);
  const [umrah, setUmrah] = useState<Row[]>([]);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const refresh = async () => {
    const [o, v, u] = await Promise.all([
      supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("visa_services").select("*").order("country"),
      supabase.from("umrah_packages").select("*").order("price_pkr"),
    ]);
    setOrders(o.data ?? []);
    setVisas((v.data ?? []) as any);
    setUmrah((u.data ?? []) as any);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setAuthed(false); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const isAdmin = roles?.some((r) => r.role === "admin");
      setAuthed(!!isAdmin);
      if (isAdmin) await refresh();
    });
  }, []);

  if (authed === null) return <AppShell><PageHeader title="Loading..." /></AppShell>;
  if (!authed) return (
    <AppShell>
      <PageHeader title="Admin access required" subtitle="Sign in with an admin account." />
      <div className="max-w-md mx-auto px-6 text-center pb-12">
        <Link to="/auth" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">Sign In</Link>
        <p className="text-xs text-muted-foreground mt-6">To grant admin: insert a row into user_roles with role='admin' via the backend.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <PageHeader title="Admin Dashboard" subtitle="Orders, services, and AI image management" />
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="inline-flex gap-1 bg-muted rounded-full p-1 mb-6">
            {(["orders","visas","umrah"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition ${tab===t?"bg-card shadow":"text-muted-foreground"}`}>
                {t} ({t==="orders"?orders.length:t==="visas"?visas.length:umrah.length})
              </button>
            ))}
          </div>

          {tab === "orders" && <OrdersTable orders={orders} />}
          {tab === "visas" && <ServicesTable rows={visas} table="visa_services" onChange={refresh} />}
          {tab === "umrah" && <ServicesTable rows={umrah} table="umrah_packages" onChange={refresh} />}
        </div>
      </section>
    </AppShell>
  );
}

function OrdersTable({ orders }: { orders: any[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm bg-card rounded-xl ring-1 ring-border">
        <thead className="bg-muted/40 text-left">
          <tr>{["Order #","Customer","Phone","Total","Method","Status","Date"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-border">
              <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
              <td className="px-4 py-3">{o.customer_name}<br /><span className="text-xs text-muted-foreground">{o.customer_email}</span></td>
              <td className="px-4 py-3">{o.customer_phone}</td>
              <td className="px-4 py-3 font-semibold">{formatPKR(o.total_pkr)}</td>
              <td className="px-4 py-3">{o.payment_method}</td>
              <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded text-xs bg-accent/10 text-accent">{o.status}</span></td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ServicesTable({ rows, table, onChange }: { rows: Row[]; table: "visa_services" | "umrah_packages"; onChange: () => void }) {
  const gen = useServerFn(generateServiceImage);
  const [busy, setBusy] = useState<string | null>(null);

  async function generate(r: Row) {
    const label = r.country ?? r.name ?? "service";
    const defaultPrompt = table === "visa_services"
      ? `A stunning travel photograph of ${r.country}, iconic landmark, golden hour cinematic lighting, ultra realistic, 4k, vibrant colors, no text`
      : `Beautiful photograph of ${r.name} — Masjid al-Haram or Madinah, devotional Umrah journey, soft golden light, ultra realistic, no text`;
    const prompt = window.prompt(`AI prompt for "${label}":`, defaultPrompt);
    if (!prompt) return;
    setBusy(r.id);
    try {
      await gen({ data: { table, id: r.id, prompt } });
      toast.success("Image generated");
      await onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Generation failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {rows.map((r) => (
        <div key={r.id} className="bg-card rounded-2xl ring-1 ring-border overflow-hidden">
          <div className="aspect-[4/3] bg-muted relative flex items-center justify-center text-6xl">
            {r.image_url ? (
              <img src={r.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <span>{r.flag_emoji ?? "🕋"}</span>
            )}
          </div>
          <div className="p-4">
            <h3 className="font-semibold">{r.country ?? r.name}</h3>
            <p className="text-xs text-muted-foreground">{r.visa_type ?? r.tier}</p>
            <p className="text-accent font-bold text-sm mt-1">{formatPKR(r.price_pkr)}</p>
            <button
              disabled={busy === r.id}
              onClick={() => generate(r)}
              className="mt-3 w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:bg-primary-light disabled:opacity-60"
            >
              {busy === r.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> {r.image_url ? "Regenerate AI Image" : "Generate AI Image"}</>}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
