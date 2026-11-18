import { getApiBaseUrl } from '@/api/shortenerConfig';
import { getAccessTokenCookie } from '@/auth/authCookies';
import type { ChangePasswordPayload } from '@/types/profile';

const AUTH_STORAGE_KEY = 'usercenter_auth';

export const getUserCenterBaseUrl = (): string => {
  const url = import.meta.env.VITE_USERCENTER_BASE_URL?.trim();
  return (url || getApiBaseUrl()).replace(/\/$/, '');
};

export const getStoredAccessToken = (): string | undefined => {
  const fromCookie = getAccessTokenCookie();
  if (fromCookie?.trim()) return fromCookie.trim();
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return undefined;
    const parsed = JSON.parse(raw) as { accessToken?: string };
    return parsed.accessToken?.trim() || undefined;
  } catch {
    return undefined;
  }
};

function decodeBase64(str: string): string {
  if (typeof atob === 'function') {
    return atob(str);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'base64').toString('binary');
  }
  return '';
}

export interface JwtSubData {
  user_id?: string;
  userId?: string;
  profile_id?: string | null;
  account_id?: string | null;
  login?: string;
  role?: string;
}

/**
 * Извлечение полезной нагрузки из JWT токена (поддерживает плоский формат PHP-бэкенда и вложенный sub)
 */
export function parseJwtPayload(token?: string): JwtSubData | null {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const raw = decodeBase64(base64);
    const json = decodeURIComponent(
      raw
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    const parsed = JSON.parse(json) as Record<string, unknown>;
    if (parsed?.sub && typeof parsed.sub === 'object') {
      return parsed.sub as JwtSubData;
    }
    if (typeof parsed?.userId === 'string') {
      return {
        userId: parsed.userId,
        user_id: parsed.userId,
        account_id: parsed.userId,
        login: typeof parsed.login === 'string' ? parsed.login : undefined,
        role: typeof parsed.role === 'string' ? parsed.role : undefined
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function extractApiErrorMessage(
  responseBody: unknown,
  fallback = 'Произошла непредвиденная ошибка'
): string {
  if (!responseBody || typeof responseBody !== 'object') {
    return fallback;
  }

  const asRecord = responseBody as Record<string, unknown>;

  const errObj = asRecord.error;
  if (errObj && typeof errObj === 'object') {
    const errMsg = (errObj as Record<string, unknown>).message;
    if (typeof errMsg === 'string' && errMsg.trim()) {
      return errMsg;
    }
  }

  if (typeof asRecord.message === 'string' && asRecord.message.trim()) {
    return asRecord.message;
  }

  const detail = asRecord.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail;
  }

  if (detail && typeof detail === 'object') {
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as Record<string, unknown>;
      if (typeof first?.msg === 'string' && first.msg.trim()) {
        return first.msg;
      }
    }

    const detailRecord = detail as Record<string, unknown>;
    if (
      typeof detailRecord.message === 'string' &&
      detailRecord.message.trim()
    ) {
      return detailRecord.message;
    }
  }

  return fallback;
}

export interface ApiRegistryItem {
  title: string;
  value: string;
}

export interface ApiProfileData {
  profile_id?: string;
  first_name?: string | null;
  last_name?: string | null;
  contact_phone?: ApiRegistryItem[] | null;
  contact_email?: ApiRegistryItem[] | null;
  info?: Record<string, { title: string; value: unknown }> | null;
}

interface PhpProfileResponse {
  userId?: string;
  login?: string;
  role?: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  email?: string | null;
  position?: string | null;
  settings?: Record<string, unknown> | null;
}

const buildHeaders = (
  token?: string,
  contentType = 'application/json'
): HeadersInit => {
  const headers: Record<string, string> = {};
  if (contentType) {
    headers['Content-Type'] = contentType;
  }

  const effectiveToken = token || getStoredAccessToken();
  if (effectiveToken) {
    headers['Authorization'] = `Bearer ${effectiveToken}`;
  }

  return headers;
};

/**
 * Получить профиль текущего пользователя (GET /api/profile)
 */
export async function fetchMyProfile(
  token?: string,
  _projectId?: string
): Promise<ApiProfileData | null> {
  const baseUrl = getUserCenterBaseUrl();
  const effectiveToken = token || getStoredAccessToken();
  if (!effectiveToken) return null;

  try {
    const response = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: buildHeaders(effectiveToken, '')
    });

    if (response.status === 404) {
      return null;
    }

    const rawJson = (await response.json().catch(() => ({}))) as PhpProfileResponse;

    if (!response.ok) {
      throw new Error(
        extractApiErrorMessage(rawJson, 'Не удалось загрузить данные профиля')
      );
    }

    return {
      profile_id: rawJson.userId,
      first_name: rawJson.firstName ?? null,
      last_name: rawJson.lastName ?? null,
      contact_email: rawJson.email
        ? [{ title: 'work', value: rawJson.email }]
        : [],
      contact_phone: rawJson.phone
        ? [{ title: 'phone', value: rawJson.phone }]
        : [],
      info: rawJson.position
        ? { position: { title: 'Должность', value: rawJson.position } }
        : null
    };
  } catch (e) {
    if (e instanceof Error && e.message.includes('Не удалось')) {
      throw e;
    }
  }

  return null;
}

