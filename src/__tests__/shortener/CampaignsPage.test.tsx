import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';
import CampaignsPage from '@/pages/Shortener/CampaignsPage/CampaignsPage';

import { renderWithProviders } from '../../test/utils';

describe('CampaignsPage — авторизованный режим API', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthCookies();
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
  });

  afterEach(() => {
    clearAuthCookies();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('загружает кампании (campaign_id, title, created_date) и подтягивает счётчики из /stats/campaign/{id}', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'camp-jwt-token'
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === '/api/campaigns') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                campaignId: 'camp-uuid-10',
                name: 'Осенний запуск',
                description: 'Кампания для теста',
                createdAt: '2026-11-10T10:00:00Z',
                modifiedAt: '2026-11-10T10:00:00Z'
              }
            ],
            meta: { total: 1, count: 1, page: 1, perPage: 50 }
          })
        } as Response;
      }

      if (url === '/api/stats/campaigns/camp-uuid-10?granularity=day') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            dateFrom: '2026-11-01',
            dateTo: '2026-11-11',
            granularity: 'day',
            total: 124,
            unique: 90,
            series: [],
            shortcuts: [
              { shortcutId: 's1', shortcut: 'a1', clicks: 100, uniqueVisitors: 70 },
              { shortcutId: 's2', shortcut: 'b2', clicks: 20, uniqueVisitors: 16 },
              { shortcutId: 's3', shortcut: 'c3', clicks: 4, uniqueVisitors: 4 }
            ]
          })
        } as Response;
      }

      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<CampaignsPage />);

    expect(await screen.findByText('Осенний запуск')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('124')).toBeInTheDocument();
      expect(screen.getAllByText('3')).toHaveLength(2);
    });
  });

  test('показывает пустое состояние, если GET /campaigns/ вернул 404 или пустой массив', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'camp-jwt-token'
    });

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 404,
        json: async () => ({ detail: 'Not found' })
      })
    );

    renderWithProviders(<CampaignsPage />);

    expect(
      await screen.findByText('Здесь появится список ваших кампаний')
    ).toBeInTheDocument();
  });

  test('корректно отображает количество целевых URL и коротких ссылок, даже когда статистика кликов пуста', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'camp-jwt-token'
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);

      if (url === '/api/campaigns') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                campaignId: 'camp-uuid-20',
                name: 'Новая кампания',
                description: 'Кампания с новыми ссылками',
                createdAt: '2026-11-12T10:00:00Z',
                modifiedAt: '2026-11-12T10:00:00Z'
              }
            ],
            meta: { total: 1, count: 1, page: 1, perPage: 50 }
          })
        } as Response;
      }

      if (url.startsWith('/api/shortcuts?campaignId=camp-uuid-20')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                shortcutId: 'sc-1',
                shortcut: 'promo-tg',
                target: 'https://example.com/promo',
                campaignId: 'camp-uuid-20',
                status: 'active',
                clicksCount: 0
              },
              {
                shortcutId: 'sc-2',
                shortcut: 'promo-vk',
                target: 'https://example.com/promo',
                campaignId: 'camp-uuid-20',
                status: 'active',
                clicksCount: 0
              },
              {
                shortcutId: 'sc-3',
                shortcut: 'blog-post',
                target: 'https://example.com/blog',
                campaignId: 'camp-uuid-20',
                status: 'active',
                clicksCount: 0
              }
            ],
            meta: { total: 3, count: 3 }
          })
        } as Response;
      }

      if (url.startsWith('/api/stats/campaigns/camp-uuid-20')) {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            dateFrom: '2026-11-01',
            dateTo: '2026-11-12',
            granularity: 'day',
            total: 0,
            unique: 0,
            series: [],
            shortcuts: null
          })
        } as Response;
      }

      throw new Error(`Unexpected URL: ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<CampaignsPage />);

    expect(await screen.findByText('Новая кампания')).toBeInTheDocument();

    // 2 уникальных целевых URL (https://example.com/promo и https://example.com/blog)
    // 3 коротких ссылки всего
    // 0 переходов
    await waitFor(() => {
      expect(screen.getByText('2')).toBeInTheDocument(); // Целевых URL
      expect(screen.getByText('3')).toBeInTheDocument(); // Коротких ссылок
      expect(screen.getByText('0')).toBeInTheDocument(); // Переходов
    });
  });
});

describe('CampaignsPage — режим без API', () => {
  beforeEach(() => {
    localStorage.clear();
    clearAuthCookies();
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
  });

  afterEach(() => {
    clearAuthCookies();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('отображает пустое состояние при отсутствии токена API', async () => {
    renderWithProviders(<CampaignsPage />);

    expect(
      await screen.findByText('Здесь появится список ваших кампаний')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Создать первую кампанию' })
    ).toBeInTheDocument();
  });
});
