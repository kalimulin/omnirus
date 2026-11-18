/**
 * Design System Colors
 * Цветовые константы дизайн-системы для использования в TypeScript/React коде.
 */
export const colors = {
  // Primary (Основная палитра)
  primary: '#3B6EA0',
  primaryBg: '#F8FAFC',
  primaryBgHover: '#E2EBF3',
  primary50: '#E6F3F8',
  primary100: '#D4E1EE',
  primary600: '#346895',
  primary700: '#2F5A85',
  primary800: '#3B5A8A',
  primary900: '#1E3A5F',
  primaryAlt: '#3F73A8',

  // Secondary (Вторичная / акцентная палитра)
  secondary: '#00C497',
  secondaryBg: '#EBFFFA',
  secondaryBgHover: '#D6FFF5',
  secondaryHover: '#008F6D',
  secondary100: '#AEE5D1',
  secondary600: '#00A67E',
  secondary700: '#008667',

  // Backgrounds & Neutrals (Фоны и нейтральные цвета)
  bg: '#ECF2F8',
  bgSecondary: '#F8FAFC',
  bgSubtle: '#F7F8FC',
  surfaceSubtle: '#F7F7F8',
  white: '#FFFFFF',
  black: '#000000',
  snow: '#FAFAFA',
  gray50: '#F9FAFB',
  gray100: '#EEEEF9',
  gray400: '#9CA3AF',
  gray500: '#6B7280',
  zinc100: '#F4F4F5',

  // Typography / Text (Текстовые цвета)
  text: '#12233F',
  textSecondary: '#52525B',
  textPlaceholder: '#A1A1AA',
  textDisabled: '#8A8A99',
  textLink: '#2D547B',
  textLinkHover: '#244869',

  // Buttons & Interactive (Кнопки и состояния)
  btnSolid: '#3B6EA0',
  btnHover: '#34608C',
  btnOutline: '#A6C2DE',
  btnOutlineHover: '#EBF5FF',
  btnDisabled: '#9DB6CF',
  iconBtnHover: '#F0FDF4',

  // Supporting Status Colors (Служебные цвета статусов)
  error: '#EF4444',
  errorBg: '#FEF2F2',
  red50: '#FEF2F2',
  red500: '#E53E3E',
  red600: '#DC2626',
  warning: '#F59E0B',
  orange50: '#FFF7ED',
  orange600: '#EA580C',
  success: '#00C497',
  successBg: '#F0FDF4',
  green50: '#F0FDF4',
  green500: '#22C55E',
  green600: '#16A34A',
  toastSuccessBg: '#16A34A',
  toastErrorBg: '#EF4444',
  toastWarningBg: '#D97706',
  toastInfoBg: '#3B6EA0',

  // Slate & Borders
  slate50: '#F8FAFC',
  slate50Alt: '#F0F5FA',
  slate100: '#E8EEF5',
  slate100Alt2: '#F1F5F9',
  slate150: '#EEF2F6',
  slate200: '#E2E8F0',
  slate250: '#DCE3EA',
  slate300: '#CBD5E1',
  slate400: '#94A3B8',
  slate500: '#64748B',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1E293B',
  sky50: '#E6F0FA',

  // Extra Accents
  blue50: '#EBF4FF',
  blue500: '#3182CE',
  blue600: '#2B6CB0',
  blue700: '#2C5282',
  blueVivid: '#2563EB',
  indigo100: '#E3E3FE',
  indigo950: '#11023B',
  violet100: '#DDD9FF',

  // Widget Preview
  widgetText: '#0C151D',
  widgetTextSecondary: '#767A7F',
  widgetActionBg: '#487BFE',

  // Sidebar
  sidebarActive: '#A6C2DE',
  sidebarActiveHover: '#95B5D5'
} as const;

/**
 * Палитры для Chakra UI extendTheme (используются Chakra colorScheme и theme-tools)
 */
export const chakraThemeColors = {
  brand: {
    50: '#e8f4ff',
    60: colors.primaryBgHover,
    100: '#c5e0f7',
    200: '#9fcbed',
    300: '#79b5e3',
    400: '#5ca4dc',
    450: colors.textLink,
    460: colors.textLinkHover,
    500: '#01008c',
    600: '#1a3355',
    700: '#162b4a',
    800: '#12233f',
    900: '#0e1b33'
  },
  accent: {
    green: '#00C496',
    greenHover: '#008F6B'
  },
  error: {
    500: colors.error
  },
  lavender: {
    50: '#dcd5fe',
    100: '#e8e2f2',
    200: '#d4c9e8',
    300: '#b8a8d9',
    400: '#9d87ca'
  }
} as const;

export type ColorToken = keyof typeof colors;
