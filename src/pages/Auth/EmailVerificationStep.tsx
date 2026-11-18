import {
  Box,
  Button,
  FormControl,
  FormErrorMessage,
  HStack,
  Input,
  Link,
  Stack,
  Text,
  useToast
} from '@chakra-ui/react';
import { useCallback, useEffect, useState } from 'react';

import type { UserCenterLoginSuccess } from '@/api/types';
import { resendVerificationCode, verifyEmailUserCenter } from '@/api/userCenter';

interface EmailVerificationStepProps {
  email: string;
  initialCode?: string;
  onSuccess: (auth: UserCenterLoginSuccess) => void;
  onCancel: () => void;
}

export function EmailVerificationStep({
  email,
  initialCode = '',
  onSuccess,
  onCancel
}: EmailVerificationStepProps) {
  const toast = useToast();
  const [code, setCode] = useState(initialCode);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);

  // Обратный отсчёт для повторной отправки кода
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  const handleSubmit = useCallback(
    async (codeToVerify?: string) => {
      const codeVal = (codeToVerify ?? code).trim();
      if (codeVal.length !== 6) {
        setError('Код подтверждения должен состоять из 6 цифр');
        return;
      }

      setIsLoading(true);
      setError('');
      try {
        const auth = await verifyEmailUserCenter(email, codeVal);
        toast({
          title: 'Email успешно подтверждён',
          status: 'success',
          duration: 4000
        });
        onSuccess(auth);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Неверный проверочный код';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [code, email, onSuccess, toast]
  );

  // Автопроверка, если передан initialCode (например, из ссылки)
  useEffect(() => {
    if (initialCode && initialCode.length === 6) {
      void handleSubmit(initialCode);
    }
  }, [initialCode, handleSubmit]);

  const handleResend = async () => {
    if (resendTimer > 0 || isResending) return;

    setIsResending(true);
    setError('');
    try {
      const res = await resendVerificationCode(email);
      setResendTimer(res.expiresInSeconds ? Math.min(res.expiresInSeconds, 60) : 60);
      toast({
        title: 'Код отправлен',
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

  return (
    <Stack spacing={5} textAlign="center">
      <Box>
        <Text fontSize="20px" fontWeight="600" color="var(--text)" mb={2}>
          Подтвердите e-mail
        </Text>
        <Text fontSize="14px" color="var(--text-secondary)" lineHeight="20px">
          Мы отправили 6-значный проверочный код на{' '}
          <strong style={{ color: 'var(--text)' }}>{email}</strong>.
          Введите его для защиты аккаунта от ботов:
        </Text>
      </Box>

      <FormControl isInvalid={Boolean(error)}>
        <Input
          value={code}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 6);
            setCode(digits);
            setError('');
            if (digits.length === 6) {
              void handleSubmit(digits);
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              void handleSubmit();
            }
          }}
          placeholder="123456"
          textAlign="center"
          fontSize="24px"
          fontWeight="700"
          letterSpacing="8px"
          h="54px"
          borderRadius="12px"
          autoFocus
          inputMode="numeric"
          autoComplete="one-time-code"
        />
        {error && (
          <FormErrorMessage justifyContent="center" mt={2} fontSize="13px">
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
        onClick={() => void handleSubmit()}
        isLoading={isLoading}
        loadingText="Проверяем код..."
        isDisabled={code.length !== 6}
      >
        Подтвердить e-mail
      </Button>

      <HStack justify="space-between" fontSize="14px" pt={1}>
        <Link
          as="button"
          type="button"
          color="var(--primary)"
          onClick={onCancel}
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
          {resendTimer > 0
            ? `Повтор через ${resendTimer}с`
            : 'Отправить код снова'}
        </Button>
      </HStack>
    </Stack>
  );
}
