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

export function cartTotal(items: CartItem[]) {
  return items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
}
