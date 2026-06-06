import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { cart, cartTotal, useCartItems } from "@/lib/cart";
import { formatPKR } from "@/lib/site";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
              {(["jazzcash", "easypaisa", "bank_transfer"] as const).map((m) => (
                <label key={m} className={`border-2 rounded-xl p-4 cursor-pointer text-center font-semibold text-sm ${form.payment_method === m ? "border-accent bg-accent/5" : "border-border"}`}>
                  <input type="radio" name="pm" value={m} checked={form.payment_method === m} onChange={() => setForm({ ...form, payment_method: m })} className="sr-only" />
                  {m === "jazzcash" ? "JazzCash" : m === "easypaisa" ? "Easypaisa" : "Bank Transfer"}
                </label>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">After confirmation, you'll receive payment instructions via WhatsApp/email. Our representative will guide you through the transaction and documentation.</p>
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block mb-1.5">{label}</span>{children}</label>;
}
