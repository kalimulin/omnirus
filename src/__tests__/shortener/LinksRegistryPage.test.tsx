import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { checkUrlSafety } from '@/api/shortenerPublic';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';
import LinksRegistryPage from '@/pages/Shortener/LinksRegistryPage/LinksRegistryPage';

import { renderWithProviders } from '../../test/utils';

vi.mock('@/api/shortenerPublic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/shortenerPublic')>();
  return {
    ...actual,
    checkUrlSafety: vi.fn()
  };
});

const mockedCheckUrlSafety = vi.mocked(checkUrlSafety);

describe('LinksRegistryPage — подсветка измененной строки', () => {
  const originalScrollTo = Element.prototype.scrollTo;
  const initialCampaigns = [
    {
      id: 'camp-1',
      name: 'Летние продажи',
      description: '',
      linksCount: 0,
      shortLinksCount: 0,
      totalClicks: 0,
      createdAt: '2026-09-01T10:00:00.000Z',
      tags: ['promo']
    }
  ];
  const initialLinks = [
    {
      id: '3a0alc',
      name: 'Черная пятница - Телеграм',
      description: 'Пост в Telegram',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      shortcut: '3a0alc',
      targetUrl: 'https://example.com/black-friday/social-media',
      campaign: 'Без кампании',
      tags: ['telegram'],
      status: 'active' as const,
      clicks: 0,
      createdAt: '2026-09-10T10:00:00.000Z'
    }
  ];

  const renderRegistry = () =>
    renderWithProviders(
      <LinksRegistryPage links={initialLinks} campaigns={initialCampaigns} />
    );

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    Element.prototype.scrollTo = vi.fn();
    mockedCheckUrlSafety.mockResolvedValue({
      url: 'https://example.com/updated-target',
      threatLevel: 'safe',
      isSafe: true,
      isSuspicious: false,
      isBlocked: false,
      isInvalid: false,
      reasons: [],
      score: 0,
      timestamp: '2026-11-12T10:00:00Z',
      checkedBy: 'validator',
      recommendations: [],
      error: null
    });
    localStorage.clear();
  });

  afterEach(() => {
    act(() => {
      vi.advanceTimersByTime(5000);
    });
    vi.useRealTimers();
    localStorage.clear();
    Element.prototype.scrollTo = originalScrollTo;
  });

  const getTableRow = (linkName: string) => {
    const table = document.querySelector('table');
    expect(table).not.toBeNull();
    const row = within(table!).getByText(linkName).closest('tr');
    expect(row).not.toBeNull();
    return row!;
  };

  const openRowActionMenu = (linkName: string, actionName: string) => {
    const row = getTableRow(linkName);
    const menuButton = within(row).getByRole('button', {
      name: 'Действия со ссылкой'
    });
    fireEvent.click(menuButton);

    const actionItem = screen.getByText(actionName);
    fireEvent.click(actionItem);
    return row;
  };

  test('подсвечивает строку после сохранения в кампанию и сбрасывает подсветку по таймеру', () => {
    renderRegistry();

    const row = openRowActionMenu(
      'Черная пятница - Телеграм',
      'Добавить в кампанию'
    );
    expect(row).not.toHaveAttribute('data-highlighted');

    const modal = screen.getByRole('dialog');
    const select = within(modal).getByRole('combobox');
    fireEvent.change(select, { target: { value: 'Летние продажи' } });
    fireEvent.click(
      within(modal).getByRole('button', { name: 'Добавить в кампанию' })
    );

    const updatedRow = getTableRow('Черная пятница - Телеграм');
    expect(
      screen.getByText('Изменения успешно сохранены.')
    ).toBeInTheDocument();
    expect(updatedRow).toHaveAttribute('data-highlighted', 'true');
    expect(updatedRow).toHaveStyle({ backgroundColor: 'var(--success-bg)' });

    act(() => {
      vi.advanceTimersByTime(1999);
    });
    expect(updatedRow).toHaveAttribute('data-highlighted', 'true');

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(updatedRow).not.toHaveAttribute('data-highlighted');
    expect(updatedRow).not.toHaveStyle({
      backgroundColor: 'var(--success-bg)'
    });
  });

  test('подсвечивает строку после сохранения отредактированной информации и не подсвечивает при отмене', async () => {
    renderRegistry();

    openRowActionMenu('Черная пятница - Телеграм', 'Редактировать информацию');

    const cancelDialog = screen.getByRole('dialog');
    fireEvent.click(
      within(cancelDialog).getByRole('button', { name: 'Отмена' })
    );
    expect(getTableRow('Черная пятница - Телеграм')).not.toHaveAttribute(
      'data-highlighted'
    );

    openRowActionMenu('Черная пятница - Телеграм', 'Редактировать информацию');

    const editDialog = screen.getByRole('dialog');
    expect(
      within(editDialog).getByText('Редактирование информации о ссылке')
    ).toBeInTheDocument();
    expect(
      within(editDialog).getByText('shortcut-external.fenimore.skroy.ru/s/3a0alc')
    ).toBeInTheDocument();
    expect(
      within(editDialog).getByText('https://example.com/black-friday/social-media')
    ).toBeInTheDocument();

    const nameInput = within(editDialog).getByDisplayValue(
      'Черная пятница - Телеграм'
    );
    fireEvent.change(nameInput, {
      target: { value: 'Черная пятница - Обновленная' }
    });

    await act(async () => {
      fireEvent.click(
        within(editDialog).getByRole('button', { name: 'Сохранить изменения' })
      );
      await Promise.resolve();
    });

    const savedRow = getTableRow('Черная пятница - Обновленная');
    expect(
      screen.getByText('Изменения успешно сохранены.')
    ).toBeInTheDocument();
    expect(savedRow).toHaveAttribute('data-highlighted', 'true');
    expect(savedRow).toHaveStyle({ backgroundColor: 'var(--success-bg)' });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(savedRow).not.toHaveAttribute('data-highlighted');
    expect(savedRow).not.toHaveStyle({
      backgroundColor: 'var(--success-bg)'
    });
  });

  test('подсвечивает строку после сохранения целевого URL и закрытия окна подтверждения', async () => {
    renderRegistry();

    openRowActionMenu(
      'Черная пятница - Телеграм',
      'Перенаправить на другой URL'
    );

    const redirectDialog = screen.getByRole('dialog');
    const urlInput = within(redirectDialog).getByDisplayValue(
      'https://example.com/black-friday/social-media'
    );
    fireEvent.change(urlInput, {
      target: { value: 'https://example.com/updated-target' }
    });
    await act(async () => {
      fireEvent.submit(redirectDialog.querySelector('form')!);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedCheckUrlSafety).toHaveBeenCalledWith(
      'https://example.com/updated-target'
    );

    act(() => {
      vi.advanceTimersByTime(2100);
    });
    act(() => {
      vi.advanceTimersByTime(400);
    });

    const promptDialog = screen.getByRole('dialog');
    expect(
      within(promptDialog).getByText(
        'Целевой URL изменен. Хотите изменить другую информацию о ссылке?'
      )
    ).toBeInTheDocument();

    expect(getTableRow('Черная пятница - Телеграм')).not.toHaveAttribute(
      'data-highlighted'
    );

    fireEvent.click(
      within(promptDialog).getByRole('button', {
        name: /Сохранить без изменений/
      })
    );

    const updatedRow = getTableRow('Черная пятница - Телеграм');
    expect(
      screen.getByText('Изменения успешно сохранены.')
    ).toBeInTheDocument();
    expect(updatedRow).toHaveAttribute('data-highlighted', 'true');
    expect(updatedRow).toHaveStyle({ backgroundColor: 'var(--success-bg)' });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(updatedRow).not.toHaveAttribute('data-highlighted');
    expect(updatedRow).not.toHaveStyle({
      backgroundColor: 'var(--success-bg)'
    });
  });

  test('подсвечивает строку и показывает уведомление при деактивации (с подтверждением и прогрессом) и активации ссылки', async () => {
    renderRegistry();

    // Деактивация активной ссылки открывает диалог подтверждения
    openRowActionMenu('Черная пятница - Телеграм', 'Деактивировать');

    const confirmDialog = screen.getByRole('dialog');
    expect(
      within(confirmDialog).getByText('Деактивировать ссылку?')
    ).toBeInTheDocument();
    expect(
      within(confirmDialog).getByText(
        'shortcut-external.fenimore.skroy.ru/s/3a0alc'
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Изменения успешно сохранены.')
    ).not.toBeInTheDocument();
    expect(getTableRow('Черная пятница - Телеграм')).not.toHaveAttribute(
      'data-highlighted'
    );

    // Кнопка "Деактивировать" заблокирована, пока не отмечен чекбокс подтверждения
    const deactivateSubmitBtn = within(confirmDialog).getByRole('button', {
      name: 'Деактивировать'
    });
    expect(deactivateSubmitBtn).toBeDisabled();

    fireEvent.click(
      within(confirmDialog).getByRole('checkbox', {
        name: 'Понимаю, что переходы по короткой ссылке перестанут работать'
      })
    );
    expect(deactivateSubmitBtn).not.toBeDisabled();

    // Подтверждение запускает ProgressModal с надписью "Деактивация ссылки"
    fireEvent.click(deactivateSubmitBtn);

    const progressDialog = screen.getByRole('dialog');
    expect(
      within(progressDialog).getByText('Деактивация ссылки')
    ).toBeInTheDocument();
    expect(
      screen.queryByText('Изменения успешно сохранены.')
    ).not.toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
    });

    expect(screen.queryByText('Деактивация ссылки')).not.toBeInTheDocument();
    const deactivatedRow = getTableRow('Черная пятница - Телеграм');
    expect(within(deactivatedRow).getByText('неактивна')).toBeInTheDocument();
    expect(screen.getByText('Ссылка деактивирована')).toBeInTheDocument();
    expect(
      screen.getByText(
        'shortcut-external.fenimore.skroy.ru/s/3a0alc временно не работает — переходы отдают страницу 404'
      )
    ).toBeInTheDocument();
    expect(deactivatedRow).toHaveAttribute('data-highlighted', 'true');
    expect(deactivatedRow).toHaveStyle({
      backgroundColor: 'var(--orange-50)'
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(deactivatedRow).not.toHaveAttribute('data-highlighted');
    expect(deactivatedRow).not.toHaveStyle({
      backgroundColor: 'var(--orange-50)'
    });

    // Повторная активация ссылки
    openRowActionMenu('Черная пятница - Телеграм', 'Активировать');
    const activateModal = screen.getByRole('dialog');
    expect(within(activateModal).getByText('Активировать ссылку?')).toBeInTheDocument();
    fireEvent.click(within(activateModal).getByRole('button', { name: 'Активировать' }));

    const reactivatedRow = getTableRow('Черная пятница - Телеграм');
    expect(within(reactivatedRow).getByText('активна')).toBeInTheDocument();
    expect(
      screen.getByText('Изменения успешно сохранены.')
    ).toBeInTheDocument();
    expect(reactivatedRow).toHaveAttribute('data-highlighted', 'true');
    expect(reactivatedRow).toHaveStyle({
      backgroundColor: 'var(--success-bg)'
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(reactivatedRow).not.toHaveAttribute('data-highlighted');
  });

  test('отмена подтверждения или прогресса деактивации не меняет статус ссылки', () => {
    renderRegistry();

    // Отмена в окне подтверждения
    openRowActionMenu('Черная пятница - Телеграм', 'Деактивировать');
    const confirmDialog = screen.getByRole('dialog');
    fireEvent.click(
      within(confirmDialog).getByRole('button', { name: 'Отмена' })
    );

    act(() => {
      vi.advanceTimersByTime(300);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Деактивация ссылки')).not.toBeInTheDocument();
    expect(
      within(getTableRow('Черная пятница - Телеграм')).getByText('активна')
    ).toBeInTheDocument();

    // Подтверждение, затем отмена во время ProgressModal
    openRowActionMenu('Черная пятница - Телеграм', 'Деактивировать');
    const secondConfirmDialog = screen.getByRole('dialog');
    fireEvent.click(
      within(secondConfirmDialog).getByRole('checkbox', {
        name: 'Понимаю, что переходы по короткой ссылке перестанут работать'
      })
    );
    fireEvent.click(
      within(secondConfirmDialog).getByRole('button', {
        name: 'Деактивировать'
      })
    );
    const progressDialog = screen.getByRole('dialog');
    expect(
      within(progressDialog).getByText('Деактивация ссылки')
    ).toBeInTheDocument();
    fireEvent.click(
      within(progressDialog).getByRole('button', { name: 'Отмена' })
    );

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    const row = getTableRow('Черная пятница - Телеграм');
    expect(within(row).getByText('активна')).toBeInTheDocument();
    expect(row).not.toHaveAttribute('data-highlighted');
    expect(
      screen.queryByText('Изменения успешно сохранены.')
    ).not.toBeInTheDocument();
  });

  test('показывает уведомление и подсвечивает строку при отмене EditLinkModal после смены целевого URL', async () => {
    renderRegistry();

    openRowActionMenu(
      'Черная пятница - Телеграм',
      'Перенаправить на другой URL'
    );

    const redirectDialog = screen.getByRole('dialog');
    fireEvent.change(
      within(redirectDialog).getByDisplayValue(
        'https://example.com/black-friday/social-media'
      ),
      { target: { value: 'https://example.com/updated-target' } }
    );
    await act(async () => {
      fireEvent.submit(redirectDialog.querySelector('form')!);
      await Promise.resolve();
      await Promise.resolve();
    });

    act(() => {
      vi.advanceTimersByTime(2500);
    });

    const promptDialog = screen.getByRole('dialog');
    fireEvent.click(
      within(promptDialog).getByRole('button', { name: 'Редактировать' })
    );

    const editDialog = screen.getByRole('dialog');
    fireEvent.click(within(editDialog).getByRole('button', { name: 'Отмена' }));

    const row = getTableRow('Черная пятница - Телеграм');
    expect(
      screen.getByText('Изменения успешно сохранены.')
    ).toBeInTheDocument();
    expect(row).toHaveAttribute('data-highlighted', 'true');
    expect(row).toHaveStyle({ backgroundColor: 'var(--success-bg)' });
  });

  test('не сохраняет некорректный или заблокированный целевой URL в диалоге перенаправления', async () => {
    renderRegistry();

    openRowActionMenu(
      'Черная пятница - Телеграм',
      'Перенаправить на другой URL'
    );

    const redirectDialog = screen.getByRole('dialog');
    const urlInput = within(redirectDialog).getByDisplayValue(
      'https://example.com/black-friday/social-media'
    );

    // Некорректный формат без протокола
    fireEvent.change(urlInput, {
      target: { value: 'invalid-target-url' }
    });
    await act(async () => {
      fireEvent.submit(redirectDialog.querySelector('form')!);
      await Promise.resolve();
    });

    expect(
      within(redirectDialog).getByText(
        'Некорректный URL. Проверьте формат адреса.'
      )
    ).toBeInTheDocument();
    expect(mockedCheckUrlSafety).not.toHaveBeenCalled();

    // Заблокированный URL по проверке безопасности
    mockedCheckUrlSafety.mockResolvedValueOnce({
      url: 'https://blocked.example.com/bad',
      threatLevel: 'blocked',
      isSafe: false,
      isSuspicious: false,
      isBlocked: true,
      isInvalid: false,
      reasons: ['Домен в чёрном списке'],
      score: 100,
      timestamp: '2026-11-12T10:00:00Z',
      checkedBy: 'blacklist',
      recommendations: [],
      error: null
    });

    fireEvent.change(urlInput, {
      target: { value: 'https://blocked.example.com/bad' }
    });
    await act(async () => {
      fireEvent.submit(redirectDialog.querySelector('form')!);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedCheckUrlSafety).toHaveBeenCalledWith(
      'https://blocked.example.com/bad'
    );
    expect(
      within(redirectDialog).getByText('Домен в чёрном списке')
    ).toBeInTheDocument();
    expect(screen.queryByText('Меняем целевой URL')).not.toBeInTheDocument();

    const row = getTableRow('Черная пятница - Телеграм');
    expect(
      within(row).getByText('https://example.com/black-friday/social-media')
    ).toBeInTheDocument();
  });

  test('отображает пустое состояние без моков, когда сохранённых ссылок нет', () => {
    localStorage.clear();
    renderWithProviders(<LinksRegistryPage />);

    expect(
      screen.getByText('Сократите ссылку до удобного короткого адреса')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Здесь появится список ваших ссылок')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Нажмите кнопку ниже, чтобы сократить вашу первую ссылку'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Больше возможностей')).toBeInTheDocument();
    expect(screen.getByText('для вашего маркетинга')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Храните все короткие ссылки в личном кабинете, редактируйте целевой URL и отслеживайте переход.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Короткие ссылки')).toBeInTheDocument();
    expect(screen.getByText('Аналитика переходов')).toBeInTheDocument();
    expect(
      screen.getByText('Удобное управление с регистрацией')
    ).toBeInTheDocument();
    expect(screen.getByText('Безопасность и надежность')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Сократить ссылку' })
    ).toBeInTheDocument();

    expect(document.querySelector('table')).toBeNull();
  });
});

describe('LinksRegistryPage — авторизованный режим API', () => {
  const originalScrollTo = Element.prototype.scrollTo;

  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
    localStorage.clear();
    clearAuthCookies();
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
  });

  afterEach(() => {
    vi.useRealTimers();
    clearAuthCookies();
    localStorage.clear();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    Element.prototype.scrollTo = originalScrollTo;
  });

  test('загружает реестр с shortcut-core и создаёт ссылку через POST /shortcut/ с Bearer и Project-ID', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'cabinet-jwt-token'
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url === '/api/shortcuts' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                shortcutId: 'api-link-1',
                title: 'Изначальная ссылка API',
                target: 'https://example.ru/initial',
                shortUrl: 'https://example.com/s/init1',
                shortcut: 'init1',
                status: 'active',
                clicksCount: 3,
                createdAt: '2026-11-11T09:00:00Z',
                modifiedAt: '2026-11-11T09:00:00Z',
                tags: ['promo'],
                campaignId: 'camp-uuid-1'
              }
            ],
            meta: { total: 1, count: 1, page: 1, perPage: 50 }
          })
        } as Response;
      }

      if (url === '/api/campaigns' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                campaignId: 'camp-uuid-1',
                name: 'Весенняя распродажа',
                description: '',
                createdAt: '2026-11-11T08:00:00Z',
                modifiedAt: '2026-11-11T08:00:00Z'
              }
            ],
            meta: { total: 1, count: 1, page: 1, perPage: 50 }
          })
        } as Response;
      }

      if (url === '/api/tags' && method === 'GET') {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: { code: 'NOT_FOUND', message: 'Not found' } })
        } as Response;
      }

      if (url === '/api/shortcuts' && method === 'POST') {
        return {
          ok: true,
          status: 201,
          json: async () => ({
            shortcutId: 'api-link-2',
            title: 'Новая ссылка из кабинета',
            target: 'https://example.ru/new-campaign',
            shortUrl: 'https://example.com/s/new99',
            shortcut: 'new99',
            status: 'active',
            createdAt: '2026-11-11T10:00:00Z'
          })
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });

    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<LinksRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Изначальная ссылка API')).toBeInTheDocument();
    });
    const table = document.querySelector('table');
    expect(table).not.toBeNull();
    expect(within(table!).getByText('Весенняя распродажа')).toBeInTheDocument();

    const expectedHeaders = {
      'Content-Type': 'application/json',
      Authorization: 'Bearer cabinet-jwt-token'
    };

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shortcuts',
      expect.objectContaining({ headers: expectedHeaders })
    );
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/campaigns',
      expect.objectContaining({ headers: expectedHeaders })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Сократить ссылку' }));

    const dialog = await screen.findByRole('dialog');
    fireEvent.change(
      within(dialog).getByPlaceholderText('https://example.ru/landing'),
      { target: { value: 'https://example.ru/new-campaign' } }
    );
    fireEvent.change(
      within(dialog).getByPlaceholderText('Например, Пост в Telegram-канале'),
      { target: { value: 'Новая ссылка из кабинета' } }
    );

    fireEvent.click(within(dialog).getByRole('button', { name: 'Сократить' }));

    await waitFor(() => {
      expect(screen.getByText('Новая ссылка из кабинета')).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shortcuts',
      expect.objectContaining({
        method: 'POST',
        headers: expectedHeaders,
        body: JSON.stringify({
          title: 'Новая ссылка из кабинета',
          target: 'https://example.ru/new-campaign',
          description: '',
          tags: [],
          campaignId: null
        })
      })
    );
  });

  test('в авторизованном режиме проверяет целевой URL при перенаправлении перед PATCH /shortcut/{id}', async () => {
    vi.clearAllMocks();
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'cabinet-jwt-token'
    });

    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url === '/api/shortcuts' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                shortcutId: 'api-link-1',
                title: 'Изначальная ссылка API',
                target: 'https://example.ru/initial',
                shortUrl: 'https://example.com/s/init1',
                shortcut: 'init1',
                status: 'active',
                clicksCount: 3,
                createdAt: '2026-11-11T09:00:00Z',
                modifiedAt: '2026-11-11T09:00:00Z',
                tags: [],
                campaignId: null
              }
            ],
            meta: { total: 1, count: 1, page: 1, perPage: 50 }
          })
        } as Response;
      }

      if (url === '/api/campaigns' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ items: [], meta: { total: 0, count: 0 } })
        } as Response;
      }

      if (url === '/api/tags' && method === 'GET') {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: { code: 'NOT_FOUND', message: 'Not found' } })
        } as Response;
      }

      if (url === '/api/shortcuts/api-link-1' && method === 'PATCH') {
        return {
          ok: true,
          status: 200,
          json: async () => ({})
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    mockedCheckUrlSafety.mockResolvedValueOnce({
      url: 'https://blocked.example.ru/bad',
      threatLevel: 'blocked',
      isSafe: false,
      isSuspicious: false,
      isBlocked: true,
      isInvalid: false,
      reasons: ['Домен в чёрном списке'],
      score: 100,
      timestamp: '2026-11-12T10:00:00Z',
      checkedBy: 'blacklist',
      recommendations: [],
      error: null
    });

    renderWithProviders(<LinksRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Изначальная ссылка API')).toBeInTheDocument();
    });

    const table = document.querySelector('table')!;
    const row = within(table).getByText('Изначальная ссылка API').closest('tr')!;
    fireEvent.click(
      within(row).getByRole('button', { name: 'Действия со ссылкой' })
    );
    fireEvent.click(screen.getByText('Перенаправить на другой URL'));

    const redirectDialog = await screen.findByRole('dialog');
    const urlInput = within(redirectDialog).getByDisplayValue(
      'https://example.ru/initial'
    );

    fireEvent.change(urlInput, {
      target: { value: 'https://blocked.example.ru/bad' }
    });
    fireEvent.click(
      within(redirectDialog).getByRole('button', {
        name: 'Изменить целевой URL'
      })
    );

    await waitFor(() => {
      expect(
        within(redirectDialog).getByText('Домен в чёрном списке')
      ).toBeInTheDocument();
    });

    expect(fetchMock).not.toHaveBeenCalledWith(
      '/api/shortcuts/api-link-1',
      expect.anything()
    );
  });

  test('в авторизованном режиме деактивирует ссылку через PATCH /api/shortcuts/{id}/status после подтверждения и поддерживает повтор при ошибке', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'cabinet-jwt-token'
    });

    let patchAttempts = 0;
    const fetchMock = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      const method = init?.method || 'GET';

      if (url === '/api/shortcuts' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            items: [
              {
                shortcutId: 'api-link-1',
                title: 'Изначальная ссылка API',
                target: 'https://example.ru/initial',
                shortUrl: 'shortcut-external.fenimore.skroy.ru/s/init1',
                shortcut: 'init1',
                status: 'active',
                clicksCount: 3,
                createdAt: '2026-11-11T09:00:00Z',
                modifiedAt: '2026-11-11T09:00:00Z',
                tags: [],
                campaignId: null
              }
            ],
            meta: { total: 1, count: 1, page: 1, perPage: 50 }
          })
        } as Response;
      }

      if (url === '/api/campaigns' && method === 'GET') {
        return {
          ok: true,
          status: 200,
          json: async () => ({ items: [], meta: { total: 0, count: 0 } })
        } as Response;
      }

      if (url === '/api/tags' && method === 'GET') {
        return {
          ok: false,
          status: 404,
          json: async () => ({ error: { code: 'NOT_FOUND', message: 'Not found' } })
        } as Response;
      }

      if (url === '/api/shortcuts/api-link-1/status' && method === 'PATCH') {
        patchAttempts += 1;
        if (patchAttempts === 1) {
          return {
            ok: false,
            status: 500,
            json: async () => ({ error: { code: 'INTERNAL_ERROR', message: 'Ошибка сервера при деактивации' } })
          } as Response;
        }
        return {
          ok: true,
          status: 200,
          json: async () => ({})
        } as Response;
      }

      throw new Error(`Unexpected fetch call: ${method} ${url}`);
    });
    vi.stubGlobal('fetch', fetchMock);

    renderWithProviders(<LinksRegistryPage />);

    await waitFor(() => {
      expect(screen.getByText('Изначальная ссылка API')).toBeInTheDocument();
    });

    vi.useFakeTimers();

    const table = document.querySelector('table')!;
    const row = within(table).getByText('Изначальная ссылка API').closest('tr')!;
    fireEvent.click(
      within(row).getByRole('button', { name: 'Действия со ссылкой' })
    );
    fireEvent.click(screen.getByText('Деактивировать'));

    const confirmDialog = screen.getByRole('dialog');
    expect(
      within(confirmDialog).getByText('Деактивировать ссылку?')
    ).toBeInTheDocument();
    expect(patchAttempts).toBe(0);

    fireEvent.click(
      within(confirmDialog).getByRole('checkbox', {
        name: 'Понимаю, что переходы по короткой ссылке перестанут работать'
      })
    );
    fireEvent.click(
      within(confirmDialog).getByRole('button', { name: 'Деактивировать' })
    );

    const progressDialog = screen.getByRole('dialog');
    expect(
      within(progressDialog).getByText('Деактивация ссылки')
    ).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    // Первая попытка завершилась ошибкой — модалка остаётся открытой с кнопкой "Повторить"
    expect(patchAttempts).toBe(1);
    expect(
      within(screen.getByRole('dialog')).getByText('Деактивация ссылки')
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Повторить'
      })
    ).toBeInTheDocument();
    expect(within(row).getByText('активна')).toBeInTheDocument();

    // Повторная попытка проходит успешно
    fireEvent.click(
      within(screen.getByRole('dialog')).getByRole('button', {
        name: 'Повторить'
      })
    );

    await act(async () => {
      vi.advanceTimersByTime(2100);
    });
    await act(async () => {
      vi.advanceTimersByTime(400);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(patchAttempts).toBe(2);
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shortcuts/api-link-1/status',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer cabinet-jwt-token'
        },
        body: JSON.stringify({ status: 'inactive' })
      })
    );
    expect(screen.queryByText('Деактивация ссылки')).not.toBeInTheDocument();
    expect(within(row).getByText('неактивна')).toBeInTheDocument();
    expect(screen.getByText('Ссылка деактивирована')).toBeInTheDocument();
    expect(
      screen.getByText(
        'shortcut-external.fenimore.skroy.ru/s/init1 временно не работает — переходы отдают страницу 404'
      )
    ).toBeInTheDocument();
    expect(row).toHaveAttribute('data-highlighted', 'true');
    expect(row).toHaveStyle({
      backgroundColor: 'var(--orange-50)'
    });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
  });
});

