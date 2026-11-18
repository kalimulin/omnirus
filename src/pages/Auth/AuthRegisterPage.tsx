import { Button, Link, Stack, Text, VStack, useToast } from '@chakra-ui/react';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { createUserCenter, loginUserCenter } from '@/api/userCenter';
import { useAuth } from '@/auth/AuthContext';
import { useFormsRegistry } from '@/components/molecules/Form/hooks/useFormsRegistry';
import { useFormSelector } from '@/components/molecules/Form/hooks/useFormValues';
import { FormProvider } from '@/components/molecules/Form/Providers/FormProvider';
import { RegisterForm } from '@/components/organisms/Forms/Auth/RegisterForm';
import { ROUTES } from '@/routing/routes';

import { EmailVerificationStep } from './EmailVerificationStep';

type RegisterValues = {
  login: string;
  password: string;
  passwordConfirm: string;
};

const isRegisterFormFilled = (values: RegisterValues) =>
  Boolean(
    values.login?.trim() &&
    values.password?.trim() &&
    values.passwordConfirm?.trim()
  );

export default function AuthRegisterPage() {
  return (
    <FormProvider formId="register">
      <AuthRegisterPageContent />
    </FormProvider>
  );
}

function AuthRegisterPageContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const registry = useFormsRegistry();
  const { login: setAuth } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'verify'>('form');
  const [verifyEmail, setVerifyEmail] = useState('');
  const [initialCode, setInitialCode] = useState('');

  const handleSubmit = async () => {
    const store = registry.getOrCreateStore('register');
    if (!store.validateAll()) return;

    const { login, password } = store.getValues<{
      login: string;
      password: string;
    }>();

    setIsLoading(true);
    try {
      const trimmedLogin = login.trim();
      const regResult = await createUserCenter(trimmedLogin, password);

      if (regResult && regResult.verificationRequired) {
        setVerifyEmail(trimmedLogin);
        if (regResult.debugCode) {
          setInitialCode(regResult.debugCode);
        }
        setStep('verify');
        toast({
          title: 'Код подтверждения отправлен',
          description: `Проверьте почту ${trimmedLogin} для завершения регистрации`,
          status: 'info',
          duration: 5000
        });
        return;
      }

      const auth = await loginUserCenter(trimmedLogin, password);
      setAuth(auth);
      toast({
        title: 'Вы успешно создали аккаунт',
        description: 'Добро пожаловать в сервис коротких ссылок',
        status: 'success',
        duration: 4000
      });
      navigate(ROUTES.about, { state: location.state });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Ошибка авторизации';
      store.setFieldError('passwordConfirm', message);
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
          navigate(ROUTES.about, { state: location.state });
        }}
        onCancel={() => setStep('form')}
      />
    );
  }

  return (
    <Stack spacing={6}>
      <RegisterForm onEnter={() => void handleSubmit()} />
      <VStack spacing={3}>
        <RegisterSubmitButton
          isLoading={isLoading}
          onSubmit={() => void handleSubmit()}
        />
        <Text
          fontSize="13px"
          color="var(--text-secondary)"
          textAlign="center"
          lineHeight="1.4"
        >
          Создавая аккаунт, вы принимаете{' '}
          <Link
            as="a"
            href={ROUTES.terms}
            target="_blank"
            rel="noopener noreferrer"
            color="var(--primary)"
            textDecoration="underline"
            _hover={{ color: 'var(--text-link-hover)' }}
          >
            Пользовательское соглашение
          </Link>{' '}
          и{' '}
          <Link
            as="a"
            href={ROUTES.privacy}
            target="_blank"
            rel="noopener noreferrer"
            color="var(--primary)"
            textDecoration="underline"
            _hover={{ color: 'var(--text-link-hover)' }}
          >
            Политику конфиденциальности
          </Link>
        </Text>
        <Link
          as="button"
          type="button"
          color="var(--primary)"
          fontSize="16px"
          fontWeight="500"
          onClick={() => navigate(ROUTES.login)}
          _hover={{ textDecoration: 'none', color: 'var(--text-link)' }}
        >
          У меня уже есть аккаунт
        </Link>
      </VStack>
    </Stack>
  );
}

function RegisterSubmitButton({
  isLoading,
  onSubmit
}: {
  isLoading: boolean;
  onSubmit: () => void;
}) {
  const isFilled = useFormSelector('register', isRegisterFormFilled);

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
      loadingText="Создаем аккаунт..."
      opacity={isFilled ? 1 : 0.5}
    >
      Создать аккаунт
    </Button>
  );
}
