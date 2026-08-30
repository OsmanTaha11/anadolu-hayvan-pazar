-- ROLES
CREATE TYPE public.app_role AS ENUM ('buyer','seller','vet','admin');
CREATE TYPE public.listing_status AS ENUM ('draft','active','inspection_pending','inspected','sold');
CREATE TYPE public.escrow_status AS ENUM ('deposit_pending','deposit_locked','vet_approved','transport_started','completed','cancelled');

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone_number TEXT,
  city TEXT,
  district TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE POLICY "profiles_select_own" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = id OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles_select_own" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));

-- new user handler
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE r public.app_role;
BEGIN
  INSERT INTO public.profiles (id, full_name, phone_number, city, district)
  VALUES (NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name',''),
    NEW.raw_user_meta_data->>'phone_number',
    NEW.raw_user_meta_data->>'city',
    NEW.raw_user_meta_data->>'district');
  BEGIN
    r := COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'buyer');
  EXCEPTION WHEN others THEN r := 'buyer';
  END;
  IF r = 'admin' THEN r := 'buyer'; END IF;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, r)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- LISTINGS
CREATE TABLE public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID,
  seller_name TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL,
  breed TEXT NOT NULL,
  category TEXT NOT NULL,
  ear_tag_number TEXT NOT NULL,
  birth_date DATE,
  age_months INTEGER,
  head_count INTEGER NOT NULL DEFAULT 1,
  estimated_weight_kg NUMERIC(8,2),
  price_per_head NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(14,2) NOT NULL,
  city TEXT NOT NULL,
  district TEXT,
  description TEXT,
  images TEXT[] NOT NULL DEFAULT '{}',
  video_url TEXT,
  status public.listing_status NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.listings TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_public_read" ON public.listings FOR SELECT TO anon, authenticated
  USING (status IN ('active','inspection_pending','inspected','sold'));
CREATE POLICY "listings_owner_read" ON public.listings FOR SELECT TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'vet'));
CREATE POLICY "listings_owner_insert" ON public.listings FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = seller_id AND public.has_role(auth.uid(),'seller'));
CREATE POLICY "listings_owner_update" ON public.listings FOR UPDATE TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = seller_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "listings_owner_delete" ON public.listings FOR DELETE TO authenticated
  USING (auth.uid() = seller_id OR public.has_role(auth.uid(),'admin'));

-- VET INSPECTIONS
CREATE TABLE public.vet_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  vet_id UUID,
  vet_name TEXT NOT NULL DEFAULT '',
  vet_license_no TEXT,
  inspection_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verified_weight_kg NUMERIC(8,2),
  scale_ticket_photo_url TEXT,
  general_condition_score INTEGER CHECK (general_condition_score BETWEEN 1 AND 5),
  respiratory_health TEXT,
  respiratory_note TEXT,
  hoof_limb_health TEXT,
  udder_health TEXT,
  vaccination_verified BOOLEAN NOT NULL DEFAULT false,
  pregnancy_status TEXT,
  vet_notes TEXT,
  video_360_url TEXT,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.vet_inspections TO anon;
GRANT SELECT, INSERT, UPDATE ON public.vet_inspections TO authenticated;
GRANT ALL ON public.vet_inspections TO service_role;
ALTER TABLE public.vet_inspections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "inspections_public_read" ON public.vet_inspections FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.listings l WHERE l.id = listing_id AND l.status IN ('active','inspection_pending','inspected','sold')));
CREATE POLICY "inspections_vet_read" ON public.vet_inspections FOR SELECT TO authenticated
  USING (auth.uid() = vet_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "inspections_vet_insert" ON public.vet_inspections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = vet_id AND public.has_role(auth.uid(),'vet'));
CREATE POLICY "inspections_vet_update" ON public.vet_inspections FOR UPDATE TO authenticated
  USING (auth.uid() = vet_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = vet_id OR public.has_role(auth.uid(),'admin'));

-- ESCROW
CREATE TABLE public.escrow_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID,
  total_amount NUMERIC(14,2) NOT NULL,
  deposit_amount NUMERIC(14,2) NOT NULL,
  status public.escrow_status NOT NULL DEFAULT 'deposit_pending',
  virtual_iban TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.escrow_orders TO authenticated;
GRANT ALL ON public.escrow_orders TO service_role;
ALTER TABLE public.escrow_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "escrow_party_read" ON public.escrow_orders FOR SELECT TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "escrow_buyer_insert" ON public.escrow_orders FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "escrow_party_update" ON public.escrow_orders FOR UPDATE TO authenticated
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(),'admin'));

