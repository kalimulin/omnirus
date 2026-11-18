import { useState } from 'react';
import {
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  Text,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Box,
  InputGroup,
  Input,
  InputRightElement,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import DatePicker from '../DatePicker/DatePicker';
import {
  buildRangeValue,
  formatRuDate,
  periodDays,
  type DateRangeValue,
} from '@/utils/dateRange';

export type { DateRangeValue };

const periodOptions = [
  { value: '7days', label: 'Последние 7 дней' },
  { value: 'today', label: 'Сегодня' },
  { value: 'yesterday', label: 'Вчера' },
  { value: 'thisMonth', label: 'Текущий месяц' },
  { value: '30days', label: 'Последние 30 дней' },
  { value: 'allTime', label: 'За весь период' },
  { value: 'custom', label: 'Произвольный период' },
];

interface DateRangeSelectorProps {
  /** Вызывается при смене периода: количество дней для запроса статистики */
  onChange?: (days: number) => void;
  /** Вызывается при смене периода с полным диапазоном дат */
  onRangeChange?: (range: DateRangeValue) => void;
}

export default function DateRangeSelector({
  onChange,
  onRangeChange,
}: DateRangeSelectorProps) {
  const [period, setPeriod] = useState('7days');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const getDatesForPeriod = (selectedPeriod: string): [string, string] | null => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'today':
        return [formatRuDate(now), formatRuDate(now)];
      case 'yesterday': {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return [formatRuDate(yesterday), formatRuDate(yesterday)];
      }
      case '7days': {
        const days7 = new Date(now);
        days7.setDate(now.getDate() - 6);
        return [formatRuDate(days7), formatRuDate(now)];
      }
      case '30days': {
        const days30 = new Date(now);
        days30.setDate(now.getDate() - 29);
        return [formatRuDate(days30), formatRuDate(now)];
      }
      case 'thisMonth': {
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        return [formatRuDate(thisMonthStart), formatRuDate(now)];
      }
      case 'allTime':
        return ['01.01.2025', formatRuDate(now)];
      default:
        return null;
    }
  };

  const [tempStart, setTempStart] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 6);
    return formatRuDate(d);
  });
  const [tempEnd, setTempEnd] = useState(() => formatRuDate(new Date()));

  const [activeCal, setActiveCal] = useState<'start' | 'end' | null>(null);

  const emitChange = (
    selectedPeriod: string,
    startStr: string,
    endStr: string,
  ) => {
    const range = buildRangeValue(selectedPeriod, startStr, endStr);
    onChange?.(range.days);
    onRangeChange?.(range);
  };

  const handleApply = () => {
    setIsPopoverOpen(false);
    setActiveCal(null);
    const range = buildRangeValue('custom', tempStart, tempEnd);
    setPeriod('custom');
    setTempStart(range.startDate);
    setTempEnd(range.endDate);
    onChange?.(range.days);
    onRangeChange?.(range);
  };

  return (
    <Flex align="center" gap="12px" flexWrap="wrap">
      <Menu>
        <MenuButton
          as={Button}
          bg="var(--primary-bg)"
          border="1px solid var(--slate-200)"
          borderRadius="10px"
          fontSize="14px"
          fontWeight={400}
          color="var(--text)"
          _hover={{ bg: 'var(--slate-50-alt)', borderColor: 'var(--btn-outline)' }}
          _expanded={{
            bg: 'var(--primary-bg)',
            borderColor: 'var(--btn-outline)',
          }}
          h="40px"
          px="14px"
          minW="175px"
          w="auto"
          textAlign="left"
        >
          <Flex align="center" justify="space-between" gap="10px" w="100%">
            <Text>{periodOptions.find((o) => o.value === period)?.label}</Text>
            <ChevronDownIcon />
          </Flex>
        </MenuButton>
        <MenuList
          borderRadius="12px"
          py="8px"
          boxShadow="0 4px 20px rgba(0,0,0,0.1)"
          minW="220px"
          zIndex={10}
        >
          {periodOptions.map((opt) => (
            <MenuItem
              key={opt.value}
              onClick={() => {
                setPeriod(opt.value);
                const range = getDatesForPeriod(opt.value);
                if (range) {
                  setTempStart(range[0]);
                  setTempEnd(range[1]);
                }
                if (opt.value === 'custom') {
                  setIsPopoverOpen(true);
                } else if (range) {
                  emitChange(opt.value, range[0], range[1]);
                } else {
                  onChange?.(periodDays[opt.value] ?? 7);
                }
              }}
              bg={period === opt.value ? 'var(--slate-50-alt)' : 'transparent'}
              _hover={{ bg: 'var(--primary-bg)' }}
              fontSize="14px"
              color="var(--text)"
              px="16px"
              py="8px"
            >
              {opt.label}
            </MenuItem>
          ))}
        </MenuList>
      </Menu>

      <Popover
        isOpen={isPopoverOpen}
        onClose={() => {
          setIsPopoverOpen(false);
          setActiveCal(null);
        }}
        placement="bottom-start"
        autoFocus={false}
      >
        <PopoverTrigger>
          <Button
            variant="outline"
            bg="var(--primary-bg)"
            borderColor="var(--slate-200)"
            borderRadius="10px"
            fontSize="14px"
            fontWeight={400}
            color="var(--text)"
            _hover={{
              bg: 'var(--slate-50-alt)',
              borderColor: 'var(--btn-outline)',
            }}
            h="40px"
            px="14px"
            onClick={() => {
              if (period !== 'custom') {
                setPeriod('custom');
                setIsPopoverOpen(true);
              } else {
                setIsPopoverOpen(!isPopoverOpen);
              }
            }}
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              style={{ marginRight: '8px' }}
            >
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
            {tempStart} — {tempEnd}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          w="320px"
          borderRadius="12px"
          p="16px"
          boxShadow="0 4px 24px rgba(0,0,0,0.1)"
          border="none"
        >
          <PopoverBody p={0}>
            <Flex gap="12px" mb="16px">
              <Box flex={1} position="relative">
                <Text fontSize="12px" color="var(--text-secondary)" mb="6px">
                  С даты
                </Text>

                <InputGroup
                  size="sm"
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCal(activeCal === 'start' ? null : 'start');
                  }}
                >
                  <Input
                    value={tempStart}
                    readOnly
                    bg={
                      activeCal === 'start'
                        ? 'var(--slate-200)'
                        : 'var(--slate-50-alt)'
                    }
                    border="none"
                    borderRadius="8px"
                    fontSize="13px"
                    color="var(--text)"
                    cursor="pointer"
                  />
                  <InputRightElement pointerEvents="none">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-secondary)"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </InputRightElement>
                </InputGroup>

                {activeCal === 'start' && (
                  <Box
                    position="absolute"
                    top="100%"
                    left="0"
                    mt="4px"
                    zIndex={20}
                    w="240px"
                    p="12px"
                    bg="white"
                    borderRadius="12px"
                    boxShadow="0 4px 24px rgba(0,0,0,0.15)"
                    border="1px solid var(--slate-200)"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DatePicker
                      selected={tempStart}
                      onSelect={(d) => {
                        setTempStart(d);
                        setActiveCal(null);
                      }}
                    />
                  </Box>
                )}
              </Box>
              <Box flex={1} position="relative">
                <Text fontSize="12px" color="var(--text-secondary)" mb="6px">
                  По дату
                </Text>

                <InputGroup
                  size="sm"
                  cursor="pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveCal(activeCal === 'end' ? null : 'end');
                  }}
                >
                  <Input
                    value={tempEnd}
                    readOnly
                    bg={
                      activeCal === 'end'
                        ? 'var(--slate-200)'
                        : 'var(--slate-50-alt)'
                    }
                    border="none"
                    borderRadius="8px"
                    fontSize="13px"
                    color="var(--text)"
                    cursor="pointer"
                  />
                  <InputRightElement pointerEvents="none">
                    <svg
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="var(--text-secondary)"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                  </InputRightElement>
                </InputGroup>

                {activeCal === 'end' && (
                  <Box
                    position="absolute"
                    top="100%"
                    right="0"
                    mt="4px"
                    zIndex={20}
                    w="240px"
                    p="12px"
                    bg="white"
                    borderRadius="12px"
                    boxShadow="0 4px 24px rgba(0,0,0,0.15)"
                    border="1px solid var(--slate-200)"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <DatePicker
                      selected={tempEnd}
                      onSelect={(d) => {
                        setTempEnd(d);
                        setActiveCal(null);
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Flex>
            <Flex justify="flex-end" gap="12px" align="center">
              <Text
                fontSize="13px"
                color="var(--text-secondary)"
                cursor="pointer"
                onClick={() => {
                  setIsPopoverOpen(false);
                  setActiveCal(null);
                }}
                _hover={{ color: 'var(--text)' }}
              >
                Отмена
              </Text>
              <Button
                size="sm"
                bg="var(--primary)"
                color="white"
                borderRadius="8px"
                fontSize="13px"
                fontWeight={500}
                _hover={{ bg: 'var(--btn-hover)' }}
                onClick={handleApply}
              >
                Применить
              </Button>
            </Flex>
          </PopoverBody>
        </PopoverContent>
      </Popover>
    </Flex>
  );
}
