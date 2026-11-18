import { type Mock, describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

import { loginUserCenter, createUserCenter } from '@/api/userCenter';

describe('userCenter API', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_USERCENTER_BASE_URL', '/api');
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  // ===== loginUserCenter =====

  test('возвращает данные при успешном логине', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'token123',
        user: { userId: 'user-123', login: 'user@mail.com', role: 'user' }
      })
    });

    const result = await loginUserCenter('user@mail.com', 'pass');

    expect(result.accessToken).toBe('token123');
    expect(result.userId).toBe('user-123');
    expect(result.login).toBe('user@mail.com');
    expect(result.accountId).toBe('user-123');
  });

  test('бросает "Неверный логин или пароль" при 401', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({})
    });

    await expect(loginUserCenter('user@mail.com', 'wrong')).rejects.toThrow(
      'Неверный логин или пароль'
    );
  });

  test('бросает ошибку при отсутствии accessToken', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { userId: 'user-123', login: 'user@mail.com' } })
    });

    await expect(loginUserCenter('user@mail.com', 'pass')).rejects.toThrow(
      'Сервер не вернул accessToken'
    );
  });

  test('бросает ошибку если в ответе нет userId', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'token123',
        user: { login: 'user@mail.com' }
      })
    });

    await expect(loginUserCenter('user@mail.com', 'pass')).rejects.toThrow(
      'Сервер не вернул userId'
    );
  });

  test('отправляет JSON { login, password } на /api/auth/login', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        accessToken: 'token123',
        user: { userId: 'user-123', login: 'user@mail.com', role: 'user' }
      })
    });

    await loginUserCenter('user@mail.com', 'pass');

    expect(fetch).toHaveBeenCalledWith(
      '/api/auth/login',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ login: 'user@mail.com', password: 'pass' })
      })
    );
  });

  // ===== createUserCenter =====

  test('createUserCenter возвращает login/password при успехе', async () => {
    (fetch as Mock).mockResolvedValueOnce({
      ok: true,
      text: async () => '{}'
    });

    const result = await createUserCenter('new@mail.com', 'pass123');

    expect(result.login).toBe('new@mail.com');
    expect(result.password).toBe('pass123');
  });

  test('createUserCenter бросает ошибку при сети', async () => {
    (fetch as Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(createUserCenter('user@mail.com', 'pass')).rejects.toThrow(
      'Сетевая ошибка при создании аккаунта'
    );
  });
});
