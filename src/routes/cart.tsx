import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { cart, cartTotal, useCartItems } from "@/lib/cart";
import { formatPKR } from "@/lib/site";
import { Minus, Plus, Trash2 } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({ meta: [{ title: "Your Cart — DreamPort Travels" }] }),
  component: CartPage,
});

function CartPage() {
  const items = useCartItems();
  const total = cartTotal(items);

  if (items.length === 0) {
    return (
      <AppShell>
        <PageHeader title="Your cart is empty" subtitle="Browse our visa services and Umrah packages to get started." />
        <div className="max-w-3xl mx-auto px-6 py-12 text-center">
          <Link to="/visas" className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold mr-3">Browse Visas</Link>
          <Link to="/umrah" className="inline-block border border-border px-6 py-3 rounded-full font-semibold">View Umrah</Link>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <PageHeader title="Your Cart" />
      <section className="py-12">
        <div className="max-w-5xl mx-auto px-6 grid lg:grid-cols-[1fr_360px] gap-8 items-start">
          <div className="space-y-3">
            {items.map((it) => (
              <div key={it.id} className="bg-card rounded-2xl p-5 ring-1 ring-border flex gap-4 items-center">
                <div className="size-14 rounded-lg bg-accent/10 flex items-center justify-center text-2xl shrink-0">
                  {it.type === "umrah" ? "🕋" : "✈️"}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{it.name}</h3>
                  <p className="text-sm text-muted-foreground">{it.details}</p>
                  <p className="text-accent font-bold mt-1">{formatPKR(it.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => cart.setQuantity(it.id, it.quantity - 1)} className="size-8 rounded-full border border-border hover:bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                  <span className="font-semibold w-6 text-center">{it.quantity}</span>
                  <button onClick={() => cart.setQuantity(it.id, it.quantity + 1)} className="size-8 rounded-full border border-border hover:bg-muted flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                </div>
                <button onClick={() => cart.remove(it.id)} className="size-8 rounded-full hover:bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 className="h-4 w-4" /></button>
              </div>
            ))}
          </div>
          <aside className="bg-card rounded-2xl p-6 ring-1 ring-border sticky top-24">
            <h3 className="font-semibold mb-4">Order Summary</h3>
            <div className="flex justify-between text-sm mb-2"><span>Subtotal</span><span>{formatPKR(total)}</span></div>
            <div className="flex justify-between text-sm mb-4 text-muted-foreground"><span>Processing fee</span><span>Included</span></div>
            <div className="border-t border-border pt-4 flex justify-between font-semibold text-lg"><span>Total</span><span className="text-accent">{formatPKR(total)}</span></div>
            <Link to="/checkout" className="mt-6 w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold text-center block hover:bg-primary-light">
              Proceed to Checkout
            </Link>
            <p className="text-xs text-muted-foreground mt-3 text-center">🔒 Secured by JazzCash & Easypaisa</p>
          </aside>
        </div>
      </section>
    </AppShell>
  );
}
