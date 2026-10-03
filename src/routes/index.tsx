import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { BadgeCheck, PlayCircle, ShieldCheck, Truck, Stethoscope } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Listing, VetInspection } from "@/lib/marketplace";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ÇiftlikPazar — Veteriner Onaylı Güvenli Hayvan Pazarı" },
      {
        name: "description",
        content:
          "Küpe numarası kayıtlı, veteriner hekim ekspertizinden geçmiş besilik ve damızlık sığır ilanları. Güvenli ödeme ile Türkiye'nin dijital canlı hayvan pazarı.",
      },
      { property: "og:title", content: "ÇiftlikPazar — Veteriner Onaylı Hayvan Pazarı" },
      {
        property: "og:description",
        content:
          "Simental, Montofon, Holstein ve daha fazlası. Doğrulanmış canlı ağırlık, dijital sağlık raporu ve güvenli işlem.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data } = useQuery({
    queryKey: ["marketplace"],
    queryFn: async () => {
      const [listingsRes, inspectionsRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*")
          .in("status", ["active", "inspection_pending", "inspected", "sold"])
          .order("created_at", { ascending: false }),
        supabase.from("vet_inspections").select("*"),
      ]);
      if (listingsRes.error) throw listingsRes.error;
      if (inspectionsRes.error) throw inspectionsRes.error;
      return {
        listings: (listingsRes.data ?? []) as unknown as Listing[],
        inspections: (inspectionsRes.data ?? []) as unknown as VetInspection[],
      };
    },
  });

  const reelListings = useMemo(
    () => (data?.listings ?? []).filter((l) => Boolean(l.reels_video_url)).slice(0, 8),
    [data],
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main>
        <section className="relative isolate overflow-hidden">
          <img
            src="/images/hero.jpg"
            alt="Sürüsünü kontrol eden veteriner hekim"
            width={1600}
            height={1000}
            className="absolute inset-0 size-full object-cover"
          />
          <div className="hero-overlay absolute inset-0" />
          <div className="relative mx-auto w-full max-w-6xl px-4 py-16 md:py-24">
            <span className="inline-flex items-center gap-2 rounded-full bg-verified px-3 py-1.5 text-xs font-semibold text-verified-foreground">
              <BadgeCheck className="size-4" aria-hidden /> Her ilan sahada doğrulanır
            </span>
            <h1 className="mt-5 max-w-2xl font-display text-4xl font-bold leading-tight text-primary-foreground md:text-5xl">
              Veteriner Onaylı, Güvenli Hayvan Pazarı
            </h1>
            <p className="mt-4 max-w-xl text-base text-primary-foreground/85 md:text-lg">
              Küpe numarası kayıtlı hayvanlar, sahada yapılan dijital ekspertiz raporu ve kapora
              güvencesi ile alım satım. Üretici ile alıcıyı aracısız buluşturur.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/pazar">İlanları İncele</Link>
              </Button>
              <Button size="lg" variant="secondary" asChild>
                <Link to="/giris">Üretici Olarak İlan Ver</Link>
              </Button>
            </div>

            <ul className="mt-10 grid gap-4 sm:grid-cols-3">
              {[
                { icon: Stethoscope, title: "Saha Ekspertizi", text: "Yetkili veteriner hekim kontrolü" },
                { icon: ShieldCheck, title: "Kapora Güvencesi", text: "Sanal IBAN ile bloke ödeme" },
                { icon: Truck, title: "Sevkiyat Takibi", text: "Nakliye sürecini adım adım izleyin" },
              ].map((f) => (
                <li
                  key={f.title}
                  className="flex items-start gap-3 rounded-xl bg-background/95 p-4 shadow-card"
                >
                  <f.icon className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                  <div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="text-xs text-muted-foreground">{f.text}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto w-full max-w-6xl px-4 py-12">
          <div className="surface-panel flex flex-wrap items-center justify-between gap-4 p-6">
            <div>
              <h2 className="font-display text-2xl font-bold">Güncel İlanlar Pazarda</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Irk, şehir, ağırlık ve veteriner onayına göre filtreleyerek tüm ilanları inceleyin.
              </p>
            </div>
            <Button size="lg" asChild>
              <Link to="/pazar">Pazara Git</Link>
            </Button>
          </div>
        </section>

        <section className="border-t border-border bg-secondary/40 py-12">
          <div className="mx-auto w-full max-w-6xl px-4">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-bold">Keşfet (Reels)</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Hayvanların yürüyüşünü, tırnaklarını ve beden yapısını dikey videolarla izleyin.
                </p>
              </div>
              <Button asChild>
                <Link to="/kesfet">Videoları İzle</Link>
              </Button>
            </div>

            <div className="mt-6 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {reelListings.map((l) => (
                <Link
                  key={l.id}
                  to="/kesfet"
                  className="group relative aspect-[9/16] w-40 shrink-0 snap-start overflow-hidden rounded-xl bg-muted shadow-card sm:w-48"
                >
                  <img
                    src={l.thumbnail_url?.startsWith("/") ? l.thumbnail_url : (l.images[0] ?? "")}
                    alt={`${l.title} tanıtım videosu`}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                  <span className="absolute right-2 top-2 rounded-full bg-black/50 p-1.5 text-white ring-1 ring-white/25">
                    <PlayCircle className="size-4" aria-hidden />
                  </span>
                  <div className="absolute inset-x-0 bottom-0 p-3 text-primary-foreground">
                    <p className="line-clamp-2 text-xs font-semibold">{l.title}</p>
                    <p className="mt-1 text-[11px] opacity-85">
                      {l.city}
                      {l.district ? `, ${l.district}` : ""}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-secondary py-8 text-secondary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 text-sm">
          <p className="font-display text-base font-bold">ÇiftlikPazar</p>
          <p className="mt-1 opacity-80">
            Veteriner onaylı dijital canlı hayvan pazarı. Tüm hayvanlar küpe numarası ile kayıtlıdır.
          </p>
        </div>
      </footer>
    </div>
  );
}