describe('LinksRegistryPage — фильтрация по статусам (Активна, Неактивна, Заблокирована)', () => {
  const originalScrollTo = Element.prototype.scrollTo;
  const statusLinks = [
    {
      id: 'link-1',
      name: 'Активная ссылка',
      description: 'Описание 1',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/link1',
      shortcut: 'link1',
      targetUrl: 'https://example.com/active',
      campaign: 'Без кампании',
      tags: [],
      status: 'active' as const,
      clicks: 10,
      createdAt: '2026-09-10T10:00:00.000Z'
    },
    {
      id: 'link-2',
      name: 'Неактивная ссылка',
      description: 'Описание 2',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/link2',
      shortcut: 'link2',
      targetUrl: 'https://example.com/inactive',
      campaign: 'Без кампании',
      tags: [],
      status: 'inactive' as const,
      clicks: 5,
      createdAt: '2026-09-11T10:00:00.000Z'
    },
    {
      id: 'link-3',
      name: 'Заблокированная ссылка',
      description: 'Описание 3',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/link3',
      shortcut: 'link3',
      targetUrl: 'https://example.com/blocked',
      campaign: 'Без кампании',
      tags: [],
      status: 'blocked' as const,
      clicks: 0,
      createdAt: '2026-09-12T10:00:00.000Z'
    }
  ];

  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
    localStorage.clear();
    clearAuthCookies();
  });

  afterEach(() => {
    localStorage.clear();
    Element.prototype.scrollTo = originalScrollTo;
  });

  test('в выпадающем меню фильтра по статусу присутствуют только «Все статусы», «Активна», «Неактивна», «Заблокирована»', () => {
    renderWithProviders(<LinksRegistryPage links={statusLinks} />);

    const statusSelectButton = screen.getByRole('button', { name: 'Все статусы' });
    fireEvent.click(statusSelectButton);

    expect(screen.getAllByText('Все статусы').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Активна')).toBeInTheDocument();
    expect(screen.getByText('Неактивна')).toBeInTheDocument();
    expect(screen.getByText('Заблокирована')).toBeInTheDocument();

    expect(screen.queryByText('На паузе')).not.toBeInTheDocument();
    expect(screen.queryByText('Завершена')).not.toBeInTheDocument();
    expect(screen.queryByText('В архиве')).not.toBeInTheDocument();
  });

  test('фильтрует ссылки по каждому из доступных статусов и сбрасывает фильтр', () => {
    renderWithProviders(<LinksRegistryPage links={statusLinks} />);

    expect(screen.getByText('Активная ссылка')).toBeInTheDocument();
    expect(screen.getByText('Неактивная ссылка')).toBeInTheDocument();
    expect(screen.getByText('Заблокированная ссылка')).toBeInTheDocument();

    // Фильтр: Активна
    const statusSelectButton = screen.getByRole('button', { name: 'Все статусы' });
    fireEvent.click(statusSelectButton);
    fireEvent.click(screen.getByText('Активна'));

    expect(screen.getByText('Активная ссылка')).toBeInTheDocument();
    expect(screen.queryByText('Неактивная ссылка')).not.toBeInTheDocument();
    expect(screen.queryByText('Заблокированная ссылка')).not.toBeInTheDocument();

    // Фильтр: Неактивна
    const activeSelectButton = screen.getByRole('button', { name: 'Активна' });
    fireEvent.click(activeSelectButton);
    fireEvent.click(screen.getByText('Неактивна'));

    expect(screen.queryByText('Активная ссылка')).not.toBeInTheDocument();
    expect(screen.getByText('Неактивная ссылка')).toBeInTheDocument();
    expect(screen.queryByText('Заблокированная ссылка')).not.toBeInTheDocument();

    // Фильтр: Заблокирована
    const inactiveSelectButton = screen.getByRole('button', { name: 'Неактивна' });
    fireEvent.click(inactiveSelectButton);
    fireEvent.click(screen.getByText('Заблокирована'));

    expect(screen.queryByText('Активная ссылка')).not.toBeInTheDocument();
    expect(screen.queryByText('Неактивная ссылка')).not.toBeInTheDocument();
    expect(screen.getByText('Заблокированная ссылка')).toBeInTheDocument();

    // Сбросить фильтры
    fireEvent.click(screen.getByRole('button', { name: 'Сбросить фильтры' }));

    expect(screen.getByText('Активная ссылка')).toBeInTheDocument();
    expect(screen.getByText('Неактивная ссылка')).toBeInTheDocument();
    expect(screen.getByText('Заблокированная ссылка')).toBeInTheDocument();
  });
});

