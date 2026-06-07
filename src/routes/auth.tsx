import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { AppShell, PageHeader } from "@/components/AppShell";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({ meta: [{ title: "Sign In — DreamPort Travels" }] }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { emailRedirectTo: window.location.origin, data: { full_name: name } },
      });
      if (error) toast.error(error.message); else { toast.success("Account created!"); navigate({ to: "/" }); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) toast.error(error.message); else { toast.success("Signed in"); navigate({ to: "/" }); }
    }
    setLoading(false);
  }

  return (
    <AppShell>
      <PageHeader title={mode === "signup" ? "Create Account" : "Sign In"} />
      <section className="py-12">
        <div className="max-w-md mx-auto px-6">
          <form onSubmit={submit} className="bg-card ring-1 ring-border rounded-2xl p-6 space-y-3">
            {mode === "signup" && <input required placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="input" />}
            <input required type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input" />
            <input required type="password" minLength={6} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} className="input" />
            <button disabled={loading} className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-semibold hover:bg-primary-light">
              {loading ? "..." : mode === "signup" ? "Sign Up" : "Sign In"}
            </button>
            <button type="button" onClick={() => setMode(mode === "signin" ? "signup" : "signin")} className="w-full text-sm text-muted-foreground hover:text-accent">
              {mode === "signin" ? "Need an account? Sign up" : "Have an account? Sign in"}
            </button>
            {mode === "signin" && (
              <Link to="/forgot-password" className="block text-center text-xs text-muted-foreground hover:text-accent">Forgot password?</Link>
            )}
          </form>
        </div>
      </section>
      <style>{`.input{width:100%;padding:.65rem .85rem;border:1px solid var(--border);border-radius:.5rem;background:var(--background);font-size:.875rem;outline:none}.input:focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in oklab,var(--accent) 20%,transparent)}`}</style>
    </AppShell>
  );
}
