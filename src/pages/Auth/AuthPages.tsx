import { Flex, Text } from '@chakra-ui/react';
import { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';

import SpinnerLoader from '@/components/atoms/Loaders/SpinnerLoader/SpinnerLoader';
import { FormsRegistryProvider } from '@/components/molecules/Form/Providers/FormsRegistryProvider';
import { ROUTES } from '@/routing/routes';

import { AuthPageLayout } from '../../components/layouts/AuthPageLayout';

const AuthLoginPage = lazy(() => import('./AuthLoginPage'));
const AuthRegisterPage = lazy(() => import('./AuthRegisterPage'));
const AuthForgotPasswordPage = lazy(() => import('./AuthForgotPasswordPage'));

type AuthMode = 'login' | 'register' | 'forgot-password';

function AuthFormLoader() {
  return (
    <Flex
      minH="180px"
      align="center"
      justify="center"
    >
      <SpinnerLoader />
    </Flex>
  );
}

export default function AuthPages({ mode }: { mode: AuthMode }) {
  const navigate = useNavigate();

  return (
    <FormsRegistryProvider>
      <AuthPageLayout
        footer={
          mode === 'login' ? (
            <Text
              as="button"
              type="button"
              color="var(--text-link)"
              fontSize="14px"
              fontWeight="500"
              onClick={() => navigate(ROUTES.forgotPassword)}
              _hover={{ textDecoration: 'underline' }}
              cursor="pointer"
            >
              Не помню пароль
            </Text>
          ) : undefined
        }
      >
        <Suspense fallback={<AuthFormLoader />}>
          {mode === 'login' ? (
            <AuthLoginPage />
          ) : mode === 'register' ? (
            <AuthRegisterPage />
          ) : (
            <AuthForgotPasswordPage />
          )}
        </Suspense>
      </AuthPageLayout>
    </FormsRegistryProvider>
  );
}
