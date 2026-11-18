import { getApiBaseUrl } from '@/api/shortenerConfig';
import { getAccessTokenCookie } from '@/auth/authCookies';
import type {
  UserCenterCreateSuccess,
  UserCenterLoginSuccess,
  ProjectUser,
  RawProjectUser
} from './types';

const getAuthBaseUrl = (): string => {
  const url = import.meta.env.VITE_USERCENTER_BASE_URL?.trim();
  if (url) {
    return url.replace(/\/$/, '');
  }
  return getApiBaseUrl();
};

const getErrorMessage = (response: unknown): string | undefined => {
  if (!response || typeof response !== 'object') {
    return undefined;
  }

  const asRecord = response as Record<string, unknown>;
  const errObj = asRecord.error;
  if (errObj && typeof errObj === 'object') {
    const msg = (errObj as Record<string, unknown>).message;
    if (typeof msg === 'string' && msg.trim()) {
      return msg;
    }
  }

  const detail = asRecord.detail;
  if (detail && typeof detail === 'object') {
    const message = (detail as Record<string, unknown>).message;
    if (typeof message === 'string' && message.trim()) {
      return message;
    }
  }

  if (typeof asRecord.message === 'string' && asRecord.message.trim()) {
    return asRecord.message;
  }

  return undefined;
};

export async function loginUserCenter(
  username: string,
  password: string
): Promise<UserCenterLoginSuccess> {
  const baseUrl = getAuthBaseUrl();

  const response = await fetch(`${baseUrl}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      login: username,
      password
    })
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const fallback =
      response.status === 401 || response.status === 403
        ? 'Неверный логин или пароль'
        : 'Не удалось авторизоваться. Повторите попытку.';
    throw new Error(getErrorMessage(rawJson) ?? fallback);
  }

  const accessToken = rawJson.accessToken;
  const user =
    rawJson.user && typeof rawJson.user === 'object'
      ? (rawJson.user as Record<string, unknown>)
      : {};
  const userId = user.userId;
  const login = user.login;

  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Сервер не вернул accessToken');
  }
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('Сервер не вернул userId');
  }
  if (typeof login !== 'string' || !login.trim()) {
    throw new Error('Сервер не вернул login');
  }

  return {
    accessToken,
    userId,
    login,
    accountId: userId
  };
}

export async function createUserCenter(
  login: string,
  password: string
): Promise<UserCenterCreateSuccess> {
  const baseUrl = getAuthBaseUrl();

  let response: Response;
  try {
    response = await fetch(`${baseUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        login,
        password
      })
    });
  } catch (networkError) {
    console.error(networkError);
    throw new Error(
      'Сетевая ошибка при создании аккаунта. Повторите попытку.',
      { cause: networkError }
    );
  }

  const rawText = await response.text();
  let rawJson: unknown;
  try {
    rawJson = rawText ? JSON.parse(rawText) : null;
  } catch {
    rawJson = null;
  }

  if (!response.ok) {
    const fallback = 'Не удалось создать аккаунт. Повторите попытку.';
    throw new Error(getErrorMessage(rawJson) ?? fallback);
  }

  const asRecord = (rawJson && typeof rawJson === 'object' ? rawJson : {}) as Record<string, unknown>;

  return {
    login,
    password,
    status: typeof asRecord.status === 'string' ? asRecord.status : undefined,
    verificationRequired: Boolean(asRecord.verificationRequired || asRecord.status === 'verification_required'),
    email: typeof asRecord.email === 'string' ? asRecord.email : login,
    message: typeof asRecord.message === 'string' ? asRecord.message : undefined,
    expiresInSeconds: typeof asRecord.expiresInSeconds === 'number' ? asRecord.expiresInSeconds : undefined,
    debugCode: typeof asRecord.debugCode === 'string' ? asRecord.debugCode : undefined
  };
}

