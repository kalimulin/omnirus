import React from 'react';
import { describe, test, expect } from 'vitest';

import {
  StatusBadge,
  STATUS_CONFIG_MAP,
} from '@/components/atoms/Badge/StatusBadge';
import { renderWithProviders, screen } from '../../test/utils';

describe('StatusBadge', () => {
  const expectedVariants = [
    { status: 'active', label: 'активна', color: 'var(--green-600)', bg: 'var(--green-50)' },
    { status: 'inactive', label: 'неактивна', color: 'var(--text-secondary)', bg: 'var(--zinc-100)' },
    { status: 'blocked', label: 'заблокирована', color: 'var(--error)', bg: 'var(--error-bg)' },
    { status: 'paused', label: 'на паузе', color: 'var(--orange-600)', bg: 'var(--orange-50)' },
    { status: 'completed', label: 'завершена', color: 'var(--black)', bg: 'var(--snow)' },
    { status: 'archived', label: 'в архиве', color: 'var(--black)', bg: 'var(--snow)' },
    { status: 'delivered', label: 'отправлено', color: 'var(--green-600)', bg: 'var(--green-50)' },
    { status: 'failed', label: 'ошибка', color: 'var(--error)', bg: 'var(--error-bg)' },
  ];

  expectedVariants.forEach(({ status, label, color, bg }) => {
    test(`рендерит статус "${status}" с текстом "${label}" и цветами из макета`, () => {
      renderWithProviders(<StatusBadge status={status} />);
      const badge = screen.getByText(label);
      expect(badge).toBeInTheDocument();

      const config = STATUS_CONFIG_MAP[status];
      expect(config).toBeDefined();
      expect(config.label).toBe(label);
      expect(config.color.toLowerCase()).toBe(color);
      expect(config.bg.toLowerCase()).toBe(bg);
    });
  });

  test('поддерживает передачу русских названий статусов напрямую', () => {
    renderWithProviders(<StatusBadge status="на паузе" />);
    expect(screen.getByText('на паузе')).toBeInTheDocument();
  });

  test('регистронезависим и обрезает пробелы', () => {
    renderWithProviders(<StatusBadge status="  BLOCKED  " />);
    expect(screen.getByText('заблокирована')).toBeInTheDocument();
  });

  test('поддерживает кастомный children', () => {
    renderWithProviders(<StatusBadge status="active">Пользовательский текст</StatusBadge>);
    expect(screen.getByText('Пользовательский текст')).toBeInTheDocument();
  });

  test('пробрасывает ref (необходимо для Chakra Tooltip)', () => {
    const ref = React.createRef<HTMLSpanElement>();
    renderWithProviders(<StatusBadge ref={ref} status="active" />);
    expect(ref.current).toBeInstanceOf(HTMLSpanElement);
  });

  test('по умолчанию имеет размер шрифта 14px', () => {
    renderWithProviders(<StatusBadge status="active" />);
    const badge = screen.getByText('активна');
    expect(badge).toHaveStyle({ fontSize: '14px' });
  });

  test('обрабатывает неизвестный статус с fallback', () => {
    renderWithProviders(<StatusBadge status="unknown_status" />);
    expect(screen.getByText('unknown_status')).toBeInTheDocument();
  });
});
