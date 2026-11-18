import { Flex } from '@chakra-ui/react';
import { useCallback, useState } from 'react';
import { useLocation } from 'react-router-dom';

import {
  sidebarMenuItems
} from '@/components/organisms/Sidebar/SidebarConfig.config';

import { SidebarMenuItem } from '../SidebarElements/SidebarMenuItem/SidebarMenuItem';

export function SidebarMenu() {
  const { pathname } = useLocation();
  const [openMenu, setOpenMenu] = useState<{
    id: string;
    pathname: string;
  } | null>(null);
  const openId = openMenu?.pathname === pathname ? openMenu.id : null;

  const handleToggle = useCallback((id: string) => {
    setOpenMenu((previous) =>
      previous?.id === id && previous.pathname === pathname
        ? null
        : { id, pathname }
    );
  }, [pathname]);

  return (
    <Flex
      as={'menu'}
      p={0}
      m={0}
      direction={'column'}
      gap={2}
    >
      {sidebarMenuItems.map((item) => (
        <SidebarMenuItem
          key={item.text}
          {...item}
          isOpen={openId === item.text}
          onToggle={handleToggle}
        />
      ))}
    </Flex>
  );
}
