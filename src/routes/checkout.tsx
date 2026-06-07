import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AppShell, PageHeader } from "@/components/AppShell";
import { cart, cartTotal, useCartItems } from "@/lib/cart";
import { formatPKR } from "@/lib/site";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { initiateJazzCashPayment } from "@/lib/payment.functions";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(10).max(20),
  cnic: z.string().trim().max(20).optional(),
  address: z.string().trim().max(500).optional(),
  notes: z.string().trim().max(1000).optional(),
  payment_method: z.enum(["jazzcash", "easypaisa", "bank_transfer"]),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Secure Checkout — DreamPort Travels" }] }),
  component: CheckoutPage,
});

function CheckoutPage() {
  const items = useCartItems();
  const total = cartTotal(items);
  const navigate = useNavigate();
  const initJazz = useServerFn(initiateJazzCashPayment);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<{ name: string; email: string; phone: string; cnic: string; address: string; notes: string; payment_method: "jazzcash" | "easypaisa" | "bank_transfer" }>({ name: "", email: "", phone: "", cnic: "", address: "", notes: "", payment_method: "jazzcash" });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return toast.error("Cart is empty");
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid form");
    setLoading(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const { data: order, error } = await supabase
        .from("orders")
        .insert({
          user_id: userData.user?.id ?? null,
          customer_name: parsed.data.name,
          customer_email: parsed.data.email,
          customer_phone: parsed.data.phone,
          customer_cnic: parsed.data.cnic,
          customer_address: parsed.data.address,
          notes: parsed.data.notes,
          payment_method: parsed.data.payment_method,
          subtotal_pkr: total,
          total_pkr: total,
        })
        .select()
        .single();
      if (error) throw error;
      const { error: itemsError } = await supabase.from("order_items").insert(
        items.map((i) => ({
          order_id: order.id,
          item_type: i.type,
          item_id: i.itemId,
          item_name: i.name,
          item_details: i.details,
          quantity: i.quantity,
          unit_price_pkr: i.unitPrice,
          total_price_pkr: i.unitPrice * i.quantity,
        })),
      );
      if (itemsError) throw itemsError;
      cart.clear();

      // If JazzCash is wired up, redirect to JazzCash form-post.
      if (parsed.data.payment_method === "jazzcash") {
        try {
          const res = await initJazz({ data: { order_id: order.id } });
          if (res.mode === "redirect") {
            postToJazzCash(res.action, res.fields);
            return;
          }
        } catch (e) {
          // fall through to manual flow
          console.warn("JazzCash init failed, falling back to manual", e);
        }
      }

      toast.success(`Order ${order.order_number} placed! We'll contact you within 24 hours.`);
      navigate({ to: "/order-confirmed", search: { o: order.order_number } });
    } catch (err: any) {
      toast.error(err?.message ?? "Could not place order. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (items.length === 0) {
    return (
      <AppShell>
        <PageHeader title="Cart is empty" subtitle="Add a service before checking out." />
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Secure Checkout" subtitle="Complete your booking — our team will contact you within 24 hours." />
      <section className="py-12">
        <form onSubmit={submit} className="max-w-5xl mx-auto px-6 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="bg-card rounded-2xl ring-1 ring-border p-6 space-y-4">
            <h3 className="font-semibold mb-2">Customer Information</h3>
            <Field label="Full Name *"><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" /></Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Email *"><input required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" /></Field>
              <Field label="Phone *"><input required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" placeholder="03XX-XXXXXXX" /></Field>
            </div>
            <Field label="CNIC"><input value={form.cnic} onChange={(e) => setForm({ ...form, cnic: e.target.value })} className="input" placeholder="XXXXX-XXXXXXX-X" /></Field>
            <Field label="Address"><input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="input" /></Field>
            <Field label="Notes (optional)"><textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="input" /></Field>

            <h3 className="font-semibold pt-4">Payment Method</h3>
            <div className="grid sm:grid-cols-3 gap-3">
              {([
                { id: "jazzcash", label: "JazzCash", sub: "Mobile wallet", color: "border-[#ee2e3a]" },
                { id: "easypaisa", label: "Easypaisa", sub: "Mobile wallet", color: "border-[#00a651]" },
                { id: "bank_transfer", label: "Bank Transfer", sub: "Direct deposit", color: "border-primary" },
              ] as const).map((m) => {
                const active = form.payment_method === m.id;
                return (
                  <label key={m.id} className={`border-2 rounded-xl p-4 cursor-pointer text-center transition ${active ? `${m.color} bg-accent/5 shadow-sm` : "border-border hover:border-muted-foreground/40"}`}>
                    <input type="radio" name="pm" value={m.id} checked={active} onChange={() => setForm({ ...form, payment_method: m.id })} className="sr-only" />
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{m.sub}</div>
                  </label>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">
              {form.payment_method === "jazzcash" && "JazzCash redirects you to the secure gateway when the admin has it enabled. Otherwise our team will contact you within 24 hours with payment instructions."}
              {form.payment_method === "easypaisa" && "Easypaisa is currently in demo mode — place your order and our team will contact you within 24 hours with payment instructions."}
              {form.payment_method === "bank_transfer" && "Bank account details will be sent to your email immediately after you place the order."}
            </p>
          </div>
          <aside className="bg-card rounded-2xl p-6 ring-1 ring-border sticky top-24">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <ul className="space-y-2 text-sm mb-4">
              {items.map((i) => (
                <li key={i.id} className="flex justify-between gap-2">
                  <span className="truncate">{i.name} × {i.quantity}</span>
                  <span>{formatPKR(i.unitPrice * i.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="border-t border-border pt-3 flex justify-between font-semibold"><span>Total</span><span className="text-accent">{formatPKR(total)}</span></div>
            <button disabled={loading} className="mt-6 w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-light disabled:opacity-60">
              {loading ? "Placing Order..." : "Place Order"}
            </button>
            <p className="text-xs text-muted-foreground mt-3 text-center">🔒 SSL Secured Checkout</p>
          </aside>
        </form>
      </section>
      <style>{`.input{width:100%;padding:.65rem .85rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);font-size:.875rem;outline:none}.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 20%,transparent)}`}</style>
    </AppShell>
  );
}

function postToJazzCash(action: string, fields: Record<string, string>) {
  const form = document.createElement("form");
  form.method = "POST";
  form.action = action;
  for (const [k, v] of Object.entries(fields)) {
    const i = document.createElement("input");
    i.type = "hidden";
    i.name = k;
    i.value = v;
    form.appendChild(i);
  }
  document.body.appendChild(form);
  form.submit();
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</span>{children}</label>;
}
