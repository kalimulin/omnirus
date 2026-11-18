import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  Text,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Button,
  HStack,
  useToast
} from '@chakra-ui/react';
import { useState, useRef, useEffect } from 'react';

import ArrowRightIcon from '@/components/atoms/Icons/home/ArrowRightIcon';
import type { RedirectModalProps } from '@/types/shortener';
import { validateAndCheckTargetUrl } from '@/utils/validators';

export function RedirectModal({
  isOpen,
  onClose,
  shortUrl,
  initialTargetUrl = '',
  onSave,
  isLoading = false
}: RedirectModalProps) {
  const [targetUrl, setTargetUrl] = useState(initialTargetUrl);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevInitialTargetUrl, setPrevInitialTargetUrl] =
    useState(initialTargetUrl);
  const inputRef = useRef<HTMLInputElement>(null);
  const submitGenerationRef = useRef(0);
  const toast = useToast();

  if (isOpen !== prevIsOpen || initialTargetUrl !== prevInitialTargetUrl) {
    setPrevIsOpen(isOpen);
    setPrevInitialTargetUrl(initialTargetUrl);
    setIsConfirmCloseOpen(false);
    setError(null);
    setIsSubmitting(false);
    if (isOpen) {
      setTargetUrl(initialTargetUrl);
    }
  }

  useEffect(() => {
    return () => {
      submitGenerationRef.current += 1;
    };
  }, [isOpen, initialTargetUrl]);

  const isBusy = isLoading || isSubmitting;
  const hasChanges = targetUrl.trim() !== initialTargetUrl.trim();

  const handleRequestClose = () => {
    if (isBusy) {
      return;
    }
    if (hasChanges) {
      setIsConfirmCloseOpen(true);
      return;
    }
    onClose();
  };

  const handleConfirmDiscard = () => {
    setIsConfirmCloseOpen(false);
    setError(null);
    onClose();
  };

  const handleContinueEditing = () => {
    setIsConfirmCloseOpen(false);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (isBusy || !hasChanges) {
      return;
    }

    setError(null);
    const trimmed = targetUrl.trim();
    if (!trimmed) {
      setError('Введите целевой URL');
      return;
    }

    setIsSubmitting(true);
    const generation = submitGenerationRef.current;

    try {
      const validUrl = await validateAndCheckTargetUrl(trimmed);
      if (submitGenerationRef.current !== generation) {
        return;
      }
      await onSave(validUrl);
    } catch (err) {
      if (submitGenerationRef.current !== generation) {
        return;
      }
      toast({
        title: 'Не удалось сохранить ссылку',
        description: err instanceof Error ? err.message : undefined,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
    } finally {
      if (submitGenerationRef.current === generation) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleRequestClose}
        closeOnEsc={!isConfirmCloseOpen && !isBusy}
        closeOnOverlayClick={!isConfirmCloseOpen && !isBusy}
        trapFocus={!isConfirmCloseOpen}
        isCentered
        size="2xl"
      >
        <ModalOverlay />
        <ModalContent maxW="720px">
          <form onSubmit={handleSubmit}>
            <ModalHeader fontSize="var(--font-size-lg)">
              Перенаправить ссылку на другой URL
            </ModalHeader>

            <ModalCloseButton />

            <ModalBody>
              {/* Карточка текущей короткой ссылки */}
              <Box
                bg="var(--primary-bg)"
                borderRadius="12px"
                p="18px 20px"
                mb="24px"
              >
                <Text
                  fontSize="var(--font-size-sm)"
                  fontWeight={500}
                  color="var(--text-secondary)"
                  mb="4px"
                >
                  Короткий URL
                </Text>
                <Text
                  fontSize="var(--font-size-md)"
                  fontWeight={700}
                  color="var(--text-link)"
                  mb="8px"
                >
                  {shortUrl}
                </Text>
                <Text
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  lineHeight="1.4"
                >
                  Короткий адрес и QR-код не изменяются при смене целевого URL
                </Text>
              </Box>

              {/* Форма ввода целевого URL */}
              <FormControl isInvalid={Boolean(error)}>
                <FormLabel
                  fontSize="var(--font-size-sm)"
                  fontWeight={600}
                  color="var(--text)"
                  mb="8px"
                >
                  Целевой URL{' '}
                  <Text
                    as="span"
                    color="var(--error)"
                  >
                    *
                  </Text>
                </FormLabel>
                <Input
                  ref={inputRef}
                  value={targetUrl}
                  onChange={(e) => {
                    setTargetUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://example.com/new-destination"
                  _placeholder={{ color: 'var(--text-placeholder)' }}
                  autoFocus
                  h="48px"
                  bg="var(--primary-bg)"
                  border="1px solid transparent"
                  borderRadius="10px"
                  fontSize="var(--font-size-sm)"
                  color="var(--text)"
                  px="16px"
                  _hover={{
                    bg: 'var(--primary-bg)',
                    borderColor: 'var(--btn-outline)'
                  }}
                  _focus={{
                    bg: 'var(--white)',
                    borderColor: 'var(--primary)',
                    boxShadow: '0 0 0 1px var(--primary)'
                  }}
                  _invalid={{
                    borderColor: 'var(--error)',
                    boxShadow: '0 0 0 1px var(--error)'
                  }}
                />
                <FormHelperText
                  mt="8px"
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  lineHeight="1.4"
                >
                  Короткая ссылка и QR-код не изменятся. Новый адрес заработает
                  сразу для всех новых переходов.
                </FormHelperText>
                {error && (
                  <FormErrorMessage
                    fontSize="var(--font-size-xs)"
                    color="var(--error)"
                  >
                    {error}
                  </FormErrorMessage>
                )}
              </FormControl>
            </ModalBody>

            <ModalFooter>
              <HStack
                spacing="16px"
                justify="flex-end"
                w="100%"
              >
                <Button
                  variant="ghost"
                  color="var(--text)"
                  fontSize="var(--font-size-sm)"
                  fontWeight={500}
                  h="42px"
                  px="16px"
                  borderRadius="10px"
                  _hover={{ bg: 'var(--slate-100-alt2)' }}
                  onClick={handleRequestClose}
                  isDisabled={isBusy}
                >
                  Отмена
                </Button>
                <Button
                  type="submit"
                  bg="var(--btn-solid)"
                  color="var(--white)"
                  fontSize="var(--font-size-sm)"
                  fontWeight={600}
                  h="42px"
                  px="22px"
                  borderRadius="10px"
                  _hover={{ bg: 'var(--btn-hover)' }}
                  _active={{ bg: 'var(--btn-hover)' }}
                  _disabled={{
                    bg: 'var(--btn-disabled)',
                    cursor: 'not-allowed',
                    opacity: 0.7
                  }}
                  isLoading={isBusy}
                  isDisabled={!hasChanges || isBusy}
                  rightIcon={
                    <ArrowRightIcon
                      width={14}
                      height={14}
                      color="var(--white)"
                    />
                  }
                >
                  Изменить целевой URL
                </Button>
              </HStack>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>

      {/* Диалог подтверждения закрытия при несохраненных изменениях */}
      <Modal
        isOpen={isConfirmCloseOpen}
        onClose={handleContinueEditing}
        finalFocusRef={inputRef}
        isCentered
        size="md"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Закрыть без сохранения?</ModalHeader>

          <ModalCloseButton />

          <ModalBody>
            <Text
              fontSize="var(--font-size-sm)"
              color="var(--text-secondary)"
              lineHeight="1.5"
            >
              Изменения в поле «Целевой URL» не сохранены.
              <br />
              Если закрыть окно, правки будут потеряны.
            </Text>
          </ModalBody>

          <ModalFooter>
            <HStack
              spacing="16px"
              justify="flex-end"
              w="100%"
            >
              <Button
                variant="ghost"
                color="var(--text)"
                fontSize="var(--font-size-sm)"
                fontWeight={500}
                h="42px"
                px="16px"
                borderRadius="10px"
                _hover={{ bg: 'var(--slate-100-alt2)' }}
                onClick={handleConfirmDiscard}
              >
                Закрыть
              </Button>
              <Button
                bg="var(--btn-solid)"
                color="var(--white)"
                fontSize="var(--font-size-sm)"
                fontWeight={600}
                h="42px"
                px="22px"
                borderRadius="10px"
                _hover={{ bg: 'var(--btn-hover)' }}
                _active={{ bg: 'var(--btn-hover)' }}
                onClick={handleContinueEditing}
              >
                Продолжить редактирование
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
