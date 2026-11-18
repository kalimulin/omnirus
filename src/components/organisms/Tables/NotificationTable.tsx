import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Tooltip,
  Flex,
  Text,
  Link,
  Progress,
  chakra
} from '@chakra-ui/react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fragment } from 'react';

import { StatusBadge } from '@/components/atoms/Badge/StatusBadge';
import type { DispatchLog } from '@/api/types';
import { formatDate, formatAppName } from '@/utils/formatters';

interface NotificationsTableProps {
  data: DispatchLog[];
  expandedId?: string | null;
  onRowClick?: (id: string) => void;
}

const MotionTr = chakra(motion.tr);

const detailsVariants = {
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.2, ease: 'easeInOut' }
    }
  },
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.3, delay: 0.1, ease: 'easeInOut' }
    }
  }
};

export const NotificationsTable = ({
  data,
  expandedId,
  onRowClick
}: NotificationsTableProps) => {
  const getMethodName = (method: string) => {
    if (method === 'manual') return 'Ручная';
    if (method === 'triggered') return 'Триггерная';
    return method;
  };

  return (
    <Box
      bg="white"
      borderRadius="16px"
      overflow="hidden"
      w="full"
    >
      <Table
        fontSize="md"
        layout="fixed"
      >
        <Thead>
          <Tr
            sx={{ th: { py: '22px' } }}
            fontWeight="semibold"
          >
            <Th w="15%">Приложение</Th>
            <Th w="18%">Шаблон</Th>
            <Th w="25%">Заголовок</Th>
            <Th
              w="12%"
              textAlign="center"
            >
              Отправлено
            </Th>
            <Th w="15%">Дата и время</Th>
            <Th
              w="15%"
              textAlign="center"
            >
              Статус
            </Th>
          </Tr>
        </Thead>
        <Tbody fontWeight="normal">
          {data.map((row) => {
            const rowId = `${row.event_id}_${row.created_at}`;
            const isExpanded = expandedId === rowId;
            const isError = row.status === 'failed';

            return (
              <Fragment key={`row-group-${rowId}`}>
                <MotionTr
                  onClick={() => onRowClick && onRowClick(rowId)}
                  cursor={onRowClick ? 'pointer' : 'default'}
                  _hover={{
                    bg: isError ? 'var(--error-bg)' : 'var(--bg-secondary)'
                  }}
                  sx={{
                    td: {
                      borderBottom: isExpanded
                        ? 'none'
                        : '1px solid var(--slate-200)',
                      transition: 'background-color 0.2s ease'
                    }
                  }}
                >
                  <Td>
                    <Flex align="center">
                      <Text
                        color="var(--text)"
                        isTruncated
                      >
                        {formatAppName(row.application_id)}
                      </Text>
                    </Flex>
                  </Td>
                  <Td color="var(--text-link)">
                    <Text isTruncated>
                      {row.template_name || 'Без шаблона'}
                    </Text>
                  </Td>
                  <Td>
                    <Tooltip
                      label={row.body}
                      bg="var(--text)"
                      color="var(--white)"
                      placement="bottom-end"
                      hasArrow
                      p="8px"
                      borderRadius="4px"
                      maxW="230px"
                      whiteSpace="normal"
                    >
                      <Text
                        isTruncated
                        cursor="pointer"
                        color="var(--text-link)"
                      >
                        {row.title}
                      </Text>
                    </Tooltip>
                  </Td>
                  <Td
                    textAlign="center"
                    color="var(--text)"
                  >
                    {row.recipients.length}
                  </Td>
                  <Td color="var(--text)">
                    <Text isTruncated>{formatDate(row.created_at)}</Text>
                  </Td>
                  <Td textAlign="center">
                    <Flex
                      w="100%"
                      justifyContent="center"
                    >
                      <StatusBadge status={row.status} />
                    </Flex>
                  </Td>
                </MotionTr>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <Tr key={`details-${row.event_id}`}>
                      <Td
                        colSpan={6}
                        p={0}
                        borderBottom="1px solid var(--slate-200)"
                      >
                        <motion.div
                          variants={detailsVariants}
                          initial="collapsed"
                          animate="expanded"
                          exit="collapsed"
                          style={{ overflow: 'hidden' }}
                        >
                          <Box
                            bg="var(--bg-secondary)"
                            p="24px"
                            borderTop="1px solid var(--slate-200)"
                            w="full"
                          >
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{
                                opacity: 1,
                                y: 0,
                                transition: { delay: 0.15, duration: 0.3 }
                              }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <Flex
                                gap="60px"
                                mb="24px"
                                w="full"
                              >
                                <Box
                                  flex="1"
                                  minW="0"
                                >
                                  <Text
                                    fontSize="sm"
                                    color="var(--slate-500)"
                                    mb="4px"
                                  >
                                    Заголовок
                                  </Text>
                                  <Text
                                    fontSize="md"
                                    fontWeight="500"
                                    color="var(--text)"
                                    mb="16px"
                                    wordBreak="break-word"
                                  >
                                    {row.title}
                                  </Text>
                                  <Text
                                    fontSize="sm"
                                    color="var(--slate-500)"
                                    mb="4px"
                                  >
                                    Описание
                                  </Text>
                                  <Text
                                    fontSize="md"
                                    color="var(--text)"
                                    mb="16px"
                                    lineHeight="tall"
                                    wordBreak="break-word"
                                  >
                                    {row.body}
                                  </Text>
                                  <Text
                                    fontSize="sm"
                                    color="var(--slate-500)"
                                    mb="4px"
                                  >
                                    Ссылка действия
                                  </Text>
                                  <Link
                                    color="var(--primary)"
                                    fontSize="md"
                                    href="#"
                                    isExternal
                                    wordBreak="break-all"
                                  >
                                    https://omni.skroy.ru/create/push?
                                  </Link>
                                </Box>

                                <Box
                                  flex="1.5"
                                  minW="0"
                                  display="grid"
                                  gridTemplateColumns="repeat(3, 1fr)"
                                  gap="24px"
                                  alignContent="start"
                                >
                                  <Box>
                                    <Text
                                      fontSize="sm"
                                      color="var(--slate-500)"
                                      mb="4px"
                                    >
                                      Дата и время
                                    </Text>
                                    <Text
                                      fontSize="md"
                                      color="var(--text)"
                                    >
                                      {formatDate(row.created_at)}
                                    </Text>
                                  </Box>
                                  <Box>
                                    <Text
                                      fontSize="sm"
                                      color="var(--slate-500)"
                                      mb="4px"
                                    >
                                      Способ отправки
                                    </Text>
                                    <Text
                                      fontSize="md"
                                      color="var(--text)"
                                    >
                                      {getMethodName(row.send_method)}
                                    </Text>
                                  </Box>
                                  <Box>
                                    <Text
                                      fontSize="sm"
                                      color="var(--slate-500)"
                                      mb="4px"
                                    >
                                      Получатели
                                    </Text>
                                    <Text
                                      fontSize="md"
                                      color="var(--text)"
                                    >
                                      {formatAppName(row.application_id)} (
                                      {row.recipients.length})
                                    </Text>
                                  </Box>
                                  <Box gridColumn="span 3">
                                    <Text
                                      fontSize="sm"
                                      color="var(--slate-500)"
                                      mb="4px"
                                    >
                                      Инициатор отправления
                                    </Text>
                                    <Text
                                      fontSize="md"
                                      color="var(--text)"
                                    >
                                      Иван Иванов
                                    </Text>
                                  </Box>
                                </Box>
                              </Flex>

                              <Flex
                                mt="24px"
                                gap="48px"
                                align="center"
                                w="full"
                              >
                                <Box flexShrink={0}>
                                  <Text
                                    fontSize="sm"
                                    color="var(--slate-500)"
                                    mb="4px"
                                  >
                                    Отправлено
                                  </Text>
                                  <Text
                                    fontSize="md"
                                    color={
                                      isError ? 'var(--error)' : 'var(--text)'
                                    }
                                  >
                                    {isError
                                      ? '0 (0%)'
                                      : `${row.recipients.length} (100%)`}
                                  </Text>
                                </Box>
                                <Box flexShrink={0}>
                                  <Text
                                    fontSize="sm"
                                    color="var(--slate-500)"
                                    mb="4px"
                                  >
                                    Ошибок
                                  </Text>
                                  <Text
                                    fontSize="md"
                                    color={
                                      isError ? 'var(--error)' : 'var(--text)'
                                    }
                                  >
                                    {isError
                                      ? `${row.recipients.length} (100%)`
                                      : '0 (0%)'}
                                  </Text>
                                </Box>

                                {isError && (
                                  <Box flexShrink={0}>
                                    <Text
                                      fontSize="sm"
                                      color="var(--slate-500)"
                                      mb="4px"
                                    >
                                      Причина ошибки
                                    </Text>
                                    <Text
                                      fontSize="md"
                                      color="var(--error)"
                                    >
                                      Ошибка сервера
                                    </Text>
                                  </Box>
                                )}

                                <Box
                                  flex="1"
                                  maxW="300px"
                                  minW="150px"
                                >
                                  <Text
                                    fontSize="sm"
                                    color="var(--slate-500)"
                                    mb="4px"
                                  >
                                    Прочитано получателями
                                  </Text>
                                  <Flex
                                    align="center"
                                    gap="12px"
                                  >
                                    <Text
                                      fontSize="md"
                                      color="var(--text)"
                                      minW="40px"
                                    >
                                      {isError ? '0%' : '87%'}
                                    </Text>
                                    <Progress
                                      value={isError ? 0 : 87}
                                      size="sm"
                                      colorScheme={isError ? 'red' : 'blue'}
                                      borderRadius="full"
                                      flex="1"
                                      bg={
                                        isError
                                          ? 'var(--slate-100-alt2)'
                                          : undefined
                                      }
                                    />
                                  </Flex>
                                </Box>
                              </Flex>
                            </motion.div>
                          </Box>
                        </motion.div>
                      </Td>
                    </Tr>
                  )}
                </AnimatePresence>
              </Fragment>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
};
