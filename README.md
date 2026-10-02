# Anadolu Hayvan Pazarı

Build a modern, mobile-first, and highly secure digital livestock marketplace (MVP) designed for cattle trading with veterinary verification in Turkey. The stack should use Next.js / React, Tailwind CSS, Lucide Icons, and Supabase for authentication, database, and storage.

### 1. USER ROLES & AUTHENTICATION

Create Supabase auth with role-based profiles (`profiles` table linked to `auth.users`):

- `buyer` (Alıcı): Can browse listings, filter, view vet reports, submit purchase/escrow requests.

- `seller` (Üretici / Satıcı): Can create listings with ear-tag numbers, manage inventory, view offers.

- `vet` (Veteriner Hekim): Has a specialized mobile dashboard to perform on-farm health inspections.

- `admin`: Full platform overview, user approval, commission monitoring.

### 2. DATABASE SCHEMA & SECURITY (SUPABASE)

Ensure PostgreSQL Row Level Security (RLS) is strictly enabled on all tables:

1. `profiles`: `id` (UUID, references auth.users), `role` (enum: buyer, seller, vet, admin), `full_name`, `phone_number`, `city`, `district`, `is_verified` (boolean), `created_at`.

2. `listings` (İlanlar):

   - `id`, `seller_id` (UUID), `title`, `breed` (Irk: Simental, Montofon, Holstein, Şarole, Yerli Kara vb.), `category` (Besi Danası, Damızlık Düve, Süt İneği, Buzağı), `ear_tag_number` (Kulak Küpe No), `birth_date` (or age in months), `head_count` (Adet), `estimated_weight_kg` (Canlı Ağırlık), `price_per_head`, `total_price`, `city`, `district`, `description`, `images` (text array), `video_url`, `status` (draft, active, inspection_pending, inspected, sold), `created_at`.

3. `vet_inspections` (Ekspertiz Sağlık Raporları):

   - `id`, `listing_id` (UUID), `vet_id` (UUID), `inspection_date`, `verified_weight_kg`, `scale_ticket_photo_url`, `general_condition_score` (1-5), `respiratory_health` (Normal/Anormal + not), `hoof_limb_health` (Tırnak/Ayak durumu), `udder_health` (Meme sağlığı), `vaccination_verified` (Boolean), `pregnancy_status` (Gebe / Boş / Uygulanamaz), `vet_notes`, `is_approved` (Boolean), `created_at`.

4. `escrow_orders` (Güvenli İşlemler):

   - `id`, `listing_id`, `buyer_id`, `seller_id`, `total_amount`, `deposit_amount`, `status` (deposit_pending, deposit_locked, vet_approved, transport_started, completed, cancelled), `virtual_iban`, `created_at`.

### 3. CORE APPLICATION SCREENS & WORKFLOWS

**A. Homepage & Marketplace (Vitrin):**

- Modern hero section emphasizing "Veteriner Onaylı, Güvenli Hayvan Pazarı".

- Search & Filter bar: Filter by Breed (Irk), Purpose (Besi / Damızlık), Head Count, City, Weight range, and "Sadece Veteriner Onaylılar" badge toggle.

- Listing Cards: Show ear tag badge, breed, verified weight (if inspected), verified vet badge (Green Shield), location, price, and clean photo/video thumbnail.

**B. Listing Detail Page:**

- Photo gallery + Video player.

- Technical Specs: Ear tag number, breed, age, estimated/verified weight.

- **Veterinary Health Certificate Card (Ekspertiz Raporu):** If verified, render an interactive, clean medical inspection card showing vet's name, license number, inspection date, scale ticket image, and checklist items with green checkmarks.

- "Güvenli Alım / Ekspertiz Talep Et" primary CTA button.

**C. Seller Panel (İlan Ekleme & Yönetim):**

- Simple step-by-step form to add animals: Küpe No, Irk, Adet, Kilo, Konum, Fotoğraf ve Video yükleme.

- Status tracker: Shows whether a local vet has been assigned or visited.

**D. Mobile Vet Dashboard (Saha Ekspertiz Paneli):**

- Optimized for mobile screens in the field.

- List of assigned inspection tasks.

- Quick 2-minute digital inspection form with large touch-friendly toggles (Genel Sağlık, Solunum, Tırnak, Aşı, Gebelik, Tartım Fişi Yükleme, 360° Video Ekleme) and a final "Onayla ve Mühürle" button.

### 4. UI/UX & LOCALIZATION

- Turkish UI labels, professional agro-tech branding (clean emerald/slate palette, high contrast for outdoor sunlight visibility).

- Mock data: Populate with 6-8 realistic Turkish cattle listings (e.g. Simental Besi Danası in Konya/Karaman, Holstein Düve in Balıkesir) with realistic ear-tag formats (TR70XXXXX) and sample vet reports.

- Keep the design responsive, fast, and accessible for farmers using mobile phones.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/224a46be-d3dc-486d-9888-51ec4aacf810).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
