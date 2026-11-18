import { act, fireEvent, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import { checkUrlSafety } from '@/api/shortenerPublic';
import { DeactivateLinkModal } from '@/components/shortener/DeactivateLinkModal/DeactivateLinkModal';
import type { LinkRow } from '@/types/shortener';

import { renderWithProviders } from '../../test/utils';

vi.mock('@/api/shortenerPublic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/shortenerPublic')>();
  return {
    ...actual,
    checkUrlSafety: vi.fn()
  };
});

const mockedCheckUrlSafety = vi.mocked(checkUrlSafety);

const sampleLink: LinkRow = {
  id: 'link-1',
  name: 'Пост в Телеграм',
  description: 'Описание',
  shortUrl: 'omni/fbl2V',
  shortcut: 'fbl2V',
  targetUrl: 'https://example.com/example_channel/5678/social-media',
  campaign: 'Без кампании',
  tags: ['promo'],
  status: 'active',
  clicks: 0,
  createdAt: '2026-11-12T10:00:00Z'
};

describe('DeactivateLinkModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCheckUrlSafety.mockResolvedValue({
      url: 'https://example.ru/landing',
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

  test('рендерит сводку ссылки, предупреждение, поле резервного URL, чекбокс и кнопки по макету', () => {
    renderWithProviders(
      <DeactivateLinkModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        link={sampleLink}
      />
    );

    const dialog = screen.getByRole('dialog');
    expect(
      within(dialog).getByText('Деактивировать ссылку?')
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Название')).toBeInTheDocument();
    expect(within(dialog).getByText('Пост в Телеграм')).toBeInTheDocument();
    expect(within(dialog).getByText('Короткий URL')).toBeInTheDocument();
    expect(within(dialog).getByText('omni/fbl2V')).toBeInTheDocument();
    expect(within(dialog).getByText('Целевой URL')).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'https://example.com/example_channel/5678/social-media'
      )
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Короткая ссылка перестанет работать и перейдет в статус «Неактивна», короткий адрес и статистика сохранятся. Все, кто перейдет по ней попадут на страницу «Ссылка временно не работает». Рекомендуем увести ссылку на резервный URL.'
      )
    ).toBeInTheDocument();
    expect(within(dialog).getByText('Резервный URL')).toBeInTheDocument();
    expect(
      within(dialog).getByPlaceholderText('https://example.ru/landing')
    ).toBeInTheDocument();
    expect(
      within(dialog).getByText(
        'Если вы не введете резервный URL, переходы будут направлены на страницу 404.'
      )
    ).toBeInTheDocument();

    const checkbox = within(dialog).getByRole('checkbox', {
      name: 'Понимаю, что переходы по короткой ссылке перестанут работать'
    });
    expect(checkbox).not.toBeChecked();

    expect(
      within(dialog).getByRole('button', { name: 'Отмена' })
    ).toBeInTheDocument();
    expect(
      within(dialog).getByRole('button', { name: 'Деактивировать' })
    ).toBeDisabled();
  });

  test('подтверждает без резервного URL после отметки чекбокса', () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <DeactivateLinkModal
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        link={sampleLink}
      />
    );

    const dialog = screen.getByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', {
      name: 'Деактивировать'
    });

    fireEvent.click(
      within(dialog).getByRole('checkbox', {
        name: 'Понимаю, что переходы по короткой ссылке перестанут работать'
      })
    );
    expect(confirmBtn).not.toBeDisabled();

    fireEvent.click(confirmBtn);

    expect(mockedCheckUrlSafety).not.toHaveBeenCalled();
    expect(onConfirm).toHaveBeenCalledWith();
  });

  test('проверяет введенный резервный URL и отклоняет некорректный адрес', async () => {
    const onConfirm = vi.fn();
    renderWithProviders(
      <DeactivateLinkModal
        isOpen
        onClose={vi.fn()}
        onConfirm={onConfirm}
        link={sampleLink}
      />
    );

    const dialog = screen.getByRole('dialog');
    const input = within(dialog).getByPlaceholderText(
      'https://example.ru/landing'
    );
    fireEvent.click(
      within(dialog).getByRole('checkbox', {
        name: 'Понимаю, что переходы по короткой ссылке перестанут работать'
      })
    );

    // Некорректный URL
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Деактивировать' })
      );
      await Promise.resolve();
    });

    expect(
      within(dialog).getByText('Некорректный URL. Проверьте формат адреса.')
    ).toBeInTheDocument();
    expect(onConfirm).not.toHaveBeenCalled();

    // Корректный безопасный URL
    fireEvent.change(input, {
      target: { value: 'https://example.ru/landing' }
    });
    await act(async () => {
      fireEvent.click(
        within(dialog).getByRole('button', { name: 'Деактивировать' })
      );
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(mockedCheckUrlSafety).toHaveBeenCalledWith(
      'https://example.ru/landing'
    );
    expect(onConfirm).toHaveBeenCalledWith('https://example.ru/landing');
  });
});
