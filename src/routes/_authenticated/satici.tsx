import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Clapperboard, Loader2, Upload } from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { uploadReel } from "@/lib/reel-upload";
import {
  MAX_REEL_MB,
  MAX_REEL_SECONDS,
  readVideoMeta,
  validateReel,
  type VideoMeta,
} from "@/lib/video";
import {
  BREEDS,
  CATEGORIES,
  CITIES,
  STATUS_LABELS,
  formatTRY,
  type Listing,
} from "@/lib/marketplace";


export const Route = createFileRoute("/_authenticated/satici")({
  head: () => ({
    meta: [
      { title: "Satıcı Paneli — ÇiftlikPazar" },
      {
        name: "description",
        content:
          "İlanlarınızı yönetin, hayvan bilgilerini girin ve 9:16 dikey tanıtım videosu yükleyerek Keşfet akışında yer alın.",
      },
      { property: "og:title", content: "Satıcı Paneli — ÇiftlikPazar" },
      {
        property: "og:description",
        content: "İlan oluşturun ve dikey video ile hayvanınızı öne çıkarın.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SellerPage,
});

const MAX_VIDEO_MB = 60;

function SellerPage() {
  const { user, role } = useSession();
  const queryClient = useQueryClient();
  const [saving, setSaving] = useState(false);
  const [video, setVideo] = useState<File | null>(null);

  const [form, setForm] = useState({
    title: "",
    breed: BREEDS[0] as string,
    category: CATEGORIES[0] as string,
    ear_tag_number: "",
    age_months: "",
    head_count: "1",
    estimated_weight_kg: "",
    price_per_head: "",
    city: CITIES[0] as string,
    district: "",
    seller_phone: "",
    description: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const { data: myListings, isLoading } = useQuery({
    queryKey: ["my-listings", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("seller_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.title || !form.ear_tag_number || !form.price_per_head) {
      toast.error("Başlık, küpe numarası ve fiyat zorunludur.");
      return;
    }
    if (video && video.size > MAX_VIDEO_MB * 1024 * 1024) {
      toast.error(`Video en fazla ${MAX_VIDEO_MB} MB olabilir.`);
      return;
    }
    setSaving(true);
    try {
      let reels: string | null = null;
      if (video) {
        const ext = video.name.split(".").pop()?.toLowerCase() || "mp4";
        const path = `${user.id}/reels/${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from(LISTING_MEDIA_BUCKET)
          .upload(path, video, { contentType: video.type || "video/mp4", upsert: false });
        if (upErr) throw upErr;
        reels = `${STORAGE_PREFIX}${path}`;
      }

      const head = Number(form.head_count) || 1;
      const perHead = Number(form.price_per_head) || 0;
      const { error } = await supabase.from("listings").insert({
        seller_id: user.id,
        seller_name: user.email ?? "",
        title: form.title,
        breed: form.breed,
        category: form.category,
        ear_tag_number: form.ear_tag_number,
        age_months: form.age_months ? Number(form.age_months) : null,
        head_count: head,
        estimated_weight_kg: form.estimated_weight_kg ? Number(form.estimated_weight_kg) : null,
        price_per_head: perHead,
        total_price: perHead * head,
        city: form.city,
        district: form.district || null,
        seller_phone: form.seller_phone || null,
        description: form.description || null,
        reels_video_url: reels,
        status: "inspection_pending",
      });
      if (error) throw error;

      toast.success("İlan oluşturuldu. Veteriner ekspertizi için sıraya alındı.");
      setVideo(null);
      setForm((f) => ({ ...f, title: "", ear_tag_number: "", description: "" }));
      await queryClient.invalidateQueries({ queryKey: ["my-listings", user.id] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İlan kaydedilemedi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold">Satıcı Paneli</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Hayvan bilgilerini eksiksiz girin; ekspertiz sonrası ilanınız &quot;Veteriner Onaylı&quot;
          rozeti alır.
        </p>

        {role !== "seller" ? (
          <p className="mt-4 rounded-lg border border-border bg-muted p-3 text-sm">
            Hesabınız üretici/satıcı olarak tanımlı değil. İlan yayınlamak için satıcı hesabıyla
            giriş yapın.
          </p>
        ) : null}

        <form onSubmit={onSubmit} className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label htmlFor="title">İlan Başlığı</Label>
            <Input id="title" value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="Simental Besi Danası — 12 Baş" />
          </div>

          <div>
            <Label htmlFor="ear">Küpe Numarası</Label>
            <Input id="ear" value={form.ear_tag_number} onChange={(e) => set("ear_tag_number", e.target.value)} placeholder="TR70819234" />
          </div>
          <div>
            <Label htmlFor="phone">İletişim Telefonu</Label>
            <Input id="phone" value={form.seller_phone} onChange={(e) => set("seller_phone", e.target.value)} placeholder="+90 5xx xxx xx xx" />
          </div>

          <div>
            <Label>Irk</Label>
            <Select value={form.breed} onValueChange={(v) => set("breed", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {BREEDS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Kategori</Label>
            <Select value={form.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="age">Yaş (ay)</Label>
            <Input id="age" inputMode="numeric" value={form.age_months} onChange={(e) => set("age_months", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="head">Baş Sayısı</Label>
            <Input id="head" inputMode="numeric" value={form.head_count} onChange={(e) => set("head_count", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="weight">Tahmini Canlı Ağırlık (kg)</Label>
            <Input id="weight" inputMode="numeric" value={form.estimated_weight_kg} onChange={(e) => set("estimated_weight_kg", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="price">Baş Fiyatı (TL)</Label>
            <Input id="price" inputMode="numeric" value={form.price_per_head} onChange={(e) => set("price_per_head", e.target.value)} />
          </div>

          <div>
            <Label>Şehir</Label>
            <Select value={form.city} onValueChange={(v) => set("city", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="district">İlçe</Label>
            <Input id="district" value={form.district} onChange={(e) => set("district", e.target.value)} />
          </div>

          <div className="sm:col-span-2">
            <Label htmlFor="desc">Açıklama</Label>
            <Textarea id="desc" rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </div>

          <div className="sm:col-span-2 rounded-lg border border-dashed border-border bg-muted/40 p-4">
            <Label htmlFor="reels" className="flex items-center gap-2 text-sm font-semibold">
              <Clapperboard className="size-4 text-primary" aria-hidden />
              Dikey Video / Reels Yükle (Maks. 30 saniye)
            </Label>
            <p className="mt-1 text-xs text-muted-foreground">
              Hayvanın yürüyüşünü, tırnaklarını ve beden yapısını net gösterecek 9:16 formatında
              dikey video yükleyin.
            </p>
            <Input
              id="reels"
              type="file"
              accept="video/mp4,video/quicktime,video/webm"
              className="mt-3"
              onChange={(e) => setVideo(e.target.files?.[0] ?? null)}
            />
            {video ? (
              <p className="mt-2 text-xs text-muted-foreground">
                Seçilen dosya: {video.name} ({(video.size / 1024 / 1024).toFixed(1)} MB)
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2 flex flex-wrap gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Upload className="size-4" aria-hidden />}
              İlanı Yayına Gönder
            </Button>
            <Button type="button" variant="secondary" asChild>
              <Link to="/kesfet">Keşfet Akışını Gör</Link>
            </Button>
          </div>
        </form>

        <h2 className="mt-10 font-display text-lg font-bold">İlanlarım</h2>
        {isLoading ? (
          <p className="mt-2 text-sm text-muted-foreground">Yükleniyor…</p>
        ) : (myListings ?? []).length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Henüz ilanınız yok.</p>
        ) : (
          <ul className="mt-3 grid gap-3">
            {(myListings ?? []).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4">
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Küpe No: {l.ear_tag_number} · {STATUS_LABELS[l.status] ?? l.status}
                    {l.reels_video_url ? " · Dikey video yüklü" : " · Dikey video yok"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold">{formatTRY(l.price_per_head)}</span>
                  <Button variant="ghost" asChild>
                    <Link to="/ilan/$id" params={{ id: l.id }}>Görüntüle</Link>
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
