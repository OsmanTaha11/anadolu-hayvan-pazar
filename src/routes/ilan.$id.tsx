import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, MapPin, ShieldCheck, Tag } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { VetReportCard } from "@/components/vet-report-card";
import { VerifiedBadge } from "@/components/verified-badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  ageLabel,
  formatTRY,
  STATUS_LABELS,
  type Listing,
  type VetInspection,
} from "@/lib/marketplace";

export const Route = createFileRoute("/ilan/$id")({
  head: () => ({
    meta: [
      { title: "İlan Detayı — ÇiftlikPazar" },
      {
        name: "description",
        content:
          "Küpe numarası, doğrulanmış canlı ağırlık ve veteriner ekspertiz raporu ile sığır ilanı detayları.",
      },
      { property: "og:title", content: "İlan Detayı — ÇiftlikPazar" },
      {
        property: "og:description",
        content: "Veteriner onaylı sığır ilanı: teknik özellikler ve dijital sağlık raporu.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ListingDetail,
  errorComponent: () => (
    <div className="p-10 text-center text-muted-foreground">İlan yüklenemedi.</div>
  ),
  notFoundComponent: () => <div className="p-10 text-center">İlan bulunamadı.</div>,
});

function ListingDetail() {
  const { id } = Route.useParams();
  const { user } = useSession();
  const navigate = useNavigate();
  const [active, setActive] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const [l, i] = await Promise.all([
        supabase.from("listings").select("*").eq("id", id).maybeSingle(),
        supabase.from("vet_inspections").select("*").eq("listing_id", id).maybeSingle(),
      ]);
      if (l.error) throw l.error;
      return {
        listing: (l.data ?? null) as unknown as Listing | null,
        inspection: (i.data ?? null) as unknown as VetInspection | null,
      };
    },
  });

  const listing = data?.listing;
  const inspection = data?.inspection;
  const verified = Boolean(inspection?.is_approved);

  const requestEscrow = async () => {
    if (!user) {
      navigate({ to: "/giris" });
      return;
    }
    if (!listing) return;
    setSubmitting(true);
    const deposit = Math.round(Number(listing.total_price) * 0.1);
    const { error } = await supabase.from("escrow_orders").insert({
      listing_id: listing.id,
      buyer_id: user.id,
      seller_id: listing.seller_id,
      total_amount: listing.total_price,
      deposit_amount: deposit,
      virtual_iban: `TR${Math.floor(100000000000000000000000 * Math.random())
        .toString()
        .padStart(24, "0")
        .slice(0, 24)}`,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Talep oluşturulamadı: " + error.message);
      return;
    }
    toast.success("Güvenli alım talebiniz oluşturuldu. Kapora bilgileri siparişlerinizde.");
    void refetch();
    navigate({ to: "/siparislerim" });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <div className="mx-auto max-w-6xl p-4">
          <div className="h-96 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <p className="p-10 text-center text-muted-foreground">İlan bulunamadı.</p>
      </div>
    );
  }

  const images = listing.images.length ? listing.images : ["/images/simental-besi.jpg"];

  return (
    <div className="min-h-screen bg-background pb-24 md:pb-0">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link to="/">
            <ArrowLeft className="size-4" aria-hidden /> İlanlara dön
          </Link>
        </Button>

        <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <div className="space-y-6">
            <div className="surface-panel overflow-hidden">
              <img
                src={images[active]}
                alt={`${listing.breed} ${listing.category}`}
                width={1024}
                height={768}
                className="aspect-4/3 w-full object-cover"
              />
              {images.length > 1 ? (
                <div className="flex gap-2 p-3">
                  {images.map((src, idx) => (
                    <button
                      key={src}
                      onClick={() => setActive(idx)}
                      aria-label={`Fotoğraf ${idx + 1}`}
                      className={`size-16 overflow-hidden rounded-md border-2 ${idx === active ? "border-primary" : "border-transparent"}`}
                    >
                      <img src={src} alt="" loading="lazy" className="size-full object-cover" />
                    </button>
                  ))}
                </div>
              ) : null}
            </div>

            {listing.video_url ? (
              <video
                controls
                src={listing.video_url}
                className="w-full rounded-xl border border-border"
              />
            ) : null}

            <section className="surface-panel p-5">
              <h2 className="font-display text-lg font-bold">Teknik Özellikler</h2>
              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  ["Küpe Numarası", listing.ear_tag_number],
                  ["Irk", listing.breed],
                  ["Kategori", listing.category],
                  ["Yaş", ageLabel(listing.age_months)],
                  ["Adet", `${listing.head_count} baş`],
                  [
                    "Tahmini Canlı Ağırlık",
                    listing.estimated_weight_kg ? `${Number(listing.estimated_weight_kg)} kg` : "-",
                  ],
                  [
                    "Doğrulanmış Ağırlık",
                    verified && inspection?.verified_weight_kg
                      ? `${Number(inspection.verified_weight_kg)} kg`
                      : "Henüz doğrulanmadı",
                  ],
                  ["Durum", STATUS_LABELS[listing.status] ?? listing.status],
                ].map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-muted p-3">
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-semibold">{v}</dd>
                  </div>
                ))}
              </dl>
              {listing.description ? (
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  {listing.description}
                </p>
              ) : null}
            </section>

            {inspection ? (
              <VetReportCard inspection={inspection} />
            ) : (
              <section className="surface-panel p-5">
                <h2 className="font-display text-lg font-bold">Ekspertiz Raporu</h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  Bu ilan için henüz veteriner ekspertizi yapılmadı. "Ekspertiz Talep Et" ile
                  bölgedeki yetkili veteriner hekim görevlendirilir.
                </p>
              </section>
            )}
          </div>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="surface-panel p-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                  <Tag className="size-3.5" aria-hidden /> {listing.ear_tag_number}
                </span>
                {verified ? <VerifiedBadge /> : null}
              </div>
              <h1 className="mt-3 font-display text-2xl font-bold">{listing.title}</h1>
              <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-4" aria-hidden />
                {listing.city}
                {listing.district ? ` / ${listing.district}` : ""} · {listing.seller_name}
              </p>

              <div className="mt-5 rounded-lg bg-accent p-4 text-accent-foreground">
                <p className="text-xs">Baş fiyatı</p>
                <p className="font-display text-3xl font-bold">
                  {formatTRY(listing.price_per_head)}
                </p>
                <p className="mt-1 text-sm">
                  {listing.head_count} baş toplam: {formatTRY(listing.total_price)}
                </p>
              </div>

              <Button
                size="lg"
                className="mt-5 hidden w-full md:inline-flex"
                onClick={requestEscrow}
                disabled={submitting}
              >
                <ShieldCheck className="size-5" aria-hidden />
                Güvenli Alım / Ekspertiz Talep Et
              </Button>
              <p className="mt-3 text-xs text-muted-foreground">
                Kapora tutarı (%10) sanal IBAN'da bloke edilir, veteriner onayı ve teslimat sonrası
                satıcıya aktarılır.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card p-3 md:hidden">
        <Button size="lg" className="w-full" onClick={requestEscrow} disabled={submitting}>
          <ShieldCheck className="size-5" aria-hidden />
          Güvenli Alım / Ekspertiz Talep Et
        </Button>
      </div>
    </div>
  );
}