describe('LinksRegistryPage — пустое состояние поиска и фильтрации', () => {
  const originalScrollTo = Element.prototype.scrollTo;
  const searchLinks = [
    {
      id: '1',
      name: 'Новогодняя распродажа',
      shortUrl: 'https://short.io/sale',
      shortcut: 'sale',
      targetUrl: 'https://example.com/sale',
      campaign: 'Без кампании',
      tags: ['скидки'],
      status: 'активна' as const,
      clicks: 5,
      createdAt: '2026-09-10T10:00:00.000Z'
    }
  ];

  beforeEach(() => {
    Element.prototype.scrollTo = vi.fn();
  });

  afterEach(() => {
    localStorage.clear();
    Element.prototype.scrollTo = originalScrollTo;
  });

  test('при отсутствии результатов поиска отображает состояние "По запросу «...» ничего не найдено" со сбросом фильтров', () => {
    renderWithProviders(<LinksRegistryPage links={searchLinks} />);

    expect(screen.getByText('Новогодняя распродажа')).toBeInTheDocument();

    const searchInput = screen.getByPlaceholderText(
      'Поиск по названию, целевому URL или тегу'
    );
    fireEvent.change(searchInput, { target: { value: 'акция' } });

    expect(
      screen.getByText('По запросу «акция» ничего не найдено')
    ).toBeInTheDocument();
    expect(
      screen.getByText('Измените поисковый запрос и/или сбросьте фильтры.')
    ).toBeInTheDocument();
    expect(screen.queryByText('Новогодняя распродажа')).not.toBeInTheDocument();

    const resetButtons = screen.getAllByRole('button', {
      name: 'Сбросить фильтры'
    });
    expect(resetButtons.length).toBeGreaterThanOrEqual(2);

    // Кликаем по кнопке сброса в пустом состоянии карточки
    fireEvent.click(resetButtons[1]);

    expect(searchInput).toHaveValue('');
    expect(screen.getByText('Новогодняя распродажа')).toBeInTheDocument();
    expect(
      screen.queryByText('По запросу «акция» ничего не найдено')
    ).not.toBeInTheDocument();
  });

  test('сортирует ссылки по дате создания от новых к старым по умолчанию', () => {
    const sortLinks = [
      {
        id: 'old-1',
        name: 'Старая ссылка',
        shortUrl: 'https://short.io/old',
        shortcut: 'old',
        targetUrl: 'https://example.com/old',
        campaign: 'Без кампании',
        tags: [],
        status: 'активна' as const,
        clicks: 0,
        createdAt: '2026-01-01T10:00:00.000Z'
      },
      {
        id: 'new-1',
        name: 'Новая ссылка',
        shortUrl: 'https://short.io/new',
        shortcut: 'new',
        targetUrl: 'https://example.com/new',
        campaign: 'Без кампании',
        tags: [],
        status: 'активна' as const,
        clicks: 0,
        createdAt: '2026-11-01T10:00:00.000Z'
      },
      {
        id: 'mid-1',
        name: 'Средняя ссылка',
        shortUrl: 'https://short.io/mid',
        shortcut: 'mid',
        targetUrl: 'https://example.com/mid',
        campaign: 'Без кампании',
        tags: [],
        status: 'активна' as const,
        clicks: 0,
        createdAt: '2026-06-01T10:00:00.000Z'
      }
    ];

    renderWithProviders(<LinksRegistryPage links={sortLinks} />);

    const rows = document.querySelectorAll('tbody tr');
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Новая ссылка');
    expect(rows[1]).toHaveTextContent('Средняя ссылка');
    expect(rows[2]).toHaveTextContent('Старая ссылка');
  });
});

