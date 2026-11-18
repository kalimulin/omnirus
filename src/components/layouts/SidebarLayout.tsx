import { Flex, Box } from '@chakra-ui/react';
import { Suspense, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '@/auth/AuthContext';
import SpinnerLoader from '@/components/atoms/Loaders/SpinnerLoader/SpinnerLoader';
import PageHeader from '@/components/molecules/PageHeader/PageHeader';
import { Sidebar } from '@/components/organisms/Sidebar/Sidebar';
import { ROUTES, resolvePageHeaderMeta } from '@/routing/routes';

import { PageHeaderContext } from './PageHeaderContext';

function SidebarLayout() {
  const { pathname } = useLocation();
  const normalizedPathname =
    pathname.replace(/\/+$/, '') || ROUTES.home;
  const { isAuthorized } = useAuth();
  const { title, breadcrumbs } = resolvePageHeaderMeta(normalizedPathname);
  const [titleOverride, setTitleOverride] = useState<string | null>(null);
  const headerContextValue = useMemo(
    () => ({ setTitleOverride }),
    []
  );

  return (
    <PageHeaderContext.Provider value={headerContextValue}>
      <Flex
        minH="100vh"
        alignItems="stretch"
      >
        <Sidebar />
        <Flex
          flex={1}
          minW={0}
          direction="column"
        >
          <PageHeader
            isAuthorized={isAuthorized}
            title={titleOverride || title}
            breadcrumbTitle={title}
            breadcrumbs={breadcrumbs}
          />
          <Box as="main" h={"full"}>
            <Suspense
              fallback={
                <Flex
                  minH="100dvh"
                  justifyContent="center"
                  alignItems="center"
                  bg="var(--bg)"
                >
                  <SpinnerLoader />
                </Flex>
              }
            >
              <Outlet />
            </Suspense>
          </Box>
        </Flex>
      </Flex>
    </PageHeaderContext.Provider>
  );
}

export default SidebarLayout;
