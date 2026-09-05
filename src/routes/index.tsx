import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { BadgeCheck, Search, ShieldCheck, Truck, Stethoscope } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import {
  BREEDS,
  CATEGORIES,
  CITIES,
  PURPOSES,
  purposeOf,
  type Listing,
  type VetInspection,
} from "@/lib/marketplace";

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

const ALL = "hepsi";

function HomePage() {
  const [term, setTerm] = useState("");
  const [breed, setBreed] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [purpose, setPurpose] = useState(ALL);
  const [city, setCity] = useState(ALL);
  const [minHead, setMinHead] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);

  const { data, isLoading } = useQuery({
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

  const inspectionByListing = useMemo(() => {
    const map = new Map<string, VetInspection>();
    for (const i of data?.inspections ?? []) {
      if (!map.has(i.listing_id) || i.is_approved) map.set(i.listing_id, i);
    }
    return map;
  }, [data]);

  const reelListings = useMemo(
    () => (data?.listings ?? []).filter((l) => Boolean(l.reels_video_url)).slice(0, 8),
    [data],
  );

  const filtered = useMemo(() => {

    return (data?.listings ?? []).filter((l) => {
      const insp = inspectionByListing.get(l.id);
      const verified = Boolean(insp?.is_approved);
      const weight = Number(insp?.verified_weight_kg ?? l.estimated_weight_kg ?? 0);
      if (term && !`${l.title} ${l.breed} ${l.ear_tag_number} ${l.city}`.toLocaleLowerCase("tr").includes(term.toLocaleLowerCase("tr")))
        return false;
      if (breed !== ALL && l.breed !== breed) return false;
      if (category !== ALL && l.category !== category) return false;
      if (purpose !== ALL && purposeOf(l.category) !== purpose) return false;
      if (city !== ALL && l.city !== city) return false;
      if (minHead && l.head_count < Number(minHead)) return false;
      if (minWeight && weight < Number(minWeight)) return false;
      if (maxWeight && weight > Number(maxWeight)) return false;
      if (onlyVerified && !verified) return false;
      return true;
    });
  }, [data, inspectionByListing, term, breed, category, purpose, city, minHead, minWeight, maxWeight, onlyVerified]);

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
                <a href="#ilanlar">İlanları İncele</a>
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

        <section id="ilanlar" className="mx-auto w-full max-w-6xl px-4 py-10">
          <div className="surface-panel p-4 md:p-5">
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                value={term}
                onChange={(e) => setTerm(e.target.value)}
                placeholder="Irk, küpe no veya şehir ara..."
                aria-label="İlan ara"
                className="h-12 pl-9"
              />
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <Label className="text-xs text-muted-foreground">Irk</Label>
                <Select value={breed} onValueChange={setBreed}>
                  <SelectTrigger className="mt-1 h-11 w-full">
                    <SelectValue placeholder="Tüm ırklar" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tüm ırklar</SelectItem>
                    {BREEDS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Kategori</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="mt-1 h-11 w-full">
                    <SelectValue placeholder="Tümü" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tümü</SelectItem>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Amaç</Label>
                <Select value={purpose} onValueChange={setPurpose}>
                  <SelectTrigger className="mt-1 h-11 w-full">
                    <SelectValue placeholder="Besi / Damızlık" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Besi / Damızlık</SelectItem>
                    {PURPOSES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Şehir</Label>
                <Select value={city} onValueChange={setCity}>
                  <SelectTrigger className="mt-1 h-11 w-full">
                    <SelectValue placeholder="Tüm şehirler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>Tüm şehirler</SelectItem>
                    {CITIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="minHead" className="text-xs text-muted-foreground">
                  Min. adet
                </Label>
                <Input
                  id="minHead"
                  inputMode="numeric"
                  className="mt-1 h-11"
                  value={minHead}
                  onChange={(e) => setMinHead(e.target.value)}
                  placeholder="örn. 5"
                />
              </div>
              <div>
                <Label htmlFor="minWeight" className="text-xs text-muted-foreground">
                  Min. kilo (kg)
                </Label>
                <Input
                  id="minWeight"
                  inputMode="numeric"
                  className="mt-1 h-11"
                  value={minWeight}
                  onChange={(e) => setMinWeight(e.target.value)}
                  placeholder="300"
                />
              </div>
              <div>
                <Label htmlFor="maxWeight" className="text-xs text-muted-foreground">
                  Maks. kilo (kg)
                </Label>
                <Input
                  id="maxWeight"
                  inputMode="numeric"
                  className="mt-1 h-11"
                  value={maxWeight}
                  onChange={(e) => setMaxWeight(e.target.value)}
                  placeholder="600"
                />
              </div>
              <div className="flex items-end">
                <div className="flex h-11 w-full items-center justify-between rounded-md border border-input px-3">
                  <Label htmlFor="verified" className="text-sm">
                    Sadece Veteriner Onaylılar
                  </Label>
                  <Switch id="verified" checked={onlyVerified} onCheckedChange={setOnlyVerified} />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="font-display text-2xl font-bold">Güncel İlanlar</h2>
            <p className="text-sm text-muted-foreground">{filtered.length} ilan</p>
          </div>

          {isLoading ? (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-80 animate-pulse rounded-xl bg-muted" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-10 text-center text-muted-foreground">
              Filtrelerinize uygun ilan bulunamadı.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((l) => (
                <ListingCard key={l.id} listing={l} inspection={inspectionByListing.get(l.id)} />
              ))}
            </div>
          )}
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
