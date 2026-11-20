import {
  Box,
  Button,
  Checkbox,
  Flex,
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
import { useState } from 'react';
import type { GuestShortcut } from '@/utils/guestShortcuts';
import './ClaimGuestShortcutsModal.scss';

export interface ClaimGuestShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  guestLinks: GuestShortcut[];
  maxSelectable: number;
  onClaim: (selectedCodes: string[]) => Promise<void>;
}

export function ClaimGuestShortcutsModal({
  isOpen,
  onClose,
  guestLinks,
  maxSelectable,
  onClaim
}: ClaimGuestShortcutsModalProps) {
  const [selectedCodes, setSelectedCodes] = useState<string[]>(() =>
    guestLinks.slice(0, Math.max(0, maxSelectable)).map((l) => l.shortcut)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleSelect = (code: string) => {
    if (selectedCodes.includes(code)) {
      setSelectedCodes(selectedCodes.filter((c) => c !== code));
    } else {
      if (selectedCodes.length >= maxSelectable) return;
      setSelectedCodes([...selectedCodes, code]);
    }
  };

  const handleSubmit = async () => {
    if (selectedCodes.length === 0) return;
    setIsSubmitting(true);
    try {
      await onClaim(selectedCodes);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="lg"
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent className="claim-guest-modal">
        <ModalHeader className="claim-guest-modal__header">
          Перенос гостевых ссылок
        </ModalHeader>
        <ModalCloseButton top="20px" right="20px" />

        <ModalBody className="claim-guest-modal__body">
          <VStack align="stretch" spacing={3}>
            <Text fontSize="var(--font-size-sm)" color="var(--text)" lineHeight="1.5">
              У вас есть {guestLinks.length} гостевых ссылок, созданных до входа в аккаунт.
              Свободных слотов по вашему тарифу: <strong>{maxSelectable}</strong>.
            </Text>
            <Text fontSize="var(--font-size-xs)" color="var(--text-secondary)">
              Выберите, какие ссылки перенести в личный кабинет:
            </Text>

            <Box className="claim-guest-modal__list">
              {guestLinks.map((item) => {
                const isChecked = selectedCodes.includes(item.shortcut);
                const isLimitReached =
                  selectedCodes.length >= maxSelectable && !isChecked;

                return (
                  <Flex
                    key={item.shortcut}
                    className="claim-guest-modal__item"
                    onClick={() => !isLimitReached && toggleSelect(item.shortcut)}
                    cursor={isLimitReached ? 'not-allowed' : 'pointer'}
                    opacity={isLimitReached ? 0.6 : 1}
                  >
                    <Checkbox
                      isChecked={isChecked}
                      isDisabled={isLimitReached}
                      onChange={() => toggleSelect(item.shortcut)}
                      mt="2px"
                    />
                    <Box className="claim-guest-modal__item-info">
                      <Text className="claim-guest-modal__target" title={item.originalUrl}>
                        {item.originalUrl}
                      </Text>
                      <Text className="claim-guest-modal__short">
                        {item.shortUrl}
                      </Text>
                    </Box>
                  </Flex>
                );
              })}
            </Box>

            <Text className="claim-guest-modal__counter">
              Выбрано: {selectedCodes.length} из {maxSelectable}
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter className="claim-guest-modal__footer">
          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={onClose}
              isDisabled={isSubmitting}
              h="40px"
              borderRadius="10px"
            >
              Пропустить
            </Button>
            <Button
              onClick={handleSubmit}
              isLoading={isSubmitting}
              isDisabled={selectedCodes.length === 0}
              h="40px"
              borderRadius="10px"
              bg="var(--btn-solid)"
              color="var(--white)"
              _hover={{ bg: 'var(--btn-hover)' }}
            >
              Перенести выбранные ({selectedCodes.length})
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default ClaimGuestShortcutsModal;
