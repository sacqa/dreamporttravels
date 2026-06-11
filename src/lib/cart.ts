import { useSyncExternalStore } from "react";

export type CartItem = {
  id: string;
  type: "visa" | "umrah";
  itemId: string;
  name: string;
  details: string;
  unitPrice: number;
  quantity: number;
};

const KEY = "dreamport_cart_v1";
const listeners = new Set<() => void>();

// Drawer open state (separate store)
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
}

export const cart = {
  get: read,
  add(item: Omit<CartItem, "id" | "quantity"> & { quantity?: number }) {
    const items = read();
    const existing = items.find(
      (i) => i.type === item.type && i.itemId === item.itemId,
    );
    if (existing) {
      existing.quantity += item.quantity ?? 1;
    } else {
      items.push({
        ...item,
        id: crypto.randomUUID(),
        quantity: item.quantity ?? 1,
      });
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
