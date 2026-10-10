import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "seller" | "vet" | "admin";

const MODE_KEY = "cp_active_mode";

function pickRole(roles: AppRole[]): AppRole {
  const saved = typeof window !== "undefined" ? window.localStorage.getItem(MODE_KEY) : null;
  const hasVet = roles.includes("vet");
  const hasTrader = roles.includes("seller") || roles.includes("buyer");
  if (roles.includes("admin")) {
    if (saved === "vet" && hasVet) return "vet";
    if (saved === "seller" && hasTrader) return "seller";
    return "admin";
  }
  if (hasVet && hasTrader) return saved === "vet" ? "vet" : "seller";
  if (hasVet) return "vet";
  return "seller";
}

/** Switch between modes for accounts that have several roles. */
export async function switchMode(mode: "vet" | "seller" | "admin", addIfMissing = false) {
  if (addIfMissing && mode !== "admin") {
    const { error } = await supabase.rpc("add_my_role", { _role: mode });
    if (error) throw error;
  }
  window.localStorage.setItem(MODE_KEY, mode);
  window.location.href = mode === "vet" ? "/veteriner" : mode === "admin" ? "/yonetim" : "/";
}

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setRoles([]);
        setFullName("");
        setLoading(false);
        return;
      }
      const [{ data: roleRows }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", nextUser.id),
        supabase.from("profiles").select("full_name").eq("id", nextUser.id).maybeSingle(),
      ]);
      if (!active) return;
      const list = ((roleRows ?? []).map((r) => r.role) as AppRole[]) || [];
      setRoles(list);
      setRole(pickRole(list));
      setFullName(profile?.full_name ?? "");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));

    if (typeof window !== "undefined" && window.location.hash.includes("type=recovery") && window.location.pathname !== "/reset-password") {
      window.location.replace("/reset-password" + window.location.hash);
    }

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && window.location.pathname !== "/reset-password") {
        window.location.replace("/reset-password");
        return;
      }
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      // Defer to avoid auth-lock deadlock (e.g. updateUser hanging)
      setTimeout(() => void load(session?.user ?? null), 0);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const hasVet = roles.includes("vet");
  const hasTrader = roles.includes("seller") || roles.includes("buyer");

  return { user, role, roles, hasVet, hasTrader, fullName, loading };
}
