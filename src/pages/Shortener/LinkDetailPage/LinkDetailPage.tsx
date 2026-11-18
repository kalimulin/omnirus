import { ArrowForwardIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  FormHelperText,
  Heading,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Select,
  SimpleGrid,
  Spinner,
  Tag,
  Text,
  Tooltip,
  useToast,
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  XAxis,
  YAxis,
} from 'recharts';

import {
  buildRedirectUrl,
  createCampaign,
  exportLinkStatistics,
  fetchCampaign,
  fetchCampaigns,
  fetchLink,
  fetchLinkStatistics,
  fetchTags,
  isApiConfigured,
  setLinkStatus,
  updateLink,
} from '@/api/shortener';
import copyIcon from '@/assets/copy.svg';
import qrIcon from '@/assets/qr.svg';
import { StatusBadge } from '@/components/atoms/Badge/StatusBadge';
import { usePageHeaderTitle } from '@/components/layouts/PageHeaderContext';
import DateRangeSelector, {
  type DateRangeValue,
} from '@/components/shortener/DateRangeSelector/DateRangeSelector';
import { getInitialSevenDaysRange } from '@/utils/dateRange';
import { ActivateLinkModal } from '@/components/shortener/ActivateLinkModal/ActivateLinkModal';
import { DeactivateLinkModal } from '@/components/shortener/DeactivateLinkModal/DeactivateLinkModal';
import { EditLinkModal } from '@/components/shortener/EditLinkModal/EditLinkModal';
import ProgressModal from '@/components/shortener/ProgressModal/ProgressModal';
import { QrModal } from '@/components/shortener/QrModal/QrModal';
import { RedirectModal } from '@/components/shortener/RedirectModal/RedirectModal';
import { RedirectPromptModal } from '@/components/shortener/RedirectPromptModal/RedirectPromptModal';
import { ROUTES } from '@/routing/routes';
import type {
  CampaignRow,
  DailyDataPoint,
  LinkRow,
  LinkStatistics,
  StatCard,
} from '@/types/shortener';
import { exportStatsCsv } from '@/utils/exportStatsCsv';
import './LinkDetailPage.scss';

const STATS_REFRESH_INTERVAL_MS = 30_000;

const SHORT_MONTHS_RU = [
  'янв',
  'фев',
  'мар',
  'апр',
  'май',
  'июн',
  'июл',
  'авг',
  'сен',
  'окт',
  'ноя',
  'дек',
];

/** "2026-09-07" → "07.09" */
const formatDay = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (match) return `${match[3]}.${match[2]}`;
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
    });
  }
  return date;
};

/** "2026-09-07" → "07.09.2026" */
const formatDayFull = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(date.trim());
  if (match) return `${match[3]}.${match[2]}.${match[1]}`;
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  }
  return date;
};

/** "2026-09-07" → "7 сен" */
const formatDayShortMonth = (date: string): string => {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
  if (match) {
    const day = Number(match[3]);
    const monthIdx = Number(match[2]) - 1;
    return `${day} ${SHORT_MONTHS_RU[monthIdx] ?? match[2]}`;
  }
  const parsed = new Date(date);
  if (!Number.isNaN(parsed.getTime())) {
    return `${parsed.getDate()} ${SHORT_MONTHS_RU[parsed.getMonth()]}`;
  }
  return date;
};

/** "2026-09-07T00:00:00Z" / "2026-09-07 00:00" → "7 сен 00:00" */
const formatHourLabel = (period: string): string => {
  const trimmed = period.trim();
  const hasTz = /(?:Z|[+-]\d{2}:?\d{2})$/i.test(trimmed);
  if (!hasTz) {
    const match = /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/.exec(trimmed);
    if (match) {
      const day = Number(match[3]);
      const month = SHORT_MONTHS_RU[Number(match[2]) - 1] ?? match[2];
      return `${day} ${month} ${match[4]}:${match[5]}`;
    }
  }
  const parsed = new Date(trimmed);
  if (!Number.isNaN(parsed.getTime())) {
    const day = parsed.getDate();
    const month = SHORT_MONTHS_RU[parsed.getMonth()];
    const hours = String(parsed.getHours()).padStart(2, '0');
    const mins = String(parsed.getMinutes()).padStart(2, '0');
    return `${day} ${month} ${hours}:${mins}`;
  }
  return trimmed;
};

