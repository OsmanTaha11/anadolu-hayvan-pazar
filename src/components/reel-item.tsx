import { Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  BadgeCheck,
  Bookmark,
  CheckCircle2,
  CircleAlert,
  MapPin,
  MessageCircle,
  Phone,
  Play,
  Scale,
  Share2,
  Stethoscope,
  Tag,
  Volume2,
  VolumeX,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { resolveMediaUrl, waLink } from "@/lib/media";
import {
  ageLabel,
  formatDate,
  formatTRY,
  type Listing,
  type VetInspection,
} from "@/lib/marketplace";

function ActionButton({
  label,
  onClick,
  href,
  children,
  tone = "dark",
}: {
  label: string;
  onClick?: () => void;
  href?: string;
  children: React.ReactNode;
  tone?: "dark" | "verified";
}) {
  const cls =
    "flex size-12 items-center justify-center rounded-full backdrop-blur transition-transform active:scale-90 " +
    (tone === "verified"
      ? "bg-verified text-verified-foreground"
      : "bg-secondary/60 text-secondary-foreground ring-1 ring-white/15");
  const inner = (
    <>
      <span className={cls}>{children}</span>
      <span className="mt-1 block max-w-16 text-center text-[11px] font-medium leading-tight text-white/90">
        {label}
      </span>
    </>
  );
  return href ? (
    <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="block">
      {inner}
    </a>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className="block">
      {inner}
    </button>
  );
}

function CheckLine({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border py-2.5 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-right text-sm font-semibold">
        {ok ? (
          <CheckCircle2 className="size-4 text-verified" aria-hidden />
        ) : (
          <CircleAlert className="size-4 text-warning" aria-hidden />
        )}
        {value}
      </span>
    </div>
  );
}

export function ReelItem({
  listing,
  inspection,
  active,
  muted,
  onToggleMute,
}: {
  listing: Listing;
  inspection?: VetInspection | undefined;
  active: boolean;
  muted: boolean;
  onToggleMute: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [src, setSrc] = useState<string | null>(null);
  const [poster, setPoster] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const verified = Boolean(inspection?.is_approved);
  const weight = verified ? inspection?.verified_weight_kg : listing.estimated_weight_kg;

  const contactMessage = useMemo(
    () => `Merhaba, ÇiftlikPazar'daki "${listing.title}" (Küpe No: ${listing.ear_tag_number}) ilanınız hakkında bilgi almak istiyorum.`,
    [listing.title, listing.ear_tag_number],
  );

  // Only resolve media for the reels that are near the viewport.
  useEffect(() => {
    let alive = true;
    void (async () => {
      const [v, p] = await Promise.all([
        resolveMediaUrl(listing.reels_video_url),
        resolveMediaUrl(listing.thumbnail_url ?? listing.images[0] ?? null),
      ]);
      if (!alive) return;
      setSrc(v);
      setPoster(p);
    })();
    return () => {
      alive = false;
    };
  }, [listing.reels_video_url, listing.thumbnail_url, listing.images]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (active) {
      const p = el.play();
      if (p) p.catch(() => undefined);
    } else {
      el.pause();
      el.currentTime = 0;
    }
  }, [active, src]);

  useEffect(() => {
    setSaved(
      typeof window !== "undefined" &&
        window.localStorage.getItem(`kaydedilen:${listing.id}`) === "1",
    );
  }, [listing.id]);

  const toggleSave = () => {
    const next = !saved;
    setSaved(next);
    if (next) window.localStorage.setItem(`kaydedilen:${listing.id}`, "1");
    else window.localStorage.removeItem(`kaydedilen:${listing.id}`);
    toast.success(next ? "İlan kaydedildi." : "Kayıt kaldırıldı.");
  };

  const share = async () => {
    const url = `${window.location.origin}/ilan/${listing.id}`;
    try {
      if (navigator.share) await navigator.share({ title: listing.title, url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success("İlan bağlantısı kopyalandı.");
      }
    } catch {
      /* kullanıcı paylaşımı iptal etti */
    }
  };

  const ok = (v: string | null | undefined) =>
    Boolean(v && /normal|sağlıklı|negatif|uygulanamaz/i.test(v));

  return (
    <section
      className="relative h-[100dvh] w-full shrink-0 snap-start snap-always overflow-hidden bg-black"
      aria-label={`${listing.title} tanıtım videosu`}
    >
      {src ? (
        <video
          ref={videoRef}
          src={src}
          poster={poster ?? undefined}
          muted={muted}
          loop
          playsInline
          preload="metadata"
          className="absolute inset-0 size-full object-cover"
        />
      ) : (
        <img
          src={poster ?? "/images/simental-besi.jpg"}
          alt={`${listing.breed} ${listing.category}`}
          className="absolute inset-0 size-full object-cover"
        />
      )}

      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/55"
        aria-hidden
      />

      {/* Ses kontrolü */}
      <button
        type="button"
        onClick={onToggleMute}
        aria-label={muted ? "Sesi aç" : "Sesi kapat"}
        className="absolute right-4 top-4 z-10 flex size-11 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur"
      >
        {muted ? <VolumeX className="size-5" aria-hidden /> : <Volume2 className="size-5" aria-hidden />}
      </button>

      {verified ? (
        <span className="absolute left-16 top-4 z-10 inline-flex max-w-[calc(100%-9rem)] items-center gap-1.5 rounded-full bg-verified px-3 py-1.5 text-xs font-semibold text-verified-foreground shadow-lift">
          <BadgeCheck className="size-4" aria-hidden /> Veteriner Onaylı Ekspertiz
        </span>
      ) : null}

      {/* Sağ aksiyon çubuğu */}
      <div className="absolute bottom-28 right-3 z-10 flex flex-col items-center gap-4">
        {inspection ? (
          <ActionButton label="Ekspertiz Gör" tone="verified" onClick={() => setSheetOpen(true)}>
            <Stethoscope className="size-5" aria-hidden />
          </ActionButton>
        ) : null}
        <ActionButton label="WhatsApp" href={waLink(listing.seller_phone, contactMessage)}>
          <MessageCircle className="size-5" aria-hidden />
        </ActionButton>
        <ActionButton label="Ara" href={`tel:${listing.seller_phone ?? ""}`}>
          <Phone className="size-5" aria-hidden />
        </ActionButton>
        <ActionButton label="Paylaş" onClick={share}>
          <Share2 className="size-5" aria-hidden />
        </ActionButton>
        <ActionButton label={saved ? "Kaydedildi" : "Kaydet"} onClick={toggleSave}>
          <Bookmark className={`size-5 ${saved ? "fill-current" : ""}`} aria-hidden />
        </ActionButton>
      </div>

      {/* İlan bilgileri */}
      <div className="absolute inset-x-0 bottom-0 z-10 max-w-[calc(100%-5.5rem)] p-4 pb-24 text-white">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
          <Tag className="size-3.5" aria-hidden /> Küpe No: {listing.ear_tag_number}
        </span>
        <h2 className="mt-2 font-display text-xl font-bold leading-tight">{listing.title}</h2>
        <p className="mt-1 text-sm text-white/85">
          {listing.breed} · {listing.category} · {ageLabel(listing.age_months)}
        </p>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <span className="font-display text-lg font-bold">{formatTRY(listing.price_per_head)}<span className="text-xs font-medium text-white/80"> / baş</span></span>
          <span className="text-white/85">Toplam: {formatTRY(listing.total_price)} ({listing.head_count} baş)</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
            <MapPin className="size-3.5" aria-hidden /> {listing.city}
            {listing.district ? `, ${listing.district}` : ""}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 backdrop-blur">
            <Scale className="size-3.5" aria-hidden /> {weight ? `${Number(weight)} kg` : "-"}
            {verified ? " ✓" : ""}
          </span>
        </div>

        <Button asChild size="lg" className="mt-4 w-full max-w-xs">
          <Link to="/ilan/$id" params={{ id: listing.id }}>
            <Play className="size-4" aria-hidden /> İlanı İncele
          </Link>
        </Button>
      </div>

      <Drawer open={sheetOpen} onOpenChange={setSheetOpen}>
        <DrawerContent className="max-h-[85dvh]">
          <DrawerHeader className="text-left">
            <DrawerTitle className="flex items-center gap-2">
              <Stethoscope className="size-5 text-verified" aria-hidden /> Ekspertiz Özeti
            </DrawerTitle>
            <DrawerDescription>
              {inspection?.vet_name} · {formatDate(inspection?.inspection_date)}
            </DrawerDescription>
          </DrawerHeader>
          <div className="overflow-y-auto px-4 pb-8">
            <div className="mb-4 rounded-lg bg-accent p-4 text-accent-foreground">
              <p className="text-xs opacity-80">Doğrulanmış Canlı Ağırlık</p>
              <p className="font-display text-2xl font-bold">
                {inspection?.verified_weight_kg ? `${Number(inspection.verified_weight_kg)} kg` : "-"}
              </p>
            </div>
            <CheckLine
              label="Genel Kondisyon"
              value={`${inspection?.general_condition_score ?? "-"} / 5`}
              ok={(inspection?.general_condition_score ?? 0) >= 3}
            />
            <CheckLine
              label="Solunum Sistemi"
              value={inspection?.respiratory_health ?? "-"}
              ok={ok(inspection?.respiratory_health)}
            />
            <CheckLine
              label="Tırnak / Ayak"
              value={inspection?.hoof_limb_health ?? "-"}
              ok={ok(inspection?.hoof_limb_health)}
            />
            <CheckLine
              label="Meme Sağlığı"
              value={inspection?.udder_health ?? "-"}
              ok={ok(inspection?.udder_health)}
            />
            <CheckLine
              label="Aşı Kayıtları"
              value={inspection?.vaccination_verified ? "Doğrulandı" : "Eksik"}
              ok={Boolean(inspection?.vaccination_verified)}
            />
            {inspection?.scale_ticket_photo_url ? (
              <figure className="mt-4">
                <img
                  src={inspection.scale_ticket_photo_url}
                  alt="Kantar tartı fişi"
                  loading="lazy"
                  className="w-full rounded-lg border border-border object-cover"
                />
                <figcaption className="mt-2 text-xs text-muted-foreground">
                  Kantar tartı fişi — veteriner hekim tarafından yüklendi
                </figcaption>
              </figure>
            ) : null}
            {inspection?.vet_notes ? (
              <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm">
                {inspection.vet_notes}
              </p>
            ) : null}
            <Button asChild className="mt-5 w-full">
              <Link to="/ilan/$id" params={{ id: listing.id }}>
                Tam Raporu ve İlanı Aç
              </Link>
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </section>
  );
}
