import { ArrowLeftRight } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { switchMode, useSession } from "@/hooks/use-session";

type Mode = "vet" | "seller" | "admin";
const LABELS: Record<Mode, string> = {
  vet: "Veteriner Modu",
  seller: "Alım-Satım Modu",
  admin: "Yönetici Modu",
};

export function ModeSwitch({ className }: { className?: string }) {
  const { user, role, roles, hasVet, hasTrader } = useSession();
  if (!user || !role) return null;

  const isAdmin = roles.includes("admin");
  if (isAdmin) {
    const modes = (["admin", "seller", "vet"] as Mode[]).filter(
      (m) => m !== role && (m === "admin" || (m === "vet" ? hasVet : hasTrader)),
    );
    if (modes.length === 0) return null;
    return (
      <>
        {modes.map((m) => (
          <Button key={m} variant="outline" size="sm" className={className} onClick={() => void switchMode(m)}>
            <ArrowLeftRight className="size-4" aria-hidden /> {LABELS[m]}
          </Button>
        ))}
      </>
    );
  }

  const target: "vet" | "seller" = role === "vet" ? "seller" : "vet";
  const has = target === "vet" ? hasVet : hasTrader;
  const label = has
    ? target === "vet"
      ? "Veteriner Moduna Geç"
      : "Alım-Satım Moduna Geç"
    : target === "vet"
      ? "Veteriner Hesabı Ekle"
      : "Alım-Satım Hesabı Ekle";

  const onClick = async () => {
    if (!has) {
      const ok = window.confirm(
        target === "vet"
          ? "Bu e-postaya veteriner hesabı eklensin mi? İki mod arasında istediğin zaman geçiş yapabilirsin."
          : "Bu e-postaya alım-satım hesabı eklensin mi? İki mod arasında istediğin zaman geçiş yapabilirsin.",
      );
      if (!ok) return;
    }
    try {
      await switchMode(target, !has);
    } catch (e) {
      toast.error("İşlem başarısız: " + (e as Error).message);
    }
  };

  return (
    <Button variant="outline" size="sm" className={className} onClick={onClick}>
      <ArrowLeftRight className="size-4" aria-hidden /> {label}
    </Button>
  );
}
