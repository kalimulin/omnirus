import { useState } from 'react';
import { Box, Flex, Grid, Text, Icon } from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon } from '@chakra-ui/icons';

const months = [
  'Январь',
  'Февраль',
  'Март',
  'Апрель',
  'Май',
  'Июнь',
  'Июль',
  'Август',
  'Сентябрь',
  'Октябрь',
  'Ноябрь',
  'Декабрь',
];

export interface DatePickerProps {
  selected: string;
  onSelect: (date: string) => void;
}

export default function DatePicker({ selected, onSelect }: DatePickerProps) {
  const getInitialDate = () => {
    try {
      const parts = selected.split('.');
      if (parts.length === 3) {
        return new Date(
          parseInt(parts[2]),
          parseInt(parts[1]) - 1,
          parseInt(parts[0]),
        );
      }
    } catch {
      // fallback
    }
    return new Date();
  };

  const initialDate = getInitialDate();
  const [currentMonth, setCurrentMonth] = useState(initialDate.getMonth());
  const [currentYear, setCurrentYear] = useState(initialDate.getFullYear());

  const days = ['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  let firstDay = new Date(currentYear, currentMonth, 1).getDay();
  if (firstDay === 0) firstDay = 7;

  const empty = Array.from({ length: firstDay - 1 }, () => null);
  const dates = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb="12px" px="4px">
        <Icon
          as={ChevronLeftIcon}
          color="var(--text-placeholder)"
          cursor="pointer"
          boxSize={4}
          onClick={handlePrev}
          _hover={{ color: 'var(--text)' }}
        />
        <Text fontSize="12px" fontWeight={600} color="var(--text)">
          {months[currentMonth]} {currentYear}
        </Text>
        <Icon
          as={ChevronRightIcon}
          color="var(--text-placeholder)"
          cursor="pointer"
          boxSize={4}
          onClick={handleNext}
          _hover={{ color: 'var(--text)' }}
        />
      </Flex>
      <Grid templateColumns="repeat(7, 1fr)" gap="2px" mb="8px">
        {days.map((d) => (
          <Text
            key={d}
            fontSize="10px"
            color="var(--text-placeholder)"
            textAlign="center"
            textTransform="uppercase"
          >
            {d}
          </Text>
        ))}
      </Grid>
      <Grid templateColumns="repeat(7, 1fr)" gap="2px" rowGap="6px">
        {empty.map((_, i) => (
          <Box key={`e-${i}`} />
        ))}
        {dates.map((d) => {
          const formatted = `${d.toString().padStart(2, '0')}.${(currentMonth + 1).toString().padStart(2, '0')}.${currentYear}`;
          const isSelected = selected === formatted;
          return (
            <Flex
              key={d}
              w="24px"
              h="24px"
              align="center"
              justify="center"
              fontSize="12px"
              borderRadius="50%"
              bg={isSelected ? 'var(--primary)' : 'transparent'}
              color={isSelected ? 'white' : 'var(--text)'}
              cursor="pointer"
              _hover={{
                bg: isSelected ? 'var(--primary)' : 'var(--slate-50-alt)',
              }}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(formatted);
              }}
              margin="auto"
            >
              {d}
            </Flex>
          );
        })}
      </Grid>
    </Box>
  );
}
