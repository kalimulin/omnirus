import { matchPath } from 'react-router-dom';

import type { PageHeaderBreadcrumb } from '@/components/molecules/types/types';

export const ROUTES = {
  home: '/',
  linksLanding: '/links-landing',
  dashboard: '/dashboard',
  links: '/links',
  linkDetails: '/links/:id',
  campaigns: '/campaigns',
  campaignDetails: '/campaigns/:id',
  addCampaignLink: '/campaigns/:id/add-link',
  editCampaignLink: '/campaigns/:id/edit-link/:linkId',
  profile: '/profile',
  login: '/login',
  registration: '/registration',
  forgotPassword: '/forgot-password',
  about: '/about-yourself',
  linkServiceError: '/links/errors/:type',
  linkNotFound: '/links/errors/not-found',
  linkInactive: '/links/errors/inactive',
  linkBlocked: '/links/errors/blocked',
  shortRedirect: '/s/:code'
} as const;

export const PAGE_TITLES: Partial<Record<string, string>> = {
  [ROUTES.links]: 'Короткие ссылки',
  [ROUTES.campaigns]: 'Кампании',
  [ROUTES.campaignDetails]: 'Кампания',
  [ROUTES.addCampaignLink]: 'Добавить ссылку в кампанию',
  [ROUTES.editCampaignLink]: 'Редактировать ссылку',
  [ROUTES.linkDetails]: 'Карточка ссылки',
  [ROUTES.linkNotFound]: 'Такой ссылки не существует',
  [ROUTES.linkInactive]: 'Ссылка временно не работает',
  [ROUTES.linkBlocked]: 'Переход по ссылке остановлен',
  [ROUTES.forgotPassword]: 'Восстановление пароля',
  [ROUTES.profile]: 'Настройка профиля',
  '/dashboard/profile': 'Настройка профиля',
  '/create/email': 'Создание e-mail рассылки',
  '/create/push': 'Создание рассылки push-уведомлений',
};

export const PAGE_BREADCRUMBS: Partial<Record<string, PageHeaderBreadcrumb[]>> = {
  [ROUTES.linkDetails]: [{ label: 'Короткие ссылки', href: ROUTES.links }],
  [ROUTES.campaignDetails]: [{ label: 'Кампании', href: ROUTES.campaigns }],
  [ROUTES.addCampaignLink]: [{ label: 'Кампании', href: ROUTES.campaigns }],
  [ROUTES.editCampaignLink]: [{ label: 'Кампании', href: ROUTES.campaigns }]
};

export function resolvePageHeaderMeta(pathname: string): {
  title: string;
  breadcrumbs: PageHeaderBreadcrumb[];
} {
  const exactTitle = PAGE_TITLES[pathname];
  if (exactTitle !== undefined) {
    return {
      title: exactTitle,
      breadcrumbs: PAGE_BREADCRUMBS[pathname] ?? []
    };
  }

  for (const [pattern, title] of Object.entries(PAGE_TITLES)) {
    if (title && matchPath({ path: pattern, end: true }, pathname)) {
      return {
        title,
        breadcrumbs: PAGE_BREADCRUMBS[pattern] ?? []
      };
    }
  }

  return { title: '', breadcrumbs: [] };
}

export const COLLAPSED_SIDEBAR_ROUTES = [] as const;
