import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Box,
  VStack,
  Flex,
  Text,
  Tag,
  Checkbox,
  Button,
  HStack
} from '@chakra-ui/react';

import ArrowRightIcon from '@/components/atoms/Icons/home/ArrowRightIcon';
import type { RedirectPromptModalProps } from '@/types/shortener';

export function RedirectPromptModal({
  isOpen,
  onClose,
  onEdit,
  shortUrl,
  newTargetUrl,
  name,
  description,
  tags = [],
  dontShowAgain,
  onDontShowAgainChange
}: RedirectPromptModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      isCentered
      size="2xl"
    >
      <ModalOverlay />
      <ModalContent maxW="720px">
        <ModalHeader>
          Целевой URL изменен. Хотите изменить другую информацию о ссылке?
        </ModalHeader>

        <ModalCloseButton />

        <ModalBody>
          {/* Сводка текущих параметров ссылки */}
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
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  mb="2px"
                >
                  Короткий URL
                </Text>
                <Text
                  fontSize="var(--font-size-sm)"
                  color="var(--text)"
                  lineHeight="1.4"
                >
                  {shortUrl}
                </Text>
              </Box>

              <Box>
                <Text
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  mb="2px"
                >
                  Новый целевой URL
                </Text>
                <Text
                  fontSize="var(--font-size-sm)"
                  color="var(--text)"
                  lineHeight="1.4"
                  wordBreak="break-all"
                >
                  {newTargetUrl}
                </Text>
              </Box>

              <Box>
                <Text
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  mb="2px"
                >
                  Название
                </Text>
                <Text
                  fontSize="var(--font-size-sm)"
                  color="var(--text)"
                  lineHeight="1.4"
                >
                  {name || '—'}
                </Text>
              </Box>

              <Box>
                <Text
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  mb="2px"
                >
                  Описание
                </Text>
                <Text
                  fontSize="var(--font-size-sm)"
                  color="var(--text)"
                  lineHeight="1.4"
                >
                  {description || '—'}
                </Text>
              </Box>

              <Box>
                <Text
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  mb="6px"
                >
                  Теги
                </Text>
                <Flex
                  flexWrap="wrap"
                  gap="8px"
                >
                  {tags.length > 0 ? (
                    tags.map((tag, index) => (
                      <Tag
                        key={`${tag}-${index}`}
                        size="sm"
                        bg="var(--primary-50)"
                        color="var(--text-link)"
                        borderRadius="full"
                        px="10px"
                        py="3px"
                        fontSize="var(--font-size-xs)"
                        fontWeight={500}
                      >
                        {tag}
                      </Tag>
                    ))
                  ) : (
                    <Text
                      fontSize="var(--font-size-sm)"
                      color="var(--text)"
                    >
                      —
                    </Text>
                  )}
                </Flex>
              </Box>
            </VStack>
          </Box>

          <Checkbox
            isChecked={dontShowAgain}
            onChange={(e) => onDontShowAgainChange(e.target.checked)}
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
            Больше не предлагать после изменения целевого URL
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
              onClick={onEdit}
            >
              Редактировать
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
              onClick={onClose}
              rightIcon={
                <ArrowRightIcon
                  width={14}
                  height={14}
                  color="var(--white)"
                />
              }
            >
              Сохранить без изменений
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
