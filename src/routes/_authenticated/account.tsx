import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatPKR } from "@/lib/site";
import { User, Package, MapPin, Lock, Plus, Trash2, Star } from "lucide-react";
import { z } from "zod";

export const Route = createFileRoute("/_authenticated/account")({
  head: () => ({ meta: [{ title: "My Account — DreamPort Travels" }] }),
  component: AccountPage,
});

type Tab = "profile" | "orders" | "addresses" | "security";

function AccountPage() {
  const [tab, setTab] = useState<Tab>("profile");
  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "profile", label: "Profile", icon: User },
    { id: "orders", label: "Orders", icon: Package },
    { id: "addresses", label: "Addresses", icon: MapPin },
    { id: "security", label: "Security", icon: Lock },
  ];

  return (
    <AppShell>
      <PageHeader title="My Account" subtitle="Manage your profile, orders, addresses and password" />
      <section className="py-8">
        <div className="max-w-5xl mx-auto px-6 grid md:grid-cols-[220px_1fr] gap-6">
          <aside className="space-y-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition ${tab === t.id ? "bg-accent text-accent-foreground" : "hover:bg-muted"}`}
              >
                <t.icon className="h-4 w-4" /> {t.label}
              </button>
            ))}
          </aside>
          <div className="bg-card rounded-2xl ring-1 ring-border p-6">
            {tab === "profile" && <ProfileTab />}
            {tab === "orders" && <OrdersTab />}
            {tab === "addresses" && <AddressesTab />}
            {tab === "security" && <SecurityTab />}
          </div>
        </div>
      </section>
    </AppShell>
  );
}

function ProfileTab() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      setEmail(u.user.email ?? "");
      const { data: p } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
      setName(p?.full_name ?? "");
      setPhone(p?.phone ?? "");
      setLoading(false);
    })();
  }, []);

  async function save() {
    const parsed = z.object({
      name: z.string().trim().min(2).max(100),
      phone: z.string().trim().min(10).max(20),
    }).safeParse({ name, phone });
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid input");
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const { error } = await supabase.from("profiles").upsert({ id: u.user.id, full_name: parsed.data.name, phone: parsed.data.phone });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Profile updated");
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading...</p>;

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Profile</h3>
      <Field label="Email"><input value={email} disabled className="input opacity-60" /></Field>
      <Field label="Full Name"><input value={name} onChange={(e) => setName(e.target.value)} className="input" /></Field>
      <Field label="Phone"><input value={phone} onChange={(e) => setPhone(e.target.value)} className="input" placeholder="03XX-XXXXXXX" /></Field>
      <button disabled={saving} onClick={save} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary-light disabled:opacity-60">
        {saving ? "Saving..." : "Save Changes"}
      </button>
      <style>{`.input{width:100%;padding:.55rem .85rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);font-size:.875rem;outline:none}.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 20%,transparent)}`}</style>
    </div>
  );
}

