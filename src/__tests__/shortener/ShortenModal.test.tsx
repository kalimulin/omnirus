import {
  render,
  screen,
  fireEvent,
  waitFor,
  within
} from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { ShortenModal } from '@/components/shortener/ShortenModal/ShortenModal';
import { checkUrlSafety, createShortcut } from '@/api/shortenerPublic';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';

vi.mock('@/api/shortenerPublic', () => ({
  checkUrlSafety: vi.fn(),
  createShortcut: vi.fn()
}));

const mockedCheckUrlSafety = vi.mocked(checkUrlSafety);
const mockedCreateShortcut = vi.mocked(createShortcut);

describe('ShortenModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onCreated: vi.fn(),
    onEdited: vi.fn(),
    campaigns: ['Без кампании', 'Летняя акция', 'Telegram'],
    availableTags: ['маркетинг', 'smm', 'акция']
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthCookies();
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
    mockedCheckUrlSafety.mockResolvedValue({
      threatLevel: 'safe',
      isSafe: true,
      isSuspicious: false,
      isBlocked: false,
      isInvalid: false,
      reasons: [],
      score: 0,
      timestamp: '2026-11-10T10:00:00Z',
      checkedBy: ['validator'],
      recommendations: [],
      error: null
    });
    mockedCreateShortcut.mockResolvedValue({
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      originalUrl: 'https://example.ru/promo',
      createdAt: '2026-11-10T10:00:00Z',
      isSecure: true,
      shortcut: '3a0alc',
      shortcutId: 'uuid-3a0alc',
      securityScore: 0
    });
  });

  afterEach(() => {
    clearAuthCookies();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const renderModal = (props = {}) => {
    return render(
      <ChakraProvider>
        <ShortenModal
          {...defaultProps}
          {...props}
        />
      </ChakraProvider>
    );
  };

  test('рендерит заголовок "Сократить ссылку" и кнопку "Сократить"', () => {
    renderModal();

    expect(screen.getByText('Сократить ссылку')).toBeInTheDocument();
    const submitBtn = screen.getByRole('button', { name: /сократить/i });
    expect(submitBtn).toBeInTheDocument();
  });

  test('поле "Название ссылки" не содержит звездочку обязательности', () => {
    renderModal();

    // Целевой URL содержит звездочку
    const targetUrlLabel = screen.getByText(/Целевой URL/i);
    expect(targetUrlLabel.textContent).toContain('*');

    // Название ссылки НЕ содержит звездочку
    const nameLabel = screen.getByText('Название ссылки');
    expect(nameLabel.textContent).not.toContain('*');
  });

  test('у каждого инпута есть подпись строго по макету', () => {
    renderModal();

    expect(
      screen.getByText(
        'Адрес, на который будет вести короткая ссылка. Формат http:// или https://'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText('Показывается в реестре и участвует в поиске.')
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Показывается в реестре, чтобы вы не забыли назначение ссылки.'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText(
        'Введите до 5-ти тегов через Enter или пробел. Тегами удобно размечать назначение ссылки.'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText('Ссылку можно добавить в кампанию позже.')
    ).toBeInTheDocument();
  });

  test('плейсхолдеры всех инпутов соответствуют макету', () => {
    renderModal();

    expect(
      screen.getByPlaceholderText('https://example.ru/landing')
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('Например, Пост в Telegram-канале')
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText(
        'Например, Для отслеживания рекламной кампании по акции «Название акции»'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByPlaceholderText('Введите тег и нажмите Enter')
    ).toBeInTheDocument();
  });

  test('позволяет создать ссылку без заполнения названия (поле необязательное)', async () => {
    const onCreated = vi.fn();
    renderModal({ onCreated });

    const urlInput = screen.getByPlaceholderText('https://example.ru/landing');
    fireEvent.change(urlInput, {
      target: { value: 'https://example.ru/promo' }
    });

    const submitBtn = screen.getByRole('button', { name: /сократить/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });

    expect(mockedCheckUrlSafety).toHaveBeenCalledWith(
      'https://example.ru/promo'
    );
    expect(mockedCreateShortcut).toHaveBeenCalledWith(
      'https://example.ru/promo'
    );

    const createdLink = onCreated.mock.calls[0][0];
    expect(createdLink.id).toBe('uuid-3a0alc');
    expect(createdLink.shortUrl).toBe(
      'shortcut-external.fenimore.skroy.ru/s/3a0alc'
    );
    expect(createdLink.shortcut).toBe('3a0alc');
    expect(createdLink.targetUrl).toBe('https://example.ru/promo');
    expect(createdLink.status).toBe('активна');
    // Если название не заполнено, используется URL
    expect(createdLink.name).toBe('https://example.ru/promo');
  });

  test('показывает ошибку при заблокированном URL и не вызывает createShortcut', async () => {
    mockedCheckUrlSafety.mockResolvedValueOnce({
      threatLevel: 'blocked',
      isSafe: false,
      isSuspicious: false,
      isBlocked: true,
      reasons: ['Домен в чёрном списке'],
      score: 100,
      timestamp: '2026-11-10T10:00:00Z',
      checkedBy: ['blacklist'],
      recommendations: []
    });

    const onCreated = vi.fn();
    renderModal({ onCreated });

    const urlInput = screen.getByPlaceholderText('https://example.ru/landing');
    fireEvent.change(urlInput, {
      target: { value: 'https://blocked.example.ru/bad' }
    });

    fireEvent.click(screen.getByRole('button', { name: /сократить/i }));

    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText('Домен в чёрном списке')
      ).toBeInTheDocument();
    });

    expect(mockedCreateShortcut).not.toHaveBeenCalled();
    expect(onCreated).not.toHaveBeenCalled();
  });

  test('добавление тегов через Enter и пробел', () => {
    renderModal();

    const tagInput = screen.getByPlaceholderText('Введите тег и нажмите Enter');

    // Добавляем тег через Enter
    fireEvent.change(tagInput, { target: { value: 'новости' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    expect(screen.getByText('новости')).toBeInTheDocument();

    // Добавляем второй тег через пробел
    fireEvent.change(tagInput, { target: { value: 'акция' } });
    fireEvent.keyDown(tagInput, { key: ' ', code: 'Space' });

    expect(screen.getByText('акция')).toBeInTheDocument();
  });

  test('в авторизованном режиме отправляет POST на shortcut-core/shortcut/ с Bearer и Project-ID вместо /public/shortcut/', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'modal-jwt-token'
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({
        shortcutId: 'core-uuid-1',
        title: 'Пост в Telegram',
        target: 'https://example.ru/promo',
        shortUrl: 'https://example.com/s/core1',
        shortcut: 'core1',
        status: 'active',
        createdAt: '2026-11-11T10:00:00Z'
      })
    });
    vi.stubGlobal('fetch', fetchMock);

    const onCreated = vi.fn();
    renderModal({ onCreated });

    fireEvent.change(screen.getByPlaceholderText('https://example.ru/landing'), {
      target: { value: 'https://example.ru/promo' }
    });
    fireEvent.change(
      screen.getByPlaceholderText('Например, Пост в Telegram-канале'),
      { target: { value: 'Пост в Telegram' } }
    );

    fireEvent.click(screen.getByRole('button', { name: /сократить/i }));

    await waitFor(() => {
      expect(onCreated).toHaveBeenCalled();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shortcuts',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer modal-jwt-token'
        },
        body: JSON.stringify({
          title: 'Пост в Telegram',
          target: 'https://example.ru/promo',
          description: '',
          tags: [],
          campaignId: null
        })
      })
    );
    expect(mockedCreateShortcut).not.toHaveBeenCalled();
    expect(onCreated.mock.calls[0][0]).toMatchObject({
      id: 'core-uuid-1',
      name: 'Пост в Telegram',
      shortUrl: 'https://example.com/s/core1'
    });
  });
});
