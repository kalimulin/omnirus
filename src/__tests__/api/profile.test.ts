import { describe, test, expect, vi, beforeEach, afterEach, type Mock } from 'vitest';

import {
  fetchMyProfile,
  updateMyProfile,
  changeUserPassword,
  fetchCustomerProfileConfig,
  saveCustomerProfileConfig,
  extractApiErrorMessage,
  parseJwtPayload
} from '@/api/profile';
import {
  profileService,
  MOCK_TAKEN_EMAIL
} from '@/services/profile';
import type { UserProfile } from '@/types/profile';

// Mock JWT with sub { user_id: 'u-123', profile_id: 'p-123', account_id: 'a-123' }
const MOCK_TOKEN_WITH_ALL =
  'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOnsidXNlcl9pZCI6InUtMTIzIiwicHJvZmlsZV9pZCI6InAtMTIzIiwiYWNjb3VudF9pZCI6ImEtMTIzIn19.sig';

describe('profile API and service', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USERCENTER_BASE_URL', '/api');
    vi.stubGlobal('fetch', vi.fn());
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    sessionStorage.clear();
    localStorage.clear();
  });

  test('parseJwtPayload извлекает sub из валидного JWT токена', () => {
    const payload = parseJwtPayload(MOCK_TOKEN_WITH_ALL);
    expect(payload?.user_id).toBe('u-123');
    expect(payload?.profile_id).toBe('p-123');
    expect(payload?.account_id).toBe('a-123');

    expect(parseJwtPayload('invalid.token')).toBeNull();
    expect(parseJwtPayload('')).toBeNull();
  });

  test('extractApiErrorMessage корректно извлекает текст ошибки из разных форматов', () => {
    expect(extractApiErrorMessage({ error: { code: 'ERR', message: 'Ошибка PHP' } })).toBe('Ошибка PHP');
    expect(extractApiErrorMessage({ detail: 'Не авторизован' })).toBe('Не авторизован');
    expect(extractApiErrorMessage({ detail: { message: 'Кастомная ошибка' } })).toBe('Кастомная ошибка');
    expect(extractApiErrorMessage({ detail: [{ msg: 'Поле обязательно' }] })).toBe('Поле обязательно');
    expect(extractApiErrorMessage(null, 'Фолбэк')).toBe('Фолбэк');
  });

  test('fetchMyProfile успешно возвращает данные профиля из GET /api/profile', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        userId: 'u-123',
        firstName: 'Петр',
        lastName: 'Петров',
        email: 'petr@test.ru',
        phone: '+79991112233',
        position: 'Разработчик'
      })
    });

    const result = await fetchMyProfile(MOCK_TOKEN_WITH_ALL);
    expect(result?.first_name).toBe('Петр');
    expect(result?.last_name).toBe('Петров');
    expect(result?.contact_email?.[0].value).toBe('petr@test.ru');
    expect(result?.info?.position?.value).toBe('Разработчик');

    expect(fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          Authorization: `Bearer ${MOCK_TOKEN_WITH_ALL}`
        })
      })
    );
  });

  test('fetchMyProfile возвращает null при 404', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: { code: 'USER_NOT_FOUND', message: 'Not found' } })
    });

    const result = await fetchMyProfile(MOCK_TOKEN_WITH_ALL);
    expect(result).toBeNull();
  });

  test('updateMyProfile обновляет профиль через PATCH /api/profile', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ userId: 'u-123' })
    });

    const res = await updateMyProfile(
      {
        firstName: 'Иван',
        lastName: 'Иванов',
        email: 'ivan@test.ru',
        phone: '+79998887766',
        position: 'Дизайнер'
      },
      MOCK_TOKEN_WITH_ALL
    );

    expect(res.profileId).toBe('u-123');
    expect(fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        method: 'PATCH',
        headers: expect.objectContaining({
          Authorization: `Bearer ${MOCK_TOKEN_WITH_ALL}`,
          'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
          firstName: 'Иван',
          lastName: 'Иванов',
          email: 'ivan@test.ru',
          phone: '+79998887766',
          position: 'Дизайнер'
        })
      })
    );
  });

  test('changeUserPassword отправляет старый и новый пароли в PATCH /api/auth/password', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ok: true })
    });

    await changeUserPassword(
      { oldPassword: 'oldSecret', newPassword: 'newSecret123' },
      'token123'
    );

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/password',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({
          oldPassword: 'oldSecret',
          newPassword: 'newSecret123'
        })
      })
    );
  });

  test('fetchCustomerProfileConfig и saveCustomerProfileConfig используют settings из /api/profile', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        userId: 'u-123',
        settings: { position: 'Аналитик' }
      })
    });

    const settings = await fetchCustomerProfileConfig('profile', MOCK_TOKEN_WITH_ALL);
    expect(settings?.position).toBe('Аналитик');

    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ userId: 'u-123', settings: { position: 'Тимлид' } })
    });

    await saveCustomerProfileConfig({ position: 'Тимлид' }, 'profile', MOCK_TOKEN_WITH_ALL);
    expect(fetch).toHaveBeenCalledWith(
      '/api/profile',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ settings: { position: 'Тимлид' } })
      })
    );
  });

  test('profileService.loadProfile загружает профиль из API при наличии токена', async () => {
    localStorage.setItem(
      'usercenter_auth',
      JSON.stringify({ accessToken: MOCK_TOKEN_WITH_ALL, tokenType: 'bearer' })
    );

    (fetch as Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          userId: 'u-123',
          firstName: 'Алексей',
          lastName: 'Смирнов',
          email: 'alex@test.ru',
          phone: '+79993334455',
          position: 'Архитектор',
          settings: { position: 'Архитектор' }
        })
      })
    );

    const seed: UserProfile = {
      firstName: 'Дефолт',
      lastName: '',
      email: 'default@test.ru',
      phone: '',
      position: ''
    };

    const loaded = await profileService.loadProfile(seed);
    expect(loaded.firstName).toBe('Алексей');
    expect(loaded.lastName).toBe('Смирнов');
    expect(loaded.email).toBe('alex@test.ru');
    expect(loaded.phone).toBe('+79993334455');
    expect(loaded.position).toBe('Архитектор');
  });

  test('profileService.loadProfile возвращает рабочий email из профиля', async () => {
    localStorage.setItem(
      'usercenter_auth',
      JSON.stringify({ accessToken: MOCK_TOKEN_WITH_ALL, tokenType: 'bearer' })
    );

    (fetch as Mock).mockImplementation(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({
          userId: 'u-123',
          firstName: 'Анна',
          lastName: 'Павлова',
          email: 'work.anna@corporate.ru',
          phone: '+79990001122'
        })
      })
    );

    const seed: UserProfile = {
      firstName: 'Анна',
      lastName: '',
      email: 'account_login@mail.ru',
      phone: '',
      position: ''
    };

    const loaded = await profileService.loadProfile(seed);
    expect(loaded.email).toBe('work.anna@corporate.ru');
  });

  test('profileService.saveProfile выбрасывает ошибки для занятого email и телефона', async () => {
    const profile: UserProfile = {
      firstName: 'Иван',
      lastName: 'Иванов',
      email: MOCK_TAKEN_EMAIL,
      phone: '+7 900 111-22-33',
      position: 'Разработчик'
    };

    await expect(profileService.saveProfile(profile)).rejects.toThrow(
      expect.objectContaining({
        field: 'email'
      })
    );

    localStorage.setItem(
      'usercenter_auth',
      JSON.stringify({ accessToken: MOCK_TOKEN_WITH_ALL, tokenType: 'bearer' })
    );

    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: { code: 'VALIDATION_ERROR', message: 'Телефон занят другим пользователем' } })
    });

    const profilePhoneTaken: UserProfile = {
      ...profile,
      email: 'free@mail.ru',
      phone: '+7 900 111-22-33'
    };

    await expect(profileService.saveProfile(profilePhoneTaken)).rejects.toThrow(
      expect.objectContaining({
        field: 'phone'
      })
    );
  });

  test('profileService.verifyCurrentPassword принимает 123456 и отклоняет некорректный пароль', async () => {
    await expect(profileService.verifyCurrentPassword('123456')).resolves.toBeUndefined();
    await expect(profileService.verifyCurrentPassword('wrong-pwd')).rejects.toThrow(
      expect.objectContaining({
        field: 'currentPassword'
      })
    );
  });
});
