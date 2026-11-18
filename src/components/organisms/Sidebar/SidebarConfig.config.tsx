import { FiFolder, FiLink } from 'react-icons/fi';

import {
  SidebarMenuItemProps
} from '@/components/molecules/types/sidebar';
import { ROUTES } from '@/routing/routes';

const MENU_ICON_SIZE = 24;

export const sidebarMenuItems: SidebarMenuItemProps[] = [
  {
    leftIcon: (
      <FiLink
        size={MENU_ICON_SIZE}
        strokeWidth={1}
      />
    ),
    text: 'Ссылки',
    as: 'a',
    href: ROUTES.links
  },
  {
    leftIcon: (
      <FiFolder
        size={MENU_ICON_SIZE}
        strokeWidth={1}
      />
    ),
    text: 'Кампании',
    as: 'a',
    href: ROUTES.campaigns
  }
];
