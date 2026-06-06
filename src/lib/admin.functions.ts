import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const input = z.object({
  table: z.enum(["visa_services", "umrah_packages"]),
  id: z.string().uuid(),
  prompt: z.string().min(3).max(500),
});

export const generateServiceImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => input.parse(data))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    if (!roles?.some((r) => r.role === "admin")) {
      throw new Error("Admin only");
    }

    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash-image",
          messages: [{ role: "user", content: data.prompt }],
          modalities: ["image", "text"],
        }),
      },
    );
    if (!aiRes.ok) {
      const txt = await aiRes.text().catch(() => "");
      throw new Error(`AI gateway ${aiRes.status}: ${txt.slice(0, 200)}`);
    }
    const aiJson = (await aiRes.json()) as {
      data?: Array<{ b64_json?: string }>;
    };
    const b64 = aiJson.data?.[0]?.b64_json;
    if (!b64) throw new Error("No image returned");

    const { supabaseAdmin } = await import(
      "@/integrations/supabase/client.server"
    );
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const path = `${data.table}/${data.id}-${Date.now()}.png`;
    const { error: upErr } = await supabaseAdmin.storage
      .from("service-images")
      .upload(path, bytes, { contentType: "image/png", upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { data: pub } = supabaseAdmin.storage
      .from("service-images")
      .getPublicUrl(path);

    const { error: updErr } = await supabaseAdmin
      .from(data.table)
      .update({ image_url: pub.publicUrl })
      .eq("id", data.id);
    if (updErr) throw new Error(updErr.message);

    return { image_url: pub.publicUrl };
  });