/**
 * Обновить профиль пользователя (PATCH /api/profile)
 */
export async function updateMyProfile(
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    position?: string;
  },
  token?: string,
  _projectId?: string
): Promise<{ profileId?: string }> {
  const baseUrl = getUserCenterBaseUrl();
  const effectiveToken = token || getStoredAccessToken();

  const body: Record<string, unknown> = {};
  if (data.firstName !== undefined) body.firstName = data.firstName;
  if (data.lastName !== undefined) body.lastName = data.lastName;
  if (data.email !== undefined) body.email = data.email;
  if (data.phone !== undefined) body.phone = data.phone;
  if (data.position !== undefined) body.position = data.position;

  const response = await fetch(`${baseUrl}/profile`, {
    method: 'PATCH',
    headers: buildHeaders(effectiveToken),
    body: JSON.stringify(body)
  });

  const rawJson = (await response.json().catch(() => ({}))) as PhpProfileResponse;
  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(
        rawJson,
        'При сохранении изменений произошла ошибка'
      )
    );
  }

  return { profileId: rawJson.userId };
}

/**
 * Изменить пароль пользователя (PATCH /api/auth/password)
 */
export async function changeUserPassword(
  payload: ChangePasswordPayload,
  token?: string,
  _projectId?: string
): Promise<void> {
  const baseUrl = getUserCenterBaseUrl();

  const response = await fetch(`${baseUrl}/auth/password`, {
    method: 'PATCH',
    headers: buildHeaders(token),
    body: JSON.stringify({
      oldPassword: payload.oldPassword,
      newPassword: payload.newPassword
    })
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    throw new Error(
      extractApiErrorMessage(rawJson, 'При изменении пароля произошла ошибка')
    );
  }
}

/**
 * Получить настройки профиля пользователя (settings из GET /api/profile)
 */
export async function fetchCustomerProfileConfig(
  _configCode = 'profile',
  token?: string,
  _projectId?: string
): Promise<Record<string, unknown> | null> {
  const effectiveToken = token || getStoredAccessToken();
  if (!effectiveToken) return null;

  const baseUrl = getUserCenterBaseUrl();
  try {
    const response = await fetch(`${baseUrl}/profile`, {
      method: 'GET',
      headers: buildHeaders(effectiveToken, '')
    });
    if (!response.ok) return null;
    const rawJson = (await response.json().catch(() => ({}))) as PhpProfileResponse;
    return rawJson.settings ?? null;
  } catch {
    return null;
  }
}

/**
 * Сохранить настройки профиля пользователя (settings в PATCH /api/profile)
 */
export async function saveCustomerProfileConfig(
  settings: Record<string, unknown>,
  _configCode = 'profile',
  token?: string,
  _projectId?: string
): Promise<void> {
  const effectiveToken = token || getStoredAccessToken();
  if (!effectiveToken) return;

  const baseUrl = getUserCenterBaseUrl();
  try {
    await fetch(`${baseUrl}/profile`, {
      method: 'PATCH',
      headers: buildHeaders(effectiveToken),
      body: JSON.stringify({ settings })
    });
  } catch {
    // Игнорируем сетевые ошибки синхронизации настроек
  }
}
