import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cart, cartTotal, useCartDrawer, useCartItems } from "@/lib/cart";
import { formatPKR } from "@/lib/site";
import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, ArrowRight, Sparkles, Clock, MapPin } from "lucide-react";

export function CartDrawer() {
  const [open, setOpen] = useCartDrawer();
  const items = useCartItems();
  const total = cartTotal(items);
  const count = items.reduce((s, i) => s + i.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent side="right" className="w-full sm:max-w-md flex flex-col p-0 gap-0">
        <SheetHeader className="px-5 py-4 border-b bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
          <SheetTitle className="flex items-center gap-2 text-primary-foreground">
            <div className="relative">
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute -top-2 -right-2 bg-accent text-accent-foreground text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center">
                  {count}
                </span>
              )}
            </div>
            Your Cart
          </SheetTitle>
          {items.length > 0 && (
            <p className="text-xs text-primary-foreground/80 flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" /> Just added — review and checkout
            </p>
          )}
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12 gap-4">
            <div className="size-20 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="h-9 w-9 text-muted-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Your cart is empty</h3>
              <p className="text-sm text-muted-foreground mt-1">Browse visas and Umrah packages to get started.</p>
            </div>
            <div className="flex gap-2 mt-2">
              <Link to="/visas" onClick={() => setOpen(false)} className="bg-primary text-primary-foreground px-5 py-2.5 rounded-full text-sm font-semibold">Browse Visas</Link>
              <Link to="/umrah" onClick={() => setOpen(false)} className="border border-border px-5 py-2.5 rounded-full text-sm font-semibold">View Umrah</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.map((it) => (
                <div key={it.id} className="bg-card rounded-xl p-3 ring-1 ring-border flex gap-3 animate-in slide-in-from-right-2 duration-300">
                  <div className="size-14 rounded-lg bg-gradient-to-br from-accent/15 to-primary/10 flex items-center justify-center text-2xl shrink-0">
                    {it.flag ?? (it.type === "umrah" ? "🕋" : "✈️")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm truncate">{it.name}</h4>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-primary/10 text-primary shrink-0">{it.type}</span>
                    </div>
                    {it.country && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" /> {it.country}</p>
                    )}
                    {it.details && <p className="text-xs text-muted-foreground truncate">{it.details}</p>}
                    {it.processing_time && (
                      <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> {it.processing_time}</p>
                    )}
                    <p className="text-accent font-bold text-sm mt-1">{formatPKR(it.unitPrice)}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => cart.setQuantity(it.id, it.quantity - 1)} className="size-7 rounded-full border border-border hover:bg-muted flex items-center justify-center"><Minus className="h-3 w-3" /></button>
                      <span className="font-semibold w-6 text-center text-sm">{it.quantity}</span>
                      <button onClick={() => cart.setQuantity(it.id, it.quantity + 1)} className="size-7 rounded-full border border-border hover:bg-muted flex items-center justify-center"><Plus className="h-3 w-3" /></button>
                      <button onClick={() => cart.remove(it.id)} className="ml-auto size-7 rounded-full hover:bg-destructive/10 text-destructive flex items-center justify-center"><Trash2 className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t bg-muted/30 px-5 py-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-semibold">{formatPKR(total)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-accent">{formatPKR(total)}</span>
              </div>
              <Link
                to="/checkout"
                onClick={() => setOpen(false)}
                className="w-full inline-flex items-center justify-center gap-2 bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary/90 transition group"
              >
                Checkout <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
              </Link>
              <Link
                to="/cart"
                onClick={() => setOpen(false)}
                className="block w-full text-center text-xs text-muted-foreground hover:text-foreground"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
