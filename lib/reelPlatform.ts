export type ReelPlatform = 'instagram' | 'tiktok' | 'unknown';

export function detectPlatform(url: string): ReelPlatform {
  if (url.includes('instagram.com')) return 'instagram';
  if (url.includes('tiktok.com')) return 'tiktok';
  return 'unknown';
}
