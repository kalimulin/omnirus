import { CheckIcon } from '@chakra-ui/icons/Check';
import { Box, HStack, Text } from '@chakra-ui/react';

import type { TariffCardFeatureProps } from '../types/types';

export default function TariffCardFeature({
  text,
  isHighlighted,
  isDisabled
}: TariffCardFeatureProps) {
  const textColor = isDisabled
    ? isHighlighted
      ? 'rgba(255, 255, 255, 0.45)'
      : 'var(--gray-400)'
    : isHighlighted
      ? 'white'
      : 'var(--text)';

  return (
    <HStack
      align="start"
      spacing={3}
    >
      {!isDisabled && (
        <Box
          mt="5px"
          borderRadius="4px"
          bg="var(--green-500)"
          color="white"
          fontSize="10px"
          display="flex"
          alignItems="center"
          justifyContent="center"
          flexShrink={0}
          padding={1}
        >
          <CheckIcon boxSize={3.5} />
        </Box>
      )}
      <Text
        fontSize="xl"
        lineHeight="30px"
        color={textColor}
        textDecor={isDisabled ? 'line-through' : 'unset'}
      >
        {text}
      </Text>
    </HStack>
  );
}
