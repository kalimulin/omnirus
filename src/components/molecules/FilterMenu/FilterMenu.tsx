import { ChevronDownIcon } from '@chakra-ui/icons';
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Box,
  Flex,
  Text
} from '@chakra-ui/react';

interface FilterMenuProps {
  label: string;
  options: string[];
  value?: string;
  onSelect?: (value: string) => void;
}

export const FilterMenu = ({
  label,
  options,
  value,
  onSelect
}: FilterMenuProps) => (
  <Box
    display="block"
    position="relative"
    w="full"
  >
    <Menu matchWidth>
      {({ isOpen }) => (
        <>
          <MenuButton
            as={Button}
            w="full"
            p="14px 20px"
            variant="outline"
            bg="var(--bg-secondary)"
            fontWeight="normal"
            borderColor="transparent"
            _hover={{ bg: 'var(--bg-secondary)', borderColor: 'var(--primary)' }}
            _focus={{ bg: 'var(--bg-secondary)', borderColor: 'var(--primary)' }}
            _expanded={{ bg: 'var(--bg-secondary)', borderColor: 'var(--primary)' }}
          >
            <Flex
              w="full"
              justify="space-between"
              align="center"
              gap="8px"
            >
              {/* isTruncated аккуратно обрежет длинный текст, не задевая стрелку */}
              <Text
                isTruncated
                color="var(--text)"
              >
                {value || label}
              </Text>

              {/* Стрелка всегда видима, меняет цвет и крутится на 180 градусов */}
              <ChevronDownIcon
                color="var(--text)"
                boxSize="16px"
                flexShrink={0} // Запрещаем сжимать стрелку
                transform={isOpen ? 'rotate(180deg)' : 'rotate(0deg)'}
                transition="transform 0.2s ease"
              />
            </Flex>
          </MenuButton>

          <MenuList
            minW="0"
            w="full"
            p="8px"
          >
            {options.map((opt) => (
              <MenuItem
                key={opt}
                fontSize="sm"
                lineHeight="20px"
                py="12px"
                px="16px"
                borderRadius="8px"
                onClick={() => onSelect?.(opt)}
                _hover={{ bg: 'var(--btn-outline)', color: 'var(--text-link)' }}
                color={value === opt ? 'var(--text-link)' : 'var(--text)'}
              >
                {opt}
              </MenuItem>
            ))}
          </MenuList>
        </>
      )}
    </Menu>
  </Box>
);
