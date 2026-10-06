import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Clapperboard, Home, PlusSquare, Store, User, UserPlus } from "lucide-react";

import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

export function BottomNav() {
  const { user, role } = useSession();
  const navigate = useNavigate();
  const routerPath = useRouterState({ select: (s) => s.location.pathname });
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = mounted ? routerPath : "";

  const panel =
    role === "vet"
      ? "/veteriner"
      : role === "admin"
        ? "/yonetim"
        : "/siparislerim";

  const items = [
    { to: "/", label: "Ana Sayfa", icon: Home },
    { to: "/kesfet", label: "Reels", icon: Clapperboard },
    user
      ? { to: "/satici", label: "İlan Ver", icon: PlusSquare }
      : { to: "/giris", label: "İlan Ver", icon: PlusSquare },
    { to: "/pazar", label: "Pazar", icon: Store },
    user
      ? { to: panel, label: "Profil", icon: User }
      : { to: "/giris", label: "Giriş", icon: UserPlus },
  ] as const;

  useEffect(() => {
    const vetAllowed = ["/veteriner", "/reset-password", "/giris"];
    if (mounted && role === "vet" && !vetAllowed.some((p) => pathname.startsWith(p))) {
      navigate({ to: "/veteriner", replace: true });
    }
  }, [mounted, role, pathname, navigate]);

  if (!mounted) return null;
  if (role === "vet") return null;

  const onReels = pathname.startsWith("/kesfet");

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur md:hidden",
        onReels
          ? "border-white/10 bg-black/70 text-white"
          : "border-border bg-background/95 text-foreground",
      )}
      aria-label="Alt gezinme"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {items.map((item, i) => {
          const active =
            mounted && item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <li key={`${item.to}-${i}`} className="flex-1">
              <Link
                to={item.to}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? onReels
                      ? "text-white"
                      : "text-primary"
                    : onReels
                      ? "text-white/60"
                      : "text-muted-foreground",
                )}
              >
                <Icon className={cn("size-6", active && "scale-110")} aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
