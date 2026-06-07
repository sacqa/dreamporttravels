import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/reset-password")({
  head: () => ({ meta: [{ title: "Reset Password — DreamPort Travels" }] }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Supabase parses the recovery token from the URL hash automatically.
    // Listen for the PASSWORD_RECOVERY event then allow form submission.
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") setReady(true);
    });
    // Fallback: if already authenticated, allow update.
    supabase.auth.getUser().then(({ data }) => { if (data.user) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("Password updated — please sign in");
    await supabase.auth.signOut();
    navigate({ to: "/auth" });
  }

  return (
    <AppShell>
      <PageHeader title="Reset Password" subtitle="Choose a new password for your account" />
      <section className="py-12">
        <div className="max-w-md mx-auto px-6">
          <form onSubmit={submit} className="bg-card ring-1 ring-border rounded-2xl p-6 space-y-3">
            {!ready && <p className="text-sm text-muted-foreground text-center">Verifying reset link…</p>}
            <input required type="password" minLength={8} placeholder="New password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background" />
            <input required type="password" minLength={8} placeholder="Confirm password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="w-full px-3 py-2.5 border border-border rounded-lg bg-background" />
            <button disabled={loading || !ready} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-light disabled:opacity-60">
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        </div>
      </section>
    </AppShell>
  );
}
