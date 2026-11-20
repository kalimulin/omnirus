import {
  Box,
  Button,
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
import { LuCircleAlert, LuInfo, LuMail } from 'react-icons/lu';
import { useNavigate } from 'react-router-dom';

import ArrowRightIcon from '@/components/atoms/Icons/home/ArrowRightIcon';
import { ROUTES } from '@/routing/routes';
import './LimitExceededModal.scss';

export interface LimitExceededModalProps {
  isOpen: boolean;
  onClose: () => void;
  resource: 'shortcuts' | 'campaigns';
  limit?: number;
  used?: number;
}

export function LimitExceededModal({
  isOpen,
  onClose,
  resource,
  limit = resource === 'shortcuts' ? 50 : 5,
  used
}: LimitExceededModalProps) {
  const navigate = useNavigate();

  const isShortcuts = resource === 'shortcuts';
  const resourceTitle = isShortcuts ? 'ссылок' : 'кампаний';
  const isReached = used !== undefined ? used >= limit : true;
  const title = isReached
    ? `Лимит ${resourceTitle} исчерпан`
    : `Лимит ${resourceTitle} ограничен`;

  const handleContactSupport = () => {
    const subject = `Запрос на увеличение лимита ${resourceTitle}`;
    const usedText =
      used !== undefined
        ? `Использовано: ${used} из ${limit}.`
        : `Текущий лимит: ${limit}.`;
    const message = `Здравствуйте!\n\nПрошу увеличить лимит ${resourceTitle} для моего аккаунта.\n${usedText}\n\nЗаранее спасибо!`;

    const searchParams = new URLSearchParams({
      category: 'suggestion',
      subject,
      message
    });

    navigate(`${ROUTES.feedback}?${searchParams.toString()}`);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="md"
      closeOnOverlayClick={false}
    >
      <ModalOverlay />
      <ModalContent className="limit-exceeded-modal">
        <ModalHeader className="limit-exceeded-modal__header">
          <Box
            className={`limit-exceeded-modal__icon-wrap ${
              !isReached ? 'limit-exceeded-modal__icon-wrap--info' : ''
            }`}
            aria-hidden="true"
          >
            {isReached ? <LuCircleAlert size={22} /> : <LuInfo size={22} />}
          </Box>
          <Text as="span">{title}</Text>
        </ModalHeader>
        <ModalCloseButton top="20px" right="20px" />

        <ModalBody className="limit-exceeded-modal__body">
          <VStack align="stretch" spacing={3}>
            {isReached ? (
              <Text
                fontSize="var(--font-size-md)"
                color="var(--text)"
                lineHeight="1.5"
              >
                Вы использовали{' '}
                <strong>
                  {used !== undefined ? used : limit} из {limit}
                </strong>{' '}
                доступных {resourceTitle} на вашем тарифе.
              </Text>
            ) : (
              <Text
                fontSize="var(--font-size-md)"
                color="var(--text)"
                lineHeight="1.5"
              >
                Количество {resourceTitle} на вашем тарифе ограничено. Вы
                использовали{' '}
                <strong>
                  {used} из {limit}
                </strong>{' '}
                (осталось свободных слотов:{' '}
                <strong>{Math.max(0, limit - (used ?? 0))}</strong>).
              </Text>
            )}

            <Box className="limit-exceeded-modal__info-box">
              <Text
                fontSize="var(--font-size-sm)"
                color="var(--text-secondary)"
                lineHeight="1.6"
              >
                {isReached
                  ? `Чтобы создать новые ${resourceTitle}, вы можете удалить старые или неактуальные (квота сразу освободится) либо обратиться в службу поддержки для расширения лимитов.`
                  : `Если вам потребуется больше ${resourceTitle}, вы можете заблаговременно обратиться в службу поддержки для расширения лимитов вашего аккаунта.`}
              </Text>

              <Flex className="limit-exceeded-modal__support-row">
                <LuMail size={16} aria-hidden="true" />
                <Text as="span">
                  Прямой адрес поддержки:{' '}
                  <a href="mailto:support@омни.рус">support@омни.рус</a>
                </Text>
              </Flex>
            </Box>
          </VStack>
        </ModalBody>

        <ModalFooter className="limit-exceeded-modal__footer">
          <HStack spacing={3}>
            <Button
              variant="outline"
              onClick={onClose}
              h="42px"
              px="20px"
              borderRadius="10px"
              borderColor="var(--btn-outline)"
              color="var(--text)"
              _hover={{ bg: 'var(--primary-bg)' }}
            >
              Понятно
            </Button>
            <Button
              onClick={handleContactSupport}
              h="42px"
              px="20px"
              borderRadius="10px"
              bg="var(--btn-solid)"
              color="var(--white)"
              _hover={{ bg: 'var(--btn-hover)' }}
              rightIcon={
                <ArrowRightIcon
                  width={14}
                  height={14}
                  color="var(--white)"
                />
              }
            >
              Написать в поддержку
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default LimitExceededModal;
