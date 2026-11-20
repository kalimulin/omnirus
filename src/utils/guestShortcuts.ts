import { claimShortcut } from '@/api/shortenerPublic';
import type { GuestShortcut } from '@/types/shortener';

export type { GuestShortcut };

const STORAGE_KEY = 'omni_guest_shortcuts';
const TTL_HOURS = 48;

// Получить список гостевых ссылок из хранилища
export const getGuestShortcuts = (): GuestShortcut[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const items: GuestShortcut[] = JSON.parse(raw);
    const now = Date.now();

    // Отфильтровываем истёкшие
    return items.filter((item) => new Date(item.expiresAt).getTime() > now);
  } catch (err) {
    console.error('Failed to read guest shortcuts:', err);
    return [];
  }
};

// Сохранить одну гостевую ссылку
export const saveGuestShortcut = (shortcut: {
  shortUrl: string;
  originalUrl: string;
  shortcut: string;
  shortcutId: string;
  createdAt: string;
}): GuestShortcut => {
  const expiresAt = new Date(
    Date.now() + TTL_HOURS * 60 * 60 * 1000,
  ).toISOString();

  const item: GuestShortcut = {
    ...shortcut,
    expiresAt,
  };

  const existing = getGuestShortcuts();
  // Удаляем дубликат по shortcut
  const filtered = existing.filter((s) => s.shortcut !== item.shortcut);
  const updated = [item, ...filtered];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save guest shortcut:', err);
  }

  return item;
};

// Удалить ссылку из хранилища (например, после claim)
export const removeGuestShortcut = (shortcutCode: string): void => {
  const updated = getGuestShortcuts().filter(
    (s) => s.shortcut !== shortcutCode,
  );
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to remove guest shortcut:', err);
  }
};

// Очистить всё хранилище
export const clearGuestShortcuts = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

// Вернуть TTL в часах
export const getGuestTtlHours = (): number => TTL_HOURS;

/**
 * Закрепить выбранные гостевые ссылки за аккаунтом.
 */
export async function claimSpecificGuestShortcuts(
  codes: string[],
  projectId?: string
): Promise<void> {
  for (const code of codes) {
    try {
      await claimShortcut(code, projectId);
      removeGuestShortcut(code);
    } catch (err) {
      const errCode = (err as Error & { code?: string }).code;
      if (errCode === 'SHORTCUT_NOT_FOUND') {
        removeGuestShortcut(code);
      } else if (
        errCode === 'LIMIT_EXCEEDED_SHORTCUTS' ||
        (err as Error).message.includes('лимит')
      ) {
        break;
      }
    }
  }
}

/**
 * Закрепить все гостевые ссылки за аккаунтом после того, как пользователь
 * авторизовался. Вызывается один раз после получения токена авторизации.
 */
export async function claimAllGuestShortcuts(
  projectId?: string,
): Promise<void> {
  const guests = getGuestShortcuts();

  if (guests.length === 0) return;

  for (const guest of guests) {
    try {
      await claimShortcut(guest.shortcut, projectId);
      removeGuestShortcut(guest.shortcut);
    } catch (err) {
      const code = (err as Error & { code?: string }).code;

      if (code === 'SHORTCUT_NOT_FOUND') {
        // Ссылка истекла на сервере — убираем из localStorage
        removeGuestShortcut(guest.shortcut);
        console.warn(`TTL expired, removed locally: ${guest.shortcut}`);
      } else if (
        code === 'LIMIT_EXCEEDED_SHORTCUTS' ||
        (err as Error).message.includes('лимит')
      ) {
        console.warn(`Limit reached, stopped claiming: ${guest.shortcut}`);
        break;
      } else {
        console.error(`Failed to claim ${guest.shortcut}:`, err);
      }
    }
  }
}