function OrdersTab() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return;
      const { data } = await supabase.from("orders").select("*, order_items(*)").eq("user_id", u.user.id).order("created_at", { ascending: false });
      setOrders(data ?? []);
      setLoading(false);
    })();
  }, []);

  if (loading) return <p className="text-sm text-muted-foreground">Loading orders...</p>;
  if (orders.length === 0) {
    return (
      <div className="text-center py-8">
        <Package className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
        <p className="text-muted-foreground mb-4">No orders yet.</p>
        <Link to="/visas" className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold">Browse Services</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold">My Orders</h3>
      {orders.map((o) => (
        <div key={o.id} className="border border-border rounded-xl p-4">
          <div className="flex justify-between gap-4 mb-2">
            <div>
              <div className="font-mono text-xs text-muted-foreground">{o.order_number}</div>
              <div className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleString()}</div>
            </div>
            <span className={`text-xs uppercase font-bold px-2 py-1 rounded ${statusColor(o.status)}`}>{o.status}</span>
          </div>
          <ul className="text-sm space-y-0.5 mb-2">
            {o.order_items?.map((i: any) => <li key={i.id}>{i.item_name} × {i.quantity}</li>)}
          </ul>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-border">
            <span>Total</span><span className="text-accent">{formatPKR(o.total_pkr)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function statusColor(s: string) {
  switch (s) {
    case "paid": return "bg-emerald-100 text-emerald-700";
    case "processing": return "bg-blue-100 text-blue-700";
    case "completed": return "bg-emerald-100 text-emerald-700";
    case "cancelled": return "bg-rose-100 text-rose-700";
    default: return "bg-amber-100 text-amber-700";
  }
}

const addrSchema = z.object({
  label: z.string().trim().min(1).max(40),
  full_name: z.string().trim().min(2).max(100),
  phone: z.string().trim().min(10).max(20),
  line1: z.string().trim().min(3).max(200),
  line2: z.string().trim().max(200).optional().or(z.literal("")),
  city: z.string().trim().min(1).max(80),
  postal_code: z.string().trim().max(20).optional().or(z.literal("")),
  is_default: z.boolean().optional(),
});

function AddressesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", postal_code: "", is_default: false });

  async function refresh() {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { data } = await supabase.from("customer_addresses").select("*").eq("user_id", u.user.id).order("is_default", { ascending: false });
    setItems(data ?? []);
  }
  useEffect(() => { refresh(); }, []);

  async function add() {
    const parsed = addrSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid address");
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    if (parsed.data.is_default) {
      await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", u.user.id);
    }
    const { error } = await supabase.from("customer_addresses").insert({ ...parsed.data, user_id: u.user.id });
    if (error) return toast.error(error.message);
    toast.success("Address added");
    setAdding(false);
    setForm({ label: "Home", full_name: "", phone: "", line1: "", line2: "", city: "", postal_code: "", is_default: false });
    refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this address?")) return;
    const { error } = await supabase.from("customer_addresses").delete().eq("id", id);
    if (error) return toast.error(error.message);
    refresh();
  }

  async function makeDefault(id: string) {
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    await supabase.from("customer_addresses").update({ is_default: false }).eq("user_id", u.user.id);
    await supabase.from("customer_addresses").update({ is_default: true }).eq("id", id);
    refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Saved Addresses</h3>
        {!adding && (
          <button onClick={() => setAdding(true)} className="inline-flex items-center gap-1 bg-accent text-accent-foreground px-4 py-2 rounded-full text-sm font-semibold">
            <Plus className="h-4 w-4" /> Add Address
          </button>
        )}
      </div>

      {adding && (
        <div className="border border-border rounded-xl p-4 space-y-3 bg-muted/30">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Label"><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className="input" placeholder="Home / Office" /></Field>
            <Field label="Full Name"><input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="input" /></Field>
            <Field label="Phone"><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></Field>
            <Field label="City"><input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" /></Field>
            <Field label="Address Line 1"><input value={form.line1} onChange={(e) => setForm({ ...form, line1: e.target.value })} className="input" /></Field>
            <Field label="Address Line 2"><input value={form.line2} onChange={(e) => setForm({ ...form, line2: e.target.value })} className="input" /></Field>
            <Field label="Postal Code"><input value={form.postal_code} onChange={(e) => setForm({ ...form, postal_code: e.target.value })} className="input" /></Field>
            <label className="flex items-center gap-2 text-sm mt-6"><input type="checkbox" checked={form.is_default} onChange={(e) => setForm({ ...form, is_default: e.target.checked })} /> Set as default</label>
          </div>
          <div className="flex gap-2">
            <button onClick={add} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold">Save</button>
            <button onClick={() => setAdding(false)} className="border border-border px-5 py-2 rounded-full text-sm">Cancel</button>
          </div>
        </div>
      )}

      {items.length === 0 && !adding && (
        <p className="text-sm text-muted-foreground text-center py-6">No saved addresses yet.</p>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        {items.map((a) => (
          <div key={a.id} className="border border-border rounded-xl p-4 relative">
            {a.is_default && <span className="absolute top-3 right-3 inline-flex items-center gap-1 text-[10px] uppercase font-bold text-emerald-700"><Star className="h-3 w-3" /> Default</span>}
            <div className="font-semibold text-sm mb-1">{a.label}</div>
            <div className="text-sm">{a.full_name}</div>
            <div className="text-xs text-muted-foreground">{a.phone}</div>
            <div className="text-sm mt-1">{a.line1}{a.line2 ? `, ${a.line2}` : ""}</div>
            <div className="text-sm">{a.city}{a.postal_code ? `, ${a.postal_code}` : ""}</div>
            <div className="flex gap-2 mt-3">
              {!a.is_default && <button onClick={() => makeDefault(a.id)} className="text-xs text-accent hover:underline">Make default</button>}
              <button onClick={() => remove(a.id)} className="text-xs text-destructive hover:underline inline-flex items-center gap-1 ml-auto"><Trash2 className="h-3 w-3" /> Delete</button>
            </div>
          </div>
        ))}
      </div>
      <style>{`.input{width:100%;padding:.55rem .85rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);font-size:.875rem;outline:none}.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 20%,transparent)}`}</style>
    </div>
  );
}

function SecurityTab() {
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  async function change() {
    if (newPassword.length < 8) return toast.error("Password must be at least 8 characters");
    if (newPassword !== confirm) return toast.error("Passwords don't match");
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated");
    setNewPassword(""); setConfirm("");
  }

  return (
    <div className="space-y-4 max-w-md">
      <h3 className="text-lg font-semibold">Change Password</h3>
      <Field label="New Password"><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="input" minLength={8} /></Field>
      <Field label="Confirm Password"><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input" minLength={8} /></Field>
      <button disabled={saving} onClick={change} className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold disabled:opacity-60">
        {saving ? "Updating..." : "Update Password"}
      </button>
      <p className="text-xs text-muted-foreground">Use at least 8 characters with a mix of letters and numbers.</p>
      <style>{`.input{width:100%;padding:.55rem .85rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);font-size:.875rem;outline:none}.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 20%,transparent)}`}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</span>{children}</label>;
}
