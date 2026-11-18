import {
  getShortenerCoreBaseUrl,
  getShortenerExternalBaseUrl,
} from '@/api/shortenerConfig';
import { getAccessTokenCookie } from '@/auth/authCookies';
import type { LinkData, UrlSafetyData, QrCodeData } from '@/types/shortener';

export const SHORTENER_API_BASE_URL = getShortenerExternalBaseUrl();

interface RawPublicShortcutData {
  shortUrl: string;
  originalUrl: string;
  createdAt: string;
  isSecure: boolean;
  shortcutId: string;
  shortcut: string;
  securityScore?: number | null;
}

/** Преобразует относительный путь бэкенда (например, `/api/public/qr/.../image` или `/public/qr/.../image`) в корректный URL */
export const resolveShortenerUrl = (pathOrUrl: string): string => {
  if (!pathOrUrl) return '';
  if (/^(https?:)?\/\//i.test(pathOrUrl) || pathOrUrl.startsWith('data:')) {
    return pathOrUrl;
  }
  const normalizedPath = pathOrUrl.startsWith('/')
    ? pathOrUrl
    : `/${pathOrUrl}`;
  const base = getShortenerExternalBaseUrl();

  // Если путь уже начинается с /api/ (как возвращает PHP-бэкенд)
  if (normalizedPath === base || normalizedPath.startsWith(`${base}/`)) {
    return normalizedPath;
  }
  if (/^https?:\/\//i.test(base) && normalizedPath.startsWith('/api/')) {
    try {
      return `${new URL(base).origin}${normalizedPath}`;
    } catch {
      return normalizedPath;
    }
  }

  return `${base}${normalizedPath}`;
};

// ---------- Вспомогательная функция обработки ошибки ----------
const handleError = async (
  response: Response,
  fallbackMessage: string,
): Promise<never> => {
  let message = fallbackMessage;
  let code = 'UNKNOWN';

  try {
    const errorData = await response.json();
    if (errorData?.error?.message) {
      message = errorData.error.message;
      code = errorData.error.code || code;
    } else if (errorData?.detail?.message) {
      message = errorData.detail.message;
      code = errorData.detail.code || code;
    }
  } catch {
    // игнорируем ошибку парсинга
  }

  const error = new Error(message);
  (error as Error & { code?: string }).code = code;
  throw error;
};

// ---------- Публичные функции ----------

// POST /api/public/shortcuts — создать гостевую короткую ссылку
export const createShortcut = async (url: string): Promise<LinkData> => {
  const response = await fetch(
    `${getShortenerExternalBaseUrl()}/public/shortcuts`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    },
  );

  if (!response.ok) {
    await handleError(response, 'Ошибка при создании ссылки');
  }

  const raw: RawPublicShortcutData = await response.json();

  return {
    shortUrl: raw.shortUrl,
    originalUrl: raw.originalUrl,
    createdAt: raw.createdAt,
    isSecure: raw.isSecure,
    shortcut: raw.shortcut,
    shortcutId: raw.shortcutId,
    securityScore: raw.securityScore ?? undefined,
  };
};

// POST /api/public/url-check — проверить URL
export const checkUrlSafety = async (
  url: string,
  signal?: AbortSignal,
): Promise<UrlSafetyData> => {
  const response = await fetch(
    `${getShortenerExternalBaseUrl()}/public/url-check`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal,
    },
  );

  if (!response.ok) {
    await handleError(response, 'Ошибка при проверке URL');
  }

  return (await response.json()) as UrlSafetyData;
};

// GET /api/public/qr/{code} — получить метаданные QR-кода
export const getQrCode = async (shortcutCode: string): Promise<QrCodeData> => {
  const response = await fetch(
    `${getShortenerExternalBaseUrl()}/public/qr/${encodeURIComponent(shortcutCode)}`,
  );

  if (!response.ok) {
    await handleError(response, 'Ошибка при получении QR-кода');
  }

  const raw: QrCodeData = await response.json();

  return {
    ...raw,
    qrImageUrl: resolveShortenerUrl(raw.qrImageUrl),
  };
};

// POST /api/shortcuts/{code}/claim — закрепить гостевую ссылку после авторизации
export const claimShortcut = async (
  shortcutCode: string,
  _projectId?: string,
): Promise<void> => {
  const accessToken = getAccessTokenCookie();
  if (!accessToken) {
    throw new Error('Токен авторизации отсутствует');
  }

  const response = await fetch(
    `${getShortenerCoreBaseUrl()}/shortcuts/${encodeURIComponent(shortcutCode)}/claim`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    await handleError(response, 'Не удалось закрепить ссылку');
  }
};
