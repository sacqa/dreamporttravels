import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const itemSchema = z.object({
  type: z.enum(["visa", "umrah"]),
  itemId: z.string().uuid(),
  name: z.string().min(1).max(200),
  details: z.string().max(500).optional().nullable(),
  quantity: z.number().int().positive().max(20),
  unitPrice: z.number().int().nonnegative(),
});

const input = z.object({
  user_id: z.string().uuid().optional().nullable(),
  customer_name: z.string().trim().min(2).max(100),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(10).max(20),
  customer_cnic: z.string().trim().max(20).optional().nullable(),
  customer_address: z.string().trim().max(500).optional().nullable(),
  notes: z.string().trim().max(1000).optional().nullable(),
  payment_method: z.enum(["jazzcash", "easypaisa", "bank_transfer"]),
  items: z.array(itemSchema).min(1).max(50),
});

// Server-side, atomic order creation. Bypasses the 10-minute guest INSERT
// loophole on order_items by using the service role to insert both rows in
// one trusted server call (no public INSERT policy on order_items needed).
export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const subtotal = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    if (subtotal <= 0) throw new Error("Cart total must be positive.");

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: data.user_id ?? null,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        customer_cnic: data.customer_cnic ?? null,
        customer_address: data.customer_address ?? null,
        notes: data.notes ?? null,
        payment_method: data.payment_method,
        subtotal_pkr: subtotal,
        total_pkr: subtotal,
      })
      .select()
      .single();
    if (oErr || !order) throw new Error(oErr?.message ?? "Could not create order");

    const { error: iErr } = await supabaseAdmin.from("order_items").insert(
      data.items.map((i) => ({
        order_id: order.id,
        item_type: i.type,
        item_id: i.itemId,
        item_name: i.name,
        item_details: i.details ?? null,
        quantity: i.quantity,
        unit_price_pkr: i.unitPrice,
        total_price_pkr: i.unitPrice * i.quantity,
      })),
    );
    if (iErr) {
      // best-effort rollback
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(iErr.message);
    }
    return { id: order.id as string, order_number: order.order_number as string };
  });
