import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { MoreVertical, Search } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
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

export const Route = createFileRoute("/pazar")({
  head: () => ({
    meta: [
      { title: "Pazar — Güncel Sığır İlanları | ÇiftlikPazar" },
      {
        name: "description",
        content:
          "Simental, Montofon, Holstein ve daha fazlası: ırk, şehir, ağırlık ve veteriner onayına göre filtreleyerek güncel besilik ve damızlık sığır ilanlarını inceleyin.",
      },
      { property: "og:title", content: "Pazar — Güncel Sığır İlanları | ÇiftlikPazar" },
      {
        property: "og:description",
        content:
          "Irk, şehir, ağırlık ve veteriner onayına göre filtrelenmiş güncel canlı hayvan ilanları.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PazarPage,
});

const ALL = "hepsi";

function PazarPage() {
  const [term, setTerm] = useState("");
  const [breed, setBreed] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [purpose, setPurpose] = useState(ALL);
  const [city, setCity] = useState(ALL);
  const [minHead, setMinHead] = useState("");
  const [minWeight, setMinWeight] = useState("");
  const [maxWeight, setMaxWeight] = useState("");
  const [onlyVerified, setOnlyVerified] = useState(false);

  const activeFilterCount =
    (breed !== ALL ? 1 : 0) +
    (category !== ALL ? 1 : 0) +
    (purpose !== ALL ? 1 : 0) +
    (city !== ALL ? 1 : 0) +
    (minHead ? 1 : 0) +
    (minWeight ? 1 : 0) +
    (maxWeight ? 1 : 0) +
    (onlyVerified ? 1 : 0);

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
        <section className="mx-auto w-full max-w-6xl px-4 py-10">
          <h1 className="font-display text-2xl font-bold">Pazar</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Küpe numarası kayıtlı, ekspertizli güncel ilanlar.
          </p>

          <div className="surface-panel mt-5 p-4 md:p-5">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
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
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="relative h-12 w-12 shrink-0"
                    aria-label="Filtreleme seçenekleri"
                  >
                    <MoreVertical className="size-5" aria-hidden />
                    {activeFilterCount > 0 && (
                      <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                        {activeFilterCount}
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-80 p-4">
                  <p className="mb-3 text-sm font-semibold">Filtrele</p>
                  <div className="grid gap-3">
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
                    <div className="grid grid-cols-3 gap-2">
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
                          Min. kg
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
                          Maks. kg
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
                    </div>
                    <div className="flex h-11 w-full items-center justify-between rounded-md border border-input px-3">
                      <Label htmlFor="verified" className="text-sm">
                        Sadece Veteriner Onaylılar
                      </Label>
                      <Switch id="verified" checked={onlyVerified} onCheckedChange={setOnlyVerified} />
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <div className="mt-8 flex items-baseline justify-between">
            <h2 className="font-display text-xl font-bold">Güncel İlanlar</h2>
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
