import { ChakraProvider } from '@chakra-ui/react';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within
} from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';
import { EditLinkModal } from '@/components/shortener/EditLinkModal/EditLinkModal';
import { ShortenModal } from '@/components/shortener/ShortenModal/ShortenModal';
import theme from '@/theme';
import type { LinkRow } from '@/types/shortener';

describe('EditLinkModal', () => {
  const sampleLink: LinkRow = {
    id: 'link-1',
    name: 'Пост в Телеграм',
    description:
      'Для отслеживания рекламной кампании по акции «Черная пятница»',
    shortUrl: 'omni/fbl2V',
    shortcut: 'fbl2V',
    targetUrl: 'https://example.com/example_channel/5678/social-media',
    campaign: 'Весенняя распродажа',
    campaignId: 'camp-1',
    tags: ['promo', 'telegram'],
    status: 'active',
    clicks: 10,
    createdAt: '2026-11-12T10:00:00Z'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    clearAuthCookies();
    vi.stubEnv('VITE_SHORTENER_DEMO_TOKEN', '');
  });

  afterEach(() => {
    clearAuthCookies();
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  const renderModal = (props = {}) => {
    return render(
      <ChakraProvider theme={theme}>
        <EditLinkModal
          isOpen
          onClose={vi.fn()}
          link={sampleLink}
          onSaved={vi.fn()}
          availableTags={['promo', 'telegram', 'vk', 'email']}
          {...props}
        />
      </ChakraProvider>
    );
  };

  test('рендерит заголовок, сводку URL, поля формы, подсказки и кнопки строго по макету', () => {
    renderModal();

    const dialog = screen.getByRole('dialog');

    expect(
      within(dialog).getByText('Редактирование информации о ссылке')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Короткий URL')).toBeInTheDocument();
    expect(within(dialog).getByText('omni/fbl2V')).toBeInTheDocument();
    expect(within(dialog).getByText('Целевой URL')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'https://example.com/example_channel/5678/social-media'
      )
    ).toBeInTheDocument();

    expect(
      within(dialog).getByDisplayValue('Пост в Телеграм')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText('Показывается в реестре и участвует в поиске')
    ).toBeInTheDocument();

    expect(
      within(dialog).getByDisplayValue(
        'Для отслеживания рекламной кампании по акции «Черная пятница»'
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Показывается в реестре, чтобы вы не забыли назначение ссылки.'
      )
    ).toBeInTheDocument();

    expect(within(dialog).getByText('promo')).toBeInTheDocument();
    expect(within(dialog).getByText('telegram')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Можно удалить старые теги и/или ввести через Enter или пробел новые — всего до 5-ти тегов. Тегами удобно размечать назначение ссылки.'
      )
    ).toBeInTheDocument();

    // Поле выбора кампании и инпут целевого URL отсутствуют в диалоге редактирования
    expect(within(dialog).queryByText('Кампания')).not.toBeInTheDocument();
    expect(within(dialog).queryByRole('combobox')).not.toBeInTheDocument();
    expect(
      within(dialog).queryByDisplayValue(
        'https://example.com/example_channel/5678/social-media'
      )
    ).not.toBeInTheDocument();

    expect(
      within(dialog).getByRole('button', { name: 'Отмена' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Сохранить изменения' })
    ).toBeInTheDocument();
  });

  test('позволяет удалить старые теги, добавить новые и сохранить изменения локально', async () => {
    const onSaved = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSaved, onClose });

    const dialog = screen.getByRole('dialog');

    fireEvent.change(within(dialog).getByDisplayValue('Пост в Телеграм'), {
      target: { value: '  Обновленный пост  ' }
    });
    fireEvent.change(
      within(dialog).getByDisplayValue(
        'Для отслеживания рекламной кампании по акции «Черная пятница»'
      ),
      { target: { value: '  Новое описание  ' } }
    );

    // Удаляем первый тег ("promo")
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Удалить тег promo' })
    );
    expect(within(dialog).queryByText('promo')).not.toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();

    // Добавляем новый тег через Enter и пробел
    const tagInput = dialog.querySelector('input.link-tags-field__input')!;
    fireEvent.change(tagInput, { target: { value: 'sale' } });
    fireEvent.keyDown(tagInput, { key: 'Enter', code: 'Enter' });

    fireEvent.change(tagInput, { target: { value: 'spring' } });
    fireEvent.keyDown(tagInput, { key: ' ', code: 'Space' });

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Сохранить изменения' })
    );

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith({
        ...sampleLink,
        name: 'Обновленный пост',
        description: 'Новое описание',
        tags: ['telegram', 'sale', 'spring']
      });
    });

    expect(
      screen.getByText('Изменения успешно сохранены.')
    ).toBeInTheDocument();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('сохраняет прежнее название ссылки, если поле названия оставлено пустым', async () => {
    const onSaved = vi.fn();
    renderModal({ onSaved });

    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByDisplayValue('Пост в Телеграм'), {
      target: { value: '   ' }
    });

    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Сохранить изменения' })
    );

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Пост в Телеграм'
        })
      );
    });
  });

  test('в авторизованном режиме отправляет PATCH /shortcut/{id} с title, description и tags', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-edit-token'
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({})
    });
    vi.stubGlobal('fetch', fetchMock);

    const onSaved = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSaved, onClose });

    const dialog = screen.getByRole('dialog');
    fireEvent.change(within(dialog).getByDisplayValue('Пост в Телеграм'), {
      target: { value: 'Пост в Telegram v2' }
    });
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Сохранить изменения' })
    );

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalledTimes(1);
    });

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/shortcuts/link-1',
      expect.objectContaining({
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer jwt-edit-token'
        },
        body: JSON.stringify({
          title: 'Пост в Telegram v2',
          description:
            'Для отслеживания рекламной кампании по акции «Черная пятница»',
          tags: ['promo', 'telegram']
        })
      })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('не закрывает окно и не вызывает onSaved при ошибке PATCH /shortcut/{id}', async () => {
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-edit-token'
    });

    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ detail: 'Ошибка сервера при обновлении' })
    });
    vi.stubGlobal('fetch', fetchMock);

    const onSaved = vi.fn();
    const onClose = vi.fn();
    renderModal({ onSaved, onClose });

    const dialog = screen.getByRole('dialog');
    fireEvent.click(
      within(dialog).getByRole('button', { name: 'Сохранить изменения' })
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(
        within(dialog).getByRole('button', { name: 'Отмена' })
      ).not.toBeDisabled();
    });

    expect(onSaved).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  test('ShortenModal с переданным editLink рендерит актуальный диалог редактирования', () => {
    render(
      <ChakraProvider theme={theme}>
        <ShortenModal
          isOpen
          onClose={vi.fn()}
          editLink={sampleLink}
          onEdited={vi.fn()}
          availableTags={['promo', 'telegram']}
        />
      </ChakraProvider>
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Редактирование информации о ссылке')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Сохранить изменения' })
    ).toBeInTheDocument();
  });
});
