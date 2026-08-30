import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";

import { SiteHeader } from "@/components/site-header";
import { supabase } from "@/integrations/supabase/client";
import { ESCROW_LABELS, formatDate, formatTRY } from "@/lib/marketplace";

export const Route = createFileRoute("/_authenticated/siparislerim")({
  head: () => ({
    meta: [
      { title: "Siparişlerim — ÇiftlikPazar" },
      {
        name: "description",
        content: "Güvenli alım taleplerinizi, kapora durumunuzu ve sevkiyat aşamasını takip edin.",
      },
      { property: "og:title", content: "Siparişlerim — ÇiftlikPazar" },
      { property: "og:description", content: "Kapora ve sevkiyat takibi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OrdersPage,
});

function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["escrow-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("escrow_orders")
        .select("*, listings(title, ear_tag_number, city)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="font-display text-2xl font-bold">Güvenli İşlemlerim</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Kapora tutarı sanal IBAN'da bloke edilir, veteriner onayı ve teslimattan sonra satıcıya
          aktarılır.
        </p>

        {isLoading ? (
          <div className="mt-6 h-40 animate-pulse rounded-xl bg-muted" />
        ) : (data?.length ?? 0) === 0 ? (
          <p className="mt-10 text-center text-muted-foreground">Henüz bir işleminiz yok.</p>
        ) : (
          <ul className="mt-6 space-y-4">
            {data!.map((o) => {
              const listing = o.listings as { title?: string; ear_tag_number?: string } | null;
              return (
                <li key={o.id} className="surface-panel p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold">{listing?.title ?? "İlan"}</p>
                      <p className="text-xs text-muted-foreground">
                        Küpe: {listing?.ear_tag_number ?? "-"} · {formatDate(o.created_at)}
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground">
                      <ShieldCheck className="size-4" aria-hidden />
                      {ESCROW_LABELS[o.status] ?? o.status}
                    </span>
                  </div>
                  <div className="mt-4 grid gap-3 sm:grid-cols-3">
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Toplam</p>
                      <p className="font-semibold">{formatTRY(o.total_amount)}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Kapora</p>
                      <p className="font-semibold">{formatTRY(o.deposit_amount)}</p>
                    </div>
                    <div className="rounded-lg bg-muted p-3">
                      <p className="text-xs text-muted-foreground">Sanal IBAN</p>
                      <p className="truncate font-mono text-sm">{o.virtual_iban ?? "-"}</p>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
}
