import { createFileRoute } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { SITE } from "@/lib/site";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, MapPin, Phone } from "lucide-react";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().max(20).optional(),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(5).max(1000),
});

export const Route = createFileRoute("/contact")({
  head: () => ({ meta: [{ title: "Contact — DreamPort Travels" }, { name: "description", content: "Reach DreamPort Travels in Depalpur, Punjab. Phone, WhatsApp and email support." }] }),
  component: ContactPage,
});

function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message ?? "Invalid");
    setLoading(true);
    const { error } = await supabase.from("inquiries").insert(parsed.data);
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Message sent! We'll get back within 24 hours.");
    setForm({ name: "", email: "", phone: "", subject: "", message: "" });
  }
  return (
    <AppShell>
      <PageHeader eyebrow="Get In Touch" title="We're here to help with your journey." />
      <section className="py-16">
        <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-10">
          <div className="space-y-5">
            <Info icon={MapPin} t="Office Address" d={SITE.address} />
            <Info icon={Phone} t="Phone & WhatsApp" d={SITE.phone} href={`tel:${SITE.phoneIntl}`} />
            <Info icon={Mail} t="Email" d={SITE.email} href={`mailto:${SITE.email}`} />
            <div className="bg-muted/40 rounded-xl p-5 text-sm">
              <strong>Business Hours:</strong> Mon–Sat, 10:00 AM – 8:00 PM (PKT)
            </div>
          </div>
          <form onSubmit={submit} className="bg-card rounded-2xl ring-1 ring-border p-6 space-y-3">
            <input required placeholder="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
            <div className="grid sm:grid-cols-2 gap-3">
              <input required type="email" placeholder="Email *" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" />
              <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
            </div>
            <input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} className="input" />
            <textarea required rows={5} placeholder="Message *" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input" />
            <button disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-light disabled:opacity-60">
              {loading ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>
      </section>
      <style>{`.input{width:100%;padding:.65rem .85rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);font-size:.875rem;outline:none}.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 20%,transparent)}`}</style>
    </AppShell>
  );
}

function Info({ icon: Icon, t, d, href }: any) {
  const Wrap: any = href ? "a" : "div";
  return (
    <Wrap href={href} className="flex gap-4 p-5 rounded-xl bg-card ring-1 ring-border hover:shadow-md transition-shadow">
      <div className="size-11 rounded-lg bg-accent/10 text-accent flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></div>
      <div><h4 className="font-semibold">{t}</h4><p className="text-sm text-muted-foreground">{d}</p></div>
    </Wrap>
  );
}
