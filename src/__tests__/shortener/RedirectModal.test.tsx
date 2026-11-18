import { ChakraProvider } from '@chakra-ui/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { checkUrlSafety } from '@/api/shortenerPublic';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';
import { RedirectModal } from '@/components/shortener/RedirectModal/RedirectModal';

vi.mock('@/api/shortenerPublic', () => ({
  checkUrlSafety: vi.fn()
}));

const mockedCheckUrlSafety = vi.mocked(checkUrlSafety);

describe('RedirectModal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
    initialTargetUrl: 'https://example.ru/initial',
    onSave: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthCookies();
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
    mockedCheckUrlSafety.mockResolvedValue({
      url: 'https://example.ru/new-destination',
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
  });

  afterEach(() => {
    clearAuthCookies();
    vi.unstubAllEnvs();
  });

  const renderModal = (props = {}) => {
    return render(
      <ChakraProvider>
        <RedirectModal
          {...defaultProps}
          {...props}
        />
      </ChakraProvider>
    );
  };

  test('рендерит заголовок, обязательный индикатор и кнопку сохранения', () => {
    renderModal();

    expect(
      screen.getByText('Перенаправить ссылку на другой URL')
    ).toBeInTheDocument();

    const targetUrlLabel = screen.getByText(/^Целевой URL/i);
    expect(targetUrlLabel.textContent).toContain('*');

    expect(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    ).toBeInTheDocument();
  });

  test('активирует кнопку сохранения только при изменении целевого URL', () => {
    renderModal({ initialTargetUrl: 'https://example.ru/initial' });

    const saveButton = screen.getByRole('button', {
      name: 'Изменить целевой URL'
    });
    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );

    // При открытии без изменений кнопка неактивна
    expect(saveButton).toBeDisabled();

    // При вводе нового URL кнопка становится активной
    fireEvent.change(input, {
      target: { value: 'https://example.ru/new-dest' }
    });
    expect(saveButton).toBeEnabled();

    // При возврате к исходному URL кнопка снова становится неактивной
    fireEvent.change(input, {
      target: { value: 'https://example.ru/initial' }
    });
    expect(saveButton).toBeDisabled();

    // Пробелы вокруг исходного URL также считаются отсутствием изменений
    fireEvent.change(input, {
      target: { value: '  https://example.ru/initial  ' }
    });
    expect(saveButton).toBeDisabled();
  });

  test('показывает ошибку для пустого целевого URL и не вызывает checkUrlSafety и onSave', async () => {
    const onSave = vi.fn();
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    const dialog = screen.getByRole('dialog');
    expect(within(dialog).getByText('Введите целевой URL')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(mockedCheckUrlSafety).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  test.each(['not-a-url', 'example.com/path', 'ftp://example.com/file'])(
    'показывает ошибку формата для некорректного URL (%s) и не вызывает checkUrlSafety и onSave',
    async (badUrl) => {
      const onSave = vi.fn();
      renderModal({ onSave });

      const input = screen.getByPlaceholderText(
        'https://example.com/new-destination'
      );
      fireEvent.change(input, { target: { value: badUrl } });
      fireEvent.click(
        screen.getByRole('button', { name: 'Изменить целевой URL' })
      );

      await waitFor(() => {
        expect(
          within(screen.getByRole('dialog')).getByText(
            'Некорректный URL. Проверьте формат адреса.'
          )
        ).toBeInTheDocument();
      });

      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(mockedCheckUrlSafety).not.toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    }
  );

  test('показывает ошибку при заблокированном URL от checkUrlSafety и не вызывает onSave', async () => {
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

    const onSave = vi.fn();
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, {
      target: { value: 'https://blocked.example.ru/bad' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText('Домен в чёрном списке')
      ).toBeInTheDocument();
    });

    expect(mockedCheckUrlSafety).toHaveBeenCalledWith(
      'https://blocked.example.ru/bad'
    );
    expect(onSave).not.toHaveBeenCalled();
  });

  test('показывает ошибку при isInvalid от checkUrlSafety и не вызывает onSave', async () => {
    mockedCheckUrlSafety.mockResolvedValueOnce({
      url: 'https://invalid-domain',
      threatLevel: 'invalid',
      isSafe: false,
      isSuspicious: false,
      isBlocked: false,
      isInvalid: true,
      reasons: [],
      score: 0,
      timestamp: '2026-11-12T10:00:00Z',
      checkedBy: 'validator',
      recommendations: [],
      error: 'Указан некорректный URL'
    });

    const onSave = vi.fn();
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, {
      target: { value: 'https://invalid-domain' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText('Указан некорректный URL')
      ).toBeInTheDocument();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  test('сбрасывает ошибку при изменении значения в поле ввода', async () => {
    renderModal();

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    expect(
      within(screen.getByRole('dialog')).getByText('Введите целевой URL')
    ).toBeInTheDocument();

    fireEvent.change(input, {
      target: { value: 'https://example.ru/valid' }
    });

    expect(
      within(screen.getByRole('dialog')).queryByText('Введите целевой URL')
    ).not.toBeInTheDocument();
    expect(input).not.toHaveAttribute('aria-invalid', 'true');
  });

  test('вызывает checkUrlSafety и onSave с очищенным от пробелов URL при успешной проверке (включая авторизованный режим)', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'modal-jwt-token'
    });

    const onSave = vi.fn();
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, {
      target: { value: '  https://example.ru/new-destination  ' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    await waitFor(() => {
      expect(onSave).toHaveBeenCalledWith('https://example.ru/new-destination');
    });

    expect(mockedCheckUrlSafety).toHaveBeenCalledWith(
      'https://example.ru/new-destination'
    );
  });

  test('показывает ошибку при сбое запроса checkUrlSafety и не вызывает onSave', async () => {
    mockedCheckUrlSafety.mockRejectedValueOnce(
      new Error('Сервис проверки недоступен')
    );

    const onSave = vi.fn();
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, {
      target: { value: 'https://example.ru/new-destination' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText(
          'Сервис проверки недоступен'
        )
      ).toBeInTheDocument();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  test('сбрасывает ошибку при повторном открытии модального окна', () => {
    const onSave = vi.fn();
    const { rerender } = render(
      <ChakraProvider>
        <RedirectModal
          {...defaultProps}
          onSave={onSave}
        />
      </ChakraProvider>
    );

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, { target: { value: '' } });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );
    expect(screen.getByText('Введите целевой URL')).toBeInTheDocument();

    rerender(
      <ChakraProvider>
        <RedirectModal
          {...defaultProps}
          isOpen={false}
          onSave={onSave}
        />
      </ChakraProvider>
    );

    rerender(
      <ChakraProvider>
        <RedirectModal
          {...defaultProps}
          isOpen
          onSave={onSave}
        />
      </ChakraProvider>
    );

    expect(screen.queryByText('Введите целевой URL')).not.toBeInTheDocument();
    expect(
      screen.getByDisplayValue('https://example.ru/initial')
    ).toBeInTheDocument();
  });

  test('использует запасные сообщения, когда checkUrlSafety возвращает isBlocked или isInvalid без деталей', async () => {
    mockedCheckUrlSafety
      .mockResolvedValueOnce({
        url: 'https://blocked-empty.example.ru',
        threatLevel: 'blocked',
        isSafe: false,
        isSuspicious: false,
        isBlocked: true,
        isInvalid: false,
        reasons: [],
        score: 90,
        timestamp: '2026-11-12T10:00:00Z',
        checkedBy: 'blacklist',
        recommendations: [],
        error: null
      })
      .mockResolvedValueOnce({
        url: 'https://invalid-empty.example.ru',
        threatLevel: 'invalid',
        isSafe: false,
        isSuspicious: false,
        isBlocked: false,
        isInvalid: true,
        reasons: [],
        score: 0,
        timestamp: '2026-11-12T10:00:00Z',
        checkedBy: 'validator',
        recommendations: [],
        error: null
      });

    const onSave = vi.fn();
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );

    fireEvent.change(input, {
      target: { value: 'https://blocked-empty.example.ru' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText(
          'Ссылка заблокирована из-за соображений безопасности.'
        )
      ).toBeInTheDocument();
    });

    fireEvent.change(input, {
      target: { value: 'https://invalid-empty.example.ru' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText(
          'Некорректный URL. Проверьте формат URL.'
        )
      ).toBeInTheDocument();
    });

    expect(onSave).not.toHaveBeenCalled();
  });

  test('показывает ошибку в форме при отклонении асинхронного onSave', async () => {
    const onSave = vi
      .fn()
      .mockRejectedValueOnce(new Error('Ошибка сохранения'));
    renderModal({ onSave });

    const input = screen.getByPlaceholderText(
      'https://example.com/new-destination'
    );
    fireEvent.change(input, {
      target: { value: 'https://example.ru/new-destination' }
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Изменить целевой URL' })
    );

    await waitFor(() => {
      expect(
        within(screen.getByRole('dialog')).getByText('Ошибка сохранения')
      ).toBeInTheDocument();
    });
  });

  test('блокирует повторную отправку и кнопку отмены при isLoading=true', () => {
    const onSave = vi.fn();
    renderModal({ isLoading: true, onSave });

    expect(screen.getByRole('button', { name: 'Отмена' })).toBeDisabled();
    fireEvent.submit(screen.getByRole('dialog').querySelector('form')!);

    expect(mockedCheckUrlSafety).not.toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });
});
