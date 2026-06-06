import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load(u: User | null) {
      if (!mounted) return;
      setUser(u);
      if (!u) { setIsAdmin(false); setLoading(false); return; }
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
      if (!mounted) return;
      setIsAdmin(!!data?.some((r) => r.role === "admin"));
      setLoading(false);
    }
    supabase.auth.getUser().then(({ data }) => load(data.user));
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        load(session?.user ?? null);
      }
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return { user, isAdmin, loading };
}