-- DEMO DATA
INSERT INTO public.listings (id, seller_name, title, breed, category, ear_tag_number, age_months, head_count, estimated_weight_kg, price_per_head, total_price, city, district, description, images, status) VALUES
('11111111-1111-4111-8111-000000000001','Konya Besi Çiftliği','Simental Besi Danası - 12 Baş Grup','Simental','Besi Danası','TR7042318',14,12,420,72000,864000,'Konya','Karatay','Kapalı ahırda arpa-mısır rasyonu ile beslenmiş, günlük ortalama 1.5 kg canlı ağırlık artışı olan sağlıklı besi danaları.','{"/images/simental-besi.jpg"}','inspected'),
('11111111-1111-4111-8111-000000000002','Balıkesir Süt Hayvancılık','Holstein Damızlık Düve - Gebe','Holstein','Damızlık Düve','TR1058874',24,6,520,96000,576000,'Balıkesir','Bigadiç','Suni tohumlama ile 5 aylık gebe, soy kütüğü kayıtlı Holstein düveler. Anne süt verimi 38 lt/gün.','{"/images/holstein-duve.jpg"}','inspected'),
('11111111-1111-4111-8111-000000000003','Karaman Tarım İşletmesi','Montofon Besi Danası','Montofon','Besi Danası','TR7011209',11,20,350,61500,1230000,'Karaman','Merkez','Aşıları tam, küpeleri kayıtlı, mera + kesif yem ile beslenen grup hayvanlar.','{"/images/montofon-dana.jpg"}','active'),
('11111111-1111-4111-8111-000000000004','Erzurum Damızlık Merkezi','Şarole Besi Tosunu','Şarole','Besi Danası','TR2503341',16,8,480,88000,704000,'Erzurum','Pasinler','Yüksek karkas randımanlı Şarole tosunlar, yem dönüşüm oranı yüksek.','{"/images/sarole-tosun.jpg"}','inspection_pending'),
('11111111-1111-4111-8111-000000000005','Ege Süt Çiftliği','Holstein Süt İneği - 2. Laktasyon','Holstein','Süt İneği','TR3577120',42,4,610,105000,420000,'İzmir','Ödemiş','Günlük 32 litre süt veren, mastitis geçmişi olmayan sağlıklı süt inekleri.','{"/images/holstein-inek.jpg"}','inspected'),
('11111111-1111-4111-8111-000000000006','Sivas Yerli Irk Üreticisi','Yerli Kara Besi Danası','Yerli Kara','Besi Danası','TR5809932',13,15,290,49000,735000,'Sivas','Zara','Meraya dayanıklı, hastalığa dirençli yerli kara ırkı besi danaları.','{"/images/yerli-kara.jpg"}','active'),
('11111111-1111-4111-8111-000000000007','Bursa Buzağı Üretim','Simental Buzağı Grubu','Simental','Buzağı','TR1633045',4,25,140,28000,700000,'Bursa','Karacabey','Kolostrum programı uygulanmış, ishal ve solunum problemi olmayan buzağılar.','{"/images/simental-buzagi.jpg"}','active'),
('11111111-1111-4111-8111-000000000008','Aydın Damızlık Düve','Montofon Damızlık Düve','Montofon','Damızlık Düve','TR0944871',22,10,470,84000,840000,'Aydın','Söke','Tohumlamaya hazır, ideal vücut kondisyon skoruna sahip damızlık düveler.','{"/images/montofon-duve.jpg"}','inspected');

INSERT INTO public.vet_inspections (listing_id, vet_name, vet_license_no, inspection_date, verified_weight_kg, scale_ticket_photo_url, general_condition_score, respiratory_health, respiratory_note, hoof_limb_health, udder_health, vaccination_verified, pregnancy_status, vet_notes, is_approved) VALUES
('11111111-1111-4111-8111-000000000001','Vet. Hek. Mehmet Aydın','TVHB-42-10877','2026-08-24',428,'/images/tarti-fisi.jpg',5,'Normal','Oskültasyonda patolojik ses yok','Normal','Uygulanamaz',true,'Uygulanamaz','Grup homojen, kondisyon iyi. Şap ve enterotoksemi aşıları kayıtlı.',true),
('11111111-1111-4111-8111-000000000002','Vet. Hek. Zeynep Korkmaz','TVHB-10-33421','2026-08-26',515,'/images/tarti-fisi.jpg',5,'Normal','Normal','Normal','Sağlıklı',true,'Gebe','Rektal muayenede 5 aylık gebelik doğrulandı. Meme dokusu sağlıklı.',true),
('11111111-1111-4111-8111-000000000005','Vet. Hek. Ali Şahin','TVHB-35-77310','2026-08-20',604,'/images/tarti-fisi.jpg',4,'Normal','Normal','Hafif tırnak uzaması','Sağlıklı - CMT negatif',true,'Boş','Süt verimi ve meme sağlığı iyi. Tırnak bakımı önerilir.',true),
('11111111-1111-4111-8111-000000000008','Vet. Hek. Fatma Demir','TVHB-09-55214','2026-08-28',462,'/images/tarti-fisi.jpg',5,'Normal','Normal','Normal','Sağlıklı',true,'Boş','Damızlık için uygun, brusella ve tüberküloz testleri negatif.',true);