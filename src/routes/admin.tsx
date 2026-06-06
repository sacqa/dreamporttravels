import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatPKR } from "@/lib/site";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Admin — DreamPort Travels" }] }),
  component: AdminPage,
});

function AdminPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) { setAuthed(false); return; }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", data.user.id);
      const isAdmin = roles?.some((r) => r.role === "admin");
      setAuthed(!!isAdmin);
      if (isAdmin) {
        const { data: o } = await supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(100);
        setOrders(o ?? []);
      }
    });
  }, []);

  if (authed === null) return <AppShell><PageHeader title="Loading..." /></AppShell>;
  if (!authed) return (
    <AppShell>
      <PageHeader title="Admin access required" subtitle="Sign in with an admin account to view orders." />
      <div className="max-w-md mx-auto px-6 text-center pb-12">
        <Link to="/auth" className="bg-primary text-primary-foreground px-6 py-3 rounded-full font-semibold">Sign In</Link>
        <p className="text-xs text-muted-foreground mt-6">To grant admin: insert a row into user_roles with role='admin' for the user via Cloud dashboard.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <PageHeader title="Admin Dashboard" subtitle={`${orders.length} orders`} />
      <section className="py-10">
        <div className="max-w-7xl mx-auto px-6 overflow-x-auto">
          <table className="w-full text-sm bg-card rounded-xl ring-1 ring-border">
            <thead className="bg-muted/40 text-left">
              <tr>{["Order #","Customer","Phone","Total","Method","Status","Date"].map((h) => <th key={h} className="px-4 py-3 font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">{o.order_number}</td>
                  <td className="px-4 py-3">{o.customer_name}<br /><span className="text-xs text-muted-foreground">{o.customer_email}</span></td>
                  <td className="px-4 py-3">{o.customer_phone}</td>
                  <td className="px-4 py-3 font-semibold">{formatPKR(o.total_pkr)}</td>
                  <td className="px-4 py-3">{o.payment_method}</td>
                  <td className="px-4 py-3"><span className="inline-block px-2 py-0.5 rounded text-xs bg-accent/10 text-accent">{o.status}</span></td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </AppShell>
  );
}
