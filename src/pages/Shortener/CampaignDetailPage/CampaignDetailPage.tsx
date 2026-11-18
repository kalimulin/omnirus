import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Spinner,
  useToast
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AddIcon,
  LinkIcon,
  ArrowForwardIcon
} from '@chakra-ui/icons';
import BarChartIcon from '@/components/atoms/Icons/BarChartIcon';
import DateRangeSelector from '@/components/shortener/DateRangeSelector/DateRangeSelector';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList
} from 'recharts';

import ProgressModal from '@/components/shortener/ProgressModal/ProgressModal';
import { LinksRegistryTable } from '@/components/shortener/LinksRegistryTable';
import {
  fetchCampaign,
  fetchLinks,
  fetchCampaignStatistics,
  isApiConfigured
} from '@/api/shortener';
import { exportStatsCsv } from '@/utils/exportStatsCsv.ts';
import { ROUTES } from '@/routing/routes';
import type {
  LinkRow,
  CampaignRow,
  LinkStatistics,
  DailyDataPoint,
  StatCard
} from '@/types/shortener';
import './CampaignDetailPage.scss';

const STATS_REFRESH_INTERVAL_MS = 30_000;

/** "2026-09-07" → "07.09" */
const formatDay = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (match) return `${match[3]}.${match[2]}`;
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit'
    });
  }
  return date;
};