export async function verifyEmailUserCenter(
  email: string,
  code: string,
  token?: string
): Promise<UserCenterLoginSuccess> {
  const baseUrl = getAuthBaseUrl();

  const response = await fetch(`${baseUrl}/auth/verify-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.trim(),
      code: code.trim(),
      token: token?.trim() || undefined
    })
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const fallback = 'Неверный или истёкший код подтверждения.';
    throw new Error(getErrorMessage(rawJson) ?? fallback);
  }

  const accessToken = rawJson.accessToken;
  const user =
    rawJson.user && typeof rawJson.user === 'object'
      ? (rawJson.user as Record<string, unknown>)
      : {};
  const userId = user.userId;
  const login = user.login;

  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Сервер не вернул accessToken');
  }
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('Сервер не вернул userId');
  }
  if (typeof login !== 'string' || !login.trim()) {
    throw new Error('Сервер не вернул login');
  }

  return {
    accessToken,
    userId,
    login,
    accountId: userId,
    firstName: typeof user.firstName === 'string' ? user.firstName : undefined,
    lastName: typeof user.lastName === 'string' ? user.lastName : undefined
  };
}

export async function resendVerificationCode(
  email: string
): Promise<{ ok: boolean; message: string; expiresInSeconds?: number }> {
  const baseUrl = getAuthBaseUrl();

  const response = await fetch(`${baseUrl}/auth/resend-verification`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.trim()
    })
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const fallback = 'Не удалось повторно отправить проверочный код.';
    throw new Error(getErrorMessage(rawJson) ?? fallback);
  }

  return {
    ok: true,
    message:
      typeof rawJson.message === 'string'
        ? rawJson.message
        : 'Новый проверочный код отправлен на ваш e-mail',
    expiresInSeconds:
      typeof rawJson.expiresInSeconds === 'number'
        ? rawJson.expiresInSeconds
        : undefined
  };
}

export async function requestPasswordReset(
  email: string
): Promise<{ ok: boolean; message: string; expiresInSeconds?: number }> {
  const baseUrl = getAuthBaseUrl();

  const response = await fetch(`${baseUrl}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: email.trim()
    })
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const fallback = 'Не удалось запросить сброс пароля.';
    throw new Error(getErrorMessage(rawJson) ?? fallback);
  }

  return {
    ok: true,
    message:
      typeof rawJson.message === 'string'
        ? rawJson.message
        : 'Код для восстановления пароля отправлен на ваш e-mail',
    expiresInSeconds:
      typeof rawJson.expiresInSeconds === 'number'
        ? rawJson.expiresInSeconds
        : undefined
  };
}

export async function confirmPasswordReset(params: {
  email: string;
  code: string;
  newPassword: string;
  token?: string;
}): Promise<UserCenterLoginSuccess> {
  const baseUrl = getAuthBaseUrl();

  const response = await fetch(`${baseUrl}/auth/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: params.email.trim(),
      code: params.code.trim(),
      newPassword: params.newPassword,
      token: params.token?.trim() || undefined
    })
  });

  const rawJson = (await response.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;

  if (!response.ok) {
    const fallback = 'Не удалось сбросить пароль. Проверьте код и повторите попытку.';
    throw new Error(getErrorMessage(rawJson) ?? fallback);
  }

  const accessToken = rawJson.accessToken;
  const user =
    rawJson.user && typeof rawJson.user === 'object'
      ? (rawJson.user as Record<string, unknown>)
      : {};
  const userId = user.userId;
  const login = user.login;

  if (typeof accessToken !== 'string' || !accessToken.trim()) {
    throw new Error('Сервер не вернул accessToken');
  }
  if (typeof userId !== 'string' || !userId.trim()) {
    throw new Error('Сервер не вернул userId');
  }
  if (typeof login !== 'string' || !login.trim()) {
    throw new Error('Сервер не вернул login');
  }

  return {
    accessToken,
    userId,
    login,
    accountId: userId,
    firstName: typeof user.firstName === 'string' ? user.firstName : undefined,
    lastName: typeof user.lastName === 'string' ? user.lastName : undefined
  };
}

const PROJECT_USERS_PER_PAGE = 200;

async function getProjectUsersPage(
  _projectId: string,
  page: number,
  signal?: AbortSignal
): Promise<{ users: ProjectUser[]; total: number }> {
  const token = getAccessTokenCookie();
  if (!token) {
    throw new Error('Токен авторизации не найден.');
  }

  const baseUrl = getAuthBaseUrl();
  const response = await fetch(
    `${baseUrl}/users?page=${page}&perPage=${PROJECT_USERS_PER_PAGE}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      ...(signal ? { signal } : {})
    }
  );

  if (!response.ok) {
    throw new Error(
      `Не удалось загрузить пользователей: ${response.status} ${response.statusText}`
    );
  }

  const json = await response.json();
  const rawUsers: RawProjectUser[] = Array.isArray(json.items)
    ? json.items
    : Array.isArray(json.data)
      ? json.data
      : [];

  const users = rawUsers.map((user) => ({
    ...user,
    id: user.user_id,
    full_name: user.login
  }));
  const responseTotal = Number(json.meta?.total ?? json.info?.total);

  return {
    users,
    total: Number.isFinite(responseTotal) ? responseTotal : users.length
  };
}

export async function getProjectUsers(
  projectId: string,
  signal?: AbortSignal,
  onProgress?: (loaded: number, total: number) => void
): Promise<ProjectUser[]> {
  const usersById = new Map<string, ProjectUser>();
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const result = await getProjectUsersPage(projectId, page, signal);
    result.users.forEach((user) => usersById.set(user.id, user));
    const total = Math.max(result.total, usersById.size);
    onProgress?.(usersById.size, total);

    hasMore = result.users.length > 0 && page * PROJECT_USERS_PER_PAGE < total;
    page += 1;
  }

  return [...usersById.values()];
}
