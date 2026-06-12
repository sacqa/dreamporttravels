import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR, SITE } from "@/lib/site";
import { generateServiceImage, getAdminStatus } from "@/lib/admin.functions";
import { useRoles, type Permission } from "@/hooks/use-roles";
import { Footer, FOOTER_DEFAULTS, type FooterContent } from "@/components/Footer";
import { toast } from "sonner";
import {
  Sparkles, Loader2, Plus, Trash2, Eye, EyeOff, ShieldCheck, ShieldAlert,
  LayoutDashboard, ShoppingCart, Plane, Building2, FileText, Users, MessageSquare,
  CreditCard, ExternalLink, LogOut, Menu, X, Globe, DollarSign, TrendingUp, Bell, Lock,
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

type Tab = "dashboard" | "orders" | "carts" | "visas" | "umrah" | "content" | "customers" | "inquiries" | "payments";

const NAV: { key: Tab; label: string; icon: any; perm: Permission }[] = [
  { key: "dashboard", label: "Dashboard",      icon: LayoutDashboard, perm: "view_dashboard" },
  { key: "orders",    label: "Orders",         icon: ShoppingCart,    perm: "manage_orders" },
  { key: "carts",     label: "Carts",          icon: ShoppingCart,    perm: "view_carts" },
  { key: "visas",     label: "Visa Services",  icon: Plane,           perm: "manage_services" },
  { key: "umrah",     label: "Umrah Packages", icon: Building2,       perm: "manage_services" },
  { key: "content",   label: "Site Content",   icon: FileText,        perm: "edit_content" },
  { key: "customers", label: "Customers",      icon: Users,           perm: "manage_customers" },
  { key: "inquiries", label: "Inquiries",      icon: MessageSquare,   perm: "manage_orders" },
  { key: "payments",  label: "Payments",       icon: CreditCard,      perm: "manage_payments" },
];

function AdminPage() {
  const roles = useRoles();
  const [tab, setTab] = useState<Tab>("dashboard");
  const [orders, setOrders] = useState<any[]>([]);
  const [carts, setCarts] = useState<any[]>([]);
  const [visas, setVisas] = useState<Row[]>([]);
  const [umrah, setUmrah] = useState<Row[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [content, setContent] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [status, setStatus] = useState<{ aiKeyConfigured: boolean; storageBucket: string } | null>(null);
  const fetchStatus = useServerFn(getAdminStatus);

  const visibleNav = useMemo(() => NAV.filter((n) => roles.can(n.perm)), [roles]);

  const refresh = async () => {
    const [o, v, u, iq, pc, sc, cu, cs] = await Promise.all([
      roles.can("manage_orders")    ? supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] as any[] }),
      roles.can("manage_services")  ? supabase.from("visa_services").select("*").order("country") : Promise.resolve({ data: [] as any[] }),
      roles.can("manage_services")  ? supabase.from("umrah_packages").select("*").order("price_pkr") : Promise.resolve({ data: [] as any[] }),
      roles.can("manage_orders")    ? supabase.from("inquiries").select("*").order("created_at", { ascending: false }).limit(100) : Promise.resolve({ data: [] as any[] }),
      roles.can("manage_payments")  ? supabase.from("payment_configs").select("*").order("provider") : Promise.resolve({ data: [] as any[] }),
      roles.can("edit_content")     ? supabase.from("site_content").select("*").order("category") : Promise.resolve({ data: [] as any[] }),
      roles.can("manage_customers") ? supabase.from("profiles").select("*").order("full_name").limit(200) : Promise.resolve({ data: [] as any[] }),
      roles.can("view_carts")       ? supabase.from("cart_sessions").select("*").order("last_activity_at", { ascending: false }).limit(200) : Promise.resolve({ data: [] as any[] }),
    ]);
    setOrders(o.data ?? []);
    setVisas((v.data ?? []) as any);
    setUmrah((u.data ?? []) as any);
    setInquiries(iq.data ?? []);
    setPayments(pc.data ?? []);
    setContent(sc.data ?? []);
    setCustomers(cu.data ?? []);
    setCarts(cs.data ?? []);
  };

  useEffect(() => {
    if (!roles.loading && roles.canAccessAdmin) {
      refresh();
      // load server-side status (best for diagnostics)
      fetchStatus({})
        .then((s) => setStatus({ aiKeyConfigured: s.aiKeyConfigured, storageBucket: s.storageBucket }))
        .catch(() => setStatus({ aiKeyConfigured: false, storageBucket: "service-images" }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roles.loading, roles.canAccessAdmin]);

  // Re-route to a tab the user can see
  useEffect(() => {
    if (!visibleNav.find((n) => n.key === tab) && visibleNav[0]) setTab(visibleNav[0].key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleNav.length]);

  if (roles.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!roles.canAccessAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 px-6">
        <div className="bg-card rounded-2xl ring-1 ring-border p-8 max-w-md text-center">
          <div className="size-14 rounded-full bg-primary/10 text-primary mx-auto flex items-center justify-center mb-4">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="text-xl font-bold mb-2">Admin access required</h1>
          <p className="text-sm text-muted-foreground mb-5">
            {roles.signedIn
              ? `Signed in as ${roles.email}. Your account does not have the admin or editor role.`
              : "Sign in with an admin or editor account to access the dashboard."}
          </p>
          <Link to="/auth" className="inline-flex bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">Sign In</Link>
        </div>
      </div>
    );
  }

  const counts: Record<Tab, number> = {
    dashboard: 0, orders: orders.length, carts: carts.length, visas: visas.length, umrah: umrah.length,
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
          {visibleNav.map((n) => {
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
        <header className="h-16 bg-card border-b border-border px-5 flex items-center justify-between sticky top-0 z-20 gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button className="lg:hidden" onClick={() => setSidebarOpen(true)}><Menu className="h-5 w-5" /></button>
            <div className="min-w-0">
              <h1 className="text-lg font-bold leading-tight truncate">{sectionTitle}</h1>
              <p className="text-xs text-muted-foreground truncate">Signed in as {roles.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <AdminStatusBadge roles={roles.roles} aiKeyConfigured={status?.aiKeyConfigured ?? null} />
            <a href={`https://${SITE.domain}`} target="_blank" rel="noreferrer" className="hidden sm:inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full bg-muted hover:bg-muted/70">
              <Globe className="h-3.5 w-3.5" /> {SITE.domain}
            </a>
            {inquiries.length > 0 && roles.can("manage_orders") && (
              <button onClick={() => setTab("inquiries")} className="relative inline-flex items-center justify-center h-9 w-9 rounded-full hover:bg-muted">
                <Bell className="h-4 w-4" />
                <span className="absolute -top-0.5 -right-0.5 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">{inquiries.length}</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 p-5 lg:p-8 overflow-x-auto">
          {tab === "dashboard" && <DashboardOverview orders={orders} visas={visas} umrah={umrah} customers={customers} inquiries={inquiries} carts={carts} onJump={setTab} canJump={(t) => !!visibleNav.find((n) => n.key === t)} />}
          {tab === "orders"    && roles.can("manage_orders")    && <OrdersTable orders={orders} onChange={refresh} />}
          {tab === "carts"     && roles.can("view_carts")       && <CartsTable carts={carts} />}
          {tab === "visas"     && roles.can("manage_services")  && <ServicesTable rows={visas} table="visa_services"   onChange={refresh} canGenerate={roles.can("generate_images")} aiKeyConfigured={status?.aiKeyConfigured ?? null} />}
          {tab === "umrah"     && roles.can("manage_services")  && <ServicesTable rows={umrah} table="umrah_packages" onChange={refresh} canGenerate={roles.can("generate_images")} aiKeyConfigured={status?.aiKeyConfigured ?? null} />}
          {tab === "content"   && roles.can("edit_content")     && <SiteContentTable rows={content} onChange={refresh} />}
          {tab === "customers" && roles.can("manage_customers") && <CustomersTable rows={customers} />}
          {tab === "inquiries" && roles.can("manage_orders")    && <InquiriesTable rows={inquiries} />}
          {tab === "payments"  && roles.can("manage_payments")  && <PaymentsTable rows={payments} onChange={refresh} />}
        </main>
      </div>
    </div>
  );
}

function AdminStatusBadge({ roles, aiKeyConfigured }: { roles: string[]; aiKeyConfigured: boolean | null }) {
  const roleLabel = roles.includes("admin") ? "Admin" : roles.includes("editor") ? "Editor" : "—";
  const ok = aiKeyConfigured === true && roles.includes("admin");
  const warn = aiKeyConfigured === false || (!roles.includes("admin") && !ok);
  const Icon = ok ? ShieldCheck : ShieldAlert;
  const tone = ok ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-emerald-500/20"
                  : warn ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 ring-amber-500/20"
                         : "bg-muted text-muted-foreground ring-border";
  const tip = !roles.includes("admin")
    ? "Editor role — limited access. Image generation requires admin."
    : aiKeyConfigured === false
      ? "LOVABLE_API_KEY missing on server. Image generation will fail."
      : aiKeyConfigured === true
        ? "All admin services online (AI key + storage configured)."
        : "Checking…";
  return (
    <span title={tip} className={`hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-full ring-1 ${tone}`}>
      <Icon className="h-3.5 w-3.5" />
      {roleLabel} {aiKeyConfigured === null ? "· checking" : ok ? "· ready" : "· check"}
    </span>
  );
}

function DashboardOverview({ orders, visas, umrah, customers, inquiries, carts, onJump, canJump }: { orders: any[]; visas: Row[]; umrah: Row[]; customers: any[]; inquiries: any[]; carts: any[]; onJump: (t: Tab) => void; canJump: (t: Tab) => boolean }) {
  const revenue = orders.filter((o) => ["paid", "processing", "completed"].includes(o.status)).reduce((s, o) => s + (o.total_pkr ?? 0), 0);
  const pending = orders.filter((o) => o.status === "pending").length;
  const recent = orders.slice(0, 5);

  const activeCarts = carts.filter((c) => c.status === "active" || c.status === "checkout_started").length;
  const convertedCarts = carts.filter((c) => c.status === "converted").length;
  const conversionRate = carts.length > 0 ? Math.round((convertedCarts / carts.length) * 100) : 0;

  const stats = [
    { label: "Revenue", value: formatPKR(revenue), icon: DollarSign, tone: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    { label: "Orders", value: orders.length, sub: `${pending} pending`, icon: ShoppingCart, tone: "bg-blue-500/10 text-blue-600 dark:text-blue-400", click: () => onJump("orders"), tab: "orders" as Tab },
    { label: "Conversion", value: `${conversionRate}%`, sub: `${convertedCarts}/${carts.length} carts`, icon: TrendingUp, tone: "bg-teal-500/10 text-teal-600 dark:text-teal-400", click: () => onJump("carts"), tab: "carts" as Tab },
    { label: "Active Carts", value: activeCarts, icon: ShoppingCart, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400", click: () => onJump("carts"), tab: "carts" as Tab },
    { label: "Customers", value: customers.length, icon: Users, tone: "bg-purple-500/10 text-purple-600 dark:text-purple-400", click: () => onJump("customers"), tab: "customers" as Tab },
    { label: "Inquiries", value: inquiries.length, icon: MessageSquare, tone: "bg-orange-500/10 text-orange-600 dark:text-orange-400", click: () => onJump("inquiries"), tab: "inquiries" as Tab },
    { label: "Visa Services", value: visas.length, sub: `${visas.filter((v) => v.active).length} active`, icon: Plane, tone: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400", click: () => onJump("visas"), tab: "visas" as Tab },
    { label: "Umrah Packages", value: umrah.length, sub: `${umrah.filter((u) => u.active).length} active`, icon: Building2, tone: "bg-rose-500/10 text-rose-600 dark:text-rose-400", click: () => onJump("umrah"), tab: "umrah" as Tab },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="bg-gradient-to-r from-primary to-primary/70 text-primary-foreground rounded-2xl p-6 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-display font-bold">Welcome back 👋</h2>
          <p className="text-primary-foreground/80 text-sm mt-1">Here's what's happening with your travel business today.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {canJump("content") && <button onClick={() => onJump("content")} className="bg-white/15 hover:bg-white/25 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"><FileText className="h-4 w-4" /> Edit Content</button>}
          {canJump("visas") && <button onClick={() => onJump("visas")} className="bg-accent text-accent-foreground hover:opacity-90 px-4 py-2 rounded-lg text-sm font-semibold inline-flex items-center gap-1.5"><Plus className="h-4 w-4" /> Add Service</button>}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {stats.map((s) => {
          const Icon = s.icon;
          const clickable = s.click && (!s.tab || canJump(s.tab));
          return (
            <button
              key={s.label}
              onClick={clickable ? s.click : undefined}
              className="bg-card rounded-xl ring-1 ring-border p-4 text-left hover:ring-primary/40 hover:shadow-md transition group disabled:cursor-default"
              disabled={!clickable}
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
        {canJump("orders") && (
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
        )}

        {canJump("inquiries") && (
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
        )}
      </div>
    </div>
  );
}

function CartsTable({ carts }: { carts: any[] }) {
  const total = carts.length;
  const converted = carts.filter((c) => c.status === "converted").length;
  const checkout = carts.filter((c) => c.status === "checkout_started").length;
  const active = carts.filter((c) => c.status === "active").length;
  const rate = total ? Math.round((converted / total) * 100) : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat label="Total Carts" value={total} />
        <Stat label="Active" value={active} tone="text-amber-600" />
        <Stat label="Checkout Started" value={checkout} tone="text-blue-600" />
        <Stat label="Converted" value={`${converted} (${rate}%)`} tone="text-emerald-600" />
      </div>
      <div className="overflow-x-auto bg-card rounded-xl ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wider">
            <tr>
              {["Status", "Customer", "Items", "Total", "Updated"].map((h) => (
                <th key={h} className="px-4 py-3 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {carts.length === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground">No cart activity yet.</td></tr>
            )}
            {carts.map((c) => (
              <tr key={c.id} className="border-t border-border align-top">
                <td className="px-4 py-3">
                  <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                    c.status === "converted" ? "bg-emerald-500/15 text-emerald-700" :
                    c.status === "checkout_started" ? "bg-blue-500/15 text-blue-700" :
                    c.status === "abandoned" ? "bg-rose-500/15 text-rose-700" :
                    "bg-amber-500/15 text-amber-700"}`}>
                    {String(c.status).replace("_", " ")}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="font-semibold text-sm">{c.customer_name ?? <span className="italic text-muted-foreground">Anonymous</span>}</div>
                  <div className="text-xs text-muted-foreground">{c.customer_email ?? `anon ${String(c.anon_id).slice(0, 6)}…`}</div>
                  {c.customer_phone && <div className="text-xs text-muted-foreground">{c.customer_phone}</div>}
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="font-semibold">{c.item_count} items</div>
                  <ul className="text-muted-foreground mt-0.5 space-y-0.5">
                    {(c.items ?? []).slice(0, 3).map((it: any, idx: number) => (
                      <li key={idx}>• {it.flag ? `${it.flag} ` : ""}{it.name} ×{it.quantity}</li>
                    ))}
                    {(c.items?.length ?? 0) > 3 && <li>+ {c.items.length - 3} more</li>}
                  </ul>
                </td>
                <td className="px-4 py-3 font-semibold">{formatPKR(c.total_pkr ?? 0)}</td>
                <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{new Date(c.last_activity_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: any; tone?: string }) {
  return (
    <div className="bg-card rounded-xl ring-1 ring-border p-4">
      <div className="text-xs text-muted-foreground font-medium">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${tone ?? ""}`}>{value}</div>
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
      <p className="text-sm text-muted-foreground">Edit content shown on the public website. The footer block shows a live preview as you type.</p>
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
  const isFooter = row.key === "footer.content";

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

      {isFooter && (
        <div className="pt-4 border-t border-border">
          <div className="flex items-center gap-2 mb-2">
            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Live preview (unsaved)</span>
          </div>
          <div className="rounded-xl overflow-hidden ring-1 ring-border bg-background">
            <div className="origin-top-left scale-[0.65] w-[154%]">
              <Footer override={{ ...FOOTER_DEFAULTS, ...(value as Partial<FooterContent>) }} />
            </div>
          </div>
        </div>
      )}
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

function ServicesTable({ rows, table, onChange, canGenerate, aiKeyConfigured }: { rows: Row[]; table: "visa_services" | "umrah_packages"; onChange: () => void; canGenerate: boolean; aiKeyConfigured: boolean | null }) {
  const gen = useServerFn(generateServiceImage);
  const [busy, setBusy] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);

  async function generate(r: Row) {
    if (!canGenerate) {
      toast.error("Only admins can generate images.");
      return;
    }
    if (aiKeyConfigured === false) {
      toast.error("AI key not configured on server. Cannot generate.");
      return;
    }
    const label = r.country ?? r.name ?? "service";
    const defaultPrompt = table === "visa_services"
      ? `A stunning travel photograph of ${r.country}, iconic landmark, golden hour cinematic lighting, ultra realistic, 4k, vibrant colors, no text`
      : `Beautiful photograph of ${r.name} — Masjid al-Haram or Madinah, devotional Umrah journey, soft golden light, ultra realistic, no text`;
    const prompt = window.prompt(`AI prompt for "${label}":`, defaultPrompt);
    if (!prompt) return;
    setBusy(r.id);
    setLastError(null);
    try {
      await gen({ data: { table, id: r.id, prompt } });
      toast.success(`✨ Image generated for ${label}`);
      await onChange();
    } catch (e: any) {
      const msg = e?.message ?? "Generation failed";
      setLastError(`${label}: ${msg}`);
      toast.error(msg);
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
      {/* Image-gen status banner */}
      <div className={`mb-4 rounded-xl ring-1 px-4 py-3 text-sm flex items-start gap-3 ${
        !canGenerate ? "bg-amber-500/10 ring-amber-500/20 text-amber-800 dark:text-amber-200" :
        aiKeyConfigured === false ? "bg-rose-500/10 ring-rose-500/20 text-rose-800 dark:text-rose-200" :
        "bg-emerald-500/10 ring-emerald-500/20 text-emerald-800 dark:text-emerald-200"
      }`}>
        {(!canGenerate || aiKeyConfigured === false) ? <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" /> : <ShieldCheck className="h-4 w-4 mt-0.5 shrink-0" />}
        <div className="flex-1">
          <div className="font-semibold">
            {!canGenerate ? "Image generation disabled"
              : aiKeyConfigured === false ? "AI key missing"
              : aiKeyConfigured === null ? "Checking AI gateway…"
              : "Image generation ready"}
          </div>
          <div className="text-xs opacity-90 mt-0.5">
            {!canGenerate ? "Only the admin role can generate images. Editors can manage content but not media."
              : aiKeyConfigured === false ? "LOVABLE_API_KEY env var is missing on the server. Contact the project owner."
              : aiKeyConfigured === null ? "Verifying server config…"
              : `Connected to AI gateway · Uploading into "service-images" bucket.`}
          </div>
          {lastError && (
            <div className="mt-2 text-xs font-mono bg-background/60 px-2 py-1 rounded">Last error → {lastError}</div>
          )}
        </div>
      </div>

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
                disabled={busy === r.id || !canGenerate || aiKeyConfigured === false}
                onClick={() => generate(r)}
                title={!canGenerate ? "Admin role required" : aiKeyConfigured === false ? "AI key missing" : "Generate AI image"}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-semibold hover:bg-primary-light disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy === r.id
                  ? <><Loader2 className="h-4 w-4 animate-spin" /> Generating...</>
                  : <><Sparkles className="h-4 w-4" /> {r.image_url ? "Regenerate" : "Generate Image"}</>}
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
