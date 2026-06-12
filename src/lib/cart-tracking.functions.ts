import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  id: z.string(),
  type: z.string(),
  itemId: z.string(),
  name: z.string(),
  details: z.string().optional().default(""),
  unitPrice: z.number(),
  quantity: z.number(),
  country: z.string().optional().nullable(),
  flag: z.string().optional().nullable(),
  processing_time: z.string().optional().nullable(),
  duration: z.string().optional().nullable(),
});

const upsertInput = z.object({
  anon_id: z.string().min(8).max(80),
  items: z.array(itemSchema),
  status: z.enum(["active", "checkout_started", "abandoned", "converted"]).optional(),
  customer_name: z.string().max(120).optional().nullable(),
  customer_email: z.string().email().max(255).optional().nullable(),
  customer_phone: z.string().max(40).optional().nullable(),
  order_id: z.string().uuid().optional().nullable(),
});

export const upsertCartSession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => upsertInput.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const total = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const count = data.items.reduce((s, i) => s + i.quantity, 0);

    const payload: Record<string, any> = {
      anon_id: data.anon_id,
      items: data.items,
      item_count: count,
      total_pkr: total,
      last_activity_at: new Date().toISOString(),
    };
    if (data.status) payload.status = data.status;
    if (data.customer_name !== undefined) payload.customer_name = data.customer_name;
    if (data.customer_email !== undefined) payload.customer_email = data.customer_email;
    if (data.customer_phone !== undefined) payload.customer_phone = data.customer_phone;
    if (data.order_id !== undefined) payload.order_id = data.order_id;

    const { error } = await supabaseAdmin
      .from("cart_sessions")
      .upsert(payload, { onConflict: "anon_id" });
    if (error) throw new Error(error.message);
    return { ok: true };
  });
