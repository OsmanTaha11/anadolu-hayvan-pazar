import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function VerifiedBadge({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-verified px-2.5 py-1 text-xs font-semibold text-verified-foreground shadow-sm",
        className,
      )}
    >
      <BadgeCheck className="size-3.5" aria-hidden />
      Veteriner Onaylı
    </span>
  );
}
