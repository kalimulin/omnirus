import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  FormLabel,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Link,
  Stack,
  Text,
  VStack,
  useToast
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

import { confirmPasswordReset, requestPasswordReset } from '@/api/userCenter';
import { useAuth } from '@/auth/AuthContext';
import { getAuthRedirectPath } from '@/routing/authRedirect';
import { ROUTES } from '@/routing/routes';

export default function AuthForgotPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const { login: setAuth } = useAuth();

  const searchParams = new URLSearchParams(location.search);
  const emailParam = searchParams.get('email') || '';
  const codeParam = searchParams.get('code') || '';
  const tokenParam = searchParams.get('token') || '';

  const [step, setStep] = useState<'request' | 'reset'>(
    emailParam && (codeParam || tokenParam) ? 'reset' : 'request'
  );

  const [email, setEmail] = useState(emailParam);
  const [code, setCode] = useState(codeParam);
  const [token] = useState(tokenParam);
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const redirectTo = getAuthRedirectPath(location.state);

  // Обратный отсчёт для повторной отправки кода
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleRequestCode = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Введите адрес e-mail');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Укажите корректный e-mail адрес');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await requestPasswordReset(trimmedEmail);
      toast({
        title: 'Код отправлен',
        description: res.message,
        status: 'info',
        duration: 5000
      });
      setResendTimer(60);
      setStep('reset');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Не удалось отправить код восстановления';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    setError('');

    try {
      const res = await requestPasswordReset(email.trim());
      setResendTimer(60);
      toast({
        title: 'Новый код отправлен',
        description: res.message,
        status: 'info',
        duration: 4000
      });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Не удалось отправить код повторно';
      setError(msg);
    } finally {
      setIsResending(false);
    }
  };

  const handleResetPassword = async () => {
    const trimmedCode = code.trim();
    if (!token && trimmedCode.length !== 6) {
      setError('Код восстановления должен состоять из 6 цифр');
      return;
    }
    if (newPassword.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }
    if (newPassword !== newPasswordConfirm) {
      setError('Пароли не совпадают');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const auth = await confirmPasswordReset({
        email: email.trim(),
        code: trimmedCode,
        newPassword,
        token: token || undefined
      });

      setAuth(auth);
      toast({
        title: 'Пароль успешно изменён',
        description: 'Вы вошли в свой аккаунт с новым паролем',
        status: 'success',
        duration: 4000
      });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Не удалось установить новый пароль';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 'request') {
    return (
      <Stack spacing={6}>
        <Box textAlign="center">
          <Text fontSize="20px" fontWeight="600" color="var(--text)" mb={2}>
            Восстановление пароля
          </Text>
          <Text fontSize="14px" color="var(--text-secondary)" lineHeight="20px">
            Введите адрес e-mail, привязанный к вашему аккаунту, и мы отправим проверочный код:
          </Text>
        </Box>

        <FormControl isInvalid={Boolean(error)}>
          <FormLabel fontSize="14px" fontWeight="500" color="var(--text)" mb={1}>
            Электронная почта
          </FormLabel>
          <Input
            type="email"
            placeholder="example@омни.рус"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleRequestCode();
              }
            }}
            h="49px"
            borderRadius="12px"
            autoFocus
          />
          {error && (
            <FormErrorMessage mt={2} fontSize="13px">
              {error}
            </FormErrorMessage>
          )}
        </FormControl>

        <VStack spacing={2}>
          <Button
            w="100%"
            h="49px"
            borderRadius="12px"
            bg="var(--primary)"
            _hover={{ bg: 'var(--text-link)' }}
            color="var(--snow)"
            fontSize="16px"
            fontWeight="500"
            onClick={() => void handleRequestCode()}
            isLoading={isLoading}
            loadingText="Отправляем код..."
            isDisabled={!email.trim()}
          >
            Получить код
          </Button>

          <Link
            as="button"
            type="button"
            color="var(--primary)"
            fontSize="14px"
            fontWeight="500"
            onClick={() => navigate(ROUTES.login, { state: location.state })}
            _hover={{ textDecoration: 'none', color: 'var(--text-link)' }}
            pt={2}
          >
            Вспомнили пароль? Войти
          </Link>
        </VStack>
      </Stack>
    );
  }

  return (
    <Stack spacing={5}>
      <Box textAlign="center">
        <Text fontSize="20px" fontWeight="600" color="var(--text)" mb={2}>
          Новый пароль
        </Text>
        <Text fontSize="14px" color="var(--text-secondary)" lineHeight="20px">
          Код отправлен на{' '}
          <strong style={{ color: 'var(--text)' }}>{email}</strong>. Введите его и задайте новый пароль:
        </Text>
      </Box>

      {/* Поле кода подтверждения */}
      <FormControl isInvalid={Boolean(error && error.includes('код'))}>
        <FormLabel fontSize="14px" fontWeight="500" color="var(--text)" mb={1}>
          6-значный проверочный код
        </FormLabel>
        <Input
          value={code}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(digits);
            setError('');
          }}
          placeholder="123456"
          textAlign="center"
          fontSize="22px"
          fontWeight="700"
          letterSpacing="6px"
          h="50px"
          borderRadius="12px"
          inputMode="numeric"
          autoComplete="one-time-code"
          autoFocus={!code}
        />
      </FormControl>

      {/* Новый пароль */}
      <FormControl isInvalid={Boolean(error && (error.includes('Пароль') || error.includes('парол')))}>
        <FormLabel fontSize="14px" fontWeight="500" color="var(--text)" mb={1}>
          Новый пароль
        </FormLabel>
        <InputGroup>
          <Input
            type={showPassword ? 'text' : 'password'}
            value={newPassword}
            onChange={(e) => {
              setNewPassword(e.target.value);
              setError('');
            }}
            placeholder="минимум 6 символов"
            h="49px"
            borderRadius="12px"
            autoComplete="new-password"
          />
          <InputRightElement h="49px">
            <IconButton
              aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
              icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
              variant="ghost"
              size="sm"
              onClick={() => setShowPassword((prev) => !prev)}
            />
          </InputRightElement>
        </InputGroup>
      </FormControl>

      {/* Повтор нового пароля */}
      <FormControl isInvalid={Boolean(error && (error.includes('совпадают') || error.includes('парол')))}>
        <FormLabel fontSize="14px" fontWeight="500" color="var(--text)" mb={1}>
          Повторите новый пароль
        </FormLabel>
        <InputGroup>
          <Input
            type={showPasswordConfirm ? 'text' : 'password'}
            value={newPasswordConfirm}
            onChange={(e) => {
              setNewPasswordConfirm(e.target.value);
              setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                void handleResetPassword();
              }
            }}
            placeholder="повторите новый пароль"
            h="49px"
            borderRadius="12px"
            autoComplete="new-password"
          />
          <InputRightElement h="49px">
            <IconButton
              aria-label={showPasswordConfirm ? 'Скрыть пароль' : 'Показать пароль'}
              icon={showPasswordConfirm ? <ViewOffIcon /> : <ViewIcon />}
              variant="ghost"
              size="sm"
              onClick={() => setShowPasswordConfirm((prev) => !prev)}
            />
          </InputRightElement>
        </InputGroup>
        {error && (
          <FormErrorMessage mt={2} fontSize="13px">
            {error}
          </FormErrorMessage>
        )}
      </FormControl>

      <Button
        w="100%"
        h="49px"
        borderRadius="12px"
        bg="var(--primary)"
        _hover={{ bg: 'var(--text-link)' }}
        color="var(--snow)"
        fontSize="16px"
        fontWeight="500"
        onClick={() => void handleResetPassword()}
        isLoading={isLoading}
        loadingText="Сохраняем пароль..."
        isDisabled={(!token && code.length !== 6) || newPassword.length < 6 || !newPasswordConfirm}
      >
        Сохранить новый пароль
      </Button>

      <HStack justify="space-between" fontSize="14px" pt={1}>
        <Link
          as="button"
          type="button"
          color="var(--primary)"
          onClick={() => {
            setStep('request');
            setError('');
          }}
          _hover={{ textDecoration: 'none', color: 'var(--text-link)' }}
        >
          Изменить email
        </Link>
        <Button
          variant="link"
          size="sm"
          color="var(--primary)"
          isDisabled={resendTimer > 0 || isResending}
          onClick={() => void handleResend()}
          isLoading={isResending}
        >
          {resendTimer > 0 ? `Повтор через ${resendTimer}с` : 'Отправить код снова'}
        </Button>
      </HStack>

      <Box textAlign="center" pt={1}>
        <Link
          as="button"
          type="button"
          color="var(--text-secondary)"
          fontSize="14px"
          onClick={() => navigate(ROUTES.login, { state: location.state })}
          _hover={{ textDecoration: 'none', color: 'var(--primary)' }}
        >
          Вернуться ко входу
        </Link>
      </Box>
    </Stack>
  );
}
