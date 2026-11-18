import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { checkUrlSafety, createShortcut } from '@/api/shortenerPublic';
import LinkShortener from '@/components/shortener/landing/LinkShortener/LinkShortener';

vi.mock('@/api/shortenerPublic', () => ({
  checkUrlSafety: vi.fn(),
  createShortcut: vi.fn()
}));

const mockedCheckUrlSafety = vi.mocked(checkUrlSafety);
const mockedCreateShortcut = vi.mocked(createShortcut);

describe('LinkShortener', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test('обрабатывает ответ isInvalid от /public/check-url/ и блокирует отправку', async () => {
    mockedCheckUrlSafety.mockResolvedValueOnce({
      threatLevel: 'invalid',
      isSafe: false,
      isSuspicious: false,
      isBlocked: false,
      isInvalid: true,
      reasons: [],
      score: 0,
      timestamp: '2026-11-10T10:00:00Z',
      checkedBy: ['validator'],
      recommendations: [],
      error: 'Указан некорректный URL'
    });

    const onShortened = vi.fn();
    render(<LinkShortener onShortened={onShortened} />);

    const input = screen.getByPlaceholderText('Вставьте ссылку');
    fireEvent.change(input, { target: { value: 'https://invalid-domain' } });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
    });

    expect(screen.getByText('Указан некорректный URL')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Сократить' })).toBeDisabled();
    expect(mockedCreateShortcut).not.toHaveBeenCalled();
    expect(onShortened).not.toHaveBeenCalled();
  });

  test('после успешной проверки сокращает ссылку через createShortcut', async () => {
    mockedCheckUrlSafety.mockResolvedValueOnce({
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
    const createdData = {
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      originalUrl: 'https://example.com/offer',
      createdAt: '2026-11-10T10:00:00Z',
      isSecure: true,
      shortcut: '3a0alc',
      shortcutId: 'uuid-1',
      securityScore: 0
    };
    mockedCreateShortcut.mockResolvedValueOnce(createdData);

    const onShortened = vi.fn();
    render(<LinkShortener onShortened={onShortened} />);

    const input = screen.getByPlaceholderText('Вставьте ссылку');
    fireEvent.change(input, { target: { value: 'https://example.com/offer' } });

    await act(async () => {
      vi.advanceTimersByTime(500);
      await Promise.resolve();
      await Promise.resolve();
    });

    const submitButton = screen.getByRole('button', { name: 'Сократить' });
    expect(submitButton).toBeEnabled();

    await act(async () => {
      fireEvent.click(submitButton);
      await Promise.resolve();
    });

    expect(mockedCreateShortcut).toHaveBeenCalledWith(
      'https://example.com/offer'
    );
    expect(onShortened).toHaveBeenCalledWith(createdData);
  });
});
