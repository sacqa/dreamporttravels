import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const input = z.object({
  table: z.enum(["visa_services", "umrah_packages"]),
  id: z.string().uuid(),
  prompt: z.string().min(3).max(500),
});

// 100 years — effectively permanent for our use case.
const SIGNED_URL_TTL = 60 * 60 * 24 * 365 * 100;

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const list = (roles ?? []).map((r) => r.role);
    return {
      userId,
      roles: list,
      isAdmin: list.includes("admin"),
      isEditor: list.includes("editor"),
      aiKeyConfigured: !!process.env.LOVABLE_API_KEY,
      storageBucket: "service-images",
    };
  });

async function uploadImageBytes(table: "visa_services" | "umrah_packages", id: string, bytes: Uint8Array) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const path = `${table}/${id}-${Date.now()}.png`;
  const { error: upErr } = await supabaseAdmin.storage
    .from("service-images")
    .upload(path, bytes, { contentType: "image/png", upsert: true });
  if (upErr) throw new Error(`Storage upload failed: ${upErr.message}`);
  // Bucket is private (workspace blocks public buckets); use long-lived signed URL.
  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("service-images")
    .createSignedUrl(path, SIGNED_URL_TTL);
  if (signErr || !signed?.signedUrl) throw new Error(`Signed URL failed: ${signErr?.message ?? "unknown"}`);
  const { error: updErr } = await (supabaseAdmin.from(table) as any)
    .update({ image_url: signed.signedUrl }).eq("id", id);
  if (updErr) throw new Error(`Database update failed: ${updErr.message}`);
  return signed.signedUrl;
}

export const generateServiceImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Only admins can generate images.");
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("LOVABLE_API_KEY is not configured on the server.");

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/images/generations",
      {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: data.prompt }],
          modalities: ["image", "text"],
        }),
      },
    );
    if (!aiRes.ok) {
      const txt = await aiRes.text().catch(() => "");
      if (aiRes.status === 429) throw new Error("Rate limit hit. Wait a minute and try again.");
      if (aiRes.status === 402) throw new Error("AI credits exhausted. Top up the workspace to continue.");
      throw new Error(`AI gateway error (${aiRes.status}). ${txt.slice(0, 200)}`);
    }
    const aiJson = (await aiRes.json()) as { data?: Array<{ b64_json?: string }> };
    const b64 = aiJson.data?.[0]?.b64_json;
    if (!b64) throw new Error("AI returned no image data. Try a different prompt.");
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const url = await uploadImageBytes(data.table, data.id, bytes);
    return { image_url: url };
  });

// Backfill: seed every visa/umrah row missing image_url with a sensible placeholder
// using a small set of curated free CDN images. Admins can regenerate per row later.
const PLACEHOLDER_VISA = "https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=1200&q=80&auto=format&fit=crop";
const PLACEHOLDER_UMRAH = "https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?w=1200&q=80&auto=format&fit=crop";

export const seedDefaultImages = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Only admins can seed images.");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: visas }, { data: umrahs }] = await Promise.all([
      supabaseAdmin.from("visa_services").select("id,image_url").is("image_url", null),
      supabaseAdmin.from("umrah_packages").select("id,image_url").is("image_url", null),
    ]);
    let updated = 0;
    for (const v of visas ?? []) {
      const { error } = await supabaseAdmin.from("visa_services")
        .update({ image_url: PLACEHOLDER_VISA }).eq("id", v.id);
      if (!error) updated++;
    }
    for (const u of umrahs ?? []) {
      const { error } = await supabaseAdmin.from("umrah_packages")
        .update({ image_url: PLACEHOLDER_UMRAH }).eq("id", u.id);
      if (!error) updated++;
    }
    return { updated };
  });
