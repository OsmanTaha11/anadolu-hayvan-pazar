export const BREEDS = [
  "Simental",
  "Montofon",
  "Holstein",
  "Şarole",
  "Yerli Kara",
  "Angus",
  "Jersey",
] as const;

export const CATEGORIES = [
  "Besi Danası",
  "Damızlık Düve",
  "Süt İneği",
  "Buzağı",
] as const;

export const CITIES = [
  "Konya",
  "Karaman",
  "Balıkesir",
  "Erzurum",
  "İzmir",
  "Sivas",
  "Bursa",
  "Aydın",
  "Ankara",
  "Kayseri",
] as const;

export const PURPOSES = ["Besi", "Damızlık"] as const;

export const STATUS_LABELS: Record<string, string> = {
  draft: "Taslak",
  active: "Yayında",
  inspection_pending: "Ekspertiz Bekliyor",
  inspected: "Veteriner Onaylı",
  sold: "Satıldı",
};

export const ESCROW_LABELS: Record<string, string> = {
  deposit_pending: "Kapora Bekleniyor",
  deposit_locked: "Kapora Bloke Edildi",
  vet_approved: "Veteriner Onayladı",
  transport_started: "Sevkiyat Başladı",
  completed: "Tamamlandı",
  cancelled: "İptal Edildi",
};

export const ROLE_LABELS: Record<string, string> = {
  buyer: "Alıcı",
  seller: "Üretici (Alım + Satım)",
  vet: "Veteriner Hekim",
  admin: "Yönetici",
};

export function formatTRY(value: number | string | null | undefined) {
  const n = Number(value ?? 0);
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "long" }).format(new Date(value));
}

export function ageLabel(months: number | null | undefined) {
  if (!months) return "-";
  if (months < 12) return `${months} aylık`;
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} yaş ${m} ay` : `${y} yaş`;
}

export function purposeOf(category: string) {
  return category === "Besi Danası" || category === "Buzağı" ? "Besi" : "Damızlık";
}

export type Listing = {
  id: string;
  seller_id: string | null;
  seller_name: string;
  title: string;
  breed: string;
  category: string;
  ear_tag_number: string;
  birth_date: string | null;
  age_months: number | null;
  head_count: number;
  estimated_weight_kg: number | null;
  price_per_head: number;
  total_price: number;
  city: string;
  district: string | null;
  description: string | null;
  images: string[];
  video_url: string | null;
  reels_video_url: string | null;
  thumbnail_url: string | null;
  seller_phone: string | null;
  status: string;
  created_at: string;
};

export type VetInspection = {
  id: string;
  listing_id: string;
  vet_id: string | null;
  vet_name: string;
  vet_license_no: string | null;
  inspection_date: string;
  verified_weight_kg: number | null;
  scale_ticket_photo_url: string | null;
  general_condition_score: number | null;
  respiratory_health: string | null;
  respiratory_note: string | null;
  hoof_limb_health: string | null;
  udder_health: string | null;
  vaccination_verified: boolean;
  pregnancy_status: string | null;
  vet_notes: string | null;
  video_360_url: string | null;
  is_approved: boolean;
  created_at: string;
};
