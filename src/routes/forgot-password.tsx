import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({ meta: [{ title: "Forgot Password — DreamPort Travels" }] }),
  component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    setSent(true);
    toast.success("Reset link sent — check your email");
  }

  return (
    <AppShell>
      <PageHeader title="Forgot Password" subtitle="We'll email you a link to reset your password" />
      <section className="py-12">
        <div className="max-w-md mx-auto px-6">
          {sent ? (
            <div className="bg-card ring-1 ring-border rounded-2xl p-6 text-center space-y-3">
              <h3 className="font-semibold">Check your email</h3>
              <p className="text-sm text-muted-foreground">If an account exists for <strong>{email}</strong>, a reset link has been sent.</p>
              <Link to="/auth" className="inline-block text-accent hover:underline text-sm">Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="bg-card ring-1 ring-border rounded-2xl p-6 space-y-3">
              <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background" />
              <button disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-light disabled:opacity-60">
                {loading ? "Sending..." : "Send Reset Link"}
              </button>
              <Link to="/auth" className="block text-sm text-center text-muted-foreground hover:text-accent">Back to sign in</Link>
            </form>
          )}
        </div>
      </section>
    </AppShell>
  );
}
