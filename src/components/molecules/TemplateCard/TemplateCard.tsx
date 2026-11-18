import { Box, Button, Flex, HStack, Image, Tag, Text } from '@chakra-ui/react';
import React from 'react';

import cherryIcon from '@/assets/icons/cherry.svg';
import { NotificationTemplate } from '@/types/template';

interface TemplateCardProps {
  template: NotificationTemplate;
  onUseTemplate: (template: NotificationTemplate) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  onUseTemplate
}) => {
  if (!template) return null;

  return (
    <Box
      bg="var(--white)"
      borderRadius="20px"
      p="24px"
      w="100%"
      h="100%"
      display="flex"
      flexDirection="column"
      boxShadow="0 1px 3px rgba(30, 41, 59, 0.08)"
      border="1px solid"
      borderColor="var(--slate-200)"
    >
      {/* Название канала */}
      <HStack
        spacing={2}
        mb="16px"
      >
        <Image
          src={cherryIcon}
          alt="Вишенка Push"
          boxSize="20px"
          objectFit="contain"
        />
        <Text
          fontSize="sm"
          fontWeight="medium"
          lineHeight="20px"
          letterSpacing="0"
          color="var(--indigo-950)"
        >
          Вишенка Push
        </Text>
      </HStack>

      {/* Заголовок шаблона */}
      <Text
        fontSize="xl"
        fontWeight="bold"
        lineHeight="30px"
        letterSpacing="0"
        color="var(--text)"
        mb="12px"
      >
        {template.title}
      </Text>

      {/* Блок с текстом уведомления — растягивается на всё доступное пространство */}
      <Box
        bg="var(--bg-secondary)"
        borderRadius="12px"
        p="20px"
        display="flex"
        flexDirection="column"
        gap="8px"
        mb="8px"
        flex={1}
      >
        <Text
          fontSize="sm"
          fontWeight="bold"
          lineHeight="20px"
          letterSpacing="0"
          color="var(--text)"
        >
          {template.title}
        </Text>

        <Text
          fontSize="sm"
          fontWeight="normal"
          lineHeight="20px"
          letterSpacing="0"
          color="var(--text)"
        >
          {template.body}
        </Text>

        {template.buttonText && (
          <Box
            bg="var(--primary)"
            color="var(--white)"
            borderRadius="8px"
            display="block"
            h="36px"
            px="14px"
            py="8px"
            fontSize="sm"
            fontWeight="medium"
            lineHeight="20px"
            letterSpacing="0"
            alignSelf="flex-start"
            cursor="default"
          >
            {template.buttonText}
          </Box>
        )}
      </Box>

      {/* Теги переменных */}
      <Flex
        wrap="wrap"
        gap="8px"
        mb="16px"
      >
        {template.variables.map((variable) => (
          <Tag
            key={variable.key}
            bg="var(--primary-bg-hover)"
            color="var(--text-link)"
            borderRadius="8px"
            px="8px"
            py="2px"
            h="28px"
            fontSize="sm"
            fontWeight="normal"
            lineHeight="20px"
            letterSpacing="0"
          >
            {'{{'}
            {variable.key}
            {'}}'}
          </Tag>
        ))}
      </Flex>

      {/* Статистика */}
      <Box mb="16px">
        <Text
          fontSize="sm"
          fontWeight="medium"
          lineHeight="20px"
          letterSpacing="0"
          color="var(--text-placeholder)"
        >
          Использован {template.usageCount ?? 0} раз
        </Text>
        <Text
          fontSize="sm"
          fontWeight="medium"
          lineHeight="20px"
          letterSpacing="0"
          color="var(--text-placeholder)"
        >
          Изменен {template.updatedAt ?? '—'}
        </Text>
      </Box>

      {/* Разделительная линия */}
      <Box
        w="100%"
        h="0.5px"
        bg="var(--text-placeholder)"
        opacity={0.3}
        mb="16px"
      />

      {/* Кнопка "Использовать" — прижата к низу */}
      <Flex
        justify="flex-end"
        mt="auto"
      >
        <Button
          variant="outline"
          borderColor="var(--text-link)"
          borderWidth="1px"
          color="var(--text-link)"
          borderRadius="8px"
          h="44px"
          w="152px"
          fontSize="md"
          fontWeight="500"
          lineHeight="24px"
          letterSpacing="0"
          px="20px"
          py="10px"
          bg="transparent"
          _hover={{
            bg: 'var(--primary-bg-hover)',
            borderColor: 'var(--text-link)'
          }}
          onClick={() => onUseTemplate(template)}
        >
          Использовать
        </Button>
      </Flex>
    </Box>
  );
};

export default TemplateCard;
