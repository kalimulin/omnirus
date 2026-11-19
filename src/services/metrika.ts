declare global {
  interface Window {
    ym?: (counterId: number, eventName: string, ...args: unknown[]) => void;
  }
}

export const YANDEX_METRIKA_ID =
  Number(import.meta.env.VITE_YANDEX_METRIKA_ID) || 114373494;

export const COOKIE_CONSENT_KEY = 'omni_cookie_consent';

export interface MetrikaHitOptions {
  title?: string;
  referer?: string;
  params?: Record<string, unknown>;
}

/**
 * Проверяет, разрешены ли аналитические cookie пользователем.
 * По умолчанию (до первого выбора) аналитика активна.
 */
export const isAnalyticsAllowed = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!stored) return true;
    const parsed = JSON.parse(stored);
    return parsed.analytics !== false;
  } catch {
    return true;
  }
};

/**
 * Отправляет просмотр страницы (hit) в Яндекс Метрику.
 */
export const reachHit = (
  url: string = window.location.href,
  options?: MetrikaHitOptions
): void => {
  if (
    typeof window !== 'undefined' &&
    typeof window.ym === 'function' &&
    isAnalyticsAllowed()
  ) {
    window.ym(YANDEX_METRIKA_ID, 'hit', url, options);
  }
};

/**
 * Отправляет достижение цели (reachGoal) в Яндекс Метрику.
 */
export const reachGoal = (
  target: string,
  params?: Record<string, unknown>
): void => {
  if (
    typeof window !== 'undefined' &&
    typeof window.ym === 'function' &&
    isAnalyticsAllowed()
  ) {
    window.ym(YANDEX_METRIKA_ID, 'reachGoal', target, params);
  }
};

/**
 * Передает параметры визитов/пользователя.
 */
export const setUserParams = (params: Record<string, unknown>): void => {
  if (
    typeof window !== 'undefined' &&
    typeof window.ym === 'function' &&
    isAnalyticsAllowed()
  ) {
    window.ym(YANDEX_METRIKA_ID, 'userParams', params);
  }
};

/**
 * Устанавливает идентификатор пользователя (User ID).
 */
export const setUserId = (userId: string | number): void => {
  if (
    typeof window !== 'undefined' &&
    typeof window.ym === 'function' &&
    isAnalyticsAllowed()
  ) {
    window.ym(YANDEX_METRIKA_ID, 'setUserID', String(userId));
  }
};
