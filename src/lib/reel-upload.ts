import { supabase } from "@/integrations/supabase/client";
import { LISTING_MEDIA_BUCKET, STORAGE_PREFIX } from "@/lib/media";
import { captureThumbnail } from "@/lib/video";

/**
 * Uploads a seller's vertical reel (and a poster frame captured from it) into
 * the listing-media bucket, scoped to the seller's own folder.
 */
export async function uploadReel(userId: string, file: File) {
  const stamp = Date.now();
  const ext = file.name.split(".").pop()?.toLowerCase() || "mp4";
  const videoPath = `${userId}/reels/${stamp}.${ext}`;

  const { error: upErr } = await supabase.storage
    .from(LISTING_MEDIA_BUCKET)
    .upload(videoPath, file, { contentType: file.type || "video/mp4", upsert: false });
  if (upErr) throw upErr;

  let thumbnail: string | null = null;
  const poster = await captureThumbnail(file);
  if (poster) {
    const posterPath = `${userId}/reels/${stamp}-poster.jpg`;
    const { error: posterErr } = await supabase.storage
      .from(LISTING_MEDIA_BUCKET)
      .upload(posterPath, poster, { contentType: "image/jpeg", upsert: true });
    if (!posterErr) thumbnail = `${STORAGE_PREFIX}${posterPath}`;
  }

  return { reels_video_url: `${STORAGE_PREFIX}${videoPath}`, thumbnail_url: thumbnail };
}
