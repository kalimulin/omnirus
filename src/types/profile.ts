/** Данные профиля пользователя (Страница «Настройка профиля») */
export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  limits?: UserLimits;
}

/** Ограничение отдельного ресурса (ссылки, кампании) */
export interface QuotaResourceLimit {
  used: number;
  max: number;
  remaining: number;
  isReached: boolean;
}

/** Лимиты и квоты пользователя */
export interface UserLimits {
  plan: 'free' | 'standard' | 'pro' | 'enterprise' | 'custom' | string;
  shortcuts: QuotaResourceLimit;
  campaigns: QuotaResourceLimit;
}

/** Поле, к которому относится ошибка профиля ('' — общая ошибка) */
export type ProfileErrorField = 'email' | 'phone' | 'currentPassword' | '';

/** Структура ошибки мок-API профиля */
export interface ProfileServiceError {
  field: ProfileErrorField;
  message: string;
}

/** Данные для изменения пароля */
export interface ChangePasswordPayload {
  oldPassword: string;
  newPassword: string;
  locale?: string;
}
