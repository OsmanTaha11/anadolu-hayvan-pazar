ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS reels_video_url TEXT,
  ADD COLUMN IF NOT EXISTS thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS seller_phone TEXT;

UPDATE public.listings SET reels_video_url = '/__l5e/assets-v1/b96c6977-ebdb-463b-8884-b184f6b829f5/reel1.mp4', thumbnail_url = '/__l5e/assets-v1/55b2df02-f6be-40a5-9cec-37b44a96f7bd/poster1.jpg', seller_phone = '+905321100101' WHERE id = '11111111-1111-4111-8111-000000000001';
UPDATE public.listings SET reels_video_url = '/__l5e/assets-v1/b7b3a5fb-75f2-48ca-92ee-359ba995e5ad/reel2.mp4', thumbnail_url = '/__l5e/assets-v1/bcf88476-a649-42ba-ac80-1716834684e8/poster2.jpg', seller_phone = '+905321100102' WHERE id = '11111111-1111-4111-8111-000000000002';
UPDATE public.listings SET reels_video_url = '/__l5e/assets-v1/e33e6ffc-215f-4cdb-9c89-d22e287b6ce4/reel3.mp4', thumbnail_url = '/__l5e/assets-v1/c3f47c25-2db6-4b22-829b-4b73fc6ae315/poster3.jpg', seller_phone = '+905321100108' WHERE id = '11111111-1111-4111-8111-000000000008';
UPDATE public.listings SET reels_video_url = '/__l5e/assets-v1/51a9fa18-c718-4a82-86a2-27bd7453460b/reel4.mp4', thumbnail_url = '/__l5e/assets-v1/e26c58df-9003-4332-a674-423a72600e32/poster4.jpg', seller_phone = '+905321100104' WHERE id = '11111111-1111-4111-8111-000000000004';
UPDATE public.listings SET reels_video_url = '/__l5e/assets-v1/211ef317-2ea5-487a-8d72-a3494cbfa186/reel5.mp4', thumbnail_url = '/__l5e/assets-v1/68d9a369-3315-411f-8855-e914e5c38a1a/poster5.jpg', seller_phone = '+905321100107' WHERE id = '11111111-1111-4111-8111-000000000007';
UPDATE public.listings SET seller_phone = COALESCE(seller_phone, '+905321100100') WHERE seller_phone IS NULL;