/** ISO 8601 → "07.09.2026" */
const formatDate = (iso?: string): string => {
  if (!iso) return '—';
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return formatDayFull(iso);
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

const formatNumber = (value: number): string => value.toLocaleString('ru-RU');

const triggerBlobDownload = (blob: Blob, filename: string): void => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export default function LinkDetailPage() {
  const toast = useToast();
  const navigate = useNavigate();
  const { id } = useParams();
  const apiConfigured = isApiConfigured();

  const [dateRange, setDateRange] = useState<DateRangeValue>(() =>
    getInitialSevenDaysRange(),
  );

  const [link, setLink] = useState<LinkRow | null>(null);
  const [localLinkOverride, setLocalLinkOverride] = useState<LinkRow | null>(
    null,
  );
  const [stats, setStats] = useState<LinkStatistics | null>(null);
  const [hourlyStats, setHourlyStats] = useState<LinkStatistics | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRow[]>([]);
  const [apiTags, setApiTags] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(Boolean(apiConfigured && id));
  const [isStatsLoading, setIsStatsLoading] = useState(
    Boolean(apiConfigured && id),
  );
  const [loadError, setLoadError] = useState('');
  const [reloadKey, setReloadKey] = useState(0);

  const [copiedField, setCopiedField] = useState<'short' | 'target' | null>(
    null,
  );
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Export modal state
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [exportError, setExportError] = useState<string | undefined>();
  const [exportRetryCount, setExportRetryCount] = useState(0);

  // Actions modals state
  const [redirectLink, setRedirectLink] = useState<LinkRow | null>(null);
  const [redirectNewUrl, setRedirectNewUrl] = useState('');
  const [isRedirectLoading, setIsRedirectLoading] = useState(false);
  const [isRedirectPromptOpen, setIsRedirectPromptOpen] = useState(false);
  const [dontShowPromptAgain, setDontShowPromptAgain] = useState(false);
  const redirectAttemptRef = useRef(0);

  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [activateConfirmLink, setActivateConfirmLink] =
    useState<LinkRow | null>(null);
  const [isActivating, setIsActivating] = useState(false);

  const [deactivateConfirmLink, setDeactivateConfirmLink] =
    useState<LinkRow | null>(null);
  const [deactivateProgressLink, setDeactivateProgressLink] =
    useState<LinkRow | null>(null);
  const [deactivateReserveUrl, setDeactivateReserveUrl] = useState<
    string | undefined
  >();
  const [deactivateError, setDeactivateError] = useState<string | undefined>();
  const [deactivateRetryCount, setDeactivateRetryCount] = useState(0);
  const deactivateAttemptRef = useRef(0);
  const isTogglingStatusRef = useRef(false);

  // Загрузка карточки ссылки + кампаний/тегов с автообновлением каждые 30 секунд
  useEffect(() => {
    if (!apiConfigured || !id) return;
    let cancelled = false;

    const load = async (isInitial = false) => {
      if (isInitial) {
        setIsLoading(true);
        setLoadError('');
      }
      try {
        const [data, apiCampaigns, tags] = await Promise.all([
          fetchLink(id),
          fetchCampaigns().catch(() => [] as CampaignRow[]),
          fetchTags().catch(() => []),
        ]);

        let resolved = data;
        if (
          data.campaignId &&
          (!data.campaign || data.campaign === 'Без кампании')
        ) {
          const matched = apiCampaigns.find((c) => c.id === data.campaignId);
          if (matched?.name) {
            resolved = { ...data, campaign: matched.name };
          } else {
            const camp = await fetchCampaign(data.campaignId).catch(() => null);
            if (camp?.name) {
              resolved = { ...data, campaign: camp.name };
            }
          }
        }

        if (!cancelled) {
          setLink(resolved);
          setCampaigns(apiCampaigns);
          setApiTags(tags.map((t) => t.name));
        }
      } catch (err) {
        if (!cancelled && isInitial) {
          setLoadError((err as Error).message);
        }
      } finally {
        if (!cancelled && isInitial) {
          setIsLoading(false);
        }
      }
    };

    load(true);

    const intervalId = window.setInterval(() => {
      load(false);
    }, STATS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [apiConfigured, id, reloadKey]);

  // Загрузка дневной и почасовой статистики за выбранный период с автообновлением каждые 30 секунд
  useEffect(() => {
    if (!apiConfigured || !id) return;
    let cancelled = false;

    const loadStats = async (isInitial = false) => {
      if (isInitial) {
        setIsStatsLoading(true);
      }
      const queryParams =
        dateRange.dateFrom && dateRange.dateTo
          ? { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo }
          : { days: dateRange.days };

      const [dailyRes, hourlyRes] = await Promise.allSettled([
        fetchLinkStatistics(id, { ...queryParams, granularity: 'day' }),
        fetchLinkStatistics(id, { ...queryParams, granularity: 'hour' }),
      ]);

      if (cancelled) return;

      if (dailyRes.status === 'fulfilled') {
        setStats(dailyRes.value);
      } else if (isInitial) {
        toast({
          title: 'Не удалось загрузить статистику',
          description:
            dailyRes.reason instanceof Error
              ? dailyRes.reason.message
              : undefined,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
      }

      if (hourlyRes.status === 'fulfilled') {
        setHourlyStats(hourlyRes.value);
      } else if (isInitial) {
        setHourlyStats(null);
      }

      if (isInitial) {
        setIsStatsLoading(false);
      }
    };

    loadStats(true);

    const intervalId = window.setInterval(() => {
      loadStats(false);
    }, STATS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [apiConfigured, id, dateRange, reloadKey, toast]);

  useEffect(() => {
    return () => {
      clearTimeout(copyTimerRef.current);
    };
  }, []);

  const effectiveLink = apiConfigured ? link : localLinkOverride;
  usePageHeaderTitle(effectiveLink?.name);
  const effectiveStats = apiConfigured ? stats : null;
  const effectiveHourlyStats = apiConfigured ? hourlyStats : null;

  const hasStats =
    (effectiveStats?.total ?? 0) > 0 ||
    (effectiveStats?.byDay.length ?? 0) > 0;

  const allCampaigns = useMemo(
    () => [
      'Без кампании',
      ...Array.from(
        new Set([
          ...campaigns.map((c) => c.name),
          ...(effectiveLink?.campaign ? [effectiveLink.campaign] : []),
        ]),
      ).filter((name) => Boolean(name) && name !== 'Без кампании'),
    ],
    [campaigns, effectiveLink],
  );

  const allTags = useMemo(
    () =>
      Array.from(
        new Set([
          ...apiTags,
          ...campaigns.flatMap((c) => c.tags),
          ...(effectiveLink?.tags ?? []),
        ]),
      ).sort(),
    [apiTags, campaigns, effectiveLink],
  );

  const redirectUrl = effectiveLink
    ? buildRedirectUrl(
        effectiveLink.shortcut ||
          effectiveLink.shortUrl.split('/').pop() ||
          effectiveLink.id,
      )
    : '';

  const applyLinkUpdate = useCallback(
    (updater: (prev: LinkRow) => LinkRow) => {
      if (apiConfigured) {
        setLink((prev) => (prev ? updater(prev) : prev));
        return;
      }
      setLocalLinkOverride((prev) => (prev ? updater(prev) : prev));
    },
    [apiConfigured],
  );

  const copyText = (
    text: string,
    message: string,
    field: 'short' | 'target',
  ) => {
    const markCopied = () => {
      setCopiedField(field);
      toast({
        title: message,
        status: 'success',
        duration: 4000,
        isClosable: true,
      });
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedField(null), 2000);
    };

    navigator.clipboard
      .writeText(text)
      .then(markCopied)
      .catch(() =>
        toast({
          title: 'Не удалось скопировать',
          status: 'error',
          duration: 4000,
          isClosable: true,
        }),
      );
  };

  // --- Link actions ---
  const showChangesSavedToast = useCallback(() => {
    toast({
      title: 'Изменения успешно сохранены.',
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
  }, [toast]);

  const handleOpenRedirect = (targetLink: LinkRow) => {
    redirectAttemptRef.current += 1;
    setRedirectLink(targetLink);
    setRedirectNewUrl(targetLink.targetUrl);
  };

  const handleCancelRedirect = () => {
    redirectAttemptRef.current += 1;
    setRedirectLink(null);
    setIsRedirectLoading(false);
  };

  const handleSaveRedirect = (newUrl: string) => {
    if (!redirectLink) return;
    setRedirectNewUrl(newUrl);
    setIsRedirectLoading(true);
  };

  const performRedirectSave = useCallback(async () => {
    if (!redirectLink) return;
    const attemptId = redirectAttemptRef.current;
    const savedLinkId = redirectLink.id;
    const trimmed = redirectNewUrl.trim();
    const finalUrl = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    if (apiConfigured) {
      try {
        await updateLink(savedLinkId, { target: finalUrl });
      } catch (err) {
        if (redirectAttemptRef.current !== attemptId) return;
        setIsRedirectLoading(false);
        toast({
          title: 'Не удалось сохранить целевой URL',
          description: (err as Error).message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      if (redirectAttemptRef.current !== attemptId) return;
    }

    const modifiedNow = new Date().toISOString();
    applyLinkUpdate((prev) => ({
      ...prev,
      targetUrl: finalUrl,
      modifiedAt: modifiedNow,
    }));

    setIsRedirectLoading(false);
    if (dontShowPromptAgain) {
      showChangesSavedToast();
      setRedirectLink(null);
      return;
    }
    setIsRedirectPromptOpen(true);
  }, [
    apiConfigured,
    applyLinkUpdate,
    dontShowPromptAgain,
    redirectLink,
    redirectNewUrl,
    showChangesSavedToast,
    toast,
  ]);

  const handleCloseRedirectPrompt = () => {
    showChangesSavedToast();
    setIsRedirectPromptOpen(false);
    setRedirectLink(null);
  };

  const handleEditFromPrompt = () => {
    setIsRedirectPromptOpen(false);
    setRedirectLink(null);
    setIsEditModalOpen(true);
  };

  const handleOpenCampaign = (targetLink: LinkRow) => {
    setSelectedCampaign(targetLink.campaign || 'Без кампании');
    setIsCampaignModalOpen(true);
  };

  const handleSaveCampaign = async () => {
    if (!effectiveLink) return;
    const targetCampaign = selectedCampaign || 'Без кампании';

    let resolvedCampaignId: string | null = null;

    if (apiConfigured) {
      try {
        if (targetCampaign !== 'Без кампании') {
          resolvedCampaignId =
            campaigns.find((c) => c.name === targetCampaign)?.id ?? null;
          if (!resolvedCampaignId) {
            const created = await createCampaign({ name: targetCampaign });
            resolvedCampaignId = created.id;
            setCampaigns((prev) => [...prev, created]);
          }
        }
        await updateLink(effectiveLink.id, { campaign_id: resolvedCampaignId });
      } catch (err) {
        toast({
          title: 'Не удалось сохранить кампанию',
          description: (err as Error).message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }
    } else {
      resolvedCampaignId =
        targetCampaign === 'Без кампании'
          ? null
          : (campaigns.find((c) => c.name === targetCampaign)?.id ?? null);

      if (
        targetCampaign !== 'Без кампании' &&
        !campaigns.some((c) => c.name === targetCampaign)
      ) {
        const createdCampaign: CampaignRow = {
          id: String(Date.now()),
          name: targetCampaign,
          description: '',
          linksCount: 1,
          shortLinksCount: 1,
          totalClicks: 0,
          createdAt: new Date().toISOString(),
          tags: [],
        };
        setCampaigns((prev) => [createdCampaign, ...prev]);
        resolvedCampaignId = createdCampaign.id;
      }
    }

    const modifiedNow = new Date().toISOString();
    applyLinkUpdate((prev) => ({
      ...prev,
      campaign: targetCampaign,
      campaignId: resolvedCampaignId,
      modifiedAt: modifiedNow,
    }));

    showChangesSavedToast();
    setIsCampaignModalOpen(false);
  };

  const handleToggleStatus = async (targetLink: LinkRow) => {
    if (targetLink.status === 'заблокирована') {
      toast({
        title: 'Заблокированная ссылка не может быть изменена',
        status: 'error',
        duration: 4000,
        isClosable: true,
      });
      return;
    }

    const isInactive = targetLink.status === 'неактивна';
    if (!isInactive) {
      setDeactivateConfirmLink(targetLink);
      return;
    }

    setActivateConfirmLink(targetLink);
  };

  const handleConfirmActivate = async () => {
    if (!activateConfirmLink) return;
    const targetLink = activateConfirmLink;

    if (isTogglingStatusRef.current) return;

    setIsActivating(true);

    if (apiConfigured) {
      isTogglingStatusRef.current = true;
      try {
        await setLinkStatus(targetLink.id, 'активна');
      } catch (err) {
        toast({
          title: 'Не удалось изменить статус',
          description: (err as Error).message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        setIsActivating(false);
        return;
      } finally {
        isTogglingStatusRef.current = false;
      }
    }

    const modifiedNow = new Date().toISOString();
    applyLinkUpdate((prev) => ({
      ...prev,
      status: 'активна',
      modifiedAt: modifiedNow,
    }));
    setIsActivating(false);
    setActivateConfirmLink(null);
    showChangesSavedToast();
  };

  const handleConfirmDeactivate = (reserveUrl?: string) => {
    if (!deactivateConfirmLink) return;
    deactivateAttemptRef.current += 1;
    setDeactivateError(undefined);
    setDeactivateRetryCount(0);
    setDeactivateReserveUrl(reserveUrl);
    setDeactivateProgressLink(deactivateConfirmLink);
    setDeactivateConfirmLink(null);
  };

  const handleCancelDeactivate = () => {
    deactivateAttemptRef.current += 1;
    setDeactivateProgressLink(null);
    setDeactivateReserveUrl(undefined);
    setDeactivateError(undefined);
  };

  const handleRetryDeactivate = () => {
    deactivateAttemptRef.current += 1;
    setDeactivateError(undefined);
    setDeactivateRetryCount((c) => c + 1);
  };

  const performDeactivate = useCallback(async () => {
    if (!deactivateProgressLink) return;
    const attemptId = deactivateAttemptRef.current;
    const targetId = deactivateProgressLink.id;
    const reserveUrl = deactivateReserveUrl;
    const shortUrlDisplay = deactivateProgressLink.shortUrl.replace(
      /^https?:\/\//i,
      '',
    );

    if (apiConfigured) {
      try {
        if (reserveUrl) {
          await updateLink(targetId, {
            status: 'inactive',
            target: reserveUrl,
          });
        } else {
          await setLinkStatus(targetId, 'неактивна');
        }
      } catch (err) {
        if (deactivateAttemptRef.current !== attemptId) return;
        const message =
          err instanceof Error
            ? err.message
            : 'Не удалось деактивировать ссылку';
        setDeactivateError(message);
        toast({
          title: 'Не удалось изменить статус',
          description: message,
          status: 'error',
          duration: 4000,
          isClosable: true,
        });
        return;
      }
      if (deactivateAttemptRef.current !== attemptId) return;
    }

    const modifiedNow = new Date().toISOString();
    applyLinkUpdate((prev) => ({
      ...prev,
      status: 'неактивна',
      modifiedAt: modifiedNow,
      ...(reserveUrl ? { targetUrl: reserveUrl } : {}),
    }));

    setDeactivateProgressLink(null);
    setDeactivateReserveUrl(undefined);
    setDeactivateError(undefined);
    toast({
      title: 'Ссылка деактивирована',
      description: reserveUrl
        ? `${shortUrlDisplay} временно не работает — переходы перенаправлены на ${reserveUrl}`
        : `${shortUrlDisplay} временно не работает — переходы отдают страницу 404`,
      status: 'success',
      duration: 4000,
      isClosable: true,
    });
  }, [
    apiConfigured,
    applyLinkUpdate,
    deactivateProgressLink,
    deactivateReserveUrl,
    toast,
  ]);

  // --- Stats data transformation ---
  const dailyData = useMemo(
    () =>
      effectiveStats?.byDay.map((point) => ({
        date: formatDay(point.date),
        value: point.value,
      })) ?? [],
    [effectiveStats],
  );

  const hourlyData = useMemo(() => {
    const source = effectiveHourlyStats?.series ?? [];
    return source.map((point) => ({
      label: formatHourLabel(point.period),
      value: point.clicks,
    }));
  }, [effectiveHourlyStats]);

  const statCards: StatCard[] = useMemo(() => {
    if (!effectiveStats) return [];
    const peak = effectiveStats.byDay.reduce<DailyDataPoint | null>(
      (best, point) => (!best || point.value > best.value ? point : best),
      null,
    );

    return [
      { label: 'Всего переходов', value: formatNumber(effectiveStats.total) },
      {
        label: 'Уникальных переходов',
        value: formatNumber(effectiveStats.unique),
      },
      {
        label: 'В среднем за день',
        value: formatNumber(
          effectiveStats.byDay.length
            ? Math.round(effectiveStats.total / effectiveStats.byDay.length)
            : 0,
        ),
      },
      peak
        ? {
            label: 'Пик',
            value: formatNumber(peak.value),
            sub: formatDayShortMonth(peak.date),
          }
        : { label: 'Пик', value: '0' },
    ];
  }, [effectiveStats]);

  const periodLabel = effectiveStats?.byDay.length
    ? `${formatDayFull(effectiveStats.byDay[0].date)} — ${formatDayFull(
        effectiveStats.byDay[effectiveStats.byDay.length - 1].date,
      )}`
    : `${dateRange.startDate} — ${dateRange.endDate}`;

  const handleStartExport = () => {
    setExportError(undefined);
    setExportRetryCount(0);
    setIsExportModalOpen(true);
  };

  const handleCompleteExport = async () => {
    if (apiConfigured && id) {
      try {
        const { blob, filename } = await exportLinkStatistics(id, {
          ...(dateRange.dateFrom && dateRange.dateTo
            ? { dateFrom: dateRange.dateFrom, dateTo: dateRange.dateTo }
            : { days: dateRange.days }),
          granularity: 'day',
          format: 'csv',
        });
        triggerBlobDownload(blob, filename);
        setIsExportModalOpen(false);
        return;
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : 'Не удалось экспортировать отчёт';
        setExportError(message);
        return;
      }
    }

    exportStatsCsv({
      shortUrl: effectiveLink?.shortUrl || '',
      targetUrl: effectiveLink?.targetUrl || '',
      period: periodLabel,
      statCards,
      byDay: effectiveStats?.byDay ?? [],
    });
    setIsExportModalOpen(false);
  };

  return (
    <Box className="link-detail-page" p={{ base: '20px', md: '24px 28px' }}>
      <Box
        bg="white"
        borderRadius="16px"
        border="1px solid var(--slate-200)"
        boxShadow="0px 1px 4px rgba(29, 79, 145, 0.05)"
        p={{ base: '20px', md: '28px' }}
      >
        {apiConfigured && isLoading && (
          <Box py="80px" px="20px" textAlign="center">
            <Spinner color="var(--primary)" size="lg" />
          </Box>
        )}

        {apiConfigured && !isLoading && loadError && (
          <Box py="72px" px="20px" textAlign="center">
            <Text fontSize="18px" fontWeight={700} color="var(--text)" mb="8px">
              Не удалось загрузить ссылку
            </Text>
            <Text fontSize="14px" color="var(--text-secondary)" mb="24px">
              {loadError}
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
              onClick={() => setReloadKey((k) => k + 1)}
            >
              Повторить
            </Button>
          </Box>
        )}

        {(!apiConfigured || (!isLoading && !loadError)) && !effectiveLink && (
          <Box py="72px" px="20px" textAlign="center">
            <Text fontSize="18px" fontWeight={700} color="var(--text)" mb="8px">
              Ссылка не найдена
            </Text>
            <Text fontSize="14px" color="var(--text-secondary)" mb="24px">
              Запрошенная ссылка не найдена среди сохранённых ссылок.
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
              onClick={() => navigate(ROUTES.links)}
            >
              Перейти к списку ссылок
            </Button>
          </Box>
        )}

        {/* Link Info Card */}
        {(!apiConfigured || (!isLoading && !loadError)) && effectiveLink && (
          <Box
            bg="white"
            borderRadius="12px"
            border="1px solid var(--slate-200)"
            p="24px 28px"
            mb="24px"
          >
            <Flex justify="space-between" align="flex-start" mb="20px">
              <Box>
                <StatusBadge status={effectiveLink.status} />
                {effectiveLink.status === 'заблокирована' &&
                  effectiveLink.blockReason && (
                    <Text
                      fontSize="13px"
                      color="var(--error)"
                      mt="8px"
                      maxW="480px"
                    >
                      Причина: {effectiveLink.blockReason}
                    </Text>
                  )}
              </Box>

              <HStack spacing="4px">
                <Tooltip
                  label="Показать QR-код"
                  bg="var(--slate-800)"
                  color="white"
                  fontSize="12px"
                  borderRadius="8px"
                  placement="top"
                  hasArrow
                >
                  <IconButton
                    aria-label="QR"
                    icon={
                      <img
                        src={qrIcon}
                        alt="qr"
                        className="link-detail-page__action-icon"
                      />
                    }
                    variant="ghost"
                    size="sm"
                    color="var(--text-placeholder)"
                    _hover={{
                      color: 'var(--primary)',
                      bg: 'var(--slate-50-alt)',
                    }}
                    onClick={() => setIsQrModalOpen(true)}
                  />
                </Tooltip>

                <Menu isLazy placement="bottom-end">
                  <MenuButton
                    as={IconButton}
                    aria-label="Действия со ссылкой"
                    icon={
                      <Text
                        fontSize="18px"
                        lineHeight="1"
                        color="var(--text-placeholder)"
                      >
                        ⋯
                      </Text>
                    }
                    variant="ghost"
                    size="sm"
                    _hover={{
                      color: 'var(--primary)',
                      bg: 'var(--slate-50-alt)',
                    }}
                  />
                  <Portal>
                    <MenuList
                      bg="white"
                      border="1px solid"
                      borderColor="brand.60"
                      borderRadius="12px"
                      boxShadow="0 4px 20px rgba(18, 35, 63, 0.08)"
                      p="8px"
                      minW="275px"
                      zIndex={1000}
                    >
                      <Box px="12px" pt="6px" pb="12px">
                        <Text
                          fontSize="15px"
                          fontWeight="600"
                          color="brand.450"
                        >
                          Действия со ссылкой
                        </Text>
                      </Box>

                      <MenuItem
                        borderRadius="8px"
                        h="44px"
                        px="12px"
                        color="brand.800"
                        fontSize="14px"
                        fontWeight="500"
                        bg="transparent"
                        _hover={{ bg: 'var(--primary-bg)' }}
                        _focus={{ bg: 'var(--primary-bg)' }}
                        onClick={() => handleOpenRedirect(effectiveLink)}
                      >
                        <Flex
                          mr="12px"
                          align="center"
                          justify="center"
                          color="brand.800"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="15 6 20 11 15 16" />
                            <path d="M4 19v-4a4 4 0 0 1 4-4h12" />
                          </svg>
                        </Flex>
                        <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="brand.800"
                        >
                          Перенаправить на другой URL
                        </Text>
                      </MenuItem>

                      <MenuItem
                        borderRadius="8px"
                        h="44px"
                        px="12px"
                        color="brand.800"
                        fontSize="14px"
                        fontWeight="500"
                        bg="transparent"
                        _hover={{ bg: 'var(--primary-bg)' }}
                        _focus={{ bg: 'var(--primary-bg)' }}
                        onClick={() => handleOpenCampaign(effectiveLink)}
                      >
                        <Flex
                          mr="12px"
                          align="center"
                          justify="center"
                          color="brand.800"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                          </svg>
                        </Flex>
                        <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="brand.800"
                        >
                          Добавить в кампанию
                        </Text>
                      </MenuItem>

                      <MenuItem
                        borderRadius="8px"
                        h="44px"
                        px="12px"
                        color="brand.800"
                        fontSize="14px"
                        fontWeight="500"
                        bg="transparent"
                        _hover={{ bg: 'var(--primary-bg)' }}
                        _focus={{ bg: 'var(--primary-bg)' }}
                        onClick={() => setIsEditModalOpen(true)}
                      >
                        <Flex
                          mr="12px"
                          align="center"
                          justify="center"
                          color="brand.800"
                        >
                          <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="1.75"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                            <line x1="9" y1="21" x2="15" y2="21" />
                          </svg>
                        </Flex>
                        <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="brand.800"
                        >
                          Редактировать информацию
                        </Text>
                      </MenuItem>

                      <MenuItem
                        borderRadius="8px"
                        h="44px"
                        px="12px"
                        color="brand.800"
                        fontSize="14px"
                        fontWeight="500"
                        bg="transparent"
                        _hover={{ bg: 'var(--primary-bg)' }}
                        _focus={{ bg: 'var(--primary-bg)' }}
                        onClick={() => handleToggleStatus(effectiveLink)}
                      >
                        <Flex
                          mr="12px"
                          align="center"
                          justify="center"
                          color="brand.800"
                        >
                          {effectiveLink.status === 'неактивна' ? (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <polygon points="5 3 19 12 5 21" />
                            </svg>
                          ) : (
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.75"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <rect
                                x="6"
                                y="5"
                                width="4"
                                height="14"
                                rx="1.5"
                              />
                              <rect
                                x="14"
                                y="5"
                                width="4"
                                height="14"
                                rx="1.5"
                              />
                            </svg>
                          )}
                        </Flex>
                        <Text
                          fontSize="14px"
                          fontWeight="500"
                          color="brand.800"
                        >
                          {effectiveLink.status === 'неактивна'
                            ? 'Активировать'
                            : 'Деактивировать'}
                        </Text>
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              </HStack>
            </Flex>

            <Flex gap="40px" mb="16px" flexWrap="wrap">
              <Box>
                <Text fontSize="12px" color="var(--text-secondary)" mb="4px">
                  Короткая ссылка
                </Text>
                <HStack spacing="6px">
                  <Text
                    fontSize="14px"
                    color="var(--primary)"
                    fontWeight={600}
                  >
                    {effectiveLink.shortUrl}
                  </Text>
                  <Tooltip
                    label={
                      copiedField === 'short'
                        ? 'Скопировано!'
                        : 'Копировать ссылку'
                    }
                    bg="var(--slate-800)"
                    color="white"
                    fontSize="12px"
                    borderRadius="8px"
                    hasArrow
                    placement="top"
                  >
                    <IconButton
                      aria-label="Copy short"
                      icon={
                        copiedField === 'short' ? (
                          <svg
                            className="link-detail-page__action-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <img
                            src={copyIcon}
                            alt="copy"
                            className="link-detail-page__action-icon"
                          />
                        )
                      }
                      variant="ghost"
                      size="xs"
                      color={
                        copiedField === 'short'
                          ? 'var(--secondary)'
                          : 'var(--text-placeholder)'
                      }
                      _hover={{ color: 'var(--primary)' }}
                      onClick={() =>
                        copyText(
                          redirectUrl,
                          'Ссылка скопирована в буфер обмена',
                          'short',
                        )
                      }
                    />
                  </Tooltip>
                </HStack>
              </Box>

              <Box>
                <Text fontSize="12px" color="var(--text-secondary)" mb="4px">
                  Целевой URL
                </Text>
                <HStack spacing="6px">
                  <Text
                    fontSize="14px"
                    color="var(--text)"
                    noOfLines={1}
                    maxW="560px"
                  >
                    {effectiveLink.targetUrl}
                  </Text>
                  <Tooltip
                    label={
                      copiedField === 'target'
                        ? 'Скопировано!'
                        : 'Копировать целевой URL'
                    }
                    bg="var(--slate-800)"
                    color="white"
                    fontSize="12px"
                    borderRadius="8px"
                    hasArrow
                    placement="top"
                  >
                    <IconButton
                      aria-label="Copy target"
                      icon={
                        copiedField === 'target' ? (
                          <svg
                            className="link-detail-page__action-icon"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        ) : (
                          <img
                            src={copyIcon}
                            alt="copy"
                            className="link-detail-page__action-icon"
                          />
                        )
                      }
                      variant="ghost"
                      size="xs"
                      color={
                        copiedField === 'target'
                          ? 'var(--secondary)'
                          : 'var(--text-placeholder)'
                      }
                      _hover={{ color: 'var(--primary)' }}
                      onClick={() =>
                        copyText(
                          effectiveLink.targetUrl,
                          'Целевой URL скопирован',
                          'target',
                        )
                      }
                    />
                  </Tooltip>
                </HStack>
              </Box>
            </Flex>

            <Box mb="16px">
              <Text fontSize="12px" color="var(--text-secondary)" mb="4px">
                Описание
              </Text>
              <Text fontSize="14px" color="var(--text)">
                {effectiveLink.description || '—'}
              </Text>
            </Box>

            <Box mb="16px">
              <Text fontSize="12px" color="var(--text-secondary)" mb="6px">
                Теги
              </Text>
              {effectiveLink.tags.length > 0 ? (
                <HStack spacing="6px" flexWrap="wrap">
                  {effectiveLink.tags.map((tag, i) => (
                    <Tag
                      key={`${tag}-${i}`}
                      size="sm"
                      bg="var(--primary-50)"
                      color="var(--primary)"
                      borderRadius="full"
                      px="10px"
                      py="2px"
                      fontSize="12px"
                      fontWeight={500}
                    >
                      {tag}
                    </Tag>
                  ))}
                </HStack>
              ) : (
                <Text fontSize="14px" color="var(--text-placeholder)">
                  —
                </Text>
              )}
            </Box>

            <Box mb="16px">
              <Text fontSize="12px" color="var(--text-secondary)" mb="4px">
                Кампания
              </Text>
              {effectiveLink.campaignId ? (
                <Text
                  as="button"
                  type="button"
                  fontSize="14px"
                  color="var(--primary)"
                  fontWeight={500}
                  _hover={{ textDecoration: 'underline' }}
                  onClick={() =>
                    navigate(`${ROUTES.campaigns}/${effectiveLink.campaignId}`)
                  }
                >
                  {effectiveLink.campaign || 'Без кампании'}
                </Text>
              ) : (
                <Text fontSize="14px" color="var(--primary)" fontWeight={500}>
                  {effectiveLink.campaign || 'Без кампании'}
                </Text>
              )}
            </Box>

            <Flex gap="40px" flexWrap="wrap">
              <Box>
                <Text fontSize="12px" color="var(--text-secondary)" mb="4px">
                  Создана
                </Text>
                <Text fontSize="14px" color="var(--text)">
                  {formatDate(effectiveLink.createdAt)}
                </Text>
              </Box>
              <Box>
                <Text fontSize="12px" color="var(--text-secondary)" mb="4px">
                  Изменена
                </Text>
                <Text fontSize="14px" color="var(--text)">
                  {effectiveLink.modifiedAt &&
                  effectiveLink.modifiedAt !== effectiveLink.createdAt
                    ? formatDate(effectiveLink.modifiedAt)
                    : '—'}
                </Text>
              </Box>
            </Flex>
          </Box>
        )}

        {/* Statistics Section */}
        {(!apiConfigured || (!isLoading && !loadError)) && effectiveLink && (
          <Box>
            {/* Period Selector & Export */}
            <Flex align="center" gap="16px" mb="24px" flexWrap="wrap">
              <DateRangeSelector onRangeChange={setDateRange} />
              <Box flex={1} />
              <Button
                bg="var(--primary)"
                color="white"
                fontSize="14px"
                fontWeight={500}
                borderRadius="10px"
                h="40px"
                px="20px"
                _hover={{ bg: 'var(--btn-hover)' }}
                _active={{ bg: 'var(--text-link)' }}
                onClick={handleStartExport}
              >
                Экспорт в Excel
              </Button>
            </Flex>

            {apiConfigured && isStatsLoading && !effectiveStats ? (
              <Box
                bg="var(--primary-bg)"
                borderRadius="12px"
                border="1px solid var(--slate-200)"
                p="64px 40px"
                textAlign="center"
              >
                <Spinner color="var(--primary)" size="lg" />
              </Box>
            ) : hasStats && statCards.length > 0 ? (
              <>
                {/* Stats Cards */}
                <SimpleGrid
                  columns={{ base: 1, sm: 2, lg: 4 }}
                  gap="16px"
                  mb="32px"
                >
                  {statCards.map((stat) => (
                    <Box
                      key={stat.label}
                      bg="var(--primary-bg)"
                      borderRadius="12px"
                      p="20px 24px"
                      border="1px solid var(--slate-200)"
                    >
                      <Text
                        fontSize="13px"
                        color="var(--text-secondary)"
                        mb="6px"
                      >
                        {stat.label}
                      </Text>
                      <Text
                        fontSize="28px"
                        fontWeight={700}
                        color="var(--text)"
                        lineHeight="1.2"
                      >
                        {stat.value}
                      </Text>
                      {stat.sub && (
                        <Text
                          fontSize="12px"
                          color="var(--text-secondary)"
                          mt="4px"
                        >
                          {stat.sub}
                        </Text>
                      )}
                    </Box>
                  ))}
                </SimpleGrid>

                {/* Daily Chart */}
                <Box mb="32px">
                  <Heading
                    fontSize="18px"
                    fontWeight={700}
                    color="var(--text)"
                    mb="20px"
                    fontFamily="var(--font-family)"
                  >
                    Посуточная динамика переходов
                  </Heading>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={dailyData}
                      barCategoryGap="30%"
                      margin={{ top: 24, right: 8, left: -12, bottom: 0 }}
                    >
                      <CartesianGrid
                        stroke="var(--slate-200)"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        fontSize={12}
                        tickLine={false}
                        axisLine={{
                          stroke: 'var(--slate-500)',
                          strokeWidth: 2,
                        }}
                        tick={{ fill: 'var(--text-secondary)' }}
                        dy={8}
                      />
                      <YAxis
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                        allowDecimals={false}
                        tick={{ fill: 'var(--text-secondary)' }}
                      />
                      <RechartsTooltip
                        formatter={(value) => [
                          formatNumber(Number(value ?? 0)),
                          'Переходы',
                        ]}
                      />
                      <Bar
                        dataKey="value"
                        name="Переходы"
                        radius={[6, 6, 0, 0]}
                        maxBarSize={48}
                        minPointSize={4}
                      >
                        <LabelList
                          dataKey="value"
                          position="top"
                          fontSize={12}
                          fill="var(--text-secondary)"
                          fontWeight={500}
                          offset={8}
                        />
                        {dailyData.map((entry, index) => (
                          <Cell
                            key={index}
                            fill={
                              entry.value === 0
                                ? 'var(--slate-400)'
                                : 'var(--primary)'
                            }
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </Box>

                {/* Hourly Chart */}
                <Box>
                  <Heading
                    fontSize="18px"
                    fontWeight={700}
                    color="var(--text)"
                    mb="20px"
                    fontFamily="var(--font-family)"
                  >
                    Почасовая динамика переходов
                  </Heading>
                  {hourlyData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={260}>
                      <LineChart
                        data={hourlyData}
                        margin={{ top: 16, right: 16, left: -12, bottom: 0 }}
                      >
                        <CartesianGrid
                          stroke="var(--slate-200)"
                          vertical={false}
                        />
                        <XAxis
                          dataKey="label"
                          fontSize={12}
                          tickLine={false}
                          axisLine={{
                            stroke: 'var(--slate-500)',
                            strokeWidth: 2,
                          }}
                          tick={{ fill: 'var(--text-secondary)' }}
                          minTickGap={48}
                          dy={8}
                        />
                        <YAxis
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          allowDecimals={false}
                          tick={{ fill: 'var(--text-secondary)' }}
                        />
                        <RechartsTooltip
                          formatter={(value) => [
                            formatNumber(Number(value ?? 0)),
                            'Переходы',
                          ]}
                        />
                        <Line
                          type="linear"
                          dataKey="value"
                          name="Переходы"
                          stroke="var(--secondary)"
                          strokeWidth={2}
                          dot={false}
                          activeDot={{ r: 5, fill: 'var(--secondary)' }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <Text fontSize="14px" color="var(--text-secondary)">
                      Почасовые данные за выбранный период отсутствуют.
                    </Text>
                  )}
                </Box>
              </>
            ) : (
              <Box
                bg="var(--primary-bg)"
                borderRadius="12px"
                border="1px solid var(--slate-200)"
                p="72px 40px"
                textAlign="center"
              >
                <Flex justify="center" mb="20px">
                  <Flex
                    w="56px"
                    h="56px"
                    borderRadius="full"
                    bg="var(--primary-50)"
                    align="center"
                    justify="center"
                  >
                    <Text fontSize="24px">📊</Text>
                  </Flex>
                </Flex>
                <Text
                  fontSize="18px"
                  fontWeight={700}
                  color="var(--text)"
                  mb="8px"
                >
                  Переходов пока нет
                </Text>
                <Text fontSize="14px" color="var(--text-secondary)">
                  Статистика переходов появится здесь после первых кликов
                  аудитории.
                </Text>
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* Export Modal */}
      {isExportModalOpen && (
        <ProgressModal
          key={`export-${exportRetryCount}`}
          title="Экспортируем отчет"
          successMessage={
            exportError
              ? undefined
              : 'Отчет сформирован\nФайл за выбранный период экспортирован.'
          }
          error={exportError}
          onRetry={() => {
            setExportError(undefined);
            setExportRetryCount((c) => c + 1);
          }}
          onComplete={handleCompleteExport}
          onClose={() => {
            setIsExportModalOpen(false);
            setExportError(undefined);
          }}
        />
      )}

      {/* QR Modal */}
      {isQrModalOpen && effectiveLink && (
        <QrModal
          shortUrl={effectiveLink.shortUrl}
          shortcut={
            effectiveLink.shortcut ||
            effectiveLink.shortUrl.split('/').pop() ||
            effectiveLink.id
          }
          onClose={() => setIsQrModalOpen(false)}
        />
      )}

      {/* Redirect Modal */}
      {redirectLink && !isRedirectLoading && !isRedirectPromptOpen && (
        <RedirectModal
          isOpen={Boolean(redirectLink)}
          onClose={handleCancelRedirect}
          shortUrl={redirectLink.shortUrl}
          initialTargetUrl={redirectNewUrl}
          onSave={handleSaveRedirect}
        />
      )}

      {isRedirectLoading && (
        <ProgressModal
          title="Меняем целевой URL"
          duration={2000}
          onClose={() => setIsRedirectLoading(false)}
          onCancel={handleCancelRedirect}
          onComplete={performRedirectSave}
        />
      )}

      {isRedirectPromptOpen && redirectLink && (
        <RedirectPromptModal
          isOpen={isRedirectPromptOpen}
          onClose={handleCloseRedirectPrompt}
          onEdit={handleEditFromPrompt}
          shortUrl={redirectLink.shortUrl}
          newTargetUrl={redirectNewUrl}
          name={redirectLink.name}
          description={redirectLink.description}
          tags={redirectLink.tags}
          dontShowAgain={dontShowPromptAgain}
          onDontShowAgainChange={setDontShowPromptAgain}
        />
      )}

      {/* Add To Campaign Modal */}
      {isCampaignModalOpen && effectiveLink && (
        <Modal
          isOpen={isCampaignModalOpen}
          onClose={() => setIsCampaignModalOpen(false)}
          isCentered
          size="2xl"
        >
          <ModalOverlay />
          <ModalContent maxW="720px" borderRadius="16px" p={{ base: '12px', md: '16px' }}>
            <ModalHeader
              fontSize="var(--font-size-lg)"
              fontWeight={700}
              color="var(--text)"
              pb="16px"
            >
              Добавить ссылку в кампанию
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb="24px">
              {/* Карточка текущей короткой ссылки */}
              <Box
                bg="var(--primary-bg)"
                borderRadius="12px"
                p="18px 20px"
                mb="24px"
              >
                <Text
                  fontSize="var(--font-size-xs)"
                  fontWeight={500}
                  color="var(--text-secondary)"
                  mb="4px"
                >
                  Короткий URL
                </Text>
                <Text
                  fontSize="var(--font-size-md)"
                  fontWeight={700}
                  color="var(--text-link)"
                  mb="12px"
                >
                  {effectiveLink.shortUrl}
                </Text>
                <Text
                  fontSize="var(--font-size-xs)"
                  fontWeight={500}
                  color="var(--text-secondary)"
                  mb="4px"
                >
                  Целевой URL
                </Text>
                <Text
                  fontSize="var(--font-size-sm)"
                  color="var(--text)"
                  wordBreak="break-all"
                  noOfLines={2}
                >
                  {effectiveLink.targetUrl}
                </Text>
              </Box>

              <FormControl>
                <FormLabel
                  fontSize="var(--font-size-sm)"
                  fontWeight={600}
                  color="var(--text)"
                  mb="8px"
                >
                  Кампания
                </FormLabel>
                <Select
                  value={selectedCampaign}
                  onChange={(e) => setSelectedCampaign(e.target.value)}
                  h="44px"
                  bg="var(--primary-bg-hover)"
                  border="none"
                  borderRadius="10px"
                  fontSize="var(--font-size-sm)"
                  color="var(--text)"
                  _focusVisible={{
                    boxShadow: '0 0 0 1px var(--primary)',
                    bg: 'var(--white)'
                  }}
                >
                  {allCampaigns.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
                <FormHelperText
                  mt="8px"
                  fontSize="var(--font-size-xs)"
                  color="var(--text-secondary)"
                  lineHeight="1.4"
                >
                  Выберите созданную вами кампанию и добавьте в нее ссылку.
                </FormHelperText>
              </FormControl>
            </ModalBody>
            <ModalFooter pt="0">
              <HStack spacing="16px" justify="flex-end" w="100%">
                <Button
                  variant="ghost"
                  color="var(--text)"
                  fontSize="var(--font-size-sm)"
                  fontWeight={500}
                  h="42px"
                  px="16px"
                  borderRadius="10px"
                  _hover={{ bg: 'var(--slate-100-alt2)' }}
                  onClick={() => setIsCampaignModalOpen(false)}
                >
                  Отмена
                </Button>
                <Button
                  bg="var(--btn-solid)"
                  color="var(--white)"
                  fontSize="var(--font-size-sm)"
                  fontWeight={600}
                  h="42px"
                  px="22px"
                  borderRadius="10px"
                  _hover={{ bg: 'var(--btn-hover)' }}
                  _active={{ bg: 'var(--btn-hover)' }}
                  onClick={handleSaveCampaign}
                  rightIcon={<ArrowForwardIcon boxSize="14px" />}
                >
                  Добавить в кампанию
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Edit Link Info Modal */}
      <EditLinkModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        link={effectiveLink}
        onSaved={(updatedLink) => {
          const modifiedNow = new Date().toISOString();
          applyLinkUpdate(() => ({
            ...updatedLink,
            modifiedAt: modifiedNow,
          }));
          setIsEditModalOpen(false);
        }}
        availableTags={allTags}
      />

      {/* Activate Confirmation Modal */}
      {activateConfirmLink && (
        <ActivateLinkModal
          isOpen={Boolean(activateConfirmLink)}
          onClose={() => {
            if (!isActivating) {
              setActivateConfirmLink(null);
            }
          }}
          onConfirm={handleConfirmActivate}
          link={activateConfirmLink}
          isLoading={isActivating}
        />
      )}

      {/* Deactivate Confirmation Modal */}
      <DeactivateLinkModal
        isOpen={Boolean(deactivateConfirmLink)}
        onClose={() => setDeactivateConfirmLink(null)}
        onConfirm={handleConfirmDeactivate}
        link={deactivateConfirmLink}
      />

      {/* Deactivate Progress Modal */}
      {deactivateProgressLink && (
        <ProgressModal
          key={`${deactivateProgressLink.id}-${deactivateRetryCount}`}
          title="Деактивируем ссылку"
          duration={2000}
          error={deactivateError}
          onRetry={handleRetryDeactivate}
          onClose={handleCancelDeactivate}
          onCancel={handleCancelDeactivate}
          onComplete={performDeactivate}
        />
      )}
    </Box>
  );
}
