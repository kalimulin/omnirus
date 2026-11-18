import {
  Box,
  Button,
  FormControl,
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
  useToast,
  VStack
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { isApiConfigured, updateLink } from '@/api/shortener';
import ArrowRightIcon from '@/components/atoms/Icons/home/ArrowRightIcon';
import { LinkTagsField } from '@/components/shortener/LinkTagsField/LinkTagsField';
import type { EditLinkModalProps, LinkRow } from '@/types/shortener';

const DEFAULT_TAGS: string[] = [];

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
  }
} as const;

export function EditLinkModal({
  isOpen,
  onClose,
  link,
  onSaved,
  availableTags = DEFAULT_TAGS
}: EditLinkModalProps) {
  const toast = useToast();
  const [name, setName] = useState(link?.name || '');
  const [description, setDescription] = useState(link?.description || '');
  const [tags, setTags] = useState<string[]>(link?.tags || DEFAULT_TAGS);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  const [prevLink, setPrevLink] = useState(link);
  const saveGenerationRef = useRef(0);

  if (isOpen !== prevIsOpen || link !== prevLink) {
    setPrevIsOpen(isOpen);
    setPrevLink(link);
    setIsSubmitting(false);
    if (isOpen && link) {
      setName(link.name);
      setDescription(link.description || '');
      setTags(link.tags || DEFAULT_TAGS);
    }
  }

  useEffect(() => {
    return () => {
      saveGenerationRef.current += 1;
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
    if (isSubmitting || !link) {
      return;
    }

    const finalTitle = name.trim() || link.name;
    const trimmedDescription = description.trim();
    const apiConfigured = isApiConfigured();
    const generation = saveGenerationRef.current;

    setIsSubmitting(true);

    try {
      if (apiConfigured) {
        await updateLink(link.id, {
          title: finalTitle,
          description: trimmedDescription,
          tags
        });
      }
      if (saveGenerationRef.current !== generation) {
        return;
      }

      const updatedLink: LinkRow = {
        ...link,
        name: finalTitle,
        description: trimmedDescription,
        tags
      };

      onSaved?.(updatedLink);
      toast({
        title: 'Изменения успешно сохранены.',
        status: 'success',
        duration: 4000,
        isClosable: true
      });
      onClose();
    } catch (err) {
      if (saveGenerationRef.current !== generation) {
        return;
      }
      toast({
        title: 'Не удалось сохранить ссылку',
        description: err instanceof Error ? err.message : undefined,
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      if (saveGenerationRef.current === generation) {
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
            Редактирование информации о ссылке
          </ModalHeader>

          <ModalCloseButton />

          <ModalBody>
            {/* Сводка короткого и целевого URL */}
            <Box
              bg="var(--primary-bg)"
              borderRadius="12px"
              p="18px 20px"
              mb="24px"
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

            <VStack
              spacing="20px"
              align="stretch"
            >
              {/* Название ссылки */}
              <FormControl>
                <FormLabel
                  fontSize="var(--font-size-sm)"
                  fontWeight={600}
                  color="var(--text)"
                  mb="8px"
                >
                  Название ссылки
                </FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например, Пост в Telegram-канале"
                  isDisabled={isSubmitting}
                  {...inputStyles}
                />
                <FormHelperText
                  mt="8px"
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  lineHeight="1.4"
                >
                  Показывается в реестре и участвует в поиске
                </FormHelperText>
              </FormControl>

              {/* Описание ссылки */}
              <FormControl>
                <FormLabel
                  fontSize="var(--font-size-sm)"
                  fontWeight={600}
                  color="var(--text)"
                  mb="8px"
                >
                  Описание ссылки
                </FormLabel>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Например, Для отслеживания рекламной кампании по акции «Название акции»"
                  isDisabled={isSubmitting}
                  {...inputStyles}
                />
                <FormHelperText
                  mt="8px"
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  lineHeight="1.4"
                >
                  Показывается в реестре, чтобы вы не забыли назначение ссылки.
                </FormHelperText>
              </FormControl>

              {/* Теги */}
              <LinkTagsField
                key={link?.id || 'empty'}
                tags={tags}
                onChange={setTags}
                availableTags={availableTags}
                isOpen={isOpen}
                isDisabled={isSubmitting}
                labelMb="8px"
                helperMt="8px"
                tagVariant="pill"
                helperText="Можно удалить старые теги и/или ввести через Enter или пробел новые — всего до 5-ти тегов. Тегами удобно размечать назначение ссылки."
              />
            </VStack>
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
                isLoading={isSubmitting}
                loadingText="Сохранение..."
                rightIcon={
                  <ArrowRightIcon
                    width={14}
                    height={14}
                    color="var(--white)"
                  />
                }
              >
                Сохранить изменения
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export default EditLinkModal;
