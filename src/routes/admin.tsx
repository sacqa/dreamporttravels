import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR, SITE } from "@/lib/site";
import { generateServiceImage } from "@/lib/admin.functions";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Plus, Trash2, Eye, EyeOff,
  LayoutDashboard, ShoppingCart, Plane, Building2, FileText, Users, MessageSquare,
  CreditCard, ExternalLink, LogOut, Menu, X, Globe, DollarSign, TrendingUp, Bell,
} from "lucide-react";

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

type Tab = "dashboard" | "orders" | "visas" | "umrah" | "content" | "customers" | "inquiries" | "payments";

const NAV: { key: Tab; label: string; icon: any }[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingCart },
  { key: "visas", label: "Visa Services", icon: Plane },
  { key: "umrah", label: "Umrah Packages", icon: Building2 },
  { key: "content", label: "Site Content", icon: FileText },
  { key: "customers", label: "Customers", icon: Users },
  { key: "inquiries", label: "Inquiries", icon: MessageSquare },
  { key: "payments", label: "Payments", icon: CreditCard },
];

function AdminPage() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [visas, setVisas] = useState<Row[]>([]);
  const [umrah, setUmrah] = useState<Row[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const refresh = async () => {
    const [o, v, u, iq, pc, sc, cu] = await Promise.all([
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100),
      supabase.from("visa_services").select("*").order("country"),
      supabase.from("umrah_packages").select("*").order("price_pkr"),
      supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("payment_configs").select("*").order("provider"),
      supabase.from("site_content").select("*").order("category"),
      supabase.from("profiles").select("*").order("full_name").limit(200),
    ]);
    setOrders(o.data ?? []);
    setVisas((v.data ?? []) as any);
    setUmrah((u.data ?? []) as any);
    setInquiries(iq.data ?? []);
    setPayments(pc.data ?? []);
    setContent(sc.data ?? []);
    setCustomers(cu.data ?? []);
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

  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-6">
        <div className="bg-card rounded-2xl ring-1 ring-border p-8 max-w-md text-center">
          <div className="size-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
            <LogOut className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-5">Sign in with an admin account to access the dashboard.</p>
          <Link to="/auth" className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">Sign In</Link>
        </div>
      </div>
    );
  }

  const counts: Record<Tab, number> = {
    dashboard: 0, orders: orders.length, visas: visas.length, umrah: umrah.length,
    inquiries: inquiries.length, payments: payments.length, content: content.length, customers: customers.length,
  };

  const sectionTitle = NAV.find((n) => n.key === tab)?.label ?? "Dashboard";

  return (
    <div className="min-h-screen flex bg-muted/30">
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-card border-r border-border flex flex-col transition-transform ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}>
        <div className="h-16 px-5 flex items-center justify-between border-b border-border bg-primary text-primary-foreground">
          <div>
            <div className="font-display font-bold text-lg leading-tight">{SITE.shortName}</div>
            <div className="text-[10px] uppercase tracking-widest opacity-70">Admin Panel</div>
          </div>
          <button className="lg:hidden" onClick={() => setSidebarOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {NAV.map((n) => {
            const Icon = n.icon;
            const active = tab === n.key;
            return (
              <button
                key={n.key}
                onClick={() => { setTab(n.key); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${active ? "bg-primary text-primary-foreground shadow-sm" : "text-foreground/70 hover:bg-muted hover:text-foreground"}`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="flex-1 text-left">{n.label}</span>
                {n.key !== "dashboard" && counts[n.key] > 0 && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? "bg-primary-foreground/20" : "bg-muted-foreground/15"}`}>{counts[n.key]}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="p-3 border-t border-border space-y-1">
          <Link to="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-muted hover:text-foreground">
            <ExternalLink className="h-4 w-4" /> View Site
          </Link>
          <button onClick={async () => { await supabase.auth.signOut(); window.location.href = "/"; }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-30 lg:hidden" />}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border px-5 flex items-center justify-between sticky top-0 z-20">
          <div className="flex items-center gap-3">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
            <div>
              <h1 className="text-lg font-bold leading-tight">{sectionTitle}</h1>
              <p className="text-xs text-muted-foreground">Manage your travel business</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a href={`https://${SITE.domain}`} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70">
              <Globe className="h-3.5 w-3.5" /> {SITE.domain}
            </a>
            {inquiries.length > 0 && (
              <button onClick={() => setTab("inquiries")} className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{inquiries.length}</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 overflow-x-auto">
          {tab === "dashboard" && <DashboardOverview orders={orders} visas={visas} umrah={umrah} customers={customers} inquiries={inquiries} onJump={setTab} />}
          {tab === "orders" && <OrdersTable orders={orders} onChange={refresh} />}
          {tab === "visas" && <ServicesTable rows={visas} table="visa_services" onChange={refresh} />}
          {tab === "umrah" && <ServicesTable rows={umrah} table="umrah_packages" onChange={refresh} />}
          {tab === "content" && <SiteContentTable rows={content} onChange={refresh} />}
          {tab === "customers" && <CustomersTable rows={customers} />}
          {tab === "inquiries" && <InquiriesTable rows={inquiries} />}
          {tab === "payments" && <PaymentsTable rows={payments} onChange={refresh} />}
        </main>
      </div>
    </div>
  );
}

function DashboardOverview({ orders, visas, umrah, customers, inquiries, onJump }: { orders: any[]; visas: Row[]; umrah: Row[]; customers: any[]; inquiries: any[]; onJump: (t: Tab) => void }) {
  const revenue = orders.filter((o) => ["paid", "processing", "completed"].includes(o.status)).reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const recent = orders.slice(0, 5);
  const stats = [
    { label: "Revenue", value: formatPKR(revenue), icon: DollarSign, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "Orders", value: orders.length, sub: `${pending} pending`, icon: ShoppingCart, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400", click: () => onJump("orders") },
    { label: "Customers", value: customers.length, icon: Users, tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400", click: () => onJump("customers") },
    { label: "Inquiries", value: inquiries.length, icon: MessageSquare, tone: "bg-orange-500/10 text-orange-600 dark:text-orange-400", click: () => onJump("inquiries") },
    { label: "Visa Services", value: visas.length, sub: `${visas.filter((v) => v.active).length} active`, icon: Plane, tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", click: () => onJump("visas") },
    { label: "Umrah Packages", value: umrah.length, sub: `${umrah.filter((u) => u.active).length} active`, icon: Building2, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400", click: () => onJump("umrah") },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Welcome back 👋</h2>
          <p className="text-primary-foreground/80 text-sm mt-1">Here's what's happening with your travel business today.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => onJump("content")} className="bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"><FileText className="h-4 w-4" /> Edit Homepage</button>
          <button onClick={() => onJump("visas")} className="bg-accent text-accent-foreground hover:opacity-90 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add Service</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.label}
              onClick={s.click}
              className="bg-card rounded-xl ring-1 ring-border p-4 text-left hover:ring-primary/40 hover:shadow-md transition group disabled:cursor-default"
              disabled={!s.click}
            >
              <div className={`size-9 rounded-lg flex items-center justify-center mb-3 ${s.tone}`}>
                <Icon className="h-4 w-4" />
              </div>
              <div className="text-xs text-muted-foreground font-medium">{s.label}</div>
              <div className="text-xl font-bold mt-0.5 truncate">{s.value}</div>
              {s.sub && <div className="text-[11px] text-muted-foreground mt-0.5">{s.sub}</div>}
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-card rounded-xl ring-1 ring-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Recent Orders</h3>
            <button onClick={() => onJump("orders")} className="text-xs text-primary hover:underline">View all →</button>
          </div>
          {recent.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No orders yet.</p>
          ) : (
            <div className="space-y-2">
              {recent.map((o) => (
                <div key={o.id} className="flex items-center justify-between gap-3 p-2.5 rounded-lg hover:bg-muted/50">
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-sm truncate">{o.customer_name}</div>
                    <div className="text-xs text-muted-foreground font-mono">{o.order_number}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-sm">{formatPKR(o.total_pkr)}</div>
                    <div className={`text-[10px] uppercase font-semibold ${o.status === "paid" || o.status === "completed" ? "text-emerald-600" : o.status === "pending" ? "text-orange-600" : "text-muted-foreground"}`}>{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl ring-1 ring-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2"><MessageSquare className="h-4 w-4" /> Latest Inquiries</h3>
            <button onClick={() => onJump("inquiries")} className="text-xs text-primary hover:underline">View all →</button>
          </div>
          {inquiries.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No inquiries yet.</p>
          ) : (
            <div className="space-y-2">
              {inquiries.slice(0, 5).map((i) => (
                <div key={i.id} className="p-2.5 rounded-lg hover:bg-muted/50">
                  <div className="font-semibold text-sm">{i.name} <span className="text-xs text-muted-foreground font-normal">· {i.email}</span></div>
                  <div className="text-xs text-muted-foreground truncate">{i.subject || i.message}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


function CustomersTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) return <p className="text-center text-muted-foreground py-12">No customers yet.</p>;
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm bg-card rounded-xl ring-1 ring-border">
        <thead className="bg-muted/40 text-left">
          <tr>{["Name", "Phone", "Joined"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
        </thead>
        <tbody>
          {rows.map((c) => (
            <tr key={c.id} className="border-t border-border">
              <td className="px-4 py-3">{c.full_name || <span className="text-muted-foreground italic">No name</span>}</td>
              <td className="px-4 py-3">{c.phone || "—"}</td>
              <td className="px-4 py-3 text-xs text-muted-foreground">{c.created_at ? new Date(c.created_at).toLocaleDateString() : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SiteContentTable({ rows, onChange }: { rows: any[]; onChange: () => void }) {
  if (rows.length === 0) return <p className="text-center text-muted-foreground py-12">No content blocks defined.</p>;
  const grouped = rows.reduce((acc: Record<string, any[]>, r) => { (acc[r.category] ??= []).push(r); return acc; }, {});
  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Edit content shown on the public website. Changes appear within 5 minutes (or after a refresh).</p>
      {Object.entries(grouped).map(([cat, list]) => (
        <div key={cat}>
          <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">{cat}</h3>
          <div className="grid gap-3">
            {list.map((r) => <SiteContentCard key={r.id} row={r} onChange={onChange} />)}
          </div>
        </div>
      ))}
    </div>
  );
}

function SiteContentCard({ row, onChange }: { row: any; onChange: () => void }) {
  const [value, setValue] = useState<any>(row.value);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("site_content").update({ value }).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${row.label} saved`);
    onChange();
  }

  const keys = value && typeof value === "object" && !Array.isArray(value) ? Object.keys(value) : null;

  return (
    <div className="bg-card rounded-xl ring-1 ring-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">{row.label}</h4>
        <code className="text-[10px] text-muted-foreground">{row.key}</code>
      </div>
      {keys ? (
        <div className="grid sm:grid-cols-2 gap-3">
          {keys.map((k) => {
            const v = value[k];
            const isBool = typeof v === "boolean";
            const isLong = typeof v === "string" && (v.length > 60 || v.includes("\n"));
            const isArr = Array.isArray(v) || (v && typeof v === "object");
            return (
              <label key={k} className={isLong || isArr ? "sm:col-span-2 block" : "block"}>
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">{k.replace(/_/g, " ")}</span>
                {isBool ? (
                  <label className="inline-flex items-center gap-2"><input type="checkbox" checked={v} onChange={(e) => setValue({ ...value, [k]: e.target.checked })} /> {v ? "Enabled" : "Disabled"}</label>
                ) : isArr ? (
                  <textarea
                    value={JSON.stringify(v, null, 2)}
                    onChange={(e) => { try { setValue({ ...value, [k]: JSON.parse(e.target.value) }); } catch { /* ignore */ } }}
                    rows={6}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs font-mono"
                  />
                ) : isLong ? (
                  <textarea
                    value={String(v ?? "")}
                    onChange={(e) => setValue({ ...value, [k]: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  />
                ) : (
                  <input
                    value={String(v ?? "")}
                    onChange={(e) => setValue({ ...value, [k]: e.target.value })}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
                  />
                )}
              </label>
            );
          })}
        </div>
      ) : (
        <textarea
          value={JSON.stringify(value, null, 2)}
          onChange={(e) => { try { setValue(JSON.parse(e.target.value)); } catch { /* ignore */ } }}
          rows={8}
          className="w-full px-3 py-2 border border-border rounded-lg bg-background text-xs font-mono"
        />
      )}
      <button disabled={saving} onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-light disabled:opacity-60">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
  );
}

function InquiriesTable({ rows }: { rows: any[] }) {
  if (rows.length === 0) return <p className="text-center text-muted-foreground py-12">No inquiries yet.</p>;
  return (
    <div className="grid gap-3">
      {rows.map((r) => (
        <div key={r.id} className="bg-card rounded-xl ring-1 ring-border p-4">
          <div className="flex justify-between gap-4 mb-2">
            <div>
              <div className="font-semibold">{r.name} <span className="text-xs text-muted-foreground font-normal">· {r.email}{r.phone ? ` · ${r.phone}` : ""}</span></div>
              {r.subject && <div className="text-sm text-muted-foreground">{r.subject}{r.service_interest ? ` — ${r.service_interest}` : ""}</div>}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{new Date(r.created_at).toLocaleString()}</span>
          </div>
          <p className="text-sm whitespace-pre-wrap">{r.message}</p>
        </div>
      ))}
    </div>
  );
}

function PaymentsTable({ rows, onChange }: { rows: any[]; onChange: () => void }) {
  return (
    <div className="grid gap-4">
      <p className="text-sm text-muted-foreground">Configure payment gateways. JazzCash uses HostedCheckout v1.1 — fill all four fields and toggle <strong>Enabled</strong> to activate live payments at checkout.</p>
      {rows.map((row) => <PaymentConfigCard key={row.id} row={row} onChange={onChange} />)}
    </div>
  );
}

function PaymentConfigCard({ row, onChange }: { row: any; onChange: () => void }) {
  const [config, setConfig] = useState<Record<string, string>>(row.config ?? {});
  const [enabled, setEnabled] = useState<boolean>(!!row.enabled);
  const [sandbox, setSandbox] = useState<boolean>(!!row.sandbox);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    const { error } = await supabase.from("payment_configs").update({ config, enabled, sandbox, updated_at: new Date().toISOString() }).eq("id", row.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(`${row.provider} saved`);
    onChange();
  }

  const fields = Object.keys(config);

  return (
    <div className="bg-card rounded-xl ring-1 ring-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold capitalize text-lg">{row.provider.replace("_", " ")}</h3>
          {row.instructions && <p className="text-xs text-muted-foreground mt-1">{row.instructions}</p>}
        </div>
        <div className="flex gap-2 items-center text-sm">
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={sandbox} onChange={(e) => setSandbox(e.target.checked)} /> Sandbox</label>
          <label className="inline-flex items-center gap-2"><input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} /> Enabled</label>
        </div>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map((k) => (
          <label key={k} className="block">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1">{k.replace(/_/g, " ")}</span>
            <input
              value={config[k] ?? ""}
              onChange={(e) => setConfig({ ...config, [k]: e.target.value })}
              className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm"
            />
          </label>
        ))}
      </div>
      <button disabled={saving} onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-light disabled:opacity-60">
        {saving ? "Saving..." : "Save"}
      </button>
    </div>
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
                  onChange={(e) => updateStatus(o.id, e.target.value as typeof ORDER_STATUSES[number])}
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
