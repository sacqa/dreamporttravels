import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/site";
import { generateServiceImage } from "@/lib/admin.functions";
import { toast } from "sonner";
import { Sparkles, Loader2, Plus, Trash2, Eye, EyeOff } from "lucide-react";

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

const ORDER_STATUSES = ["pending", "paid", "processing", "completed", "cancelled"] as const;

function AdminPage() {
  const [tab, setTab] = useState<"orders" | "visas" | "umrah">("orders");
  const [orders, setOrders] = useState<any[]>([]);
  const [visas, setVisas] = useState<Row[]>([]);
  const [umrah, setUmrah] = useState<Row[]>([]);
  const [authed, setAuthed] = useState<boolean | null>(null);

  const refresh = async () => {
    const [o, v, u] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100),
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
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <PageHeader title="Admin Dashboard" subtitle="Full control over orders, services, and content" />
      <section className="py-6">
        <div className="max-w-7xl mx-auto px-6">
          <div className="inline-flex gap-1 bg-muted rounded-full p-1 mb-6">
            {(["orders","visas","umrah"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-5 py-2 rounded-full text-sm font-semibold capitalize transition ${tab===t?"bg-card shadow":"text-muted-foreground"}`}>
                {t} ({t==="orders"?orders.length:t==="visas"?visas.length:umrah.length})
              </button>
            ))}
          </div>

          {tab === "orders" && <OrdersTable orders={orders} onChange={refresh} />}
          {tab === "visas" && <ServicesTable rows={visas} table="visa_services" onChange={refresh} />}
          {tab === "umrah" && <ServicesTable rows={umrah} table="umrah_packages" onChange={refresh} />}
        </div>
      </section>
    </AppShell>
  );
}

function OrdersTable({ orders, onChange }: { orders: any[]; onChange: () => void }) {
  async function updateStatus(id: string, status: typeof ORDER_STATUSES[number]) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    toast.success(`Order marked ${status}`);
    onChange();
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm bg-card rounded-xl ring-1 ring-border">
        <thead className="bg-muted/40 text-left">
          <tr>{["Order #","Customer","Phone","Items","Total","Method","Status","Date"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr key={o.id} className="border-t border-border align-top">
              <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
              <td className="px-4 py-3">{o.customer_name}<br /><span className="text-xs text-muted-foreground">{o.customer_email}</span></td>
              <td className="px-4 py-3">{o.customer_phone}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px]">
                {o.order_items?.map((i: any) => <div key={i.id}>{i.item_name} ×{i.quantity}</div>)}
              </td>
              <td className="px-4 py-3 font-semibold">{formatPKR(o.total_pkr)}</td>
              <td className="px-4 py-3 capitalize">{o.payment_method?.replace("_"," ")}</td>
              <td className="px-4 py-3">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                >
                  {ORDER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
              <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
          {orders.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">No orders yet.</td></tr>}
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

  async function toggleActive(r: Row) {
    const { error } = await (supabase.from(table) as any).update({ active: !r.active }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(!r.active ? "Activated" : "Hidden from site");
    onChange();
  }

  async function editPrice(r: Row) {
    const v = window.prompt("New price (PKR):", String(r.price_pkr));
    if (!v) return;
    const n = Number(v.replace(/[^\d]/g, ""));
    if (!Number.isFinite(n) || n <= 0) return toast.error("Invalid price");
    const { error } = await (supabase.from(table) as any).update({ price_pkr: n }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Price updated");
    onChange();
  }

  async function remove(r: Row) {
    if (!window.confirm(`Delete "${r.country ?? r.name}"? This cannot be undone.`)) return;
    const { error } = await supabase.from(table).delete().eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success("Deleted");
    onChange();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <AddServiceButton table={table} onChange={onChange} />
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.map((r) => (
          <div key={r.id} className={`bg-card rounded-2xl ring-1 ring-border overflow-hidden ${!r.active ? "opacity-60" : ""}`}>
            <div className="aspect-[4/3] bg-muted relative flex items-center justify-center text-6xl">
              {r.image_url ? (
                <img src={r.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <span>{r.flag_emoji ?? "🕋"}</span>
              )}
            </div>
            <div className="p-4 space-y-2">
              <h3 className="font-semibold">{r.country ?? r.name}</h3>
              <p className="text-xs text-muted-foreground">{r.visa_type ?? r.tier}</p>
              <button onClick={() => editPrice(r)} className="text-accent font-bold text-sm hover:underline">{formatPKR(r.price_pkr)} ✎</button>
              <button
                disabled={busy === r.id}
                onClick={() => generate(r)}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:bg-primary-light disabled:opacity-60"
              >
                {busy === r.id ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="h-4 w-4" /> {r.image_url ? "Regenerate" : "Generate Image"}</>}
              </button>
              <div className="flex gap-2">
                <button onClick={() => toggleActive(r)} className="flex-1 inline-flex items-center justify-center gap-1 border border-border rounded-lg py-1.5 text-xs hover:bg-muted">
                  {r.active ? <><Eye className="h-3.5 w-3.5" /> Active</> : <><EyeOff className="h-3.5 w-3.5" /> Hidden</>}
                </button>
                <button onClick={() => remove(r)} className="inline-flex items-center justify-center border border-destructive/30 text-destructive rounded-lg py-1.5 px-3 text-xs hover:bg-destructive/10">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddServiceButton({ table, onChange }: { table: "visa_services" | "umrah_packages"; onChange: () => void }) {
  const [busy, setBusy] = useState(false);
  async function add() {
    setBusy(true);
    try {
      if (table === "visa_services") {
        const country = window.prompt("Country name?"); if (!country) return;
        const visa_type = window.prompt("Visa type?", "Tourist") ?? "Tourist";
        const price_pkr = Number(window.prompt("Price (PKR)?", "50000")?.replace(/[^\d]/g, "") || "0");
        if (price_pkr <= 0) return toast.error("Invalid price");
        const slug = country.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const { error } = await supabase.from("visa_services").insert({ country, visa_type, slug, price_pkr, active: true } as any);
        if (error) throw error;
      } else {
        const name = window.prompt("Package name?"); if (!name) return;
        const tier = window.prompt("Tier?", "Standard") ?? "Standard";
        const price_pkr = Number(window.prompt("Price (PKR)?", "350000")?.replace(/[^\d]/g, "") || "0");
        if (price_pkr <= 0) return toast.error("Invalid price");
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        const { error } = await supabase.from("umrah_packages").insert({ name, tier, slug, price_pkr, active: true } as any);
        if (error) throw error;
      }
      toast.success("Added");
      onChange();
    } catch (e: any) {
      toast.error(e?.message ?? "Could not add");
    } finally { setBusy(false); }
  }
  return (
    <button disabled={busy} onClick={add} className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold hover:opacity-90 disabled:opacity-60">
      <Plus className="h-4 w-4" /> Add new
    </button>
  );
}
