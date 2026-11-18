import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as shortenerApi from '@/api/shortener';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';
import CampaignDetailPage from '@/pages/Shortener/CampaignDetailPage/CampaignDetailPage';
import theme from '@/theme';

vi.mock('recharts', async () => {
  const actual = await vi.importActual<typeof import('recharts')>('recharts');
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-responsive-container">{children}</div>
    )
  };
});

const renderCampaignDetail = (campaignId = 'camp-1') =>
  render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[`/campaigns/${campaignId}`]}>
        <Routes>
          <Route
            path="/campaigns/:id"
            element={<CampaignDetailPage />}
          />
          <Route
            path="/campaigns/:id/add-link"
            element={<div>Страница добавления ссылки</div>}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );

describe('CampaignDetailPage — вкладка Аналитика', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token-123'
    });

    vi.spyOn(shortenerApi, 'fetchCampaign').mockResolvedValue({
      id: 'camp-1',
      name: 'Тестовая кампания',
      description: 'Описание тестовой кампании',
      linksCount: 0,
      shortLinksCount: 0,
      clicksCount: 0,
      createdAt: '2026-11-10T10:00:00.000Z'
    });
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([]);
    vi.spyOn(shortenerApi, 'fetchCampaignStatistics').mockResolvedValue({
      total: 0,
      unique: 0,
      clicksCount: 0,
      uniqueVisitorsCount: 0,
      byDay: [],
      byHour: [],
      utmSources: []
    });
  });

  afterEach(() => {
    clearAuthCookies();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  test('при отсутствии ссылок во вкладке «Аналитика» отображается пустое состояние с призывом добавить первую ссылку', async () => {
    renderCampaignDetail('camp-1');

    // Ждем загрузки кампании
    expect(
      await screen.findByRole('heading', { name: 'Тестовая кампания' })
    ).toBeInTheDocument();

    // Переключаемся на вкладку «Аналитика»
    const analyticsTab = screen.getByRole('tab', { name: 'Аналитика' });
    fireEvent.click(analyticsTab);

    // Проверяем элементы пустого состояния во вкладке «Аналитика»
    expect(
      await screen.findByText(
        'Добавьте в кампанию первую ссылку для отслеживания аналитики'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        /Переходы начнут попадать в отчет сразу после первых кликов аудитории/
      )
    ).toBeInTheDocument();

    const addLinkButtons = screen.getAllByRole('button', {
      name: 'Добавить ссылку в кампанию'
    });
    // В DOM две панели вкладок (Ссылки и Аналитика)
    const analyticsAddBtn = addLinkButtons[addLinkButtons.length - 1];
    expect(analyticsAddBtn).toBeInTheDocument();

    // Селектор периода и кнопка экспорта скрыты при отсутствии ссылок
    expect(screen.queryByText('Экспорт в Excel')).not.toBeInTheDocument();

    // Клик по кнопке переводит на страницу создания ссылки в кампанию
    fireEvent.click(analyticsAddBtn);
    expect(
      await screen.findByText('Страница добавления ссылки')
    ).toBeInTheDocument();
  });

  test('при отсутствии переходов (даже при наличии ссылок) во вкладке «Аналитика» отображается пустое состояние как на макете', async () => {
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([
      {
        id: 'link-1',
        name: 'Ссылка 1',
        description: 'Описание',
        shortUrl: 'omni/abc',
        targetUrl: 'https://example.com',
        campaignId: 'camp-1',
        campaign: 'Тестовая кампания',
        tags: [],
        status: 'active',
        clicks: 0,
        createdAt: '2026-11-10T10:00:00.000Z'
      }
    ]);
    vi.spyOn(shortenerApi, 'fetchCampaignStatistics').mockResolvedValue({
      total: 0,
      unique: 0,
      byDay: []
    });

    renderCampaignDetail('camp-1');

    expect(
      await screen.findByRole('heading', { name: 'Тестовая кампания' })
    ).toBeInTheDocument();

    const analyticsTab = screen.getByRole('tab', { name: 'Аналитика' });
    fireEvent.click(analyticsTab);

    // При отсутствии переходов селектор и кнопка экспорта скрыты, отображается пустое состояние
    expect(screen.queryByText('Экспорт в Excel')).not.toBeInTheDocument();
    expect(
      await screen.findByText(
        'Добавьте в кампанию первую ссылку для отслеживания аналитики'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Переходы начнут попадать в отчет сразу после первых кликов аудитории/
      )
    ).toBeInTheDocument();
  });

  test('при наличии переходов во вкладке «Аналитика» отображаются фильтры, графики и кнопка экспорта', async () => {
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([
      {
        id: 'link-1',
        name: 'Ссылка 1',
        description: 'Описание',
        shortUrl: 'omni/abc',
        targetUrl: 'https://example.com',
        campaignId: 'camp-1',
        campaign: 'Тестовая кампания',
        tags: [],
        status: 'active',
        clicks: 5,
        createdAt: '2026-11-10T10:00:00.000Z'
      }
    ]);
    vi.spyOn(shortenerApi, 'fetchCampaignStatistics').mockResolvedValue({
      total: 42,
      unique: 30,
      byDay: [{ date: '2026-11-10', value: 42 }]
    });

    renderCampaignDetail('camp-1');

    expect(
      await screen.findByRole('heading', { name: 'Тестовая кампания' })
    ).toBeInTheDocument();

    const analyticsTab = screen.getByRole('tab', { name: 'Аналитика' });
    fireEvent.click(analyticsTab);

    // При наличии переходов фильтры и кнопка экспорта отображаются
    expect(await screen.findByText('Экспорт в Excel')).toBeInTheDocument();
    expect(
      screen.queryByText(
        'Добавьте в кампанию первую ссылку для отслеживания аналитики'
      )
    ).not.toBeInTheDocument();
  });

  test('во вкладке «Ссылки» отображается кнопка «Сбросить фильтры» и сбрасывает значения фильтров', async () => {
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([
      {
        id: 'link-1',
        name: 'Ссылка 1',
        description: 'Описание',
        shortUrl: 'omni/abc',
        targetUrl: 'https://example.com',
        campaignId: 'camp-1',
        campaign: 'Тестовая кампания',
        tags: ['tag-1'],
        status: 'active',
        clicks: 10,
        createdAt: '2026-11-10T10:00:00.000Z'
      }
    ]);

    renderCampaignDetail('camp-1');

    expect(
      await screen.findByRole('heading', { name: 'Тестовая кампания' })
    ).toBeInTheDocument();

    const resetButton = await screen.findByRole('button', {
      name: 'Сбросить фильтры'
    });
    expect(resetButton).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      'Поиск по названию, URL или тегу'
    );
    fireEvent.change(searchInput, {
      target: { value: 'несуществующий текст' }
    });
    expect(searchInput).toHaveValue('несуществующий текст');

    fireEvent.click(resetButton);
    expect(searchInput).toHaveValue('');
  });

  test('во вкладке «Ссылки» меню действий строки содержит пункт «Переместить в другую кампанию»', async () => {
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([
      {
        id: 'link-1',
        name: 'Ссылка 1',
        description: 'Описание',
        shortUrl: 'omni/abc',
        targetUrl: 'https://example.com',
        campaignId: 'camp-1',
        campaign: 'Тестовая кампания',
        tags: ['tag-1'],
        status: 'active',
        clicks: 10,
        createdAt: '2026-11-10T10:00:00.000Z'
      }
    ]);

    renderCampaignDetail('camp-1');

    expect(
      await screen.findByRole('heading', { name: 'Тестовая кампания' })
    ).toBeInTheDocument();

    const actionMenuBtn = await screen.findByRole('button', {
      name: 'Действия со ссылкой'
    });
    fireEvent.click(actionMenuBtn);

    expect(
      screen.getByText('Переместить в другую кампанию')
    ).toBeInTheDocument();
    expect(screen.queryByText('Добавить в кампанию')).not.toBeInTheDocument();
  });

  test('в списке ссылок название кампании подставляется из карточки кампании, даже если API вернул «Без кампании»', async () => {
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([
      {
        id: 'link-1',
        name: 'Ссылка 1',
        description: 'Описание',
        shortUrl: 'omni/abc',
        targetUrl: 'https://example.com',
        campaignId: 'camp-1',
        campaign: 'Без кампании',
        tags: ['tag-1'],
        status: 'active',
        clicks: 10,
        createdAt: '2026-11-10T10:00:00.000Z'
      }
    ]);

    renderCampaignDetail('camp-1');

    expect(
      await screen.findByRole('heading', { name: 'Тестовая кампания' })
    ).toBeInTheDocument();

    const table = document.querySelector('table');
    expect(table).not.toBeNull();
    const rows = table!.querySelectorAll('tbody tr');
    expect(rows.length).toBe(1);
    expect(rows[0]).toHaveTextContent('Тестовая кампания');
    expect(rows[0]).not.toHaveTextContent('Без кампании');
  });
});
