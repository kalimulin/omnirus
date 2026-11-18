import {
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text
} from '@chakra-ui/react';

import { LogoutModalProps } from '../types/types';

export default function LogoutModal({
  isOpen,
  logout,
  onClose
}: LogoutModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
    >
      <ModalOverlay />
      <ModalContent
        maxW="476px"
        borderRadius="12px"
      >
        <ModalHeader
          fontSize="24px"
          lineHeight="32px"
          fontWeight="600"
          color="var(--text)"
          pb={2}
        >
          Подтверждение действия
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody pt={0}>
          <Text
            color="var(--text-secondary)"
            fontSize="16px"
            lineHeight="24px"
          >
            Вы действительно хотите выйти из аккаунта?
          </Text>
        </ModalBody>
        <ModalFooter gap={3}>
          <Button
            variant="ghost"
            color="var(--text)"
            onClick={onClose}
          >
            Отмена
          </Button>
          <Button
            bg="var(--primary)"
            color="white"
            borderRadius="10px"
            px={5}
            h="40px"
            _hover={{ bg: 'var(--text-link)' }}
            onClick={() => {
              try {
                logout();
              } finally {
                onClose();
              }
            }}
          >
            Выйти
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
