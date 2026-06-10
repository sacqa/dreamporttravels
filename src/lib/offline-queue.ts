// Offline queue for inquiry / contact submissions.
// Stores pending submissions in localStorage and flushes them when the
// browser reports it's back online (or when the service worker triggers a
// background-sync flush message). Works in all browsers — does not depend on
// the Background Sync API (which iOS Safari does not implement).

import { supabase } from "@/integrations/supabase/client";

type QueuedInquiry = {
  id: string;
  payload: {
    name: string;
    email: string;
    phone?: string;
    subject?: string;
    message: string;
    service_interest?: string;
  };
  queuedAt: number;
};

const KEY = "dpt:inquiry-queue:v1";

function read(): QueuedInquiry[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: QueuedInquiry[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {}
}

export function queueInquiry(payload: QueuedInquiry["payload"]) {
  const items = read();
  items.push({ id: crypto.randomUUID(), payload, queuedAt: Date.now() });
  write(items);
  requestBackgroundSync();
}

export function queuedInquiryCount(): number {
  return read().length;
}

async function requestBackgroundSync() {
  try {
    const reg = await navigator.serviceWorker?.ready;
    // SyncManager isn't in lib.dom; guard with `any`.
    const sync = (reg as unknown as { sync?: { register: (tag: string) => Promise<void> } })?.sync;
    if (sync) await sync.register("flush-inquiries");
  } catch {}
}

let flushing = false;
export async function flushInquiries(): Promise<{ sent: number; remaining: number }> {
  if (flushing) return { sent: 0, remaining: read().length };
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return { sent: 0, remaining: read().length };
  }
  flushing = true;
  let sent = 0;
  try {
    const items = read();
    const remaining: QueuedInquiry[] = [];
    for (const item of items) {
      const { error } = await supabase.from("inquiries").insert(item.payload);
      if (error) {
        remaining.push(item);
      } else {
        sent++;
      }
    }
    write(remaining);
    return { sent, remaining: remaining.length };
  } finally {
    flushing = false;
  }
}

export function startInquiryFlusher(onFlushed?: (sent: number) => void) {
  if (typeof window === "undefined") return () => {};
  const tryFlush = async () => {
    const { sent } = await flushInquiries();
    if (sent > 0 && onFlushed) onFlushed(sent);
  };
  // On boot, on reconnect, and when SW broadcasts a sync.
  const onOnline = () => void tryFlush();
  const onMessage = (e: MessageEvent) => {
    if (e.data?.type === "flush-inquiries") void tryFlush();
  };
  window.addEventListener("online", onOnline);
  navigator.serviceWorker?.addEventListener("message", onMessage);
  void tryFlush();
  return () => {
    window.removeEventListener("online", onOnline);
    navigator.serviceWorker?.removeEventListener("message", onMessage);
  };
}