/** ISO 8601 → "07.09.2026" */
const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  // Дата без времени — разбираем по частям, чтобы не зависеть от таймзоны
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) {
    const [year, month, day] = iso.split('-');
    return `${day}.${month}.${year}`;
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const formatNumber = (value: number): string => value.toLocaleString('ru-RU');

/** Строка таблицы распределения по ссылкам кампании */
interface UtmSourceRow {
  name: string;
  shortUrl: string;
  targetUrl: string;
  channel: string;
  clicks: number;
  uniqueClicks: number;
  share: number;
}

type SortDir = 'asc' | 'desc';

function SortIndicator({ dir }: { dir: SortDir | null }) {
  return (
    <svg
      style={{
        width: '16px',
        height: '16px',
        color: dir ? 'var(--text)' : 'var(--text-placeholder)',
        transition: 'color 0.2s'
      }}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth={dir ? 1.8 : 1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {dir === 'asc' && <path d="M3.5 10 8 5.5 12.5 10" />}
      {dir === 'desc' && <path d="M3.5 6 8 10.5 12.5 6" />}
      {!dir && (
        <>
          <path d="M4.5 6 8 2.5 11.5 6" />
          <path d="M4.5 10 8 13.5 11.5 10" />
        </>
      )}
    </svg>
  );
}

function BreadcrumbsHeader({ name }: { name: string }) {
  const navigate = useNavigate();
  return (
    <Flex
      align="center"
      gap={2}
      fontSize="13px"
      mb={2}
      px="32px"
      pt="20px"
    >
      <Text
        color="var(--primary)"
        cursor="pointer"
        _hover={{ textDecoration: 'underline' }}
        onClick={() => navigate('/campaigns')}
      >
        Кампании
      </Text>
      <Text color="var(--text-placeholder)">/</Text>
      <Text color="var(--text-secondary)">{name}</Text>
    </Flex>
  );
}
export default function CampaignDetailPage() {
  const { id } = useParams();
  const apiConfigured = isApiConfigured();
  const toast = useToast();
  const notify = useMemo(
    () => ({
      error: (msg: string) =>
        toast({
          title: msg,
          status: 'error',
          duration: 4000,
          isClosable: true
        }),
      success: (msg: string) =>
        toast({
          title: msg,
          status: 'success',
          duration: 4000,
          isClosable: true
        })
    }),
    [toast]
  );
  const navigate = useNavigate();

  const [loadedCampaign, setLoadedCampaign] = useState<CampaignRow | null>(
    null
  );
  const [apiLinks, setApiLinks] = useState<LinkRow[]>([]);
  const [stats, setStats] = useState<LinkStatistics | null>(null);
  const [days, setDays] = useState(7);
  const [isLoading, setIsLoading] = useState(Boolean(apiConfigured && id));
  const [prevCampaignId, setPrevCampaignId] = useState(id);
  if (id !== prevCampaignId) {
    setPrevCampaignId(id);
    setIsLoading(Boolean(apiConfigured && id));
  }

  const rawLinks = apiLinks;
  const baseCampaign = loadedCampaign;
  const resolvedShortLinksCount = apiConfigured
    ? Math.max(
        rawLinks.length,
        stats?.linksCount ?? baseCampaign?.shortLinksCount ?? baseCampaign?.linksCount ?? 0
      )
    : rawLinks.length;
  const resolvedTargetUrlsCount =
    rawLinks.length > 0
      ? new Set(rawLinks.map((l) => l.targetUrl?.trim()).filter(Boolean)).size
      : (baseCampaign?.linksCount ?? resolvedShortLinksCount);
  const campaign: CampaignRow | null = useMemo(() => {
    if (!baseCampaign) return null;
    return {
      ...baseCampaign,
      linksCount: resolvedTargetUrlsCount,
      shortLinksCount: resolvedShortLinksCount
    };
  }, [baseCampaign, resolvedTargetUrlsCount, resolvedShortLinksCount]);

  const links = useMemo(() => {
    if (!campaign) return rawLinks;
    return rawLinks.map((l) => ({
      ...l,
      campaignId: l.campaignId || campaign.id,
      campaign:
        l.campaign && l.campaign !== 'Без кампании'
          ? l.campaign
          : campaign.name
    }));
  }, [rawLinks, campaign]);
  const effectiveStats = apiConfigured ? stats : null;

  // Карточка кампании с автообновлением каждые 30 секунд
  useEffect(() => {
    if (!apiConfigured || !id) return;
    let cancelled = false;

    const loadCampaign = (isInitial = false) => {
      fetchCampaign(id)
        .then((data) => {
          if (!cancelled) setLoadedCampaign(data);
        })
        .catch((err) => {
          if (!cancelled && isInitial)
            notify.error(
              `Не удалось загрузить кампанию: ${(err as Error).message}`
            );
        })
        .finally(() => {
          if (!cancelled && isInitial) setIsLoading(false);
        });
    };

    loadCampaign(true);

    const intervalId = window.setInterval(() => {
      loadCampaign(false);
    }, STATS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [apiConfigured, id, notify]);

  // Ссылки кампании (GET /shortcuts/?campaign_id=...) с автообновлением статистики переходов каждые 30 секунд
  useEffect(() => {
    if (!apiConfigured || !id) return;
    let cancelled = false;

    const loadLinks = (isInitial = false) => {
      fetchLinks(id)
        .then((data) => {
          if (!cancelled) setApiLinks(data);
        })
        .catch((err) => {
          if (!cancelled && isInitial)
            notify.error(
              `Не удалось загрузить ссылки кампании: ${(err as Error).message}`
            );
        });
    };

    loadLinks(true);

    const intervalId = window.setInterval(() => {
      loadLinks(false);
    }, STATS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [apiConfigured, id, notify]);

  // Статистика кампании за выбранный период с автообновлением каждые 30 секунд
  useEffect(() => {
    if (!apiConfigured || !id) return;
    let cancelled = false;

    const loadStats = (isInitial = false) => {
      fetchCampaignStatistics(id, days)
        .then((data) => {
          if (!cancelled) setStats(data);
        })
        .catch((err) => {
          if (!cancelled && isInitial)
            notify.error(
              `Не удалось загрузить статистику: ${(err as Error).message}`
            );
        });
    };

    loadStats(true);

    const intervalId = window.setInterval(() => {
      loadStats(false);
    }, STATS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [apiConfigured, id, days, notify]);

  const [isExportModalOpen, setIsExportModalOpen] = useState(false);

  const handleLinksChange = useCallback((updatedLinks: LinkRow[]) => {
    setApiLinks(updatedLinks);
  }, []);

  const formattedDate = formatDate(campaign?.createdAt);

  const localTotalClicks = useMemo(
    () => links.reduce((sum, l) => sum + (l.clicks || 0), 0),
    [links]
  );
  // Статистика и графики
  const hasStats = apiConfigured
    ? (effectiveStats?.total ?? 0) > 0
    : localTotalClicks > 0;

  const statCards: StatCard[] = effectiveStats
    ? [
        { label: 'Всего переходов', value: formatNumber(effectiveStats.total) },
        {
          label: 'Уникальных переходов',
          value: formatNumber(effectiveStats.unique)
        },
        {
          label: 'В среднем за день',
          value: formatNumber(
            effectiveStats.byDay.length
              ? Math.round(effectiveStats.total / effectiveStats.byDay.length)
              : 0
          )
        },
        (() => {
          const peak = effectiveStats.byDay.reduce<DailyDataPoint | null>(
            (best, point) => (!best || point.value > best.value ? point : best),
            null
          );
          return peak
            ? {
                label: 'Пик',
                value: formatNumber(peak.value),
                sub: formatDay(peak.date)
              }
            : { label: 'Пик', value: '0' };
        })()
      ]
    : [];

  const dailyData =
    effectiveStats?.byDay.map((point) => ({
      date: formatDay(point.date),
      value: point.value
    })) ?? [];

  const periodLabel = effectiveStats?.byDay.length
    ? `${formatDate(effectiveStats.byDay[0].date)} — ${formatDate(
        effectiveStats.byDay[effectiveStats.byDay.length - 1].date
      )}`
    : `Последние ${days} дней`;

  // Распределение переходов по ссылкам кампании (канал = первый тег)
  const utmSources: UtmSourceRow[] = useMemo(() => {
    const statsByKey = new Map<
      string,
      { clicks: number; uniqueVisitors: number }
    >();
    stats?.shortcuts?.forEach((s) => {
      if (s.shortcutId) {
        statsByKey.set(s.shortcutId, {
          clicks: s.clicks,
          uniqueVisitors: s.uniqueVisitors
        });
      }
      if (s.shortcut) {
        statsByKey.set(s.shortcut, {
          clicks: s.clicks,
          uniqueVisitors: s.uniqueVisitors
        });
      }
    });

    const rows = links.map((l) => {
      const statMatch =
        statsByKey.get(l.id) ||
        (l.shortcut ? statsByKey.get(l.shortcut) : undefined);
      const clicks = statMatch ? statMatch.clicks : l.clicks;
      const uniqueClicks = statMatch ? statMatch.uniqueVisitors : clicks;
      return {
        name: l.name,
        shortUrl: l.shortUrl,
        targetUrl: l.targetUrl,
        channel: l.tags[0] || 'Без канала',
        clicks,
        uniqueClicks
      };
    });

    const totalClicks = rows.reduce((sum, r) => sum + r.clicks, 0);
    const total = totalClicks || 1;
    return rows
      .sort((a, b) => b.clicks - a.clicks)
      .map((row) => ({
        ...row,
        share: Math.round((row.clicks / total) * 100)
      }));
  }, [links, stats]);

  const channelsCount = new Set(links.map((l) => l.tags[0] || 'Без канала'))
    .size;

  // Пока карточка кампании не загружена — показываем индикатор
  if (apiConfigured && isLoading) {
    return (
      <Box className="campaign-detail">
        <BreadcrumbsHeader name="Карточка кампании" />
        <Box
          className="campaign-detail__container"
          py="80px"
          textAlign="center"
        >
          <Spinner
            color="var(--primary)"
            size="lg"
          />
        </Box>
      </Box>
    );
  }

  if (!campaign) {
    return (
      <Box className="campaign-detail">
        <BreadcrumbsHeader name="Кампания" />
        <Box className="campaign-detail__container">
          <Box
            className="campaign-detail__info-card"
            textAlign="center"
            py="80px"
          >
            <Text
              fontSize="18px"
              fontWeight={700}
              color="var(--text)"
              mb="8px"
            >
              Кампания не найдена
            </Text>
            <Text
              fontSize="14px"
              color="var(--text-secondary)"
              mb="24px"
            >
              Запрошенная кампания не найдена среди сохранённых кампаний.
            </Text>
            <Button
              bg="var(--primary)"
              color="white"
              fontSize="14px"
              fontWeight={600}
              borderRadius="10px"
              px="28px"
              h="44px"
              _hover={{ bg: 'var(--btn-hover)' }}
              onClick={() => navigate(ROUTES.campaigns)}
            >
              К списку кампаний
            </Button>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box className="campaign-detail">
      <BreadcrumbsHeader name={campaign.name} />

      <Box className="campaign-detail__container">
        {/* Campaign Info Card */}
        <Box className="campaign-detail__info-card">
          <Heading className="campaign-detail__title">{campaign.name}</Heading>

          <Box mb={4}>
            <Text className="campaign-detail__label">Описание</Text>
            <Text className="campaign-detail__value">
              {campaign.description || 'Нет описания'}
            </Text>
          </Box>

          <Flex
            direction="column"
            gap={2}
            mb={4}
          >
            <Flex
              gap={2}
              align="center"
            >
              <Text className="campaign-detail__label">Целевых URL</Text>
              <Text className="campaign-detail__value">
                {campaign.linksCount}
              </Text>
            </Flex>
            <Flex
              gap={2}
              align="center"
            >
              <Text className="campaign-detail__label">Коротких ссылок</Text>
              <Text className="campaign-detail__value">
                {campaign.shortLinksCount}
              </Text>
            </Flex>
            <Flex
              gap={2}
              align="center"
            >
              <Text className="campaign-detail__label">Каналов</Text>
              <Text className="campaign-detail__value">{channelsCount}</Text>
            </Flex>
          </Flex>

          <Text className="campaign-detail__date">
            Создана: {formattedDate}
          </Text>
        </Box>

        {/* Tabs Card */}
        <Box className="campaign-detail__tabs-card">
          <Tabs
            variant="line"
            colorScheme="blue"
          >
            <TabList className="campaign-detail__tablist">
              <Tab className="campaign-detail__tab">Ссылки</Tab>
              <Tab className="campaign-detail__tab">Аналитика</Tab>
            </TabList>

            <TabPanels>
              {/* Ссылки */}
              <TabPanel
                p={0}
                pt={8}
              >
                {links.length === 0 ? (
                  <Box className="campaign-detail__empty-state">
                    <Box className="campaign-detail__empty-icon">
                      <LinkIcon />
                    </Box>
                    <Text className="campaign-detail__empty-title">
                      Добавьте в кампанию первую ссылку
                    </Text>
                    <Text className="campaign-detail__empty-desc">
                      Добавьте целевой URL посадочной страницы и UTM-метки к
                      нему через конструктор.
                    </Text>
                    <Button
                      bg="var(--primary)"
                      color="white"
                      fontSize="14px"
                      fontWeight={500}
                      borderRadius="8px"
                      px="20px"
                      h="40px"
                      _hover={{ bg: 'var(--btn-hover)' }}
                      _active={{ bg: 'var(--text-link)' }}
                      rightIcon={<ArrowForwardIcon />}
                      onClick={() =>
                        navigate(`/campaigns/${campaign.id}/add-link`)
                      }
                    >
                      Добавить ссылку в кампанию
                    </Button>
                  </Box>
                ) : (
                  <LinksRegistryTable
                    links={links}
                    campaigns={campaign ? [campaign] : undefined}
                    onLinksChange={handleLinksChange}
                    title={null}
                    padding={0}
                    hideCampaignFilter
                    searchPlaceholder="Поиск по названию, URL или тегу"
                    actionButton={
                      <Button
                        bg="var(--primary)"
                        color="white"
                        borderRadius="10px"
                        h="36px"
                        px="16px"
                        fontSize="14px"
                        fontWeight="500"
                        _hover={{ bg: 'var(--text-link)' }}
                        rightIcon={<AddIcon boxSize="11px" />}
                        onClick={() =>
                          navigate(`/campaigns/${campaign?.id}/add-link`)
                        }
                      >
                        Добавить ссылку в кампанию
                      </Button>
                    }
                  />
                )}
              </TabPanel>

              {/* Аналитика */}
              <TabPanel
                p={0}
                pt={8}
              >
                {!hasStats ? (
                  <Box className="campaign-detail__empty-state">
                    <Box className="campaign-detail__empty-icon">
                      <BarChartIcon />
                    </Box>
                    <Text className="campaign-detail__empty-title">
                      Добавьте в кампанию первую ссылку для отслеживания
                      аналитики
                    </Text>
                    <Text className="campaign-detail__empty-desc">
                      Добавьте целевой URL посадочной страницы и UTM-метки к
                      нему через конструктор.
                      <br />
                      Переходы начнут попадать в отчет сразу после первых кликов
                      аудитории.
                    </Text>
                    <Button
                      bg="var(--btn-solid)"
                      color="white"
                      fontSize="14px"
                      fontWeight={500}
                      borderRadius="8px"
                      px="20px"
                      h="40px"
                      _hover={{ bg: 'var(--btn-hover)' }}
                      _active={{ bg: 'var(--btn-hover)' }}
                      rightIcon={<ArrowForwardIcon />}
                      onClick={() =>
                        navigate(`/campaigns/${campaign?.id || id}/add-link`)
                      }
                    >
                      Добавить ссылку в кампанию
                    </Button>
                  </Box>
                ) : (
                  <Box>
                    {/* Period Selector */}
                    <Flex
                      align="center"
                      gap="16px"
                      mb="24px"
                    >
                      <DateRangeSelector onChange={setDays} />

                      <Box flex={1} />
                      <Button
                        variant="outline"
                        borderColor="var(--primary)"
                        color="var(--primary)"
                        fontSize="14px"
                        fontWeight={500}
                        borderRadius="10px"
                        _hover={{ bg: 'var(--slate-50-alt)' }}
                        onClick={() => setIsExportModalOpen(true)}
                      >
                        Экспорт в Excel
                      </Button>
                    </Flex>

                    {/* Stats Cards */}
                    <Flex
                      gap="16px"
                      mb="32px"
                      flexWrap="wrap"
                    >
                      {statCards.map((stat) => (
                        <Box
                          key={stat.label}
                          bg="white"
                          borderRadius="12px"
                          p="20px 24px"
                          flex="1"
                          minW="180px"
                          border="1px solid var(--slate-200)"
                        >
                          <Text
                            fontSize="13px"
                            color="var(--text-placeholder)"
                            mb="6px"
                          >
                            {stat.label}
                          </Text>
                          <Text
                            fontSize="28px"
                            fontWeight={700}
                            color="var(--text)"
                          >
                            {stat.value}
                          </Text>
                          {stat.sub && (
                            <Text
                              fontSize="12px"
                              color="var(--text-placeholder)"
                              mt="2px"
                            >
                              {stat.sub}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </Flex>

                    {/* Daily Chart */}
                    <Box
                      bg="white"
                      borderRadius="12px"
                      p="24px"
                      border="1px solid var(--slate-200)"
                    >
                      <Heading
                        fontSize="18px"
                        fontWeight={700}
                        color="var(--text)"
                        mb="20px"
                        fontFamily="'Inter', sans-serif"
                      >
                        Посуточная динамика переходов
                      </Heading>
                      <ResponsiveContainer
                        width="100%"
                        height={280}
                      >
                        <BarChart
                          data={dailyData}
                          barCategoryGap="30%"
                        >
                          <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="var(--gray-50)"
                            vertical={false}
                          />
                          <XAxis
                            dataKey="date"
                            fontSize={12}
                            tickLine={false}
                            axisLine={{ stroke: 'var(--slate-200)' }}
                          />
                          <YAxis
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            allowDecimals={false}
                          />
                          <RechartsTooltip />
                          <Bar
                            dataKey="value"
                            radius={[4, 4, 0, 0]}
                            maxBarSize={48}
                          >
                            <LabelList
                              dataKey="value"
                              position="top"
                              fontSize={12}
                              fill="var(--primary)"
                              fontWeight={600}
                            />
                            {dailyData.map((entry, index) => (
                              <Cell
                                key={index}
                                fill={
                                  entry.value === 0
                                    ? 'var(--slate-200)'
                                    : 'var(--text-link)'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Box>

                    {/* UTM Sources Table */}
                    <Box mt="32px">
                        <Heading
                          fontSize="18px"
                          fontWeight={700}
                          color="var(--text)"
                          mb="20px"
                          fontFamily="'Inter', sans-serif"
                        >
                          Распределение по UTM-источникам
                        </Heading>
                        <Box overflowX="auto">
                          <Table
                            variant="unstyled"
                            sx={{
                              th: {
                                borderBottom: '1px solid var(--slate-200)',
                                pb: '12px',
                                pt: '0'
                              },
                              td: {
                                borderBottom: '1px solid var(--gray-50)',
                                py: '16px'
                              }
                            }}
                          >
                            <Thead>
                              <Tr>
                                <Th
                                  fontSize="12px"
                                  color="var(--text-secondary)"
                                  fontWeight={600}
                                  textTransform="none"
                                  px="0"
                                  pr="16px"
                                >
                                  Название
                                </Th>
                                <Th
                                  fontSize="12px"
                                  color="var(--text-secondary)"
                                  fontWeight={600}
                                  textTransform="none"
                                  px="16px"
                                >
                                  Короткий URL
                                </Th>
                                <Th
                                  fontSize="12px"
                                  color="var(--text-secondary)"
                                  fontWeight={600}
                                  textTransform="none"
                                  px="16px"
                                >
                                  Целевой URL
                                </Th>
                                <Th
                                  fontSize="12px"
                                  color="var(--text-secondary)"
                                  fontWeight={600}
                                  textTransform="none"
                                  px="16px"
                                >
                                  Канал
                                </Th>
                                <Th
                                  fontSize="12px"
                                  color="var(--text-secondary)"
                                  fontWeight={600}
                                  textTransform="none"
                                  cursor="pointer"
                                  px="16px"
                                >
                                  <Flex
                                    align="center"
                                    gap="4px"
                                  >
                                    Переходы
                                    <SortIndicator dir="desc" />
                                  </Flex>
                                </Th>
                                <Th
                                  fontSize="12px"
                                  color="var(--text-secondary)"
                                  fontWeight={600}
                                  textTransform="none"
                                  cursor="pointer"
                                  px="16px"
                                >
                                  <Flex
                                    align="center"
                                    gap="4px"
                                  >
                                    Уникальные переходы
                                    <SortIndicator dir={null} />
                                  </Flex>
                                </Th>
                                <Th
                                  fontSize="12px"
                                  color="var(--text-secondary)"
                                  fontWeight={600}
                                  textTransform="none"
                                  cursor="pointer"
                                  px="16px"
                                >
                                  <Flex
                                    align="center"
                                    gap="4px"
                                  >
                                    Доля
                                    <SortIndicator dir={null} />
                                  </Flex>
                                </Th>
                              </Tr>
                            </Thead>
                            <Tbody>
                              {utmSources.map((source, idx) => (
                                <Tr
                                  key={idx}
                                  _hover={{ bg: 'var(--bg-secondary)' }}
                                >
                                  <Td
                                    fontSize="13px"
                                    color="var(--text)"
                                    fontWeight={500}
                                    px="0"
                                    pr="16px"
                                  >
                                    {source.name}
                                  </Td>
                                  <Td
                                    fontSize="13px"
                                    color="var(--primary)"
                                    px="16px"
                                  >
                                    {source.shortUrl}
                                  </Td>
                                  <Td
                                    fontSize="13px"
                                    color="var(--text-secondary)"
                                    px="16px"
                                    maxW="240px"
                                  >
                                    <Text noOfLines={1}>
                                      {source.targetUrl}
                                    </Text>
                                  </Td>
                                  <Td
                                    fontSize="13px"
                                    color="var(--text-secondary)"
                                    px="16px"
                                  >
                                    {source.channel}
                                  </Td>
                                  <Td
                                    fontSize="13px"
                                    color="var(--text)"
                                    px="16px"
                                  >
                                    {source.clicks.toLocaleString('ru-RU')}
                                  </Td>
                                  <Td
                                    fontSize="13px"
                                    color="var(--text)"
                                    px="16px"
                                  >
                                    {source.uniqueClicks.toLocaleString(
                                      'ru-RU'
                                    )}
                                  </Td>
                                  <Td px="16px">
                                    <Box
                                      minW="100px"
                                      maxW="150px"
                                    >
                                      <Text
                                        fontSize="13px"
                                        color="var(--text)"
                                        mb="6px"
                                      >
                                        {source.share}%
                                      </Text>
                                      <Box
                                        w="100%"
                                        h="4px"
                                        bg="var(--slate-50-alt)"
                                        borderRadius="2px"
                                        overflow="hidden"
                                      >
                                        <Box
                                          w={`${source.share}%`}
                                          h="100%"
                                          bg="var(--primary)"
                                        />
                                      </Box>
                                    </Box>
                                  </Td>
                                </Tr>
                              ))}
                            </Tbody>
                          </Table>
                        </Box>
                      </Box>
                  </Box>
                )}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Box>
      </Box>

      {isExportModalOpen && (
        <ProgressModal
          title="Экспортируем отчет"
          successMessage="Отчет сформирован\nФайл за выбранный период экспортирован."
          onComplete={() => {
            exportStatsCsv({
              shortUrl: campaign.name,
              targetUrl: campaign.description || '—',
              period: periodLabel,
              statCards,
              byDay: effectiveStats?.byDay ?? []
            });
            setIsExportModalOpen(false);
          }}
          onClose={() => setIsExportModalOpen(false)}
        />
      )}
    </Box>
  );
}
