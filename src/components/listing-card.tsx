import { Link } from "@tanstack/react-router";
import { MapPin, Scale, Tag, Layers } from "lucide-react";

import { VerifiedBadge } from "@/components/verified-badge";
import { formatTRY, type Listing, type VetInspection } from "@/lib/marketplace";

export function ListingCard({
  listing,
  inspection,
}: {
  listing: Listing;
  inspection?: VetInspection | undefined;
}) {
  const verified = Boolean(inspection?.is_approved);
  const weight = verified ? inspection?.verified_weight_kg : listing.estimated_weight_kg;

  return (
    <Link
      to="/ilan/$id"
      params={{ id: listing.id }}
      className="group surface-panel flex flex-col overflow-hidden transition-shadow hover:shadow-lift focus-visible:outline-2 focus-visible:outline-ring"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-muted">
        <img
          src={listing.images[0] ?? "/images/simental-besi.jpg"}
          alt={`${listing.breed} ${listing.category} - ${listing.city}`}
          loading="lazy"
          width={1024}
          height={768}
          className="size-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-secondary/90 px-2.5 py-1 text-xs font-medium text-secondary-foreground">
            <Tag className="size-3.5" aria-hidden />
            {listing.ear_tag_number}
          </span>
          {verified ? <VerifiedBadge /> : null}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">
            {listing.breed} · {listing.category}
          </p>
          <h3 className="mt-1 line-clamp-2 text-base font-semibold">{listing.title}</h3>
        </div>

        <dl className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Layers className="size-4" aria-hidden />
            <span>{listing.head_count} baş</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Scale className="size-4" aria-hidden />
            <span>
              {weight ? `${Number(weight)} kg` : "-"}
              {verified ? " ✓" : ""}
            </span>
          </div>
          <div className="col-span-2 flex items-center gap-1.5">
            <MapPin className="size-4" aria-hidden />
            <span>
              {listing.city}
              {listing.district ? ` / ${listing.district}` : ""}
            </span>
          </div>
        </dl>

        <div className="mt-auto flex items-end justify-between border-t border-border pt-3">
          <div>
            <p className="text-xs text-muted-foreground">Baş fiyatı</p>
            <p className="font-display text-lg font-bold">{formatTRY(listing.price_per_head)}</p>
          </div>
          <p className="text-sm font-medium text-muted-foreground">
            Toplam {formatTRY(listing.total_price)}
          </p>
        </div>
      </div>
    </Link>
  );
}
