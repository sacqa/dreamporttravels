import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type RoleName = "admin" | "editor" | "customer";

export type RolesState = {
  loading: boolean;
  signedIn: boolean;
  email?: string;
  roles: RoleName[];
  isAdmin: boolean;
  isEditor: boolean;
  canAccessAdmin: boolean;
  can: (perm: Permission) => boolean;
};

export type Permission =
  | "view_dashboard"
  | "edit_content"
  | "edit_homepage"
  | "edit_footer"
  | "generate_images"
  | "manage_services"
  | "manage_orders"
  | "manage_customers"
  | "manage_payments"
  | "view_carts";

const ROLE_PERMISSIONS: Record<RoleName, Permission[]> = {
  admin: [
    "view_dashboard", "edit_content", "edit_homepage", "edit_footer",
    "generate_images", "manage_services", "manage_orders",
    "manage_customers", "manage_payments", "view_carts",
  ],
  editor: ["view_dashboard", "edit_content", "edit_homepage", "edit_footer", "view_carts"],
  customer: [],
};

export function useRoles(): RolesState {
  const [state, setState] = useState<RolesState>({
    loading: true, signedIn: false, roles: [],
    isAdmin: false, isEditor: false, canAccessAdmin: false,
    can: () => false,
  });

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data: u } = await supabase.auth.getUser();
      if (!mounted) return;
      if (!u.user) {
        setState({
          loading: false, signedIn: false, roles: [],
          isAdmin: false, isEditor: false, canAccessAdmin: false,
          can: () => false,
        });
        return;
      }
      const { data: rows } = await supabase
        .from("user_roles").select("role").eq("user_id", u.user.id);
      const roles = (rows ?? []).map((r) => r.role) as RoleName[];
      const isAdmin = roles.includes("admin");
      const isEditor = roles.includes("editor");
      const allowed = new Set<Permission>(
        roles.flatMap((r) => ROLE_PERMISSIONS[r] ?? []),
      );
      setState({
        loading: false, signedIn: true, email: u.user.email ?? undefined,
        roles, isAdmin, isEditor,
        canAccessAdmin: isAdmin || isEditor,
        can: (p) => allowed.has(p),
      });
    }
    load();
    const { data: sub } = supabase.auth.onAuthStateChange((e) => {
      if (e === "SIGNED_IN" || e === "SIGNED_OUT" || e === "USER_UPDATED") load();
    });
    return () => { mounted = false; sub.subscription.unsubscribe(); };
  }, []);

  return state;
}
