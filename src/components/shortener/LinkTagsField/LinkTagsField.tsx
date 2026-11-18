import { CheckIcon } from '@chakra-ui/icons';
import {
  Badge,
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Wrap,
  WrapItem
} from '@chakra-ui/react';
import { useEffect, useRef, useState } from 'react';

import './LinkTagsField.scss';

export interface LinkTagsFieldProps {
  tags: string[];
  onChange: (nextTags: string[]) => void;
  availableTags?: string[];
  isOpen?: boolean;
  isDisabled?: boolean;
  maxTags?: number;
  helperText?: string;
  labelMb?: string;
  helperMt?: string;
  tagVariant?: 'pill' | 'rounded';
}

const DEFAULT_HELPER_TEXT =
  'Введите до 5-ти тегов через Enter или пробел. Тегами удобно размечать назначение ссылки.';

export function LinkTagsField({
  tags,
  onChange,
  availableTags = [],
  isOpen = true,
  isDisabled = false,
  maxTags = 5,
  helperText = DEFAULT_HELPER_TEXT,
  labelMb = '6px',
  helperMt = '6px',
  tagVariant = 'rounded'
}: LinkTagsFieldProps) {
  const [tagInput, setTagInput] = useState('');
  const [isTagFocused, setIsTagFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);

  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagsWrapperRef = useRef<HTMLDivElement>(null);

  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    setTagInput('');
    setIsDropdownOpen(false);
    setIsTagFocused(false);
  }

  useEffect(() => {
    if (!isDropdownOpen) return undefined;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        tagsWrapperRef.current &&
        !tagsWrapperRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [isDropdownOpen]);

  const addTags = (values: string[]) => {
    if (isDisabled) return;
    const next = [...tags];
    for (const raw of values) {
      const normalized = raw.trim().toLowerCase();
      if (normalized && !next.includes(normalized) && next.length < maxTags) {
        next.push(normalized);
      }
    }
    if (next.length !== tags.length) {
      onChange(next);
    }
  };

  const addTag = (value: string) => {
    addTags([value]);
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    if (isDisabled) return;
    onChange(tags.filter((t) => t !== tag));
  };

  const toggleTag = (tag: string) => {
    if (isDisabled) return;
    if (tags.includes(tag)) {
      removeTag(tag);
    } else if (tags.length < maxTags) {
      onChange([...tags, tag]);
    }
  };

  const handleTagInputChange = (val: string) => {
    if (isDisabled) return;
    if (val.includes(',') || val.includes(' ')) {
      const parts = val.split(/[, ]+/);
      const toAdd = parts.slice(0, -1);
      const remaining = parts[parts.length - 1];
      addTags(toAdd);
      setTagInput(remaining);
      if (!isDropdownOpen) setIsDropdownOpen(true);
    } else {
      setTagInput(val);
      if (!isDropdownOpen) setIsDropdownOpen(true);
    }
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (isDisabled) return;
    if (
      (e.key === ',' || e.key === 'Enter' || e.key === ' ') &&
      tagInput.trim()
    ) {
      e.preventDefault();
      addTag(tagInput);
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const trimmedInput = tagInput.trim();
  const normalizedInput = trimmedInput.toLowerCase();
  const filteredAvailableTags = availableTags.filter(
    (t) =>
      !tags.includes(t) &&
      (!trimmedInput || t.toLowerCase().includes(normalizedInput))
  );

  const isPill = tagVariant === 'pill';

  return (
    <FormControl>
      <FormLabel
        fontSize="var(--font-size-sm)"
        fontWeight={600}
        color="var(--text)"
        mb={labelMb}
      >
        Теги
      </FormLabel>
      <Box
        position="relative"
        ref={tagsWrapperRef}
      >
        <Flex
          minH="48px"
          px="14px"
          py="8px"
          bg={isTagFocused ? 'var(--white)' : 'var(--primary-bg)'}
          border="1px solid"
          borderColor={isTagFocused ? 'var(--primary)' : 'transparent'}
          borderRadius="10px"
          flexWrap="wrap"
          align="center"
          gap="8px"
          cursor={isDisabled ? 'not-allowed' : 'text'}
          boxShadow={isTagFocused ? '0 0 0 1px var(--primary)' : 'none'}
          transition="all 0.15s ease"
          _hover={{
            borderColor: isTagFocused ? 'var(--primary)' : 'var(--btn-outline)'
          }}
          onClick={() => {
            if (!isDisabled) {
              tagInputRef.current?.focus();
            }
          }}
        >
          {tags.map((tag) => (
            <Tag
              key={tag}
              bg="var(--primary-50)"
              color={isPill ? 'var(--text-link)' : 'var(--primary)'}
              borderRadius={isPill ? 'full' : '6px'}
              fontSize="var(--font-size-xs)"
              fontWeight={500}
              px={isPill ? '10px' : '8px'}
              py={isPill ? '3px' : '4px'}
              size="sm"
            >
              <TagLabel>{tag}</TagLabel>
              <TagCloseButton
                aria-label={`Удалить тег ${tag}`}
                isDisabled={isDisabled}
                onClick={(e) => {
                  e.stopPropagation();
                  removeTag(tag);
                }}
                color={isPill ? 'var(--text-link)' : 'var(--primary)'}
                opacity={0.8}
                _hover={{ opacity: 1 }}
              />
            </Tag>
          ))}
          <input
            ref={tagInputRef}
            value={tagInput}
            disabled={isDisabled}
            onChange={(e) => handleTagInputChange(e.target.value)}
            onKeyDown={handleTagKeyDown}
            onFocus={() => {
              if (isDisabled) return;
              setIsTagFocused(true);
              if (filteredAvailableTags.length > 0) {
                setIsDropdownOpen(true);
              }
            }}
            onBlur={() => setIsTagFocused(false)}
            placeholder={tags.length === 0 ? 'Введите тег и нажмите Enter' : ''}
            style={{
              flex: 1,
              minWidth: '160px',
              height: '32px',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              fontSize: '14px',
              color: 'var(--text)',
              fontFamily: 'inherit'
            }}
            className="link-tags-field__input"
          />
        </Flex>

        {/* Выпадающий список выбора тегов при фокусе */}
        {isDropdownOpen && !isDisabled && (
          <Box
            position="absolute"
            top="calc(100% + 6px)"
            left={0}
            right={0}
            bg="var(--white)"
            border="1px solid"
            borderColor="var(--slate-200)"
            borderRadius="12px"
            boxShadow="0 14px 28px -6px rgba(18, 35, 63, 0.15), 0 4px 10px rgba(18, 35, 63, 0.05)"
            zIndex={30}
            p="12px 14px"
            maxH="230px"
            overflowY="auto"
          >
            <Flex
              justify="space-between"
              align="center"
              mb="8px"
            >
              <Text
                fontSize="12px"
                fontWeight={600}
                color="var(--text-secondary)"
              >
                Доступные теги ({filteredAvailableTags.length})
              </Text>
              <Badge
                bg="var(--primary-50)"
                color="var(--primary)"
                fontSize="11px"
                borderRadius="full"
                px="2"
                py="0.5"
              >
                Выбрано: {tags.length} из {maxTags}
              </Badge>
            </Flex>

            <Wrap spacing="6px">
              {filteredAvailableTags.map((tag) => {
                const isSelected = tags.includes(tag);
                return (
                  <WrapItem key={tag}>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="8px"
                      fontSize="12px"
                      fontWeight={isSelected ? 600 : 500}
                      bg={
                        isSelected ? 'var(--primary-50)' : 'var(--primary-bg)'
                      }
                      color={isSelected ? 'var(--primary)' : 'var(--text)'}
                      borderColor={
                        isSelected ? 'var(--btn-outline)' : 'var(--slate-200)'
                      }
                      leftIcon={
                        isSelected ? <CheckIcon boxSize="10px" /> : undefined
                      }
                      _hover={{
                        bg: isSelected
                          ? 'var(--primary-50)'
                          : 'var(--primary-bg-hover)',
                        borderColor: 'var(--btn-outline)',
                        color: 'var(--primary)'
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleTag(tag);
                      }}
                    >
                      {tag}
                    </Button>
                  </WrapItem>
                );
              })}
            </Wrap>

            {trimmedInput &&
              !filteredAvailableTags.some(
                (t) => t.toLowerCase() === normalizedInput
              ) &&
              !tags.includes(normalizedInput) && (
                <Box
                  mt="10px"
                  pt="8px"
                  borderTop="1px solid"
                  borderColor="var(--slate-100)"
                >
                  <Button
                    size="sm"
                    variant="ghost"
                    w="100%"
                    justifyContent="flex-start"
                    bg="var(--primary-50)"
                    border="1px dashed"
                    borderColor="var(--btn-outline)"
                    color="var(--primary)"
                    fontSize="13px"
                    fontWeight={500}
                    _hover={{ bg: 'var(--primary-bg-hover)' }}
                    onClick={() => addTag(tagInput)}
                  >
                    Создать тег: &lt;{trimmedInput}&gt;
                  </Button>
                </Box>
              )}

            {filteredAvailableTags.length === 0 && !trimmedInput && (
              <Text
                py={3}
                fontSize="13px"
                color="var(--text-placeholder)"
                textAlign="center"
              >
                Нет доступных тегов
              </Text>
            )}
          </Box>
        )}
      </Box>

      <FormHelperText
        fontSize="var(--font-size-xs)"
        color="var(--text-secondary)"
        mt={helperMt}
        lineHeight="1.4"
      >
        {helperText}
      </FormHelperText>
    </FormControl>
  );
}

export default LinkTagsField;
