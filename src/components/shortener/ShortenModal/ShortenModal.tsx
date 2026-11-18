import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Button,
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
  Select,
  Text,
  useToast,
  VStack
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import { createLink, ensureCampaignId, isApiConfigured } from '@/api/shortener';
import { createShortcut } from '@/api/shortenerPublic';
import { EditLinkModal } from '@/components/shortener/EditLinkModal/EditLinkModal';
import { LinkTagsField } from '@/components/shortener/LinkTagsField/LinkTagsField';
import { copyShortLinkToClipboard } from '@/components/shortener/ShortenSuccessModal/clipboard';
import { ShortenSuccessModal } from '@/components/shortener/ShortenSuccessModal/ShortenSuccessModal';
import type { LinkRow, ShortenModalProps } from '@/types/shortener';
import { validateAndCheckTargetUrl } from '@/utils/validators';

import './ShortenModal.scss';

export type { ShortenModalProps };

const DEFAULT_CAMPAIGNS = ['Без кампании'];
const DEFAULT_TAGS: string[] = [];

function CreateShortenModal({
  isOpen,
  onClose,
  onCreated,
  campaigns = DEFAULT_CAMPAIGNS,
  availableTags = DEFAULT_TAGS
}: Omit<ShortenModalProps, 'editLink' | 'onEdited'>) {
  const toast = useToast();
  const campaignOptions =
    campaigns && campaigns.length > 0 ? campaigns : DEFAULT_CAMPAIGNS;
  const finalCampaigns = [
    'Без кампании',
    ...campaignOptions.filter((c) => c !== 'Без кампании')
  ];

  const [targetUrl, setTargetUrl] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [campaign, setCampaign] = useState('Без кампании');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdLink, setCreatedLink] = useState<LinkRow | null>(null);
  const submitGenerationRef = useRef(0);

  const resetForm = () => {
    submitGenerationRef.current += 1;
    setTargetUrl('');
    setName('');
    setDescription('');
    setTags([]);
    setCampaign('Без кампании');
    setError(null);
    setIsSubmitting(false);
    setCreatedLink(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  useEffect(() => {
    const syncForm = () => {
      resetForm();
    };
    syncForm();
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const trimmedUrl = targetUrl.trim();
    if (!trimmedUrl) {
      setError('Введите целевой URL');
      return;
    }

    // Название ссылки является необязательным, если пусто - используем целевой URL
    const finalTitle = name.trim() || trimmedUrl;

    const apiConfigured = isApiConfigured();
    const generation = submitGenerationRef.current;
    setIsSubmitting(true);

    try {
      let newLink: LinkRow;

      if (apiConfigured) {
        const campaignId = await ensureCampaignId(campaign);
        newLink = await createLink({
          title: finalTitle,
          target: trimmedUrl,
          description: description.trim(),
          tags,
          campaign_id: campaignId
        });
        newLink.campaign = campaign;
      } else {
        const validUrl = await validateAndCheckTargetUrl(trimmedUrl);
        const shortData = await createShortcut(validUrl);
        newLink = {
          id: shortData.shortcutId || shortData.shortcut,
          name: finalTitle,
          description: description.trim(),
          shortUrl: shortData.shortUrl,
          shortcut: shortData.shortcut,
          targetUrl: shortData.originalUrl || validUrl,
          campaignId: null,
          campaign,
          tags,
          status: shortData.isSecure ? 'активна' : 'заблокирована',
          clicks: 0,
          createdAt: shortData.createdAt
        };
      }

      if (submitGenerationRef.current !== generation) {
        return;
      }

      onCreated?.(newLink);
      void copyShortLinkToClipboard(newLink);
      setCreatedLink(newLink);
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

  if (createdLink) {
    return (
      <ShortenSuccessModal
        isOpen={isOpen}
        onClose={handleClose}
        onShortenMore={resetForm}
        link={createdLink}
      />
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      isCentered
      size="2xl"
    >
      <ModalOverlay />
      <ModalContent
        maxW="740px"
        w="100%"
        borderRadius="16px"
        fontFamily="var(--font-family)"
        boxShadow="0 20px 60px rgba(18, 35, 63, 0.18)"
        mx="16px"
        bg="var(--white)"
      >
        <form onSubmit={handleSubmit}>
          <ModalHeader
            fontSize="20px"
            fontWeight={700}
            color="var(--text)"
            px="36px"
            pt="32px"
            pb="12px"
            borderBottom="none"
          >
            Сократить ссылку
          </ModalHeader>
          <ModalCloseButton
            top="24px"
            right="28px"
            color="var(--text)"
            _hover={{ bg: 'var(--slate-100-alt2)', color: 'var(--text)' }}
          />

          <ModalBody
            px="36px"
            pt="12px"
            pb="24px"
          >
            <VStack
              spacing="20px"
              align="stretch"
            >
              {/* Целевой URL */}
              <FormControl isInvalid={Boolean(error)}>
                <FormLabel
                  fontSize="14px"
                  fontWeight={600}
                  color="var(--text)"
                  mb="6px"
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
                  value={targetUrl}
                  onChange={(e) => {
                    setTargetUrl(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="https://example.ru/landing"
                  _placeholder={{ color: 'var(--text-placeholder)' }}
                  h="48px"
                  bg="var(--primary-bg)"
                  border="1px solid transparent"
                  borderRadius="10px"
                  fontSize="14px"
                  color="var(--text)"
                  _hover={{ borderColor: 'var(--btn-outline)' }}
                  _focus={{
                    bg: 'var(--white)',
                    borderColor: 'var(--primary)',
                    boxShadow: '0 0 0 1px var(--primary)'
                  }}
                />
                <FormHelperText
                  fontSize="12px"
                  color="var(--text-secondary)"
                  mt="6px"
                  lineHeight="1.4"
                >
                  Адрес, на который будет вести короткая ссылка. Формат http://
                  или https://
                </FormHelperText>
                {error && (
                  <FormErrorMessage
                    fontSize="12px"
                    color="var(--error)"
                  >
                    {error}
                  </FormErrorMessage>
                )}
              </FormControl>

              {/* Название ссылки (необязательное, без звездочки) */}
              <FormControl>
                <FormLabel
                  fontSize="14px"
                  fontWeight={600}
                  color="var(--text)"
                  mb="6px"
                >
                  Название ссылки
                </FormLabel>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Например, Пост в Telegram-канале"
                  _placeholder={{ color: 'var(--text-placeholder)' }}
                  h="48px"
                  bg="var(--primary-bg)"
                  border="1px solid transparent"
                  borderRadius="10px"
                  fontSize="14px"
                  color="var(--text)"
                  _hover={{ borderColor: 'var(--btn-outline)' }}
                  _focus={{
                    bg: 'var(--white)',
                    borderColor: 'var(--primary)',
                    boxShadow: '0 0 0 1px var(--primary)'
                  }}
                />
                <FormHelperText
                  fontSize="12px"
                  color="var(--text-secondary)"
                  mt="6px"
                  lineHeight="1.4"
                >
                  Показывается в реестре и участвует в поиске.
                </FormHelperText>
              </FormControl>

              {/* Описание ссылки */}
              <FormControl>
                <FormLabel
                  fontSize="14px"
                  fontWeight={600}
                  color="var(--text)"
                  mb="6px"
                >
                  Описание ссылки
                </FormLabel>
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Например, Для отслеживания рекламной кампании по акции «Название акции»"
                  _placeholder={{ color: 'var(--text-placeholder)' }}
                  h="48px"
                  bg="var(--primary-bg)"
                  border="1px solid transparent"
                  borderRadius="10px"
                  fontSize="14px"
                  color="var(--text)"
                  _hover={{ borderColor: 'var(--btn-outline)' }}
                  _focus={{
                    bg: 'var(--white)',
                    borderColor: 'var(--primary)',
                    boxShadow: '0 0 0 1px var(--primary)'
                  }}
                />
                <FormHelperText
                  fontSize="12px"
                  color="var(--text-secondary)"
                  mt="6px"
                  lineHeight="1.4"
                >
                  Показывается в реестре, чтобы вы не забыли назначение ссылки.
                </FormHelperText>
              </FormControl>

              {/* Теги */}
              <LinkTagsField
                tags={tags}
                onChange={setTags}
                availableTags={availableTags}
                isOpen={isOpen}
              />

              {/* Кампания */}
              <FormControl>
                <FormLabel
                  fontSize="14px"
                  fontWeight={600}
                  color="var(--text)"
                  mb="6px"
                >
                  Кампания
                </FormLabel>
                <Select
                  value={campaign}
                  onChange={(e) => setCampaign(e.target.value)}
                  h="48px"
                  bg="var(--primary-bg)"
                  border="1px solid var(--slate-200)"
                  borderRadius="10px"
                  fontSize="14px"
                  color="var(--text)"
                  className="shorten-modal__custom-select"
                  _hover={{ borderColor: 'var(--btn-outline)' }}
                  _focus={{
                    bg: 'var(--white)',
                    borderColor: 'var(--primary)',
                    boxShadow: '0 0 0 1px var(--primary)'
                  }}
                >
                  {finalCampaigns.map((c) => (
                    <option
                      key={c}
                      value={c}
                    >
                      {c}
                    </option>
                  ))}
                </Select>
                <FormHelperText
                  fontSize="12px"
                  color="var(--text-secondary)"
                  mt="6px"
                  lineHeight="1.4"
                >
                  Ссылку можно добавить в кампанию позже.
                </FormHelperText>
              </FormControl>
            </VStack>
          </ModalBody>

          {/* Кнопки действий */}
          <ModalFooter
            px="36px"
            pt="12px"
            pb="32px"
            borderTop="none"
          >
            <HStack spacing="16px">
              <Button
                variant="ghost"
                color="var(--text)"
                fontSize="14px"
                fontWeight={500}
                h="40px"
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
                bg="var(--primary)"
                color="var(--white)"
                fontSize="14px"
                fontWeight={600}
                h="40px"
                px="22px"
                borderRadius="10px"
                _hover={{ bg: 'var(--btn-hover)' }}
                _active={{ bg: 'var(--btn-hover)' }}
                _disabled={{ bg: 'var(--btn-disabled)', cursor: 'not-allowed' }}
                isLoading={isSubmitting}
                loadingText="Сохранение..."
                rightIcon={<ArrowForwardIcon boxSize="16px" />}
              >
                Сократить
              </Button>
            </HStack>
          </ModalFooter>
        </form>
      </ModalContent>
    </Modal>
  );
}

export function ShortenModal(props: ShortenModalProps) {
  if (props.editLink) {
    return (
      <EditLinkModal
        isOpen={props.isOpen}
        onClose={props.onClose}
        link={props.editLink}
        onSaved={props.onEdited}
        availableTags={props.availableTags}
      />
    );
  }

  return <CreateShortenModal {...props} />;
}

export default ShortenModal;
