import { Box, Button, Center, Text, Icon } from '@chakra-ui/react';
import React from 'react';
import { LuFileText } from 'react-icons/lu';

interface ErrorStateProps {
  message?: string;
  description?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Не удалось загрузить шаблоны',
  description = 'Проверьте соединение и повторите',
  onRetry
}) => {
  return (
    <Center>
      <Box
        bg="var(--white)"
        borderRadius="20px"
        borderBottom="3px solid"
        borderColor="var(--slate-200)"
        py="40px"
        w="100%"
        display="flex"
        flexDirection="column"
        alignItems="center"
        boxShadow="0 1px 3px rgba(30, 41, 59, 0.08)"
      >
        {/* Иконка документа в красном квадрате */}
        <Box
          bg="var(--error-bg)"
          borderRadius="8px"
          w="44px"
          h="44px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          mb="24px"
        >
          <Icon
            as={LuFileText}
            boxSize={6}
            color="var(--error)"
          />
        </Box>
        {/* Заголовок ошибки: xl / font-bold */}
        <Text
          fontSize="xl"
          fontWeight="bold"
          lineHeight="30px"
          letterSpacing="0"
          color="var(--text)"
          textAlign="center"
          mb="4px"
        >
          {message}
        </Text>

        {/* Описание: md / font-normal */}
        <Text
          fontSize="md"
          fontWeight="normal"
          lineHeight="24px"
          letterSpacing="0"
          color="var(--text-secondary)"
          textAlign="center"
          mb="12px"
        >
          {description}
        </Text>

        {/* Кнопка "Повторить" */}
        {onRetry && (
          <Button
            bg="var(--primary)"
            color="var(--white)"
            borderRadius="8px"
            h="48px"
            w="126px"
            fontSize="md"
            fontWeight="medium"
            lineHeight="24px"
            letterSpacing="0"
            px="20px"
            py="2px"
            mt={2}
            _hover={{ bg: 'var(--primary-700)' }}
            onClick={onRetry}
          >
            Повторить
          </Button>
        )}
      </Box>
    </Center>
  );
};

export default ErrorState;
