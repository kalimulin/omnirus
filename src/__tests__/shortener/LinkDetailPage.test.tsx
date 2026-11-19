import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as shortenerApi from '@/api/shortener';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';
import LinkDetailPage from '@/pages/Shortener/LinkDetailPage/LinkDetailPage';
import theme from '@/theme';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-responsive-container">{children}</div>
    ),
  };
});

const renderLinkDetail = (linkId = 'sc-1') =>
  render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[`/links/${linkId}`]}>
        <Routes>
          <Route path="/links/:id" element={<LinkDetailPage />} />
          <Route path="/links" element={<div>Список ссылок</div>} />
          <Route path="/campaigns/:id" element={<div>Карточка кампании</div>} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>,
  );

describe('LinkDetailPage (карточка ссылки)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token-123',
    });

    vi.spyOn(shortenerApi, 'fetchCampaigns').mockResolvedValue([]);
    vi.spyOn(shortenerApi, 'fetchTags').mockResolvedValue([]);
    vi.spyOn(shortenerApi, 'fetchLink').mockResolvedValue({
      id: 'sc-1',
      name: 'Черная пятница',
      description: 'Для отслеживания рекламной кампании по акции «Черная пятница»',
      shortUrl: 'omni/fbl2V',
      shortcut: 'fbl2V',
      targetUrl: 'https://shop.example.ru/landing/email?utm_source=omnirus',
      campaignId: null,
      campaign: 'Без кампании',
      tags: ['email', 'promo'],
      status: 'active',
      clicks: 5554,
      createdAt: '2026-09-07T10:00:00.000Z',
      modifiedAt: '2026-09-07T10:00:00.000Z',
    });

    vi.spyOn(shortenerApi, 'fetchLinkStatistics').mockImplementation(
      async (_id, opts) => {
        const granularity =
          typeof opts === 'object' ? opts.granularity : 'day';
        if (granularity === 'hour') {
          return {
            total: 5554,
            unique: 4332,
            byDay: [],
            series: [
              { period: '2026-09-07T00:00:00', clicks: 21, uniqueVisitors: 15 },
              { period: '2026-09-08T21:00:00', clicks: 16, uniqueVisitors: 12 },
            ],
            granularity: 'hour',
          };
        }
        return {
          total: 5554,
          unique: 4332,
          byDay: [
            { date: '2026-09-07', value: 220 },
            { date: '2026-09-08', value: 140 },
            { date: '2026-09-10', value: 0 },
          ],
          series: [
            { period: '2026-09-07', clicks: 220, uniqueVisitors: 180 },
            { period: '2026-09-08', clicks: 140, uniqueVisitors: 110 },
            { period: '2026-09-10', clicks: 0, uniqueVisitors: 0 },
          ],
          granularity: 'day',
        };
      },
    );
  });

  afterEach(() => {
    clearAuthCookies();
    vi.restoreAllMocks();
  });

  test('отображает карточку ссылки, 4 KPI-метрики, посуточный и почасовой графики без переключателя мок-состояний', async () => {
    renderLinkDetail('sc-1');

    expect(await screen.findByText('omni/fbl2V')).toBeInTheDocument();
    expect(
      screen.getByText(
        'https://shop.example.ru/landing/email?utm_source=omnirus',
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Для отслеживания рекламной кампании по акции «Черная пятница»',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('promo')).toBeInTheDocument();
    expect(screen.getByText('Без кампании')).toBeInTheDocument();
    expect(screen.getByText('07.09.2026')).toBeInTheDocument();

    // Отсутствует прототипный переключатель состояний
    expect(screen.queryByText(/Состояние карточки/i)).not.toBeInTheDocument();

    // Метрики и оба графика
    expect(await screen.findByText('Всего переходов')).toBeInTheDocument();
    expect(screen.getByText('Уникальных переходов')).toBeInTheDocument();
    expect(screen.getByText('В среднем за день')).toBeInTheDocument();
    expect(screen.getByText('Пик')).toBeInTheDocument();
    expect(screen.getByText('220')).toBeInTheDocument();
    expect(screen.getByText('7 сен')).toBeInTheDocument();

    expect(
      screen.getByText('Посуточная динамика переходов'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Почасовая динамика переходов'),
    ).toBeInTheDocument();

    expect(shortenerApi.fetchLinkStatistics).toHaveBeenCalledWith(
      'sc-1',
      expect.objectContaining({ granularity: 'day' }),
    );
    expect(shortenerApi.fetchLinkStatistics).toHaveBeenCalledWith(
      'sc-1',
      expect.objectContaining({ granularity: 'hour' }),
    );
  });

  test('открывает меню действий ссылки (⋯) с пунктами управления', async () => {
    renderLinkDetail('sc-1');

    await screen.findByText('omni/fbl2V');

    const moreButton = screen.getByRole('button', {
      name: 'Действия со ссылкой',
    });
    fireEvent.click(moreButton);

    expect(
      await screen.findByText('Перенаправить на другой URL'),
    ).toBeInTheDocument();
    expect(screen.getByText('Добавить в кампанию')).toBeInTheDocument();
    expect(screen.getByText('Редактировать информацию')).toBeInTheDocument();
    expect(screen.getByText('Деактивировать')).toBeInTheDocument();
  });

  test('показывает пустое состояние статистики при нуле переходов', async () => {
    vi.spyOn(shortenerApi, 'fetchLinkStatistics').mockResolvedValue({
      total: 0,
      unique: 0,
      byDay: [],
      series: [],
    });

    renderLinkDetail('sc-1');

    expect(await screen.findByText('Переходов пока нет')).toBeInTheDocument();
  });

  test('показывает ошибку загрузки и повторно запрашивает ссылку по кнопке «Повторить»', async () => {
    const fetchLinkSpy = vi
      .spyOn(shortenerApi, 'fetchLink')
      .mockRejectedValueOnce(new Error('Сеть недоступна'))
      .mockResolvedValueOnce({
        id: 'sc-1',
        name: 'Восстановленная ссылка',
        description: '',
        shortUrl: 'omni/restored',
        shortcut: 'restored',
        targetUrl: 'https://example.ru',
        campaign: 'Без кампании',
        tags: [],
        status: 'active',
        clicks: 0,
        createdAt: '2026-09-07T10:00:00.000Z',
      });

    renderLinkDetail('sc-1');

    expect(
      await screen.findByText('Не удалось загрузить ссылку'),
    ).toBeInTheDocument();
    expect(screen.getByText('Сеть недоступна')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));

    await waitFor(() => {
      expect(fetchLinkSpy).toHaveBeenCalledTimes(2);
    });
    expect(await screen.findByText('omni/restored')).toBeInTheDocument();
  });
});
