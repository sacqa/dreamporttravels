import { useSyncExternalStore } from "react";
import { upsertCartSession } from "@/lib/cart-tracking.functions";

export type CartItem = {
  id: string;
  type: "visa" | "umrah";
  itemId: string;
  name: string;
  details: string;
  unitPrice: number;
  quantity: number;
  // Optional metadata for richer cart drawer preview
  country?: string;
  flag?: string;
  processing_time?: string;
  duration?: string;
};

const KEY = "dreamport_cart_v1";
const ANON_KEY = "dreamport_anon_id";
const listeners = new Set<() => void>();

// Drawer open state
const drawerListeners = new Set<() => void>();
let drawerOpen = false;
function setDrawerOpen(v: boolean) {
  drawerOpen = v;
  drawerListeners.forEach((l) => l());
}

function read(): CartItem[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  listeners.forEach((l) => l());
  // Fire-and-forget tracking
  trackCart(items, "active").catch(() => {});
}

function getAnonId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(ANON_KEY);
  if (!id) {
    id = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`).replace(/-/g, "").slice(0, 32);
    localStorage.setItem(ANON_KEY, id);
  }
  return id;
}

async function trackCart(
  items: CartItem[],
  status: "active" | "checkout_started" | "converted" | "abandoned",
  extra: { customer_name?: string; customer_email?: string; customer_phone?: string; order_id?: string } = {},
) {
  if (typeof window === "undefined") return;
  if (items.length === 0 && status === "active") return;
  const anon_id = getAnonId();
  try {
    await upsertCartSession({ data: { anon_id, items, status, ...extra } });
  } catch {
    /* ignore tracking failures */
  }
}

export const cart = {
  get: read,
  getAnonId,
  add(item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) {
    const items = read();
    const existing = items.find((i) => i.type === item.type && i.itemId === item.itemId);
    if (existing) {
      existing.quantity += item.quantity ?? 1;
    } else {
      items.push({ ...item, id: crypto.randomUUID(), quantity: item.quantity ?? 1 });
    }
    write(items);
    setDrawerOpen(true);
  },
  remove(id: string) {
    write(read().filter((i) => i.id !== id));
  },
  setQuantity(id: string, q: number) {
    const items = read();
    const it = items.find((i) => i.id === id);
    if (it) {
      it.quantity = Math.max(1, q);
      write(items);
    }
  },
  clear() {
    write([]);
  },
  subscribe(cb: () => void) {
    listeners.add(cb);
    return () => listeners.delete(cb);
  },
  openDrawer() { setDrawerOpen(true); },
  closeDrawer() { setDrawerOpen(false); },
  markCheckoutStarted(extra: { customer_name?: string; customer_email?: string; customer_phone?: string } = {}) {
    return trackCart(read(), "checkout_started", extra);
  },
  markConverted(orderId: string, extra: { customer_name?: string; customer_email?: string; customer_phone?: string } = {}) {
    return trackCart(read(), "converted", { ...extra, order_id: orderId });
  },
};

export function useCart() {
  return useSyncExternalStore(
    cart.subscribe,
    () => JSON.stringify(read()),
    () => "[]",
  );
}

export function useCartItems(): CartItem[] {
  useCart();
  return read();
}

export function useCartDrawer(): [boolean, (v: boolean) => void] {
  const open = useSyncExternalStore(
    (cb) => { drawerListeners.add(cb); return () => drawerListeners.delete(cb); },
    () => drawerOpen,
    () => false,
  );
  return [open, setDrawerOpen];
}

export function cartTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}
