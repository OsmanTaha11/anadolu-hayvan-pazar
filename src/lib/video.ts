export type VideoMeta = { duration: number; width: number; height: number };

export const MAX_REEL_SECONDS = 30;
export const MAX_REEL_MB = 60;

function loadVideo(file: File) {
  return new Promise<{ el: HTMLVideoElement; url: string }>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement("video");
    el.preload = "metadata";
    el.muted = true;
    el.playsInline = true;
    el.src = url;
    el.onloadedmetadata = () => resolve({ el, url });
    el.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Video dosyası okunamadı."));
    };
  });
}

/** Reads duration and pixel dimensions from a locally selected video file. */
export async function readVideoMeta(file: File): Promise<VideoMeta> {
  const { el, url } = await loadVideo(file);
  const meta = {
    duration: el.duration,
    width: el.videoWidth,
    height: el.videoHeight,
  };
  URL.revokeObjectURL(url);
  return meta;
}

/** Returns a Turkish error message when the file is not a usable 9:16 reel. */
export function validateReel(file: File, meta: VideoMeta): string | null {
  if (file.size > MAX_REEL_MB * 1024 * 1024) {
    return `Video en fazla ${MAX_REEL_MB} MB olabilir.`;
  }
  if (Number.isFinite(meta.duration) && meta.duration > MAX_REEL_SECONDS + 1) {
    return `Video en fazla ${MAX_REEL_SECONDS} saniye olmalı (seçilen: ${Math.round(meta.duration)} sn).`;
  }
  if (meta.width && meta.height && meta.width >= meta.height) {
    return "Video dikey (9:16) olmalı. Telefonu dik tutarak çekilmiş bir video seçin.";
  }
  return null;
}

/** Grabs a poster frame from the video to use as the feed thumbnail. */
export async function captureThumbnail(file: File, atSecond = 1): Promise<Blob | null> {
  try {
    const { el, url } = await loadVideo(file);
    await new Promise<void>((resolve) => {
      el.onseeked = () => resolve();
      el.currentTime = Math.min(atSecond, Math.max(0, (el.duration || 1) - 0.1));
      setTimeout(resolve, 3000);
    });
    const canvas = document.createElement("canvas");
    canvas.width = el.videoWidth || 720;
    canvas.height = el.videoHeight || 1280;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      URL.revokeObjectURL(url);
      return null;
    }
    ctx.drawImage(el, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.82),
    );
    URL.revokeObjectURL(url);
    return blob;
  } catch {
    return null;
  }
}
