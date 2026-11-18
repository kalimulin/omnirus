import { ChakraProvider } from '@chakra-ui/react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as shortenerApi from '@/api/shortener';
import ShortLinkRedirectPage from '@/pages/Shortener/ShortLinkRedirectPage/ShortLinkRedirectPage';
import type { LinkRow } from '@/types/shortener';

function renderWithRouting(initialEntry: string) {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/s/:code" element={<ShortLinkRedirectPage />} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe('ShortLinkRedirectPage — обработка переходов по коротким ссылкам', () => {
  const originalLocation = window.location;

  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // @ts-expect-error Mocking window.location
    delete window.location;
    window.location = {
      ...originalLocation,
      replace: vi.fn(),
      href: 'http://localhost/'
    } as unknown as Location;
  });

  afterEach(() => {
    window.location = originalLocation;
    localStorage.clear();
  });

  test('отображает экран «Такой ссылки не существует», если ссылка не найдена', async () => {
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([]);

    renderWithRouting('/s/unknown404');

    expect(
      await screen.findByRole('heading', { name: 'Такой ссылки не существует' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Проверьте адрес: возможно, при копировании потерялся символ.'
      )
    ).toBeInTheDocument();
  });

  test('отображает экран «Ссылка временно не работает», если ссылка неактивна и без резервного адреса', async () => {
    const inactiveLink: LinkRow = {
      id: 'link-inactive-1',
      name: 'Неактивная акция',
      description: '',
      shortUrl: 'https://shortcut.ru/s/promo-off',
      shortcut: 'promo-off',
      targetUrl: 'https://example.com/promo',
      campaign: 'Без кампании',
      tags: [],
      status: 'неактивна',
      clicks: 10,
      createdAt: '2026-11-10T10:00:00Z'
    };
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([inactiveLink]);

    renderWithRouting('/s/promo-off');

    expect(
      await screen.findByRole('heading', { name: 'Ссылка временно не работает' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Автор приостановил переходы по этой короткой ссылке. Возможно, она заработает позже — уточните у того, кто ее прислал.'
      )
    ).toBeInTheDocument();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  test('выполняет редирект на резервный URL, если неактивная ссылка имеет reserveUrl', async () => {
    const inactiveWithReserve: LinkRow = {
      id: 'link-inactive-reserve',
      name: 'Неактивная с резервом',
      description: '',
      shortUrl: 'https://shortcut.ru/s/promo-reserve',
      shortcut: 'promo-reserve',
      targetUrl: 'https://example.com/expired-promo',
      reserveUrl: 'https://example.com/fallback-page',
      campaign: 'Без кампании',
      tags: [],
      status: 'неактивна',
      clicks: 10,
      createdAt: '2026-11-10T10:00:00Z'
    };
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([
      inactiveWithReserve
    ]);

    renderWithRouting('/s/promo-reserve');

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith(
        'https://example.com/fallback-page'
      );
    });
  });

  test('отображает экран «Переход по ссылке остановлен», если ссылка заблокирована', async () => {
    const blockedLink: LinkRow = {
      id: 'link-blocked-1',
      name: 'Заблокированная фишинговая ссылка',
      description: '',
      shortUrl: 'https://shortcut.ru/s/bad-link',
      shortcut: 'bad-link',
      targetUrl: 'https://phishing-site.test/login',
      campaign: 'Без кампании',
      tags: [],
      status: 'заблокирована',
      clicks: 0,
      createdAt: '2026-11-10T10:00:00Z'
    };
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([blockedLink]);

    renderWithRouting('/s/bad-link');

    expect(
      await screen.findByRole('heading', { name: 'Переход по ссылке остановлен' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Адрес назначения не прошел проверку безопасности и заблокирован модератором сервиса. Если вы получили эту ссылку в сообщении, будьте осторожны с отправителем.'
      )
    ).toBeInTheDocument();
    expect(window.location.replace).not.toHaveBeenCalled();
  });

  test('выполняет редирект на целевой URL для активной ссылки', async () => {
    const activeLink: LinkRow = {
      id: 'link-active-1',
      name: 'Активная ссылка',
      description: '',
      shortUrl: 'https://shortcut.ru/s/good-link',
      shortcut: 'good-link',
      targetUrl: 'https://example.com/real-target',
      campaign: 'Без кампании',
      tags: [],
      status: 'активна',
      clicks: 10,
      createdAt: '2026-11-10T10:00:00Z'
    };
    vi.spyOn(shortenerApi, 'fetchLinks').mockResolvedValue([activeLink]);

    renderWithRouting('/s/good-link');

    await waitFor(() => {
      expect(window.location.replace).toHaveBeenCalledWith(
        'https://example.com/real-target'
      );
    });
  });
});
