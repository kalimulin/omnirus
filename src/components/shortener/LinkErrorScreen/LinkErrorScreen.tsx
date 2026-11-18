import { Flex, Box, Heading, Text, VStack } from '@chakra-ui/react';

import { LINK_ERROR_CONFIGS } from './constants';
import { normalizeLinkErrorType, type LinkErrorScreenProps } from './types';

export { LINK_ERROR_CONFIGS } from './constants';
export {
  normalizeLinkErrorType,
  type LinkErrorType,
  type LinkErrorConfig,
  type LinkErrorScreenProps
} from './types';

/**
 * Служебный экран ошибок коротких ссылок.
 * Соответствует макетам для состояний:
 * 1. "Такой ссылки не существует" (not-found / 404)
 * 2. "Ссылка временно не работает" (inactive)
 * 3. "Переход по ссылке остановлен" (blocked)
 */
export function LinkErrorScreen({
  type = 'not-found',
  title,
  subtitle,
  children,
  className
}: LinkErrorScreenProps) {
  const resolvedType = normalizeLinkErrorType(type);
  const config = LINK_ERROR_CONFIGS[resolvedType];
  const displayTitle = title ?? config.title;
  const displaySubtitle = subtitle ?? config.subtitle;

  return (
    <Flex
      className={className}
      data-testid={`link-error-screen-${resolvedType}`}
      minH="100vh"
      w="100%"
      bg="var(--bg)"
      align="center"
      justify="center"
      px={4}
      py={8}
      direction="column"
    >
      <VStack
        spacing="0"
        textAlign="center"
        maxW="640px"
        w="100%"
      >
        <Flex
          w="52px"
          h="52px"
          borderRadius="12px"
          bg="var(--error-bg)"
          color="var(--error)"
          align="center"
          justify="center"
          mb="20px"
          flexShrink={0}
          aria-hidden="true"
        >
          {config.icon}
        </Flex>

        <Heading
          as="h1"
          fontSize={{ base: '20px', md: '24px' }}
          fontWeight={700}
          color="var(--text)"
          lineHeight="1.3"
          mb="8px"
          fontFamily="'Inter', sans-serif"
        >
          {displayTitle}
        </Heading>

        <Text
          fontSize={{ base: '13px', md: '14px' }}
          fontWeight={400}
          color="var(--text-secondary)"
          lineHeight="1.5"
          maxW={{ base: '100%', sm: '520px' }}
          mx="auto"
          fontFamily="'Inter', sans-serif"
        >
          {displaySubtitle}
        </Text>

        {children && <Box mt="20px">{children}</Box>}
      </VStack>
    </Flex>
  );
}

export default LinkErrorScreen;
