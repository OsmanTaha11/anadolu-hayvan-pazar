import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "buyer" | "seller" | "vet" | "admin";

export function useSession() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [fullName, setFullName] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const load = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setRole(null);
        setFullName("");
        setLoading(false);
        return;
      }
      const [{ data: roleRow }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", nextUser.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", nextUser.id).maybeSingle(),
      ]);
      if (!active) return;
      setRole(((roleRow?.role as AppRole | undefined) ?? "buyer") as AppRole);
      setFullName(profile?.full_name ?? "");
      setLoading(false);
    };

    supabase.auth.getSession().then(({ data }) => load(data.session?.user ?? null));

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "TOKEN_REFRESHED" || event === "INITIAL_SESSION") return;
      void load(session?.user ?? null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { user, role, fullName, loading };
}
