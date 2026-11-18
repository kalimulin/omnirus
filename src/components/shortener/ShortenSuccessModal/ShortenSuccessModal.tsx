import {
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  useToast
} from '@chakra-ui/react';
import { useState } from 'react';

import ArrowRightIcon from '@/components/atoms/Icons/home/ArrowRightIcon';
import { QrModal } from '@/components/shortener/QrModal/QrModal';
import type { ShortenSuccessModalProps } from '@/types/shortener';

import { copyShortLinkToClipboard, extractShortcut } from './clipboard';

export function ShortenSuccessModal({
  isOpen,
  onClose,
  onShortenMore,
  link
}: ShortenSuccessModalProps) {
  const toast = useToast();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevLink, setPrevLink] = useState(link);

  if (isOpen !== prevIsOpen || link !== prevLink) {
    setPrevIsOpen(isOpen);
    setPrevLink(link);
    setIsQrOpen(false);
  }

  if (!link) {
    return null;
  }

  const shortcut = link.shortcut || extractShortcut(link.shortUrl);

  const handleCopy = async () => {
    const copied = await copyShortLinkToClipboard(link);
    if (copied) {
      toast({
        title: 'Ссылка скопирована в буфер обмена',
        status: 'success',
        duration: 4000,
        isClosable: true
      });
    } else {
      toast({
        title: 'Не удалось скопировать ссылку',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    }
  };

  if (isOpen && isQrOpen && shortcut) {
    return (
      <QrModal
        shortUrl={link.shortUrl}
        shortcut={shortcut}
        onClose={() => setIsQrOpen(false)}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="xl"
    >
      <ModalOverlay />
      <ModalContent
        maxW="640px"
        w="100%"
        borderRadius="16px"
        fontFamily="var(--font-family)"
        boxShadow="0 20px 60px rgba(18, 35, 63, 0.18)"
        mx="16px"
        bg="var(--white)"
      >
        <ModalHeader
          fontSize="var(--font-size-xl)"
          fontWeight={700}
          color="var(--text)"
          px="36px"
          pt="32px"
          pb="16px"
          borderBottom="none"
        >
          Короткая ссылка готова!
        </ModalHeader>
        <ModalCloseButton
          top="24px"
          right="28px"
          color="var(--text)"
          _hover={{ bg: 'var(--slate-100-alt2)', color: 'var(--text)' }}
        />

        <ModalBody
          px="36px"
          pt="4px"
          pb="12px"
        >
          <FormControl>
            <FormLabel
              fontSize="var(--font-size-sm)"
              fontWeight={600}
              color="var(--text)"
              mb="8px"
            >
              Короткая ссылка
            </FormLabel>
            <Input
              value={link.shortUrl}
              isReadOnly
              h="48px"
              bg="var(--primary-bg)"
              border="1px solid transparent"
              borderRadius="10px"
              px="16px"
              fontSize="var(--font-size-sm)"
              color="var(--text)"
              cursor="text"
              _hover={{ borderColor: 'var(--btn-outline)' }}
              _focus={{
                bg: 'var(--primary-bg)',
                borderColor: 'var(--primary)',
                boxShadow: '0 0 0 1px var(--primary)'
              }}
              onClick={(e) => e.currentTarget.select()}
            />
            <FormHelperText
              fontSize="var(--font-size-xs)"
              color="var(--text-secondary)"
              mt="8px"
              lineHeight="1.45"
            >
              Ссылка скопирована в буфер обмена и уже добавлена в список
              сокращенных ссылок.
            </FormHelperText>
          </FormControl>
        </ModalBody>

        <ModalFooter
          px="36px"
          pt="20px"
          pb="32px"
          borderTop="none"
        >
          <Flex
            justify="space-between"
            align="center"
            w="100%"
            gap="12px"
            flexWrap="wrap"
          >
            <Button
              type="button"
              variant="ghost"
              color="var(--text)"
              fontSize="var(--font-size-sm)"
              fontWeight={500}
              h="42px"
              px="16px"
              borderRadius="10px"
              _hover={{ bg: 'var(--slate-100-alt2)' }}
              onClick={handleCopy}
            >
              Скопировать ссылку
            </Button>

            <Button
              type="button"
              variant="ghost"
              color="var(--text)"
              fontSize="var(--font-size-sm)"
              fontWeight={500}
              h="42px"
              px="16px"
              borderRadius="10px"
              _hover={{ bg: 'var(--slate-100-alt2)' }}
              isDisabled={!shortcut}
              onClick={() => setIsQrOpen(true)}
            >
              Скачать Qr-код
            </Button>

            <Button
              type="button"
              bg="var(--btn-solid)"
              color="var(--white)"
              fontSize="var(--font-size-sm)"
              fontWeight={600}
              h="42px"
              px="22px"
              borderRadius="10px"
              _hover={{ bg: 'var(--btn-hover)' }}
              _active={{ bg: 'var(--btn-hover)' }}
              rightIcon={
                <ArrowRightIcon
                  width={14}
                  height={14}
                  color="var(--white)"
                />
              }
              onClick={onShortenMore}
            >
              Сократить еще
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ShortenSuccessModal;
