/**
 * Inserts Cloudinary's f_auto,q_auto (auto format + auto compression)
 * transform into a Cloudinary delivery URL if one isn't already present.
 * Product image URLs are free-text (entered via the web admin panel) and
 * are frequently pasted in at full original size/format — this makes sure
 * every image the mobile app renders is served compressed regardless of
 * how it was uploaded, without needing to touch the stored data.
 *
 * Non-Cloudinary URLs are returned unchanged.
 */
export function optimizeImageUrl(url: string | undefined | null): string {
  if (!url) return '';
  if (!url.includes('res.cloudinary.com')) return url;
  if (url.includes('/upload/f_auto') || url.includes('/upload/q_auto')) return url;
  return url.replace('/upload/', '/upload/f_auto,q_auto/');
}
