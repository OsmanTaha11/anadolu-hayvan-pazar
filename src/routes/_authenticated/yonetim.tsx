import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  BadgeCheck,
  ClipboardList,
  Loader2,
  ShieldCheck,
  Users,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

import { SiteHeader } from "@/components/site-header";
import { VetReportCard } from "@/components/vet-report-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import {
  ROLE_LABELS,
  STATUS_LABELS,
  formatDate,
  formatTRY,
  type Listing,
  type VetInspection,
} from "@/lib/marketplace";

const LISTING_STATUSES = [
  "draft",
  "active",
  "inspection_pending",
  "inspected",
  "sold",
] as const;

type ListingStatus = (typeof LISTING_STATUSES)[number];

type Profile = {
  id: string;
  full_name: string;
  phone_number: string | null;
  city: string | null;
  district: string | null;
  is_verified: boolean;
  created_at: string;
};

export const Route = createFileRoute("/_authenticated/yonetim")({
  head: () => ({
    meta: [
      { title: "Yönetim Paneli — ÇiftlikPazar" },
      {
        name: "description",
        content:
          "Kullanıcıları onaylayın, ilanları ve veteriner ekspertizlerini tek ekrandan izleyin, rapor reddedin ve ilan durumunu güncelleyin.",
      },
      { property: "og:title", content: "Yönetim Paneli — ÇiftlikPazar" },
      {
        property: "og:description",
        content: "Kullanıcı onayı, ilan durumu yönetimi ve ekspertiz denetimi tek panelde.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const { role } = useSession();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"users" | "listings" | "reports">("listings");
  const [busy, setBusy] = useState<string | null>(null);
  const [openReport, setOpenReport] = useState<string | null>(null);

  const isAdmin = role === "admin";

  const { data: profiles, isLoading: profilesLoading } = useQuery({
    queryKey: ["admin-profiles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Profile[];
    },
  });

  const { data: roles } = useQuery({
    queryKey: ["admin-roles"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("user_id, role");
      if (error) throw error;
      return (data ?? []) as { user_id: string; role: string }[];
    },
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["admin-listings"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Listing[];
    },
  });

  const { data: inspections, isLoading: reportsLoading } = useQuery({
    queryKey: ["admin-inspections"],
    enabled: isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("vet_inspections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as VetInspection[];
    },
  });

  const roleByUser = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of roles ?? []) map.set(r.user_id, r.role);
    return map;
  }, [roles]);

  const listingById = useMemo(() => {
    const map = new Map<string, Listing>();
    for (const l of listings ?? []) map.set(l.id, l);
    return map;
  }, [listings]);

  const stats = useMemo(
    () => ({
      users: (profiles ?? []).length,
      pendingUsers: (profiles ?? []).filter((p) => !p.is_verified).length,
      listings: (listings ?? []).length,
      pendingListings: (listings ?? []).filter((l) => l.status === "inspection_pending").length,
      reports: (inspections ?? []).length,
      approvedReports: (inspections ?? []).filter((r) => r.is_approved).length,
    }),
    [profiles, listings, inspections],
  );

  const setVerified = async (profile: Profile, value: boolean) => {
    setBusy(profile.id);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_verified: value })
        .eq("id", profile.id);
      if (error) throw error;
      toast.success(value ? "Kullanıcı onaylandı." : "Kullanıcı onayı kaldırıldı.");
      await queryClient.invalidateQueries({ queryKey: ["admin-profiles"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setBusy(null);
    }
  };

  const updateStatus = async (listing: Listing, status: string) => {
    setBusy(listing.id);
    try {
      const { error } = await supabase
        .from("listings")
        .update({ status: status as ListingStatus })
        .eq("id", listing.id);
      if (error) throw error;
      toast.success(`İlan durumu güncellendi: ${STATUS_LABELS[status] ?? status}`);
      await queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
      await queryClient.invalidateQueries({ queryKey: ["reels"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Durum güncellenemedi.");
    } finally {
      setBusy(null);
    }
  };

  /** Approves or rejects a vet report and syncs the linked listing status. */
  const setReportApproval = async (report: VetInspection, approved: boolean) => {
    setBusy(report.id);
    try {
      const { error } = await supabase
        .from("vet_inspections")
        .update({ is_approved: approved })
        .eq("id", report.id);
      if (error) throw error;
      const listing = listingById.get(report.listing_id);
      if (listing) {
        const nextStatus = approved
          ? "inspected"
          : listing.status === "inspected"
            ? "inspection_pending"
            : listing.status;
        if (nextStatus !== listing.status) {
          const { error: linkError } = await supabase
            .from("listings")
            .update({ status: nextStatus as ListingStatus })
            .eq("id", listing.id);
          if (linkError) throw linkError;
        }
      }
      toast.success(approved ? "Rapor onaylandı ve ilana bağlandı." : "Rapor reddedildi.");
      await queryClient.invalidateQueries({ queryKey: ["admin-inspections"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-listings"] });
      await queryClient.invalidateQueries({ queryKey: ["listings"] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "İşlem başarısız.");
    } finally {
      setBusy(null);
    }
  };

  if (role && !isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="mx-auto w-full max-w-2xl px-4 py-16 text-center">
          <h1 className="font-display text-2xl font-bold">Yönetim Paneli</h1>
          <p className="mt-3 text-sm text-muted-foreground">
            Bu alan yalnızca yönetici hesaplarına açıktır.
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
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ShieldCheck className="size-5" aria-hidden />
          </span>
          <div>
            <h1 className="font-display text-2xl font-bold">Yönetim Paneli</h1>
            <p className="text-sm text-muted-foreground">
              Kullanıcı onayları, ilan durumları ve veteriner ekspertizleri tek ekranda.
            </p>
          </div>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {[
            { label: "Kullanıcı", value: stats.users, hint: `${stats.pendingUsers} onay bekliyor` },
            {
              label: "İlan",
              value: stats.listings,
              hint: `${stats.pendingListings} ekspertiz bekliyor`,
            },
            {
              label: "Ekspertiz",
              value: stats.reports,
              hint: `${stats.approvedReports} onaylı`,
            },
          ].map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <dt className="text-xs uppercase tracking-wide text-muted-foreground">{s.label}</dt>
              <dd className="font-display text-2xl font-bold">{s.value}</dd>
              <p className="text-xs text-muted-foreground">{s.hint}</p>
            </div>
          ))}
        </dl>

        <div className="mt-6 inline-flex flex-wrap rounded-lg border border-border bg-card p-1">
          <Button
            variant={tab === "listings" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("listings")}
          >
            <ClipboardList className="size-4" aria-hidden /> İlanlar
          </Button>
          <Button
            variant={tab === "reports" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("reports")}
          >
            <BadgeCheck className="size-4" aria-hidden /> Ekspertizler
          </Button>
          <Button
            variant={tab === "users" ? "default" : "ghost"}
            size="sm"
            onClick={() => setTab("users")}
          >
            <Users className="size-4" aria-hidden /> Kullanıcılar
          </Button>
        </div>

        {tab === "listings" ? (
          <section className="mt-6 grid gap-3" aria-label="İlan yönetimi">
            {listingsLoading ? (
              <p className="text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden />
                İlanlar yükleniyor...
              </p>
            ) : (listings ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz ilan yok.</p>
            ) : (
              (listings ?? []).map((l) => {
                const report = (inspections ?? []).find((r) => r.listing_id === l.id);
                return (
                  <article
                    key={l.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="text-xs uppercase tracking-wide text-primary">
                        {l.breed} · {l.category} · Küpe {l.ear_tag_number}
                      </p>
                      <h2 className="truncate font-semibold">{l.title}</h2>
                      <p className="text-sm text-muted-foreground">
                        {l.seller_name || "Satıcı"} · {l.city}
                        {l.district ? ` / ${l.district}` : ""} · {formatTRY(l.total_price)} ·{" "}
                        {formatDate(l.created_at)}
                        {report?.is_approved ? " · Veteriner onaylı" : ""}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Select
                        value={l.status}
                        onValueChange={(v) => void updateStatus(l, v)}
                        disabled={busy === l.id}
                      >
                        <SelectTrigger className="w-48" aria-label="İlan durumu">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {LISTING_STATUSES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {STATUS_LABELS[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" size="sm" asChild>
                        <Link to="/ilan/$id" params={{ id: l.id }}>
                          Gör
                        </Link>
                      </Button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        ) : null}

        {tab === "reports" ? (
          <section className="mt-6 grid gap-3" aria-label="Ekspertiz denetimi">
            {reportsLoading ? (
              <p className="text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden />
                Raporlar yükleniyor...
              </p>
            ) : (inspections ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Henüz ekspertiz raporu yok.</p>
            ) : (
              (inspections ?? []).map((r) => {
                const listing = listingById.get(r.listing_id);
                return (
                  <article key={r.id} className="rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-wide text-primary">
                          {r.is_approved ? "Onaylı rapor" : "Onay bekliyor"} ·{" "}
                          {formatDate(r.inspection_date)}
                        </p>
                        <h2 className="truncate font-semibold">
                          {listing?.title ?? "İlan bulunamadı"}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                          {r.vet_name} · {r.vet_license_no ?? "Lisans yok"} ·{" "}
                          {r.verified_weight_kg ? `${Number(r.verified_weight_kg)} kg` : "Tartı yok"}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOpenReport(openReport === r.id ? null : r.id)}
                        >
                          {openReport === r.id ? "Gizle" : "Raporu Gör"}
                        </Button>
                        {r.is_approved ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={busy === r.id}
                            onClick={() => void setReportApproval(r, false)}
                          >
                            <XCircle className="size-4" aria-hidden /> Reddet
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            disabled={busy === r.id}
                            onClick={() => void setReportApproval(r, true)}
                          >
                            <BadgeCheck className="size-4" aria-hidden /> Onayla
                          </Button>
                        )}
                      </div>
                    </div>
                    {openReport === r.id ? (
                      <div className="mt-4">
                        <VetReportCard inspection={r} />
                      </div>
                    ) : null}
                  </article>
                );
              })
            )}
          </section>
        ) : null}

        {tab === "users" ? (
          <section className="mt-6 grid gap-3" aria-label="Kullanıcı onayları">
            {profilesLoading ? (
              <p className="text-sm text-muted-foreground">
                <Loader2 className="mr-2 inline size-4 animate-spin" aria-hidden />
                Kullanıcılar yükleniyor...
              </p>
            ) : (profiles ?? []).length === 0 ? (
              <p className="text-sm text-muted-foreground">Kayıtlı kullanıcı yok.</p>
            ) : (
              (profiles ?? []).map((p) => {
                const r = roleByUser.get(p.id);
                return (
                  <article
                    key={p.id}
                    className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <h2 className="truncate font-semibold">{p.full_name || "İsimsiz kullanıcı"}</h2>
                      <p className="text-sm text-muted-foreground">
                        {r ? ROLE_LABELS[r] : "Rol yok"} · {p.phone_number ?? "Telefon yok"} ·{" "}
                        {p.city ?? "Şehir yok"}
                        {p.district ? ` / ${p.district}` : ""} · {formatDate(p.created_at)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                          p.is_verified
                            ? "bg-verified/15 text-verified"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {p.is_verified ? "Onaylı" : "Onay bekliyor"}
                      </span>
                      <Button
                        variant={p.is_verified ? "outline" : "default"}
                        size="sm"
                        disabled={busy === p.id}
                        onClick={() => void setVerified(p, !p.is_verified)}
                      >
                        {p.is_verified ? "Onayı Kaldır" : "Onayla"}
                      </Button>
                    </div>
                  </article>
                );
              })
            )}
          </section>
        ) : null}
      </main>
    </div>
  );
}
