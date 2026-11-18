import {
  Box,
  Button,
  HStack,
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
import React from 'react';

import ArrowRightIcon from '@/components/atoms/Icons/home/ArrowRightIcon';
import type { ActivateLinkModalProps } from '@/types/shortener';

export function ActivateLinkModal({
  isOpen,
  onClose,
  onConfirm,
  link,
  isLoading = false
}: ActivateLinkModalProps) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    onConfirm();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!isLoading) onClose();
      }}
      closeOnEsc={!isLoading}
      closeOnOverlayClick={!isLoading}
      isCentered
      size="2xl"
    >
      <ModalOverlay />
      <ModalContent maxW="720px">
        <form onSubmit={handleSubmit}>
          <ModalHeader fontSize="var(--font-size-lg)">
            Активировать ссылку?
          </ModalHeader>

          <ModalCloseButton isDisabled={isLoading} />

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

            <Text
              fontSize="var(--font-size-sm)"
              color="var(--text-secondary)"
              lineHeight="1.5"
            >
              Трафик по ссылке будет восстановлен.
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
                onClick={onClose}
                isDisabled={isLoading}
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
                isDisabled={isLoading}
                isLoading={isLoading}
                rightIcon={
                  <ArrowRightIcon
                    width={14}
                    height={14}
                    color="var(--white)"
                  />
                }
              >
                Активировать
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default ActivateLinkModal;
