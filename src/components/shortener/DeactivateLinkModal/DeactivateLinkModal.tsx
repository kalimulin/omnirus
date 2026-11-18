import {
  Box,
  Button,
  Checkbox,
  Flex,
  FormControl,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';
import { LuCircleAlert } from 'react-icons/lu';

import ArrowRightIcon from '@/components/atoms/Icons/home/ArrowRightIcon';
import type { DeactivateLinkModalProps } from '@/types/shortener';
import { validateAndCheckTargetUrl } from '@/utils/validators';

const inputStyles = {
  h: '48px',
  bg: 'var(--primary-bg)',
  border: '1px solid transparent',
  borderRadius: '10px',
  fontSize: 'var(--font-size-sm)',
  color: 'var(--text)',
  px: '16px',
  _placeholder: { color: 'var(--text-placeholder)' },
  _hover: {
    bg: 'var(--primary-bg)',
    borderColor: 'var(--btn-outline)'
  },
  _focus: {
    bg: 'var(--white)',
    borderColor: 'var(--primary)',
    boxShadow: '0 0 0 1px var(--primary)'
  },
  _invalid: {
    borderColor: 'var(--error)',
    boxShadow: '0 0 0 1px var(--error)'
  }
} as const;

export function DeactivateLinkModal({
  isOpen,
  onClose,
  onConfirm,
  link
}: DeactivateLinkModalProps) {
  const [reserveUrl, setReserveUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isUnderstood, setIsUnderstood] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevLink, setPrevLink] = useState(link);
  const submitGenerationRef = useRef(0);

  if (isOpen !== prevIsOpen || link !== prevLink) {
    setPrevIsOpen(isOpen);
    setPrevLink(link);
    setReserveUrl('');
    setError(null);
    setIsUnderstood(false);
    setIsSubmitting(false);
  }

  useEffect(() => {
    return () => {
      submitGenerationRef.current += 1;
    };
  }, [isOpen, link]);

  const handleClose = () => {
    if (isSubmitting) {
      return;
    }
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isUnderstood || isSubmitting) {
      return;
    }

    setError(null);
    const trimmed = reserveUrl.trim();
    if (!trimmed) {
      onConfirm();
      return;
    }

    setIsSubmitting(true);
    const generation = submitGenerationRef.current;

    try {
      const validUrl = await validateAndCheckTargetUrl(trimmed);
      if (submitGenerationRef.current !== generation) {
        return;
      }
      onConfirm(validUrl);
    } catch (err) {
      if (submitGenerationRef.current !== generation) {
        return;
      }
      setError(
        err instanceof Error
          ? err.message
          : 'Некорректный URL. Проверьте формат адреса.'
      );
    } finally {
      if (submitGenerationRef.current === generation) {
        setIsSubmitting(false);
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      closeOnEsc={!isSubmitting}
      closeOnOverlayClick={!isSubmitting}
      isCentered
      size="2xl"
    >
      <ModalOverlay />
      <ModalContent maxW="720px">
        <form onSubmit={handleSubmit}>
          <ModalHeader fontSize="var(--font-size-lg)">
            Деактивировать ссылку?
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody>
            {/* Сводка параметров ссылки */}
            <Box
              bg="var(--primary-bg)"
              borderRadius="12px"
              p="18px 20px"
              mb="20px"
            >
              <VStack
                align="stretch"
                spacing="12px"
              >
                <Box>
                  <Text
                    fontSize="var(--font-size-sm)"
                    fontWeight={500}
                    color="var(--text-secondary)"
                    mb="4px"
                  >
                    Название
                  </Text>
                  <Text
                    fontSize="var(--font-size-sm)"
                    color="var(--text)"
                    lineHeight="1.4"
                  >
                    {link?.name || '—'}
                  </Text>
                </Box>

                <Box>
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
                    lineHeight="1.4"
                    wordBreak="break-all"
                  >
                    {link?.shortUrl || '—'}
                  </Text>
                </Box>

                <Box>
                  <Text
                    fontSize="var(--font-size-sm)"
                    fontWeight={500}
                    color="var(--text-secondary)"
                    mb="4px"
                  >
                    Целевой URL
                  </Text>
                  <Text
                    fontSize="var(--font-size-sm)"
                    color="var(--text)"
                    lineHeight="1.4"
                    wordBreak="break-all"
                  >
                    {link?.targetUrl || '—'}
                  </Text>
                </Box>
              </VStack>
            </Box>

            {/* Предупреждение о деактивации */}
            <Box
              border="1px solid var(--orange-600)"
              bg="var(--white)"
              borderRadius="12px"
              p="16px 20px"
              mb="20px"
            >
              <Flex
                align="flex-start"
                gap="14px"
              >
                <Box
                  color="var(--orange-600)"
                  flexShrink={0}
                  mt="2px"
                  aria-hidden="true"
                >
                  <LuCircleAlert size={20} />
                </Box>
                <Text
                  fontSize="var(--font-size-sm)"
                  color="var(--orange-600)"
                  lineHeight="1.5"
                >
                  Короткая ссылка перестанет работать и перейдет в статус
                  «Неактивна», короткий адрес и статистика сохранятся. Все, кто
                  перейдет по ней попадут на страницу «Ссылка временно не
                  работает». Рекомендуем увести ссылку на резервный URL.
                </Text>
              </Flex>
            </Box>

            {/* Поле резервного URL */}
            <FormControl
              isInvalid={Boolean(error)}
              mb="20px"
            >
              <FormLabel
                fontSize="var(--font-size-sm)"
                fontWeight={600}
                color="var(--text)"
                mb="8px"
              >
                Резервный URL
              </FormLabel>
              <Input
                value={reserveUrl}
                onChange={(e) => {
                  setReserveUrl(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="https://example.ru/landing"
                isDisabled={isSubmitting}
                {...inputStyles}
              />
              <FormHelperText
                mt="8px"
                fontSize="var(--font-size-xs)"
                color="var(--text-secondary)"
                lineHeight="1.4"
              >
                Если вы не введете резервный URL, переходы будут направлены на
                страницу 404.
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

            {/* Подтверждение */}
            <Checkbox
              isChecked={isUnderstood}
              onChange={(e) => setIsUnderstood(e.target.checked)}
              isDisabled={isSubmitting}
              sx={{
                '.chakra-checkbox__control': {
                  borderColor: 'var(--text-placeholder)',
                  borderWidth: '1px',
                  borderRadius: '4px',
                  bg: 'var(--white)',
                  _checked: {
                    bg: 'var(--btn-solid)',
                    borderColor: 'var(--btn-solid)',
                    color: 'var(--white)',
                    _hover: {
                      bg: 'var(--btn-hover)',
                      borderColor: 'var(--btn-hover)'
                    }
                  }
                },
                '.chakra-checkbox__label': {
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--text)'
                }
              }}
            >
              Понимаю, что переходы по короткой ссылке перестанут работать
            </Checkbox>
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
                onClick={handleClose}
                isDisabled={isSubmitting}
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
                isDisabled={!isUnderstood || isSubmitting}
                isLoading={isSubmitting}
                rightIcon={
                  <ArrowRightIcon
                    width={14}
                    height={14}
                    color="var(--white)"
                  />
                }
              >
                Деактивировать
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default DeactivateLinkModal;
