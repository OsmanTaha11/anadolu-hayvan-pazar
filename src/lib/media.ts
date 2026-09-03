import { supabase } from "@/integrations/supabase/client";

export const LISTING_MEDIA_BUCKET = "listing-media";
export const STORAGE_PREFIX = "storage:";

/**
 * Listing media can either be a public URL (CDN / static asset) or a private
 * storage object stored as "storage:<path>". Private objects are resolved to a
 * short-lived signed URL for playback.
 */
export async function resolveMediaUrl(value: string | null | undefined) {
  if (!value) return null;
  if (!value.startsWith(STORAGE_PREFIX)) return value;
  const path = value.slice(STORAGE_PREFIX.length);
  const { data, error } = await supabase.storage
    .from(LISTING_MEDIA_BUCKET)
    .createSignedUrl(path, 60 * 60);
  if (error) return null;
  return data.signedUrl;
}

export function waLink(phone: string | null | undefined, message: string) {
  const digits = (phone ?? "").replace(/[^\d]/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
