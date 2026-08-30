import { BadgeCheck, CheckCircle2, CircleAlert, Stethoscope } from "lucide-react";

import { formatDate, type VetInspection } from "@/lib/marketplace";

function CheckRow({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-border py-3 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="flex items-center gap-1.5 text-right text-sm font-semibold">
        {ok ? (
          <CheckCircle2 className="size-4 text-verified" aria-hidden />
        ) : (
          <CircleAlert className="size-4 text-warning" aria-hidden />
        )}
        {value}
      </span>
    </div>
  );
}

export function VetReportCard({ inspection }: { inspection: VetInspection }) {
  const ok = (v: string | null | undefined) =>
    Boolean(v && /normal|sağlıklı|negatif|uygulanamaz/i.test(v));

  return (
    <section className="surface-panel overflow-hidden" aria-label="Veteriner ekspertiz raporu">
      <header className="flex flex-wrap items-center justify-between gap-3 bg-secondary px-5 py-4 text-secondary-foreground">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-verified text-verified-foreground">
            <Stethoscope className="size-5" aria-hidden />
          </span>
          <div>
            <h2 className="font-display text-base font-bold">Ekspertiz Sağlık Raporu</h2>
            <p className="text-xs opacity-80">
              {inspection.vet_name} · Diploma No: {inspection.vet_license_no ?? "-"}
            </p>
          </div>
        </div>
        {inspection.is_approved ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-verified px-3 py-1.5 text-xs font-semibold text-verified-foreground">
            <BadgeCheck className="size-4" aria-hidden /> Onaylandı ve Mühürlendi
          </span>
        ) : (
          <span className="rounded-full bg-warning px-3 py-1.5 text-xs font-semibold text-warning-foreground">
            Onay Bekliyor
          </span>
        )}
      </header>

      <div className="grid gap-6 p-5 md:grid-cols-2">
        <div>
          <div className="mb-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Muayene Tarihi</p>
              <p className="font-semibold">{formatDate(inspection.inspection_date)}</p>
            </div>
            <div className="rounded-lg bg-accent p-3 text-accent-foreground">
              <p className="text-xs opacity-80">Doğrulanmış Canlı Ağırlık</p>
              <p className="font-display text-lg font-bold">
                {inspection.verified_weight_kg ? `${Number(inspection.verified_weight_kg)} kg` : "-"}
              </p>
            </div>
          </div>

          <CheckRow
            label="Genel Kondisyon Skoru"
            value={`${inspection.general_condition_score ?? "-"} / 5`}
            ok={(inspection.general_condition_score ?? 0) >= 3}
          />
          <CheckRow
            label="Solunum Sistemi"
            value={inspection.respiratory_health ?? "-"}
            ok={ok(inspection.respiratory_health)}
          />
          <CheckRow
            label="Tırnak / Ayak Sağlığı"
            value={inspection.hoof_limb_health ?? "-"}
            ok={ok(inspection.hoof_limb_health)}
          />
          <CheckRow
            label="Meme Sağlığı"
            value={inspection.udder_health ?? "-"}
            ok={ok(inspection.udder_health)}
          />
          <CheckRow
            label="Aşı Kayıtları"
            value={inspection.vaccination_verified ? "Doğrulandı" : "Eksik"}
            ok={inspection.vaccination_verified}
          />
          <CheckRow
            label="Gebelik Durumu"
            value={inspection.pregnancy_status ?? "-"}
            ok={true}
          />
        </div>

        <div className="space-y-4">
          {inspection.scale_ticket_photo_url ? (
            <figure>
              <img
                src={inspection.scale_ticket_photo_url}
                alt="Kantar tartı fişi fotoğrafı"
                loading="lazy"
                width={1024}
                height={768}
                className="w-full rounded-lg border border-border object-cover"
              />
              <figcaption className="mt-2 text-xs text-muted-foreground">
                Kantar tartı fişi — veteriner hekim tarafından yüklendi
              </figcaption>
            </figure>
          ) : null}
          {inspection.respiratory_note ? (
            <p className="text-sm text-muted-foreground">
              <strong className="text-foreground">Solunum notu:</strong> {inspection.respiratory_note}
            </p>
          ) : null}
          {inspection.vet_notes ? (
            <div className="rounded-lg border border-border bg-muted p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Veteriner Notu
              </p>
              <p className="mt-1 text-sm">{inspection.vet_notes}</p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}
