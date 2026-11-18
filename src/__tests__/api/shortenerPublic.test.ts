import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  SHORTENER_API_BASE_URL,
  checkUrlSafety,
  claimShortcut,
  createShortcut,
  getQrCode,
  resolveShortenerUrl
} from '@/api/shortenerPublic';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';

describe('shortenerPublic API', () => {
  afterEach(() => {
    clearAuthCookies();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('использует /api как базовый URL', () => {
    expect(SHORTENER_API_BASE_URL).toBe('/api');
  });

  test('resolveShortenerUrl корректно резолвит относительные и абсолютные URL', () => {
    expect(resolveShortenerUrl('/public/qr/3a0alc/image')).toBe(
      `${SHORTENER_API_BASE_URL}/public/qr/3a0alc/image`
    );
    expect(resolveShortenerUrl('/api/public/qr/3a0alc/image')).toBe(
      '/api/public/qr/3a0alc/image'
    );
    expect(resolveShortenerUrl('public/qr/3a0alc/image')).toBe(
      `${SHORTENER_API_BASE_URL}/public/qr/3a0alc/image`
    );
    expect(resolveShortenerUrl('https://cdn.example.com/qr.svg')).toBe(
      'https://cdn.example.com/qr.svg'
    );
    expect(resolveShortenerUrl('data:image/svg+xml;base64,abc')).toBe(
      'data:image/svg+xml;base64,abc'
    );
    expect(resolveShortenerUrl('')).toBe('');
  });

  test('createShortcut вызывает POST /api/public/shortcuts и возвращает camelCase', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        shortUrl: 'https://example.com/s/3a0alc',
        originalUrl: 'https://example.com/landing',
        createdAt: '2026-11-10T10:00:00Z',
        isSecure: true,
        shortcutId: 'sc-123',
        shortcut: '3a0alc',
        securityScore: 100
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await createShortcut('https://example.com/landing');

    expect(fetchMock).toHaveBeenCalledWith(
      `${SHORTENER_API_BASE_URL}/public/shortcuts`,
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: 'https://example.com/landing' })
      })
    );
    expect(result).toEqual({
      shortUrl: 'https://example.com/s/3a0alc',
      originalUrl: 'https://example.com/landing',
      createdAt: '2026-11-10T10:00:00Z',
      isSecure: true,
      shortcut: '3a0alc',
      shortcutId: 'sc-123',
      securityScore: 100
    });
  });

  test('createShortcut пробрасывает сообщение и код ошибки бэкенда', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({
          error: {
            code: 'SHORTCUT_URL_INVALID',
            message: 'Некорректный URL. Проверьте формат URL.'
          }
        })
      })
    );

    await expect(createShortcut('invalid')).rejects.toMatchObject({
      message: 'Некорректный URL. Проверьте формат URL.',
      code: 'SHORTCUT_URL_INVALID'
    });
  });

  test('checkUrlSafety вызывает POST /api/public/url-check и передаёт AbortSignal', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        threatLevel: 'invalid',
        isSafe: false,
        isSuspicious: false,
        isBlocked: false,
        isInvalid: true,
        reasons: [],
        score: 0,
        timestamp: '2026-11-10T10:00:00Z',
        checkedBy: 'OmniNotice Security System',
        recommendations: [],
        error: 'Некорректный домен'
      })
    });
    vi.stubGlobal('fetch', fetchMock);
    const controller = new AbortController();

    const safety = await checkUrlSafety(
      'https://bad-invalid',
      controller.signal
    );

    expect(fetchMock).toHaveBeenCalledWith(
      `${SHORTENER_API_BASE_URL}/public/url-check`,
      expect.objectContaining({
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({ url: 'https://bad-invalid' })
      })
    );
    expect(safety.isInvalid).toBe(true);
    expect(safety.threatLevel).toBe('invalid');
    expect(safety.error).toBe('Некорректный домен');
  });

  test('getQrCode резолвит относительный qrImageUrl без дублирования /api', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        shortcut: '3a0alc',
        shortUrl: 'https://example.com/s/3a0alc',
        qrImageUrl: '/api/public/qr/3a0alc/image'
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const qrData = await getQrCode('3a0alc');

    expect(fetchMock).toHaveBeenCalledWith(
      `${SHORTENER_API_BASE_URL}/public/qr/3a0alc`
    );
    expect(qrData.qrImageUrl).toBe('/api/public/qr/3a0alc/image');
  });

  test('claimShortcut отправляет POST на /api/shortcuts/{code}/claim с Bearer-токеном', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'claim-jwt-token'
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ shortcutId: 'sc-1', shortcut: '3a0alc' })
    });
    vi.stubGlobal('fetch', fetchMock);

    await claimShortcut('3a0alc');

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shortcuts/3a0alc/claim',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer claim-jwt-token'
        }
      }
    );
  });
});
