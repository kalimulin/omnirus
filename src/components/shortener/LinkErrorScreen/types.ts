import type { ReactNode } from 'react';

export type LinkErrorType = 'not-found' | 'inactive' | 'blocked';

export interface LinkErrorConfig {
  title: string;
  subtitle: string;
  icon: ReactNode;
}

export interface LinkErrorScreenProps {
  /** Тип ошибки ссылки: 'not-found' | 'inactive' | 'blocked' (или их синонимы) */
  type?: LinkErrorType | string;
  /** Пользовательский заголовок (по умолчанию берется из конфигурации типа) */
  title?: string;
  /** Пользовательский подзаголовок (по умолчанию берется из конфигурации типа) */
  subtitle?: string;
  /** Дополнительные элементы (кнопки, ссылки), если требуется */
  children?: ReactNode;
  /** CSS-класс для корневого контейнера */
  className?: string;
}

/**
 * Нормализует строковый тип ошибки ссылки к поддерживаемым значениям:
 * 'not-found' | 'inactive' | 'blocked'
 */
export function normalizeLinkErrorType(rawType?: string | null): LinkErrorType {
  if (!rawType) return 'not-found';
  const lower = rawType.toLowerCase().trim();

  if (
    lower === 'inactive' ||
    lower === 'неактивна' ||
    lower === 'paused' ||
    lower === 'disabled'
  ) {
    return 'inactive';
  }

  if (
    lower === 'blocked' ||
    lower === 'заблокирована' ||
    lower === 'banned' ||
    lower === 'forbidden' ||
    lower === 'security'
  ) {
    return 'blocked';
  }

  return 'not-found';
}
