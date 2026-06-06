import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createHash } from "crypto";

const input = z.object({
  order_id: z.string().uuid(),
});

/**
 * Initiate JazzCash HostedCheckout v1.1.
 * Returns a form-post payload the browser auto-submits to JazzCash.
 * If JazzCash is not configured/enabled, returns { mode: "manual" } so the
 * UI falls back to the existing "we'll contact you" flow.
 */
export const initiateJazzCashPayment = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => input.parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: order, error: oErr } = await supabaseAdmin
      .from("orders")
      .select("id, order_number, total_pkr, customer_email, customer_phone, status")
      .eq("id", data.order_id)
      .maybeSingle();
    if (oErr || !order) throw new Error("Order not found");

    const { data: cfgRow } = await supabaseAdmin
      .from("payment_configs")
      .select("enabled, sandbox, config")
      .eq("provider", "jazzcash")
      .maybeSingle();

    const cfg = (cfgRow?.config ?? {}) as Record<string, string>;
    const merchantId = cfg.merchant_id?.trim();
    const password = cfg.password?.trim();
    const salt = cfg.integrity_salt?.trim();
    const returnUrl = cfg.return_url?.trim();

    if (!cfgRow?.enabled || !merchantId || !password || !salt || !returnUrl) {
      return { mode: "manual" as const };
    }

    // JazzCash expects amount in paisa (PKR * 100), txn date/expiry in yyyyMMddHHmmss
    const pad = (n: number) => String(n).padStart(2, "0");
    const fmt = (d: Date) =>
      `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
    const now = new Date();
    const expiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

    const fields: Record<string, string> = {
      pp_Version: "1.1",
      pp_TxnType: "MWALLET",
      pp_Language: "EN",
      pp_MerchantID: merchantId,
      pp_Password: password,
      pp_TxnRefNo: `T${Date.now()}`,
      pp_Amount: String(order.total_pkr * 100),
      pp_TxnCurrency: "PKR",
      pp_TxnDateTime: fmt(now),
      pp_BillReference: order.order_number,
      pp_Description: `DreamPort order ${order.order_number}`,
      pp_TxnExpiryDateTime: fmt(expiry),
      pp_ReturnURL: returnUrl,
      pp_SecureHash: "",
      ppmpf_1: order.id,
      ppmpf_2: order.customer_email,
      ppmpf_3: order.customer_phone,
      ppmpf_4: "",
      ppmpf_5: "",
    };

    // Compute pp_SecureHash: SHA-256 HMAC alternative — JazzCash spec is
    // sorted-by-key concat with "&" prefixed by salt, then HMAC-SHA256, hex.
    const sortedKeys = Object.keys(fields)
      .filter((k) => k !== "pp_SecureHash" && fields[k] !== "")
      .sort();
    const hashString = salt + "&" + sortedKeys.map((k) => fields[k]).join("&");
    // JazzCash docs accept HMAC-SHA256 with salt as the key. We compute HMAC.
    const { createHmac } = await import("crypto");
    fields.pp_SecureHash = createHmac("sha256", salt).update(hashString).digest("hex").toUpperCase();

    const action = cfgRow.sandbox
      ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
      : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/";

    await supabaseAdmin
      .from("orders")
      .update({ payment_ref: fields.pp_TxnRefNo, payment_payload: { provider: "jazzcash", txn_ref: fields.pp_TxnRefNo } })
      .eq("id", order.id);

    // touch hash to silence unused import in some bundlers
    void createHash;

    return { mode: "redirect" as const, action, fields };
  });
