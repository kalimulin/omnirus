import { getAccessTokenCookie } from '@/auth/authCookies';

export const DEFAULT_API_BASE_URL = '/api';

// Алиасы сохранены для совместимости с существующими импортами
export const DEFAULT_SHORTENER_EXTERNAL_API_URL = DEFAULT_API_BASE_URL;
export const DEFAULT_SHORTENER_CORE_API_URL = DEFAULT_API_BASE_URL;

export const getApiBaseUrl = (): string =>
  (
    import.meta.env.VITE_API_BASE_URL?.trim() ||
    import.meta.env.VITE_SHORTENER_CORE_API_URL?.trim() ||
    import.meta.env.VITE_SHORTENER_API_URL?.trim() ||
    DEFAULT_API_BASE_URL
  ).replace(/\/+$/, '');

export const getShortenerExternalBaseUrl = (): string => getApiBaseUrl();

export const getShortenerCoreBaseUrl = (): string => getApiBaseUrl();

export const getShortenerOrigin = (): string => {
  const configured = import.meta.env.VITE_SHORT_ORIGIN?.trim();
  if (configured) {
    return configured.replace(/\/+$/, '');
  }
  const apiBase = getApiBaseUrl();
  if (/^https?:\/\//i.test(apiBase)) {
    try {
      return new URL(apiBase).origin;
    } catch {
      // игнорируем
    }
  }
  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }
  return '';
};

export const getShortenerAccessToken = (): string => {
  const cookieToken = getAccessTokenCookie()?.trim();
  if (cookieToken) {
    return cookieToken;
  }

  const demoToken = (
    import.meta.env.VITE_SHORTENER_DEMO_TOKEN as string | undefined
  )?.trim();
  return demoToken || '';
};

export const isShortenerApiConfigured = (): boolean =>
  Boolean(getShortenerAccessToken());
