import { Button, Link, Stack, VStack, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { fetchMyProfile } from '@/api/profile';
import { loginUserCenter } from '@/api/userCenter';
import { useAuth } from '@/auth/AuthContext';
import { useFormsRegistry } from '@/components/molecules/Form/hooks/useFormsRegistry';
import { useFormSelector } from '@/components/molecules/Form/hooks/useFormValues';
import { FormProvider } from '@/components/molecules/Form/Providers/FormProvider';
import LoginForm from '@/components/organisms/Forms/Auth/LoginForm';
import { getAuthRedirectPath } from '@/routing/authRedirect';
import { ROUTES } from '@/routing/routes';

import { EmailVerificationStep } from './EmailVerificationStep';

type LoginValues = {
  login: string;
  password: string;
};

const isLoginFormFilled = (values: LoginValues) =>
  Boolean(values.login?.trim() && values.password?.trim());

export default function AuthLoginPage() {
  return (
    <FormProvider formId="login">
      <AuthLoginPageContent />
    </FormProvider>
  );
}

function AuthLoginPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const registry = useFormsRegistry();
  const { login: setAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const searchParams = new URLSearchParams(location.search);
  const verifyEmailParam = searchParams.get('verifyEmail') || '';
  const codeParam = searchParams.get('code') || '';

  const [step, setStep] = useState<'form' | 'verify'>(
    verifyEmailParam ? 'verify' : 'form'
  );
  const [verifyEmail, setVerifyEmail] = useState(verifyEmailParam);
  const [initialCode] = useState(codeParam);

  const redirectTo = getAuthRedirectPath(location.state);

  const handleSubmit = async () => {
    const store = registry.getOrCreateStore('login');
    if (!store.validateAll()) return;

    const { login, password } = store.getValues<{
      login: string;
      password: string;
    }>();

    setIsLoading(true);
    try {
      const auth = await loginUserCenter(login.trim(), password);
      let authWithProfile = auth;
      try {
        const profile = await fetchMyProfile(auth.accessToken);
        if (profile) {
          const firstName = profile.first_name?.trim();
          const lastName = profile.last_name?.trim();
          authWithProfile = {
            ...auth,
            ...(firstName ? { firstName } : {}),
            ...(lastName ? { lastName } : {})
          };

          if (firstName || lastName) {
            const email =
              profile.contact_email?.find(
                (item) =>
                  item.title?.toLowerCase() === 'work' ||
                  item.title?.toLowerCase() === 'рабочий'
              )?.value ||
              profile.contact_email?.[0]?.value ||
              auth.login;
            sessionStorage.setItem(
              'profile_data',
              JSON.stringify({
                firstName: firstName ?? '',
                lastName: lastName ?? '',
                email
              })
            );
          }
        }
      } catch (error) {
        console.warn('Could not load profile after login:', error);
      }

      setAuth(authWithProfile);
      toast({
        title: 'Вы успешно вошли',
        description: 'Добро пожаловать в сервис коротких ссылок',
        status: 'success',
        duration: 4000
      });
      navigate(redirectTo, { replace: true });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ошибка авторизации';

      if (
        message.toLowerCase().includes('не подтверждён') ||
        message.includes('EMAIL_NOT_VERIFIED')
      ) {
        setVerifyEmail(login.trim());
        setStep('verify');
        toast({
          title: 'Требуется подтверждение email',
          description: 'Пожалуйста, введите 6-значный проверочный код',
          status: 'warning',
          duration: 5000
        });
        return;
      }

      store.setFieldError('password', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <EmailVerificationStep
        email={verifyEmail}
        initialCode={initialCode}
        onSuccess={(auth) => {
          setAuth(auth);
          navigate(redirectTo, { replace: true });
        }}
        onCancel={() => setStep('form')}
      />
    );
  }

  return (
    <Stack spacing={6}>
      <LoginForm onEnter={() => void handleSubmit()} />
      <VStack spacing={1}>
        <LoginSubmitButton
          isLoading={isLoading}
          onSubmit={() => void handleSubmit()}
        />
        <Link
          as="button"
          type="button"
          color="var(--text-link)"
          fontSize="14px"
          fontWeight="500"
          onClick={() =>
            navigate(ROUTES.forgotPassword, { state: location.state })
          }
          _hover={{ textDecoration: 'underline' }}
          pt={1}
        >
          Не помню пароль
        </Link>
        <Link
          as="button"
          type="button"
          color="var(--primary)"
          fontSize="16px"
          fontWeight="500"
          onClick={() =>
            navigate(ROUTES.registration, { state: location.state })
          }
          _hover={{ textDecoration: 'none', color: 'var(--text-link)' }}
        >
          Нет аккаунта? Зарегистрируйтесь
        </Link>
      </VStack>
    </Stack>
  );
}

function LoginSubmitButton({
  isLoading,
  onSubmit
}: {
  isLoading: boolean;
  onSubmit: () => void;
}) {
  const isFilled = useFormSelector('login', isLoginFormFilled);

  return (
    <Button
      w="100%"
      h="49px"
      borderRadius="12px"
      bg="var(--primary)"
      _hover={{ bg: 'var(--text-link)' }}
      color="var(--snow)"
      fontSize="16px"
      fontWeight="500"
      onClick={onSubmit}
      isLoading={isLoading}
      loadingText="Входим..."
      opacity={isFilled ? 1 : 0.5}
      disabled={!isFilled}
    >
      Войти
    </Button>
  );
}
