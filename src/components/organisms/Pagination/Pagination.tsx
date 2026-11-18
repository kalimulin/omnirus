import { useMemo } from 'react';
import { Flex, Button, Text } from '@chakra-ui/react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

type PageItem = number | 'dots-left' | 'dots-right';

export const Pagination = ({
  currentPage,
  totalPages,
  onPageChange
}: PaginationProps) => {
  const pages = useMemo<PageItem[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Начало списка
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, 'dots-right', totalPages];
    }

    // Конец списка
    if (currentPage >= totalPages - 3) {
      return [
        1,
        'dots-left',
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages
      ];
    }

    // Середина списка
    return [
      1,
      'dots-left',
      currentPage - 1,
      currentPage,
      currentPage + 1,
      'dots-right',
      totalPages
    ];
  }, [currentPage, totalPages]);

  if (totalPages <= 1) return null;

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) {
      return;
    }

    onPageChange(page);
  };

  return (
    <Flex
      justify="center"
      mt={6}
      gap={2}
      align="center"
    >
      {/* Назад */}
      <Button
        size="sm"
        variant="ghost"
        colorScheme="gray"
        isDisabled={currentPage <= 1}
        onClick={() => handlePageChange(currentPage - 1)}
      >
        &lt;
      </Button>

      {/* Страницы */}
      {pages.map((page) => {
        if (typeof page !== 'number') {
          return (
            <Text
              key={page}
              color="gray.600"
              px={1}
              userSelect="none"
            >
              ...
            </Text>
          );
        }

        const isActive = currentPage === page;

        return (
          <Button
            key={page}
            size="sm"
            bg={isActive ? 'var(--blue-600)' : 'transparent'}
            color={isActive ? 'white' : 'gray.600'}
            _hover={{
              bg: isActive ? 'var(--blue-700)' : 'gray.100'
            }}
            aria-label={`Страница ${page}`}
            aria-current={isActive ? 'page' : undefined}
            onClick={() => handlePageChange(page)}
          >
            {page}
          </Button>
        );
      })}

      {/* Вперёд */}
      <Button
        size="sm"
        variant="ghost"
        colorScheme="gray"
        isDisabled={currentPage >= totalPages}
        onClick={() => handlePageChange(currentPage + 1)}
      >
        &gt;
      </Button>
    </Flex>
  );
};
