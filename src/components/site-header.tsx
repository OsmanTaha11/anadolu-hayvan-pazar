import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { ROLE_LABELS } from "@/lib/marketplace";

export function SiteHeader() {
  const { user, role, fullName } = useSession();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const panelLink =
    role === "vet"
      ? { to: "/veteriner", label: "Saha Paneli" }
      : role === "seller"
        ? { to: "/satici", label: "Satıcı Paneli" }
        : role === "admin"
          ? { to: "/yonetim", label: "Yönetim" }
          : { to: "/siparislerim", label: "Siparişlerim" };

  const handleSignOut = async () => {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4">
        <Link to="/" className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <span className="font-display text-lg font-bold tracking-tight">ÇiftlikPazar</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          <Button variant="ghost" asChild>
            <Link to="/">İlanlar</Link>
          </Button>
          {user ? (
            <>
              <Button variant="ghost" asChild>
                <Link to={panelLink.to}>{panelLink.label}</Link>
              </Button>
              <span className="ml-2 text-sm text-muted-foreground">
                {fullName || user.email} · {role ? ROLE_LABELS[role] : ""}
              </span>
              <Button variant="ghost" size="icon" aria-label="Çıkış yap" onClick={handleSignOut}>
                <LogOut className="size-4" aria-hidden />
              </Button>
            </>
          ) : (
            <Button asChild>
              <Link to="/giris">Giriş Yap</Link>
            </Button>
          )}
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Menü"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </Button>
      </div>

      {open ? (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <Button variant="ghost" className="justify-start" asChild onClick={() => setOpen(false)}>
              <Link to="/">İlanlar</Link>
            </Button>
            {user ? (
              <>
                <Button
                  variant="ghost"
                  className="justify-start"
                  asChild
                  onClick={() => setOpen(false)}
                >
                  <Link to={panelLink.to}>{panelLink.label}</Link>
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  Çıkış Yap
                </Button>
              </>
            ) : (
              <Button asChild onClick={() => setOpen(false)}>
                <Link to="/giris">Giriş Yap</Link>
              </Button>
            )}
          </div>
        </div>
      ) : null}
    </header>
  );
}
