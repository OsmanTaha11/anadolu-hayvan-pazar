import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ClipboardList,
  Loader2,
  MapPin,
  Stethoscope,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { VetReportCard } from "@/components/vet-report-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { LISTING_MEDIA_BUCKET, STORAGE_PREFIX } from "@/lib/media";
import {
  CITIES,
  STATUS_LABELS,
  ageLabel,
  formatDate,
  formatTRY,
  type Listing,
  type VetInspection,
} from "@/lib/marketplace";

const RESPIRATORY = ["Normal", "Hafif öksürük", "Şüpheli", "Tedavi gerekli"];
const HOOF = ["Sağlıklı", "Hafif topallık", "Tırnak bakımı gerekli", "Problemli"];
const UDDER = ["Sağlıklı", "Uygulanamaz", "Şüpheli", "Mastitis şüphesi"];
const PREGNANCY = ["Uygulanamaz", "Negatif", "Gebe — 3 ay", "Gebe — 5 ay", "Gebe — 7 ay"];

export const Route = createFileRoute("/_authenticated/veteriner")({
  head: () => ({
    meta: [
      { title: "Veteriner Saha Paneli — ÇiftlikPazar" },
      {
        name: "description",
        content:
          "Ekspertiz bekleyen ilanları görün, saha muayene formunu doldurun, raporu onaylayıp ilana bağlayın.",
      },
      { property: "og:title", content: "Veteriner Saha Paneli — ÇiftlikPazar" },
      {
        property: "og:description",
        content: "Saha ekspertiz formu, görev listesi ve rapor onay akışı.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: VetPage,
});

const emptyForm = {
  inspection_date: new Date().toISOString().slice(0, 10),
  verified_weight_kg: "",
  general_condition_score: "4",
  respiratory_health: RESPIRATORY[0]!,
  respiratory_note: "",
  hoof_limb_health: HOOF[0]!,
  udder_health: UDDER[0]!,
  vaccination_verified: true,
  pregnancy_status: PREGNANCY[0]!,
  vet_notes: "",
  vet_license_no: "",
};

function VetPage() {
  const { user, role, fullName } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"tasks" | "reports">("tasks");
  const [activeListing, setActiveListing] = useState<Listing | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [ticket, setTicket] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [approving, setApproving] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["vet-listings"],
    enabled: role === "vet",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .in("status", ["inspection_pending", "active", "inspected"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });

  const { data: inspections, isLoading: reportsLoading } = useQuery({
    queryKey: ["vet-inspections", user?.id],
    enabled: Boolean(user?.id) && role === "vet",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vet_inspections")
        .select("*")
        .eq("vet_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VetInspection[];
    },
  });

  const reportByListing = useMemo(() => {
    const map = new Map<string, VetInspection>();
    for (const r of inspections ?? []) if (!map.has(r.listing_id)) map.set(r.listing_id, r);
    return map;
  }, [inspections]);

  const { data: serviceCities } = useQuery({
    queryKey: ["vet-regions", user?.id],
    enabled: Boolean(user?.id) && role === "vet",
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("service_cities")
        .eq("id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data?.service_cities ?? []) as string[];
    },
  });
  const regions = serviceCities ?? [];
  const [editingRegions, setEditingRegions] = useState(false);

  const toggleRegion = async (city: string) => {
    if (!user) return;
    const next = regions.includes(city) ? regions.filter((c) => c !== city) : [...regions, city];
    const { error } = await supabase
      .from("profiles")
      .update({ service_cities: next })
      .eq("id", user.id);
    if (error) {
      toast.error("Çalışma bölgesi kaydedilemedi: " + error.message);
      return;
    }
    queryClient.setQueryData(["vet-regions", user.id], next);
  };

  const tasks = useMemo(
    () =>
      (listings ?? []).filter(
        (l) =>
          !reportByListing.get(l.id)?.is_approved &&
          (regions.length === 0 || regions.includes(l.city)),
      ),
    [listings, reportByListing, regions],
  );

  const openForm = (listing: Listing) => {
    setActiveListing(listing);
    setTicket(null);
    setForm({
      ...emptyForm,
      verified_weight_kg: listing.estimated_weight_kg ? String(listing.estimated_weight_kg) : "",
    });
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const uploadTicket = async () => {
    if (!ticket || !user) return null;
    const ext = ticket.name.split(".").pop() ?? "jpg";
    const path = `${user.id}/ekspertiz/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(LISTING_MEDIA_BUCKET)
      .upload(path, ticket, { contentType: ticket.type, upsert: false });
    if (error) throw error;
    return `${STORAGE_PREFIX}${path}`;
  };

  const submitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !activeListing) return;
    setSaving(true);
    try {
      const scale = await uploadTicket();
      const { error } = await supabase.from("vet_inspections").insert({
        listing_id: activeListing.id,
        vet_id: user.id,
        vet_name: fullName || user.email || "Veteriner Hekim",
        vet_license_no: form.vet_license_no || null,
        inspection_date: form.inspection_date,
        verified_weight_kg: form.verified_weight_kg ? Number(form.verified_weight_kg) : null,
        scale_ticket_photo_url: scale,
        general_condition_score: Number(form.general_condition_score),
        respiratory_health: form.respiratory_health,
        respiratory_note: form.respiratory_note || null,
        hoof_limb_health: form.hoof_limb_health,
        udder_health: form.udder_health,
        vaccination_verified: form.vaccination_verified,
        pregnancy_status: form.pregnancy_status,
        vet_notes: form.vet_notes || null,
        is_approved: false,
      });
      if (error) throw error;
      toast.success("Saha raporu kaydedildi. Onay bekliyor.");
      setActiveListing(null);
      await queryClient.invalidateQueries({ queryKey: ["vet-inspections", user.id] });
      setTab("reports");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rapor kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  /** Approves the report and marks the linked listing as vet-verified. */
  const approveReport = async (report: VetInspection) => {
    if (!user) return;
    setApproving(report.id);
    try {
      const { error } = await supabase
        .from("vet_inspections")
        .update({ is_approved: true })
        .eq("id", report.id)
        .eq("vet_id", user.id);
      if (error) throw error;
      const { error: linkError } = await supabase
        .from("listings")
        .update({ status: "inspected" })
        .eq("id", report.listing_id);
      if (linkError) throw linkError;
      toast.success("Rapor onaylandı ve ilana bağlandı.");
      await queryClient.invalidateQueries({ queryKey: ["vet-inspections", user.id] });
      await queryClient.invalidateQueries({ queryKey: ["vet-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      await queryClient.invalidateQueries({ queryKey: ["reels"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Onay işlemi başarısız.");
    } finally {
      setApproving(null);
    }
  };

  if (role && role !== "vet") {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Veteriner Saha Paneli</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Bu alan yalnızca doğrulanmış veteriner hekim hesaplarına açıktır.
          </p>
          <Button className="mt-6" asChild>
            <Link to="/">İlanlara Dön</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <div className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-verified text-verified-foreground">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Veteriner Saha Paneli</h1>
            <p className="text-sm text-muted-foreground">
              Görev listesindeki hayvanı muayene edin, saha ekspertiz formunu doldurun ve raporu
              onaylayarak ilana bağlayın.
            </p>
          </div>
        </div>

        <div className="mt-6 inline-flex rounded-lg border border-border bg-card p-1">
          <Button
            variant={tab === "tasks" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("tasks")}
          >
            <ClipboardList className="size-4" aria-hidden /> Görev Listesi ({tasks.length})
          </Button>
          <Button
            variant={tab === "reports" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("reports")}
          >
            <BadgeCheck className="size-4" aria-hidden /> Raporlarım ({(inspections ?? []).length})
          </Button>
        </div>

        <section className="mt-6 rounded-xl border border-border bg-card p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <MapPin className="size-4 text-primary" aria-hidden />
              <h2 className="font-display text-base font-bold">Çalışma Bölgem</h2>
            </div>
            <Button variant="outline" size="sm" onClick={() => setEditingRegions((v) => !v)}>
              {editingRegions ? "Tamam" : "Bölgeleri Düzenle"}
            </Button>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {regions.length === 0
              ? "Henüz bölge seçmediniz — tüm şehirlerdeki görevler gösteriliyor."
              : `Görev listesi yalnızca bu şehirlerdeki hayvanları gösterir: ${regions.join(", ")}`}
          </p>
          {editingRegions ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {CITIES.map((c) => {
                const on = regions.includes(c);
                return (
                  <Button
                    key={c}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    onClick={() => void toggleRegion(c)}
                  >
                    {c}
                  </Button>
                );
              })}
            </div>
          ) : null}
        </section>

        {activeListing ? (
          <form
            onSubmit={submitReport}
            className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-bold">Saha Ekspertiz Formu</h2>
                <p className="text-sm text-muted-foreground">
                  {activeListing.title} · Küpe No: {activeListing.ear_tag_number}
                </p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setActiveListing(null)}>
                Vazgeç
              </Button>
            </div>

            <div>
              <Label htmlFor="date">Muayene Tarihi</Label>
              <Input
                id="date"
                type="date"
                value={form.inspection_date}
                onChange={(e) => set("inspection_date", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="license">Diploma / Lisans No</Label>
              <Input
                id="license"
                value={form.vet_license_no}
                onChange={(e) => set("vet_license_no", e.target.value)}
                placeholder="VET-2024-01234"
              />
            </div>

            <div>
              <Label htmlFor="weight">Doğrulanmış Canlı Ağırlık (kg)</Label>
              <Input
                id="weight"
                inputMode="numeric"
                value={form.verified_weight_kg}
                onChange={(e) => set("verified_weight_kg", e.target.value)}
              />
            </div>
            <div>
              <Label>Genel Kondisyon Skoru (1-5)</Label>
              <Select
                value={form.general_condition_score}
                onValueChange={(v) => set("general_condition_score", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["1", "2", "3", "4", "5"].map((s) => (
                    <SelectItem key={s} value={s}>
                      {s} / 5
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Solunum Sistemi</Label>
              <Select
                value={form.respiratory_health}
                onValueChange={(v) => set("respiratory_health", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESPIRATORY.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="resnote">Solunum Notu</Label>
              <Input
                id="resnote"
                value={form.respiratory_note}
                onChange={(e) => set("respiratory_note", e.target.value)}
              />
            </div>

            <div>
              <Label>Tırnak / Ayak Sağlığı</Label>
              <Select value={form.hoof_limb_health} onValueChange={(v) => set("hoof_limb_health", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {HOOF.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Meme Sağlığı</Label>
              <Select value={form.udder_health} onValueChange={(v) => set("udder_health", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UDDER.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Gebelik Durumu</Label>
              <Select value={form.pregnancy_status} onValueChange={(v) => set("pregnancy_status", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PREGNANCY.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <Label htmlFor="vac" className="text-sm">
                Aşı kayıtları doğrulandı
              </Label>
              <Switch
                id="vac"
                checked={form.vaccination_verified}
                onCheckedChange={(v) => set("vaccination_verified", v)}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="ticket">Kantar Tartı Fişi Fotoğrafı</Label>
              <Input
                id="ticket"
                type="file"
                accept="image/*"
                className="mt-1"
                onChange={(e) => setTicket(e.target.files?.[0] ?? null)}
              />
            </div>

            <div className="sm:col-span-2">
              <Label htmlFor="notes">Veteriner Notu</Label>
              <Textarea
                id="notes"
                rows={3}
                value={form.vet_notes}
                onChange={(e) => set("vet_notes", e.target.value)}
                placeholder="Hayvanın genel durumu, gözlemler ve öneriler…"
              />
            </div>

            <div className="sm:col-span-2">
              <Button type="submit" disabled={saving}>
                {saving ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-4" aria-hidden />
                )}
                Raporu Kaydet
              </Button>
            </div>
          </form>
        ) : null}

        {tab === "tasks" ? (
          <section className="mt-8">
            <h2 className="font-display text-lg font-bold">Görev Listesi</h2>
            {listingsLoading ? (
              <p className="mt-2 text-sm text-muted-foreground">Yükleniyor…</p>
            ) : tasks.length === 0 ? (
              <p className="mt-2 text-sm text-muted-foreground">
                Ekspertiz bekleyen ilan yok. Tüm görevler tamamlandı.
              </p>
            ) : (
              <ul className="mt-3 grid gap-3">
                {tasks.map((l) => {
                  const draft = reportByListing.get(l.id);
                  return (
                    <li
                      key={l.id}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{l.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Küpe No: {l.ear_tag_number} · {l.breed} · {ageLabel(l.age_months)}
                        </p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MapPin className="size-3" aria-hidden />
                            {l.city}
                            {l.district ? `, ${l.district}` : ""}
                          </span>
                          <span>· {formatTRY(l.total_price)}</span>
                          <span className="rounded-full bg-muted px-2 py-0.5">
                            {STATUS_LABELS[l.status] ?? l.status}
                          </span>
                          {draft ? (
                            <span className="rounded-full bg-warning px-2 py-0.5 text-warning-foreground">
                              Rapor onay bekliyor
                            </span>
                          ) : null}
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="secondary" size="sm" asChild>
                          <Link to="/ilan/$id" params={{ id: l.id }}>
                            İlanı Gör
                          </Link>
                        </Button>
                        {draft ? (
                          <Button
                            size="sm"
                            disabled={approving === draft.id}
                            onClick={() => void approveReport(draft)}
                          >
                            {approving === draft.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                              <BadgeCheck className="size-4" aria-hidden />
                            )}
                            Raporu Onayla
                          </Button>
                        ) : (
                          <Button size="sm" onClick={() => openForm(l)}>
                            <ClipboardList className="size-4" aria-hidden /> Ekspertiz Yap
                          </Button>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        ) : (
          <section className="mt-8 space-y-5">
            <h2 className="font-display text-lg font-bold">Raporlarım</h2>
            {reportsLoading ? (
              <p className="text-sm text-muted-foreground">Yükleniyor…</p>
            ) : (inspections ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz düzenlenmiş raporunuz yok.</p>
            ) : (
              (inspections ?? []).map((r) => {
                const listing = (listings ?? []).find((l) => l.id === r.listing_id);
                return (
                  <div key={r.id} className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-sm text-muted-foreground">
                        {listing ? listing.title : "İlan"} · {formatDate(r.inspection_date)}
                      </p>
                      <div className="flex gap-2">
                        {listing ? (
                          <Button variant="secondary" size="sm" asChild>
                            <Link to="/ilan/$id" params={{ id: r.listing_id }}>
                              İlana Git
                            </Link>
                          </Button>
                        ) : null}
                        {!r.is_approved ? (
                          <Button
                            size="sm"
                            disabled={approving === r.id}
                            onClick={() => void approveReport(r)}
                          >
                            {approving === r.id ? (
                              <Loader2 className="size-4 animate-spin" aria-hidden />
                            ) : (
                              <BadgeCheck className="size-4" aria-hidden />
                            )}
                            Raporu Onayla
                          </Button>
                        ) : null}
                      </div>
                    </div>
                    <VetReportCard inspection={r} />
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>
    </div>
  );
}
