import { afterEach, describe, expect, test, vi } from 'vitest';

import {
  SHORTENER_CORE_API_BASE_URL,
  buildRedirectUrl,
  createCampaign,
  createLink,
  ensureCampaignId,
  exportLinkStatistics,
  fetchCampaignStatistics,
  fetchCampaigns,
  fetchLink,
  fetchLinkStatistics,
  fetchLinks,
  fetchTags,
  isApiConfigured,
  setLinkStatus,
  updateCampaign,
  updateLink
} from '@/api/shortener';
import { DEFAULT_API_BASE_URL } from '@/api/shortenerConfig';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';

describe('shortener API (единый PHP REST API управления ссылками и кампаниями)', () => {
  afterEach(() => {
    clearAuthCookies();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('использует /api как базовый URL и строит редирект на /s/{code}', () => {
    expect(SHORTENER_CORE_API_BASE_URL).toBe(DEFAULT_API_BASE_URL);
    expect(SHORTENER_CORE_API_BASE_URL).toBe('/api');
    expect(buildRedirectUrl('3a0alc')).toMatch(/\/s\/3a0alc$/);
  });

  test('isApiConfigured динамически реагирует на появление и удаление токена авторизации', () => {
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
    clearAuthCookies();
    expect(isApiConfigured()).toBe(false);

    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'cookie-jwt-token'
    });
    expect(isApiConfigured()).toBe(true);

    clearAuthCookies();
    expect(isApiConfigured()).toBe(false);

    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', 'demo-jwt-token');
    expect(isApiConfigured()).toBe(true);
  });

  test('не отправляет запрос с пустым Bearer-токеном и выбрасывает понятную ошибку', async () => {
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
    clearAuthCookies();
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    await expect(fetchLinks()).rejects.toThrow('Токен авторизации отсутствует');
    expect(fetchMock).not.toHaveBeenCalled();
  });

  test('createLink вызывает POST /api/shortcuts с Bearer-токеном в camelCase', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token-123'
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        shortcutId: 'sc-uuid-1',
        title: 'Промо-пост',
        target: 'https://example.ru/promo',
        shortUrl: 'https://example.com/s/abc123',
        shortcut: 'abc123',
        status: 'active',
        createdAt: '2026-11-11T10:00:00Z'
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const created = await createLink({
      title: 'Промо-пост',
      target: 'https://example.ru/promo',
      description: 'Описание',
      tags: ['tg'],
      campaign_id: 'camp-42'
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shortcuts',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt-token-123'
        },
        body: JSON.stringify({
          title: 'Промо-пост',
          target: 'https://example.ru/promo',
          description: 'Описание',
          tags: ['tg'],
          campaignId: 'camp-42'
        })
      })
    );
    expect(created).toMatchObject({
      id: 'sc-uuid-1',
      name: 'Промо-пост',
      shortUrl: 'https://example.com/s/abc123',
      shortcut: 'abc123',
      targetUrl: 'https://example.ru/promo',
      status: 'активна'
    });
  });

  test('fetchLinks, fetchCampaigns, createCampaign и updateLink работают с чистым camelCase REST', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token-xyz'
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              shortcutId: 'link-1',
              title: 'Ссылка 1',
              target: 'https://example.ru/1',
              shortUrl: 'https://example.com/s/l1',
              shortcut: 'l1',
              status: 'active',
              clicksCount: 7,
              campaignId: 'camp-1',
              createdAt: '2026-11-11T10:00:00Z',
              modifiedAt: '2026-11-11T10:00:00Z',
              tags: ['sale']
            }
          ],
          meta: { total: 1, count: 1, page: 1, perPage: 50 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          items: [
            {
              campaignId: 'camp-1',
              name: 'Весна',
              description: 'Весенняя акция',
              linksCount: 0,
              totalClicks: 0,
              createdAt: '2026-11-11T10:00:00Z',
              modifiedAt: '2026-11-11T10:00:00Z'
            }
          ],
          meta: { total: 1, count: 1, page: 1, perPage: 50 }
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          campaignId: 'camp-2',
          name: 'Осень',
          description: '',
          createdAt: '2026-11-11T10:00:00Z',
          modifiedAt: '2026-11-11T10:00:00Z'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 204
      });
    vi.stubGlobal('fetch', fetchMock);

    const links = await fetchLinks('camp 1');
    const campaigns = await fetchCampaigns();
    const newCamp = await createCampaign({
      name: 'Осень',
      description: 'Описание'
    });
    await updateLink('link/1', { title: 'Новое имя' });

    const expectedHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer jwt-token-xyz'
    };

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/shortcuts?campaignId=camp%201',
      expect.objectContaining({ headers: expectedHeaders })
    );
    expect(links[0]).toMatchObject({
      id: 'link-1',
      name: 'Ссылка 1',
      shortUrl: 'https://example.com/s/l1',
      clicks: 7,
      campaignId: 'camp-1',
      createdAt: '2026-11-11T10:00:00Z'
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/campaigns',
      expect.objectContaining({ headers: expectedHeaders })
    );
    expect(campaigns[0]).toMatchObject({
      id: 'camp-1',
      name: 'Весна',
      description: 'Весенняя акция',
      linksCount: 0,
      totalClicks: 0,
      createdAt: '2026-11-11T10:00:00Z'
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      3,
      '/api/campaigns',
      expect.objectContaining({
        method: 'POST',
        headers: expectedHeaders,
        body: JSON.stringify({ name: 'Осень', description: 'Описание' })
      })
    );
    expect(newCamp.id).toBe('camp-2');
    expect(newCamp.name).toBe('Осень');

    expect(fetchMock).toHaveBeenNthCalledWith(
      4,
      '/api/shortcuts/link%2F1',
      expect.objectContaining({ method: 'PATCH', headers: expectedHeaders })
    );
  });

  test('setLinkStatus меняет статус через PATCH /api/shortcuts/{id}/status, а updateCampaign отправляет name', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token'
    });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200, json: async () => ({}) });
    vi.stubGlobal('fetch', fetchMock);

    await setLinkStatus('sc-1', 'inactive');
    await updateCampaign('camp-1', { name: 'Обновлённая', description: 'Новое описание' });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      '/api/shortcuts/sc-1/status',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ status: 'inactive' })
      })
    );
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/campaigns/camp-1',
      expect.objectContaining({
        method: 'PATCH',
        body: JSON.stringify({ name: 'Обновлённая', description: 'Новое описание' })
      })
    );
  });

  test('статистика запрашивается на /api/stats/... с dateFrom, dateTo, granularity и мапит total/series/shortcuts', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token'
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          dateFrom: '2026-11-04T00:00:00Z',
          dateTo: '2026-11-11T00:00:00Z',
          granularity: 'day',
          total: 42,
          unique: 19,
          series: [
            { period: '2026-11-10', clicks: 15, uniqueVisitors: 8 },
            { period: '2026-11-11', clicks: 27, uniqueVisitors: 11 }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          dateFrom: '',
          dateTo: '',
          granularity: 'day',
          total: 120,
          unique: 80,
          linksCount: 2,
          series: [{ period: '2026-11-11', clicks: 120, uniqueVisitors: 80 }],
          shortcuts: [
            { shortcutId: 's1', shortcut: 'a1', clicks: 70, uniqueVisitors: 50 },
            { shortcutId: 's2', shortcut: 'b2', clicks: 50, uniqueVisitors: 30 }
          ]
        })
      });
    vi.stubGlobal('fetch', fetchMock);

    const linkStats = await fetchLinkStatistics('sc-1', 7);
    const campStats = await fetchCampaignStatistics('camp-1');

    const linkUrl = new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost');
    expect(linkUrl.pathname).toBe('/api/stats/shortcuts/sc-1');
    expect(linkUrl.searchParams.get('granularity')).toBe('day');
    expect(linkUrl.searchParams.get('dateFrom')).toBeTruthy();
    expect(linkUrl.searchParams.get('dateTo')).toBeTruthy();

    expect(linkStats).toMatchObject({
      total: 42,
      unique: 19,
      byDay: [
        { date: '2026-11-10', value: 15 },
        { date: '2026-11-11', value: 27 }
      ]
    });

    const campUrl = new URL(fetchMock.mock.calls[1][0] as string, 'http://localhost');
    expect(campUrl.pathname).toBe('/api/stats/campaigns/camp-1');
    expect(campUrl.searchParams.get('granularity')).toBe('day');
    expect(campStats).toMatchObject({
      total: 120,
      unique: 80,
      linksCount: 2,
      shortcuts: [
        { shortcutId: 's1', shortcut: 'a1', clicks: 70, uniqueVisitors: 50 },
        { shortcutId: 's2', shortcut: 'b2', clicks: 50, uniqueVisitors: 30 }
      ]
    });
  });

  test('списочные ручки и GET /api/tags возвращают [] при 404 без падения .map', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token'
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ error: { code: 'NOT_FOUND', message: 'Not found' } })
      })
    );

    await expect(fetchLinks('empty-camp')).resolves.toEqual([]);
    await expect(fetchCampaigns()).resolves.toEqual([]);
    await expect(fetchTags()).resolves.toEqual([]);
  });

  test('ensureCampaignId не создаёт кампанию "Без кампании" и переиспользует существующую', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token'
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        items: [
          {
            campaignId: 'camp-existing',
            name: 'Telegram',
            createdAt: '2026-11-11T10:00:00Z',
            modifiedAt: '2026-11-11T10:00:00Z'
          }
        ],
        meta: { total: 1, count: 1, page: 1, perPage: 50 }
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    await expect(ensureCampaignId('Без кампании')).resolves.toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();

    await expect(ensureCampaignId('Telegram')).resolves.toBe('camp-existing');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  test('fetchLink возвращает ссылку и выбрасывает понятную ошибку при пустом ответе', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token'
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          shortcutId: 'sc-42',
          title: 'Акция',
          target: 'https://example.ru/sale',
          shortUrl: 'omni/fbl2V',
          shortcut: 'fbl2V',
          status: 'active',
          tags: ['email'],
          createdAt: '2026-09-07T10:00:00Z',
          modifiedAt: '2026-09-07T10:00:00Z'
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({})
      });
    vi.stubGlobal('fetch', fetchMock);

    const link = await fetchLink('sc-42');
    expect(link).toMatchObject({
      id: 'sc-42',
      name: 'Акция',
      shortUrl: 'omni/fbl2V',
      targetUrl: 'https://example.ru/sale',
      tags: ['email'],
      status: 'активна'
    });

    await expect(fetchLink('missing')).rejects.toThrow('Ссылка не найдена');
  });

  test('fetchLinkStatistics поддерживает granularity=hour и dateFrom/dateTo, а exportLinkStatistics скачивает файл', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token'
    });

    const blob = new Blob(['date,clicks\n2026-09-07,10\n'], { type: 'text/csv' });
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          dateFrom: '2026-09-07T00:00:00Z',
          dateTo: '2026-09-07T23:59:59Z',
          granularity: 'hour',
          total: 35,
          unique: 20,
          series: [
            { period: '2026-09-07T00:00:00', clicks: 12, uniqueVisitors: 8 },
            { period: '2026-09-07T01:00:00', clicks: 23, uniqueVisitors: 12 }
          ]
        })
      })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        headers: new Headers({
          'Content-Disposition': 'attachment; filename="link-report.csv"'
        }),
        blob: async () => blob
      });
    vi.stubGlobal('fetch', fetchMock);

    const hourly = await fetchLinkStatistics('sc-1', {
      dateFrom: '2026-09-07T00:00:00.000Z',
      dateTo: '2026-09-07T23:59:59.999Z',
      granularity: 'hour'
    });

    const statsUrl = new URL(fetchMock.mock.calls[0][0] as string, 'http://localhost');
    expect(statsUrl.pathname).toBe('/api/stats/shortcuts/sc-1');
    expect(statsUrl.searchParams.get('granularity')).toBe('hour');
    expect(statsUrl.searchParams.get('dateFrom')).toBe('2026-09-07T00:00:00.000Z');
    expect(statsUrl.searchParams.get('dateTo')).toBe('2026-09-07T23:59:59.999Z');
    expect(hourly.series).toEqual([
      { period: '2026-09-07T00:00:00', clicks: 12, uniqueVisitors: 8 },
      { period: '2026-09-07T01:00:00', clicks: 23, uniqueVisitors: 12 }
    ]);

    const exported = await exportLinkStatistics('sc-1', {
      dateFrom: '2026-09-07T00:00:00.000Z',
      dateTo: '2026-09-07T23:59:59.999Z',
      granularity: 'day',
      format: 'csv'
    });

    const exportUrl = new URL(fetchMock.mock.calls[1][0] as string, 'http://localhost');
    expect(exportUrl.pathname).toBe('/api/stats/shortcuts/sc-1/export');
    expect(exportUrl.searchParams.get('format')).toBe('csv');
    expect(exportUrl.searchParams.get('granularity')).toBe('day');
    expect(exported.filename).toBe('link-report.csv');
    expect(exported.blob).toBe(blob);
  });
});
