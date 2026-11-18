import { buildRedirectUrl } from '@/api/shortener';
import type { LinkRow } from '@/types/shortener';

export function extractShortcut(shortUrl: string): string {
  const parts = shortUrl.split('/').filter(Boolean);
  return parts[parts.length - 1] || '';
}

function resolveCopyUrl(link: LinkRow): string {
  const shortcut = link.shortcut || extractShortcut(link.shortUrl);
  if (shortcut) {
    return buildRedirectUrl(shortcut);
  }
  return /^https?:\/\//i.test(link.shortUrl)
    ? link.shortUrl
    : `https://${link.shortUrl}`;
}

export async function copyShortLinkToClipboard(
  link: LinkRow
): Promise<boolean> {
  const fullUrl = resolveCopyUrl(link);
  if (!fullUrl) {
    return false;
  }

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(fullUrl);
      return true;
    } catch {
      // Переходим к fallback через execCommand
    }
  }

  try {
    const textArea = document.createElement('textarea');
    textArea.value = fullUrl;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.select();
    const copied =
      typeof document.execCommand === 'function' &&
      document.execCommand('copy');
    document.body.removeChild(textArea);
    return copied;
  } catch {
    return false;
  }
}
