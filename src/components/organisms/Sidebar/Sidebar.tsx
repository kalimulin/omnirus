import { Flex } from '@chakra-ui/react';
import { memo, useState } from 'react';
import { useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import LogoFigmaIcon from '@/components/atoms/Icons/home/LogoFigmaIcon';
import { LogoMini } from '@/components/atoms/Icons/LogoMini';
import { SidebarLimitsWidget } from '@/components/molecules/SidebarElements/SidebarLimitsWidget/SidebarLimitsWidget';
import { SidebarMenu } from '@/components/molecules/SidebarMenu/SidebarMenu';
import { LimitExceededModal } from '@/components/shortener/LimitExceededModal/LimitExceededModal';
import { COLLAPSED_SIDEBAR_ROUTES, ROUTES } from '@/routing/routes';

import { SidebarProvider, useSidebar } from './SidebarContext';

function SidebarContent() {
  const { isCollapsed } = useSidebar();
  const { limits, isAuthorized } = useAuth();
  const [limitModalResource, setLimitModalResource] = useState<'shortcuts' | 'campaigns' | null>(null);

  return (
    <Flex
      as="nav"
      alignSelf="flex-start"
      maxW={isCollapsed ? '80px' : '240px'}
      position={'sticky'}
      zIndex={999}
      top={0}
      w={'100%'}
      minH="100vh"
      flexShrink={0}
      padding={'20px'}
      bg={'white'}
      direction={'column'}
      gap={'30px'}
      transition="max-width 0.2s ease"
    >
      <Flex
        as={'a'}
        href={ROUTES.links}
        alignItems={'center'}
        justifyContent={'center'}
        w={'full'}
        h={isCollapsed ? '52px' : undefined}
      >
        {isCollapsed ? (
          <LogoMini />
        ) : (
          <LogoFigmaIcon
            width={180}
            height={66}
          />
        )}
      </Flex>
      <SidebarMenu />
      {isAuthorized && !isCollapsed && limits && (
        <SidebarLimitsWidget
          limits={limits}
          onOpenModal={(res) => setLimitModalResource(res)}
        />
      )}
      {limitModalResource && limits && (
        <LimitExceededModal
          isOpen={true}
          onClose={() => setLimitModalResource(null)}
          resource={limitModalResource}
          limit={limits[limitModalResource].max}
          used={limits[limitModalResource].used}
        />
      )}
    </Flex>
  );
}

function SidebarComponent() {
  const { pathname } = useLocation();
  const normalizedPathname =
    pathname.replace(/\/+$/, '') || ROUTES.home;
  const isCollapsed = COLLAPSED_SIDEBAR_ROUTES.some(
    (route) => route === normalizedPathname
  );

  return (
    <SidebarProvider isCollapsed={isCollapsed}>
      <SidebarContent />
    </SidebarProvider>
  );
}

export const Sidebar = memo(SidebarComponent);
