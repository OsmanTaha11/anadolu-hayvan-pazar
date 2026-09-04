import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2 } from "lucide-react";

import { ReelItem } from "@/components/reel-item";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import type { Listing, VetInspection } from "@/lib/marketplace";

export const Route = createFileRoute("/kesfet")({
  head: () => ({
    meta: [
      { title: "Keşfet (Reels) — ÇiftlikPazar Canlı Hayvan Videoları" },
      {
        name: "description",
        content:
          "Besilik ve damızlık sığırların dikey tanıtım videolarını kaydırarak izleyin. Veteriner onaylı ekspertiz, doğrulanmış ağırlık ve anında iletişim.",
      },
      { property: "og:title", content: "Keşfet (Reels) — ÇiftlikPazar" },
      {
        property: "og:description",
        content: "Hayvanların yürüyüşünü ve beden yapısını dikey videolarla inceleyin.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ReelsPage,
});

function ReelsPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [muted, setMuted] = useState(true);

  const { data, isLoading } = useQuery({
    queryKey: ["reels"],
    queryFn: async () => {
      const [listingsRes, inspectionsRes] = await Promise.all([
        supabase
          .from("listings")
          .select("*")
          .in("status", ["active", "inspection_pending", "inspected", "sold"])
          .not("reels_video_url", "is", null)
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

  const listings = data?.listings ?? [];

  // Track the reel filling the viewport so only that one plays.
  const onScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const idx = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex((prev) => (prev === idx ? prev : idx));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    let raf = 0;
    const handler = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(onScroll);
    };
    el.addEventListener("scroll", handler, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener("scroll", handler);
    };
  }, [onScroll, listings.length]);

  return (
    <div className="fixed inset-0 bg-black">
      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-4">
        <Button
          asChild
          variant="ghost"
          size="icon"
          className="pointer-events-auto rounded-full bg-black/45 text-white ring-1 ring-white/20 backdrop-blur hover:bg-black/60 hover:text-white"
        >
          <Link to="/" aria-label="İlanlara dön">
            <ArrowLeft className="size-5" aria-hidden />
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="flex h-full items-center justify-center text-white">
          <Loader2 className="size-6 animate-spin" aria-hidden />
          <span className="sr-only">Videolar yükleniyor</span>
        </div>
      ) : listings.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center gap-4 px-8 text-center text-white">
          <h1 className="font-display text-xl font-bold">Henüz dikey video yok</h1>
          <p className="text-sm text-white/80">
            Üreticiler ilanlarına 9:16 formatında tanıtım videosu ekledikçe burada görünecek.
          </p>
          <Button asChild>
            <Link to="/">İlanlara Göz At</Link>
          </Button>
        </div>
      ) : (
        <div
          ref={containerRef}
          className="h-full w-full snap-y snap-mandatory overflow-y-scroll overscroll-y-contain scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          <h1 className="sr-only">Keşfet — Canlı hayvan videoları</h1>
          {listings.map((listing, i) => (
            <ReelItem
              key={listing.id}
              listing={listing}
              inspection={inspectionByListing.get(listing.id)}
              active={i === activeIndex}
              muted={muted}
              onToggleMute={() => setMuted((m) => !m)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
