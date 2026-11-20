import {
  AddIcon,
  ArrowForwardIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  SearchIcon
} from '@chakra-ui/icons';
import {
  Box,
  Button,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
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
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useToast
} from '@chakra-ui/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  buildRedirectUrl,
  createCampaign,
  fetchCampaigns,
  fetchLinks,
  fetchTags,
  isApiConfigured,
  setLinkStatus,
  updateLink
} from '@/api/shortener';
import copy from '@/assets/copy.svg';
import qr from '@/assets/qr.svg';
import { StatusBadge } from '@/components/atoms/Badge/StatusBadge';
import SpinnerLoader from '@/components/atoms/Loaders/SpinnerLoader/SpinnerLoader';
import { ErrorState } from '@/components/molecules/ErrorState/ErrorState';
import { ActivateLinkModal } from '@/components/shortener/ActivateLinkModal/ActivateLinkModal';
import { DeactivateLinkModal } from '@/components/shortener/DeactivateLinkModal/DeactivateLinkModal';
import { EditLinkModal } from '@/components/shortener/EditLinkModal/EditLinkModal';
import { LinksEmptyState } from './LinksEmptyState';
import ProgressModal from '@/components/shortener/ProgressModal/ProgressModal';
import { QrModal } from '@/components/shortener/QrModal/QrModal';
import { RedirectModal } from '@/components/shortener/RedirectModal/RedirectModal';
import { RedirectPromptModal } from '@/components/shortener/RedirectPromptModal/RedirectPromptModal';
import { ShortenModal } from '@/components/shortener/ShortenModal/ShortenModal';
import { LimitExceededModal } from '@/components/shortener/LimitExceededModal/LimitExceededModal';
import { ClaimGuestShortcutsModal } from '@/components/shortener/ClaimGuestShortcutsModal/ClaimGuestShortcutsModal';
import { useAuth } from '@/auth/AuthContext';
import { ROUTES } from '@/routing/routes';
import type { CampaignRow, LinkRow } from '@/types/shortener';
import {
  getGuestShortcuts,
  claimAllGuestShortcuts,
  claimSpecificGuestShortcuts,
  type GuestShortcut
} from '@/utils/guestShortcuts';

import './LinksRegistryTable.scss';

/** Извлекает код shortcut из shortUrl вида "https://.../s/3a0alc" */
function extractShortcut(shortUrl: string): string {
  const parts = shortUrl.split('/');
  return parts[parts.length - 1];
}

const ITEMS_PER_PAGE = 7;
const ROW_HIGHLIGHT_DURATION_MS = 2000;
const STATS_REFRESH_INTERVAL_MS = 30_000;

export type SortDir = 'asc' | 'desc';

type SortKey =
  | 'name'
  | 'shortUrl'
  | 'targetUrl'
  | 'campaign'
  | 'status'
  | 'clicks';

const statusOrder: Record<string, number> = {
  активна: 0,
  неактивна: 1,
  заблокирована: 2
};

export function SortIndicator({ dir }: { dir: SortDir | null }) {
  return (
    <Box
      as="span"
      display="inline-flex"
      flexDirection="column"
      ml="4px"
      lineHeight="1"
    >
      <ChevronUpIcon
        boxSize="12px"
        color={dir === 'asc' ? 'var(--primary)' : 'var(--text-placeholder)'}
        mb="-4px"
      />
      <ChevronDownIcon
        boxSize="12px"
        color={dir === 'desc' ? 'var(--primary)' : 'var(--text-placeholder)'}
      />
    </Box>
  );
}

const statusFilterOptions: { label: string; value: string }[] = [
  { label: 'Все статусы', value: '' },
  { label: 'Активна', value: 'активна' },
  { label: 'Неактивна', value: 'неактивна' },
  { label: 'Заблокирована', value: 'заблокирована' }
];

const sortableColumns: {
  key: SortKey;
  label: string;
  isNumeric?: boolean;
}[] = [
  { key: 'name', label: 'Название ссылки' },
  { key: 'shortUrl', label: 'Короткая ссылка' },
  { key: 'targetUrl', label: 'Целевой URL' },
  { key: 'campaign', label: 'Кампания' },
  { key: 'status', label: 'Статус' },
  { key: 'clicks', label: 'Переходы', isNumeric: true }
];

function FilterMenuSelect({
  label,
  value,
  displayValue,
  options,
  isDisabled,
  onChange
}: {
  label: string;
  value: string;
  displayValue?: string;
  options: { label: string; value: string }[];
  isDisabled?: boolean;
  onChange: (value: string) => void;
}) {
  const currentLabel =
    displayValue || options.find((o) => o.value === value)?.label || label;
  return (
    <Menu
      isLazy
      placement="bottom-start"
    >
      <MenuButton
        as={Button}
        variant="unstyled"
        display="inline-flex"
        alignItems="center"
        justifyContent="space-between"
        bg="var(--primary-bg)"
        borderRadius="10px"
        h="36px"
        px="12px"
        fontSize="14px"
        fontWeight="normal"
        isDisabled={isDisabled}
        color={value ? 'var(--primary)' : 'var(--text-secondary)'}
        _hover={{ bg: 'var(--slate-50-alt)' }}
        _active={{ bg: 'var(--slate-50-alt)' }}
        rightIcon={
          <ChevronDownIcon
            boxSize="16px"
            color="var(--text-placeholder)"
            ml="4px"
          />
        }
      >
        <Text
          as="span"
          noOfLines={1}
          maxW="160px"
        >
          {currentLabel}
        </Text>
      </MenuButton>
      <Portal>
        <MenuList
          bg="white"
          borderRadius="12px"
          boxShadow="0 4px 20px rgba(18, 35, 63, 0.08)"
          borderColor="var(--slate-200)"
          p="6px"
          minW="180px"
          maxH="260px"
          overflowY="auto"
          zIndex={1000}
        >
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <MenuItem
                key={opt.value || '__all__'}
                borderRadius="8px"
                fontSize="14px"
                color={isSelected ? 'var(--primary)' : 'var(--text)'}
                fontWeight={isSelected ? 600 : 400}
                bg={isSelected ? 'var(--primary-bg)' : 'transparent'}
                _hover={{ bg: 'var(--primary-bg)' }}
                onClick={() => onChange(opt.value)}
              >
                {opt.label}
              </MenuItem>
            );
          })}
        </MenuList>
      </Portal>
    </Menu>
  );
}

export interface LinksRegistryTableProps {
  /** Список ссылок (если передан, используется как внешний управляемый список) */
  links?: LinkRow[];
  /** Список кампаний */
  campaigns?: CampaignRow[];
  /** Колбэк при изменении ссылок (создание, редактирование, деактивация, удаление) */
  onLinksChange?: (links: LinkRow[]) => void;
  /** Заголовок страницы / таблицы (по умолчанию «Список сокращенных ссылок», null — скрыть) */
  title?: React.ReactNode | null;
  /** Заголовок страницы в пустом состоянии (по умолчанию «Сократите ссылку до удобного короткого адреса») */
  emptyTitle?: React.ReactNode | null;
  /** Кастомная кнопка действия (по умолчанию «Сократить ссылку») */
  actionButton?: React.ReactNode;
  /** Плейсхолдер для инпута поиска */
  searchPlaceholder?: string;
  /** Кастомное пустое состояние при отсутствии ссылок */
  emptyState?: React.ReactNode;
  /** Начальный фильтр по кампании */
  defaultCampaignFilter?: string;
  /** Скрыть фильтр по кампаниям */
  hideCampaignFilter?: boolean;
  /** Внутренние отступы контейнера (по умолчанию px="32px" py="28px") */
  padding?: string | number;
  /** CSS-класс контейнера */
  className?: string;
  /** Кастомный обработчик клика по строке таблицы */
  onRowClick?: (link: LinkRow) => void;
  /** Флаг загрузки (если передан извне, переопределяет внутреннее состояние) */
  isLoading?: boolean;
  /** Кастомный плейсхолдер состояния загрузки */
  loadingPlaceholder?: React.ReactNode;
}

export function LinksRegistryTable({
  links: linksProp,
  campaigns: campaignsProp,
  onLinksChange,
  title = 'Список сокращенных ссылок',
  emptyTitle = 'Сократите ссылку до удобного короткого адреса',
  actionButton,
  searchPlaceholder = 'Поиск по названию, целевому URL или тегу',
  emptyState,
  defaultCampaignFilter = '',
  hideCampaignFilter = false,
  padding,
  className,
  onRowClick,
  isLoading: isLoadingProp,
  loadingPlaceholder
}: LinksRegistryTableProps) {
  const navigate = useNavigate();
  const toast = useToast();
  const apiConfigured = isApiConfigured();
  const [currentPage, setCurrentPage] = useState(1);

  const isControlledLinks = linksProp !== undefined;
  const [internalLinks, setInternalLinks] = useState<LinkRow[]>(() =>
    isControlledLinks ? (linksProp as LinkRow[]) : []
  );
  const [internalIsLoading, setInternalIsLoading] = useState<boolean>(
    () => !isControlledLinks && apiConfigured
  );
  const [apiLoadError, setApiLoadError] = useState<string | null>(null);
  const [reloadTrigger, setReloadTrigger] = useState(0);

  const effectiveIsLoading =
    isLoadingProp !== undefined
      ? isLoadingProp
      : (!isControlledLinks && apiConfigured ? internalIsLoading : false);

  const handleRetryLoad = useCallback(() => {
    setReloadTrigger((k) => k + 1);
  }, []);

  const [prevLinksProp, setPrevLinksProp] = useState(linksProp);
  if (linksProp !== prevLinksProp) {
    setPrevLinksProp(linksProp);
    if (linksProp !== undefined) {
      setInternalLinks(linksProp);
    }
  }

  const [internalCampaigns, setInternalCampaigns] = useState<CampaignRow[]>(
    () => (campaignsProp !== undefined ? campaignsProp : [])
  );
  const [prevCampaignsProp, setPrevCampaignsProp] = useState(campaignsProp);
  if (campaignsProp !== prevCampaignsProp) {
    setPrevCampaignsProp(campaignsProp);
    if (campaignsProp !== undefined) {
      setInternalCampaigns(campaignsProp);
    }
  }

  const [apiTags, setApiTags] = useState<string[]>([]);

  // Загрузка реальных данных из API (если ссылки не переданы извне) с автообновлением каждые 30 секунд
  useEffect(() => {
    if (isControlledLinks || !apiConfigured) return;
    let cancelled = false;
    const loadRegistry = async (isInitial = false) => {
      if (isInitial) {
        setInternalIsLoading(true);
        setApiLoadError(null);
      }
      try {
        const [apiLinks, apiCampaigns] = await Promise.all([
          fetchLinks(),
          fetchCampaigns()
        ]);
        if (!cancelled) {
          const campaignNameById = new Map(
            apiCampaigns.map((c) => [c.id, c.name])
          );
          const resolvedLinks = apiLinks.map((link) =>
            link.campaignId && campaignNameById.has(link.campaignId)
              ? { ...link, campaign: campaignNameById.get(link.campaignId)! }
              : link
          );
          setInternalLinks(resolvedLinks);
          setInternalCampaigns(apiCampaigns);
          setApiLoadError(null);
        }
      } catch (err) {
        if (!cancelled && isInitial) {
          const message = (err as Error).message || 'Не удалось загрузить реестр';
          setApiLoadError(message);
          toast({
            title: 'Не удалось загрузить реестр',
            description: message,
            status: 'error',
            duration: 4000,
            isClosable: true
          });
        }
      } finally {
        if (!cancelled && isInitial) {
          setInternalIsLoading(false);
        }
      }
      try {
        const tags = await fetchTags();
        if (!cancelled) setApiTags(tags.map((t) => t.name));
      } catch {
        // список тегов не критичен
      }
    };
    loadRegistry(true);
    const onFocus = () => {
      loadRegistry(false);
    };
    window.addEventListener('focus', onFocus);
    const intervalId = window.setInterval(() => {
      loadRegistry(false);
    }, STATS_REFRESH_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      window.removeEventListener('focus', onFocus);
    };
  }, [apiConfigured, isControlledLinks, reloadTrigger, toast]);

  // Загрузка тегов и списка кампаний из API даже при внешних ссылках
  useEffect(() => {
    if (!apiConfigured) return;
    let cancelled = false;
    fetchTags()
      .then((tags) => {
        if (!cancelled) setApiTags(tags.map((t) => t.name));
      })
      .catch(() => {});
    if (campaignsProp === undefined) {
      fetchCampaigns()
        .then((camps) => {
          if (!cancelled) setInternalCampaigns(camps);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [apiConfigured, campaignsProp]);

  const updateLinks = useCallback(
    (updater: LinkRow[] | ((prev: LinkRow[]) => LinkRow[])) => {
      setInternalLinks((prev) => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        onLinksChange?.(next);
        return next;
      });
    },
    [onLinksChange]
  );

  const { limits, refreshLimits } = useAuth();
  const [isShortenModalOpen, setIsShortenModalOpen] = useState(false);
  const [isLimitModalOpen, setIsLimitModalOpen] = useState(false);
  const [pendingGuestLinks, setPendingGuestLinks] = useState<GuestShortcut[]>([]);
  const [isClaimModalOpen, setIsClaimModalOpen] = useState(false);
  const claimedGuestRef = useRef(false);

  useEffect(() => {
    if (claimedGuestRef.current || !limits) return;

    const guestLinks = getGuestShortcuts();
    if (guestLinks.length === 0) return;

    const remaining = limits.shortcuts.remaining;
    if (remaining >= guestLinks.length) {
      claimedGuestRef.current = true;
      void claimAllGuestShortcuts().then(() => {
        void refreshLimits?.();
        if (apiConfigured) {
          void fetchLinks().then((data) => updateLinks(data));
        }
      });
    } else if (remaining > 0) {
      claimedGuestRef.current = true;
      setPendingGuestLinks(guestLinks);
      setIsClaimModalOpen(true);
    }
  }, [limits, apiConfigured, refreshLimits, updateLinks]);

  const handleClaimSpecific = async (selectedCodes: string[]) => {
    await claimSpecificGuestShortcuts(selectedCodes);
    void refreshLimits?.();
    if (apiConfigured) {
      const data = await fetchLinks();
      updateLinks(data);
    }
  };

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Saved / deactivated row highlight state
  const [highlightedRow, setHighlightedRow] = useState<{
    id: string;
    variant: 'success' | 'deactivated';
  } | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const pendingRedirectHighlightIdRef = useRef<string | null>(null);

  const highlightRow = useCallback(
    (linkId: string, variant: 'success' | 'deactivated' = 'success') => {
      clearTimeout(highlightTimerRef.current);
      setHighlightedRow({ id: linkId, variant });
      const timerId = setTimeout(() => {
        if (highlightTimerRef.current === timerId) {
          setHighlightedRow(null);
        }
      }, ROW_HIGHLIGHT_DURATION_MS);
      highlightTimerRef.current = timerId;
    },
    []
  );

  // QR modal state
  const [qrLink, setQrLink] = useState<LinkRow | null>(null);

  // Link actions & modals state
  const [redirectLink, setRedirectLink] = useState<LinkRow | null>(null);
  const [redirectNewUrl, setRedirectNewUrl] = useState('');
  const [isRedirectLoading, setIsRedirectLoading] = useState(false);
  const [isRedirectPromptOpen, setIsRedirectPromptOpen] = useState(false);
  const [dontShowPromptAgain, setDontShowPromptAgain] = useState(false);
  const redirectAttemptRef = useRef(0);

  const [campaignLink, setCampaignLink] = useState<LinkRow | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState('');
  const togglingStatusIdsRef = useRef<Set<string>>(new Set());

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

  const [editLink, setEditLink] = useState<LinkRow | null>(null);

  const [searchText, setSearchText] = useState('');
  const [filterCampaign, setFilterCampaign] = useState(defaultCampaignFilter);
  const [filterTag, setFilterTag] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  // Sorting state
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const campaignNameById = useMemo(() => {
    return new Map(internalCampaigns.map((c) => [c.id, c.name]));
  }, [internalCampaigns]);

  const resolvedInternalLinks = useMemo(() => {
    if (campaignNameById.size === 0) return internalLinks;
    return internalLinks.map((l) => {
      if (
        l.campaignId &&
        campaignNameById.has(l.campaignId) &&
        (!l.campaign || l.campaign === 'Без кампании')
      ) {
        return { ...l, campaign: campaignNameById.get(l.campaignId)! };
      }
      return l;
    });
  }, [internalLinks, campaignNameById]);

  const allCampaigns = [
    'Без кампании',
    ...Array.from(
      new Set([
        ...internalCampaigns.map((c) => c.name),
        ...resolvedInternalLinks.map((l) => l.campaign)
      ])
    ).filter((name) => Boolean(name) && name !== 'Без кампании')
  ];

  const allTags = Array.from(
    new Set([
      ...apiTags,
      ...internalCampaigns.flatMap((c) => c.tags),
      ...resolvedInternalLinks.flatMap((l) => l.tags)
    ])
  ).sort();

  const hasActiveFilters = Boolean(
    searchText.trim() || filterCampaign || filterTag || filterStatus
  );

  const filteredLinks = resolvedInternalLinks.filter((link) => {
    const query = searchText.toLowerCase();
    const matchesSearch =
      !query ||
      link.name.toLowerCase().includes(query) ||
      link.shortUrl.toLowerCase().includes(query) ||
      link.targetUrl.toLowerCase().includes(query) ||
      link.tags.some((t) => t.toLowerCase().includes(query)) ||
      link.campaign.toLowerCase().includes(query);
    const matchesCampaign = !filterCampaign || link.campaign === filterCampaign;
    const matchesTag = !filterTag || link.tags.includes(filterTag);
    const matchesStatus =
      !filterStatus ||
      link.status === filterStatus ||
      (filterStatus === 'активна' && (link.status as string) === 'active') ||
      (filterStatus === 'неактивна' &&
        (link.status as string) === 'inactive') ||
      (filterStatus === 'заблокирована' &&
        (link.status as string) === 'blocked');
    return matchesSearch && matchesCampaign && matchesTag && matchesStatus;
  });

  const handleLinkCreated = (newLink: LinkRow) => {
    updateLinks((prev) => [newLink, ...prev]);
    void refreshLimits?.();
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
    setCurrentPage(1);
  };

  const getLinkTimestamp = (link: LinkRow) => {
    if (!link.createdAt) return 0;
    const time = new Date(link.createdAt).getTime();
    return Number.isNaN(time) ? 0 : time;
  };

  const sortedLinks = sortKey
    ? [...filteredLinks].sort((a, b) => {
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortKey === 'clicks') return (a.clicks - b.clicks) * dir;
        if (sortKey === 'status')
          return (
            ((statusOrder[a.status] ?? 99) - (statusOrder[b.status] ?? 99)) *
            dir
          );
        return a[sortKey].localeCompare(b[sortKey], 'ru') * dir;
      })
    : [...filteredLinks].sort(
        (a, b) => getLinkTimestamp(b) - getLinkTimestamp(a)
      );

  const totalPages = Math.max(
    1,
    Math.ceil(sortedLinks.length / ITEMS_PER_PAGE)
  );
  const safePage = Math.min(currentPage, totalPages);
  const pagedLinks = sortedLinks.slice(
    (safePage - 1) * ITEMS_PER_PAGE,
    safePage * ITEMS_PER_PAGE
  );

  const resetFilters = () => {
    setSearchText('');
    setFilterCampaign('');
    setFilterTag('');
    setFilterStatus('');
    setCurrentPage(1);
  };

  // Copy handler
  const handleCopy = useCallback(
    (link: LinkRow, e: React.MouseEvent) => {
      e.stopPropagation();
      const fullUrl = buildRedirectUrl(
        link.shortcut || extractShortcut(link.shortUrl)
      );
      const markCopied = () => {
        setCopiedId(link.id);
        toast({
          title: 'Ссылка скопирована в буфер обмена',
          status: 'success',
          duration: 4000,
          isClosable: true
        });
        clearTimeout(copyTimerRef.current);
        copyTimerRef.current = setTimeout(() => setCopiedId(null), 2500);
      };
      navigator.clipboard
        .writeText(fullUrl)
        .then(markCopied)
        .catch(() => {
          try {
            const ta = document.createElement('textarea');
            ta.value = fullUrl;
            document.body.appendChild(ta);
            ta.select();
            document.execCommand('copy');
            document.body.removeChild(ta);
            markCopied();
          } catch {
            toast({
              title: 'Не удалось скопировать ссылку',
              status: 'error',
              duration: 4000,
              isClosable: true
            });
          }
        });
    },
    [toast]
  );

  // QR handler
  const handleQr = useCallback((link: LinkRow, e: React.MouseEvent) => {
    e.stopPropagation();
    setQrLink(link);
  }, []);

  // Action Menu Handlers
  const handleOpenRedirect = (link: LinkRow) => {
    redirectAttemptRef.current += 1;
    pendingRedirectHighlightIdRef.current = null;
    setRedirectLink(link);
    setRedirectNewUrl(link.targetUrl);
  };

  const handleCancelRedirect = () => {
    redirectAttemptRef.current += 1;
    setRedirectLink(null);
    setIsRedirectLoading(false);
  };

  const showChangesSavedToast = useCallback(() => {
    toast({
      title: 'Изменения успешно сохранены.',
      status: 'success',
      duration: 4000,
      isClosable: true
    });
  }, [toast]);

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
          isClosable: true
        });
        return;
      }
      if (redirectAttemptRef.current !== attemptId) return;
    }

    updateLinks((prev) =>
      prev.map((l) =>
        l.id === savedLinkId ? { ...l, targetUrl: finalUrl } : l
      )
    );

    setIsRedirectLoading(false);
    if (dontShowPromptAgain) {
      showChangesSavedToast();
      highlightRow(savedLinkId);
      setRedirectLink(null);
      return;
    }
    pendingRedirectHighlightIdRef.current = savedLinkId;
    setIsRedirectPromptOpen(true);
  }, [
    apiConfigured,
    dontShowPromptAgain,
    highlightRow,
    redirectLink,
    redirectNewUrl,
    showChangesSavedToast,
    toast,
    updateLinks
  ]);

  const handleCloseRedirectPrompt = () => {
    showChangesSavedToast();
    const pendingId = pendingRedirectHighlightIdRef.current ?? redirectLink?.id;
    pendingRedirectHighlightIdRef.current = null;
    if (pendingId) {
      highlightRow(pendingId);
    }
    setIsRedirectPromptOpen(false);
    setRedirectLink(null);
  };

  const handleEditFromPrompt = () => {
    if (!redirectLink) return;

    const trimmed = redirectNewUrl.trim();
    const finalUrl = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

    const updatedLink = { ...redirectLink, targetUrl: finalUrl };
    pendingRedirectHighlightIdRef.current = redirectLink.id;

    setIsRedirectPromptOpen(false);
    setRedirectLink(null);
    handleOpenEdit(updatedLink);
  };

  const handleSaveRedirect = (newUrl: string) => {
    if (!redirectLink) return;
    setRedirectNewUrl(newUrl);
    setIsRedirectLoading(true);
  };

  const handleOpenCampaign = (link: LinkRow) => {
    setCampaignLink(link);
    setSelectedCampaign(link.campaign || 'Без кампании');
  };

  const handleSaveCampaign = () => {
    if (!campaignLink) return;
    const targetCampaign = selectedCampaign || 'Без кампании';

    const knownCampaignId =
      targetCampaign === 'Без кампании'
        ? null
        : (internalCampaigns.find((c) => c.name === targetCampaign)?.id ?? null);

    updateLinks((prev) =>
      prev.map((l) =>
        l.id === campaignLink.id
          ? {
              ...l,
              campaign: targetCampaign,
              campaignId: knownCampaignId ?? l.campaignId ?? null
            }
          : l
      )
    );

    if (
      !apiConfigured &&
      targetCampaign !== 'Без кампании' &&
      !internalCampaigns.some((c) => c.name === targetCampaign)
    ) {
      const createdCampaign: CampaignRow = {
        id: String(Date.now()),
        name: targetCampaign,
        description: '',
        linksCount: 1,
        shortLinksCount: 1,
        totalClicks: 0,
        createdAt: new Date().toISOString(),
        tags: []
      };
      setInternalCampaigns((prev) => [createdCampaign, ...prev]);
    }

    const linkId = campaignLink.id;
    if (apiConfigured) {
      (async () => {
        try {
          let campaignId: string | null = null;
          if (targetCampaign !== 'Без кампании') {
            campaignId =
              internalCampaigns.find((c) => c.name === targetCampaign)?.id ??
              null;
            if (!campaignId) {
              const created = await createCampaign({ name: targetCampaign });
              campaignId = created.id;
              setInternalCampaigns((prev) => [...prev, created]);
            }
          }
          await updateLink(linkId, { campaign_id: campaignId });
        } catch (err) {
          setHighlightedRow((prev) => (prev?.id === linkId ? null : prev));
          toast({
            title: 'Не удалось сохранить кампанию',
            description: (err as Error).message,
            status: 'error',
            duration: 4000,
            isClosable: true
          });
        }
      })();
    }

    showChangesSavedToast();
    highlightRow(linkId);
    setCampaignLink(null);
  };

  const handleOpenEdit = (link: LinkRow) => {
    setEditLink(link);
  };

  const handleEditSave = (updatedLink: LinkRow) => {
    pendingRedirectHighlightIdRef.current = null;
    updateLinks((prev) =>
      prev.map((l) => (l.id === updatedLink.id ? updatedLink : l))
    );
    setEditLink(null);
    highlightRow(updatedLink.id);
  };

  const handleToggleStatus = async (link: LinkRow) => {
    if (link.status === 'заблокирована') {
      toast({
        title: 'Заблокированная ссылка не может быть изменена',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
      return;
    }

    const isInactive = link.status === 'неактивна';
    if (!isInactive) {
      setDeactivateConfirmLink(link);
      return;
    }

    setActivateConfirmLink(link);
  };

  const handleConfirmActivate = async () => {
    if (!activateConfirmLink) return;
    const targetLink = activateConfirmLink;

    if (togglingStatusIdsRef.current.has(targetLink.id)) {
      return;
    }

    setIsActivating(true);

    if (apiConfigured) {
      togglingStatusIdsRef.current.add(targetLink.id);
      try {
        await setLinkStatus(targetLink.id, 'активна');
      } catch (err) {
        toast({
          title: 'Не удалось изменить статус',
          description: (err as Error).message,
          status: 'error',
          duration: 4000,
          isClosable: true
        });
        setIsActivating(false);
        return;
      } finally {
        togglingStatusIdsRef.current.delete(targetLink.id);
      }
    }

    updateLinks((prev) =>
      prev.map((l) =>
        l.id === targetLink.id ? { ...l, status: 'активна' as const } : l
      )
    );

    setIsActivating(false);
    setActivateConfirmLink(null);
    showChangesSavedToast();
    highlightRow(targetLink.id);
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
      ''
    );

    if (apiConfigured) {
      try {
        if (reserveUrl) {
          await updateLink(targetId, {
            status: 'inactive',
            target: reserveUrl
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
          isClosable: true
        });
        return;
      }
      if (deactivateAttemptRef.current !== attemptId) return;
    }

    updateLinks((prev) =>
      prev.map((l) =>
        l.id === targetId
          ? {
              ...l,
              status: 'неактивна' as const,
              ...(reserveUrl ? { targetUrl: reserveUrl } : {})
            }
          : l
      )
    );

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
      isClosable: true
    });
    highlightRow(targetId, 'deactivated');
  }, [
    apiConfigured,
    deactivateProgressLink,
    deactivateReserveUrl,
    highlightRow,
    toast,
    updateLinks
  ]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      clearTimeout(copyTimerRef.current);
      clearTimeout(highlightTimerRef.current);
    };
  }, []);

  const handleFilterChange =
    (setter: (v: string) => void) =>
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      setter(e.target.value);
      setCurrentPage(1);
    };

  const paginationPages: (number | '...')[] = [];
  if (totalPages <= 5) {
    for (let i = 1; i <= totalPages; i++) paginationPages.push(i);
  } else {
    paginationPages.push(1);
    if (safePage > 3) paginationPages.push('...');
    for (
      let i = Math.max(2, safePage - 1);
      i <= Math.min(totalPages - 1, safePage + 1);
      i++
    )
      paginationPages.push(i);
    if (safePage < totalPages - 2) paginationPages.push('...');
    paginationPages.push(totalPages);
  }

  const isInitialEmpty =
    !hasActiveFilters && resolvedInternalLinks.length === 0;

  const containerPadding =
    padding !== undefined
      ? padding
      : { base: '16px', md: '28px 32px' };

  return (
    <Box className={`links-registry ${className || ''}`}>
      <Box p={containerPadding}>
        {effectiveIsLoading ? (
          loadingPlaceholder !== undefined ? (
            loadingPlaceholder
          ) : (
            <Box data-testid="links-registry-loading">
              {title !== null && title !== undefined && (
                typeof title === 'string' ? (
                  <Heading
                    fontSize="20px"
                    fontWeight={700}
                    color="var(--text)"
                    mb="24px"
                    fontFamily="'Inter', sans-serif"
                  >
                    {title}
                  </Heading>
                ) : (
                  title
                )
              )}
              <Flex minH="300px" justify="center" align="center">
                <SpinnerLoader />
              </Flex>
            </Box>
          )
        ) : apiLoadError && resolvedInternalLinks.length === 0 ? (
          <>
            {title !== null && title !== undefined && (
              typeof title === 'string' ? (
                <Heading
                  fontSize="20px"
                  fontWeight={700}
                  color="var(--text)"
                  mb="24px"
                  fontFamily="'Inter', sans-serif"
                >
                  {title}
                </Heading>
              ) : (
                title
              )
            )}
            <ErrorState
              message="Не удалось загрузить реестр ссылок"
              description={apiLoadError}
              onRetry={handleRetryLoad}
            />
          </>
        ) : isInitialEmpty && emptyState === undefined ? (
          <LinksEmptyState
            title={
              title === null
                ? null
                : (emptyTitle ?? 'Сократите ссылку до удобного короткого адреса')
            }
            onShortenClick={() =>
              limits?.shortcuts.isReached
                ? setIsLimitModalOpen(true)
                : setIsShortenModalOpen(true)
            }
          />
        ) : (
          <>
            {title !== null && title !== undefined && (
              typeof title === 'string' ? (
                <Heading
                  fontSize="20px"
                  fontWeight={700}
                  color="var(--text)"
                  mb="24px"
                  fontFamily="'Inter', sans-serif"
                >
                  {title}
                </Heading>
              ) : (
                title
              )
            )}

            <Flex
              justify="space-between"
              align="center"
              mb="20px"
              gap="12px"
              flexWrap="wrap"
            >
              <Flex
                align="center"
                gap="8px"
                flexWrap="wrap"
                flexGrow={1}
              >
                <InputGroup maxW="420px">
                  <InputLeftElement
                    pointerEvents="none"
                    h="36px"
                  >
                    <SearchIcon color="gray.400" />
                  </InputLeftElement>
                  <Input
                    value={searchText}
                    onChange={handleFilterChange(setSearchText)}
                    placeholder={searchPlaceholder}
                    bg="var(--primary-bg)"
                    border="none"
                    borderRadius="10px"
                    h="36px"
                    fontSize="14px"
                    _placeholder={{ color: 'var(--text-placeholder)' }}
                    _focusVisible={{
                      outline: 'none',
                      boxShadow: '0 0 0 1px var(--btn-outline)'
                    }}
                  />
                </InputGroup>

                {!hideCampaignFilter && (
                  <FilterMenuSelect
                    label="Кампании"
                    value={filterCampaign}
                    options={[
                      { label: 'Все кампании', value: '' },
                      ...allCampaigns.map((c) => ({ label: c, value: c }))
                    ]}
                    onChange={(val) => {
                      setFilterCampaign(val);
                      setCurrentPage(1);
                    }}
                  />
                )}

                <FilterMenuSelect
                  label="Теги"
                  value={filterTag}
                  options={[
                    { label: 'Все теги', value: '' },
                    ...allTags.map((t) => ({ label: t, value: t }))
                  ]}
                  onChange={(val) => {
                    setFilterTag(val);
                    setCurrentPage(1);
                  }}
                />

                <FilterMenuSelect
                  label="Все статусы"
                  value={filterStatus}
                  displayValue={
                    filterStatus
                      ? statusFilterOptions.find((o) => o.value === filterStatus)
                          ?.label
                      : 'Все статусы'
                  }
                  options={statusFilterOptions}
                  onChange={(val) => {
                    setFilterStatus(val);
                    setCurrentPage(1);
                  }}
                />

                <Button
                  variant="unstyled"
                  fontSize="14px"
                  fontWeight="normal"
                  color="var(--text)"
                  h="36px"
                  px="2"
                  ml={{ base: 0, md: '8px' }}
                  _hover={{ color: 'var(--primary)' }}
                  onClick={resetFilters}
                >
                  Сбросить фильтры
                </Button>
              </Flex>

              {actionButton !== undefined ? (
                actionButton
              ) : (
                <HStack spacing={3}>
                  {limits && (
                    <Text
                      fontSize="13px"
                      fontWeight={500}
                      color={
                        limits.shortcuts.isReached
                          ? 'var(--error)'
                          : limits.shortcuts.remaining <= 5 ||
                              limits.shortcuts.remaining / Math.max(1, limits.shortcuts.max) <= 0.1
                            ? '#b45309'
                            : 'var(--text-secondary)'
                      }
                    >
                      Ссылки: {limits.shortcuts.used} / {limits.shortcuts.max}
                    </Text>
                  )}
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
                      limits?.shortcuts.isReached
                        ? setIsLimitModalOpen(true)
                        : setIsShortenModalOpen(true)
                    }
                  >
                    Сократить ссылку
                  </Button>
                </HStack>
              )}
            </Flex>

            <Box>
              {emptyState !== undefined && isInitialEmpty ? (
                emptyState
              ) : filteredLinks.length === 0 ? (
                <Box
                  bg="white"
                  borderRadius="16px"
                  p={{ base: '40px 20px', md: '56px 40px' }}
                  textAlign="center"
                  boxShadow="0px 1px 4px rgba(29, 79, 145, 0.05)"
                >
                  <Flex
                    w="40px"
                    h="40px"
                    borderRadius="10px"
                    bg="var(--error-bg)"
                    align="center"
                    justify="center"
                    mx="auto"
                    mb="16px"
                  >
                    <SearchIcon
                      color="var(--error)"
                      boxSize="18px"
                    />
                  </Flex>
                  <Text
                    fontSize="18px"
                    fontWeight={700}
                    color="var(--text)"
                    mb="8px"
                    fontFamily="'Inter', sans-serif"
                  >
                    {searchText.trim()
                      ? `По запросу «${searchText.trim()}» ничего не найдено`
                      : 'Ничего не найдено'}
                  </Text>
                  <Text
                    fontSize="14px"
                    color="var(--text-secondary)"
                    mb="20px"
                    fontFamily="'Inter', sans-serif"
                  >
                    Измените поисковый запрос и/или сбросьте фильтры.
                  </Text>
                  <Button
                    bg="var(--primary)"
                    color="white"
                    borderRadius="10px"
                    h="36px"
                    px="20px"
                    fontSize="14px"
                    fontWeight={500}
                    _hover={{ bg: 'var(--btn-hover)' }}
                    _active={{ bg: 'var(--primary-700)' }}
                    className="links-registry__empty-reset"
                    onClick={resetFilters}
                  >
                    Сбросить фильтры
                  </Button>
                </Box>
              ) : (
                <>
                  <Flex
                    align="center"
                    mb="12px"
                  >
                    <Text
                      fontSize="13px"
                      color="var(--text-secondary)"
                    >
                      Найдено:{' '}
                      <Text
                        as="span"
                        fontWeight={600}
                        color="var(--text)"
                      >
                        {filteredLinks.length}
                      </Text>{' '}
                      ссылок
                    </Text>
                  </Flex>
                  <Box
                    bg="white"
                    borderRadius="12px"
                    overflow="hidden"
                    boxShadow="0px 1px 4px rgba(29, 79, 145, 0.05)"
                  >
                    <Table
                      variant="simple"
                      size="md"
                    >
                      <Thead>
                        <Tr>
                          {sortableColumns.map((col) => {
                            const isActive = sortKey === col.key;
                            return (
                              <Th
                                key={col.key}
                                fontSize="12px"
                                color="var(--text-secondary)"
                                fontWeight={600}
                                textTransform="none"
                                borderColor="var(--slate-200)"
                                isNumeric={col.isNumeric}
                                className="links-registry__sort-th"
                                aria-sort={
                                  isActive
                                    ? sortDir === 'asc'
                                      ? 'ascending'
                                      : 'descending'
                                    : 'none'
                                }
                                cursor="pointer"
                                onClick={() => handleSort(col.key)}
                              >
                                <Flex
                                  align="center"
                                  gap="4px"
                                  justify={
                                    col.isNumeric ? 'flex-end' : 'flex-start'
                                  }
                                >
                                  <Text>{col.label}</Text>
                                  <SortIndicator dir={isActive ? sortDir : null} />
                                </Flex>
                              </Th>
                            );
                          })}
                          <Th
                            fontSize="12px"
                            color="var(--text-secondary)"
                            fontWeight={600}
                            textTransform="none"
                            borderColor="var(--slate-200)"
                          >
                            Действия
                          </Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {pagedLinks.map((link) => {
                          const isCopied = copiedId === link.id;
                          const isHighlighted = highlightedRow?.id === link.id;
                          const highlightBg =
                            highlightedRow?.variant === 'deactivated'
                              ? 'var(--orange-50)'
                              : 'var(--success-bg)';
                          return (
                            <Tr
                              key={link.id}
                              bgColor={isHighlighted ? highlightBg : 'transparent'}
                              transition="background-color 0.4s ease"
                              _hover={{
                                bgColor: isHighlighted
                                  ? highlightBg
                                  : 'var(--primary-bg)'
                              }}
                              data-highlighted={isHighlighted ? 'true' : undefined}
                              cursor="pointer"
                              onClick={() => {
                                if (onRowClick) {
                                  onRowClick(link);
                                } else {
                                  navigate(`${ROUTES.links}/${link.id}`);
                                }
                              }}
                            >
                          <Td
                            fontSize="14px"
                            color="var(--text)"
                            borderColor="var(--gray-100)"
                            maxW="180px"
                          >
                            <Tooltip
                              label={link.description}
                              bg="var(--slate-800)"
                              color="white"
                              fontSize="12px"
                              borderRadius="8px"
                              p="10px 14px"
                              hasArrow
                              isDisabled={!link.description}
                            >
                              <Text noOfLines={1}>{link.name}</Text>
                            </Tooltip>
                          </Td>
                          <Td
                            fontSize="14px"
                            color="var(--primary)"
                            borderColor="var(--gray-100)"
                          >
                            {link.shortUrl}
                          </Td>
                          <Td
                            fontSize="13px"
                            color="var(--text-secondary)"
                            borderColor="var(--gray-100)"
                            maxW="240px"
                          >
                            <Text noOfLines={1}>{link.targetUrl}</Text>
                          </Td>
                          <Td
                            fontSize="13px"
                            color="var(--text-secondary)"
                            borderColor="var(--gray-100)"
                            maxW="140px"
                          >
                            <Text noOfLines={1}>{link.campaign}</Text>
                          </Td>

                          <Td borderColor="var(--gray-100)">
                            <Tooltip
                              label={link.blockReason}
                              bg="var(--slate-800)"
                              color="white"
                              fontSize="12px"
                              borderRadius="8px"
                              p="10px 14px"
                              hasArrow
                              isDisabled={
                                !(
                                  link.status === 'заблокирована' &&
                                  link.blockReason
                                )
                              }
                            >
                              <StatusBadge status={link.status} />
                            </Tooltip>
                          </Td>
                          <Td
                            fontSize="14px"
                            color="var(--text)"
                            borderColor="var(--gray-100)"
                            isNumeric
                          >
                            {link.clicks.toLocaleString('ru-RU')}
                          </Td>
                          <Td borderColor="var(--gray-100)">
                            <HStack
                              spacing="4px"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Tooltip
                                label={
                                  isCopied
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
                                  aria-label="Copy"
                                  icon={
                                    isCopied ? (
                                      <svg
                                        className="links-registry__action-icon"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2.5"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        style={{ width: 16, height: 16 }}
                                      >
                                        <polyline points="20 6 9 17 4 12" />
                                      </svg>
                                    ) : (
                                      <img
                                        src={copy}
                                        alt="copy"
                                        className="links-registry__action-icon"
                                      />
                                    )
                                  }
                                  variant="ghost"
                                  size="sm"
                                  color={
                                    isCopied
                                      ? 'var(--secondary)'
                                      : 'var(--text-placeholder)'
                                  }
                                  bg={
                                    isCopied
                                      ? 'var(--icon-btn-hover)'
                                      : undefined
                                  }
                                  _hover={{
                                    color: isCopied
                                      ? 'var(--secondary)'
                                      : 'var(--primary)',
                                    bg: isCopied
                                      ? 'var(--icon-btn-hover)'
                                      : 'var(--slate-50-alt)'
                                  }}
                                  onClick={(e) => handleCopy(link, e)}
                                />
                              </Tooltip>
                              <Tooltip
                                label="Показать QR-код"
                                bg="var(--slate-800)"
                                color="white"
                                fontSize="12px"
                                borderRadius="8px"
                                hasArrow
                                placement="top"
                              >
                                <IconButton
                                  aria-label="QR"
                                  icon={
                                    <img
                                      src={qr}
                                      alt="qr"
                                      className="links-registry__action-icon"
                                    />
                                  }
                                  variant="ghost"
                                  size="sm"
                                  color="var(--text-placeholder)"
                                  _hover={{
                                    color: 'var(--primary)',
                                    bg: 'var(--slate-50-alt)'
                                  }}
                                  onClick={(e) => handleQr(link, e)}
                                />
                              </Tooltip>
                              <Menu
                                isLazy
                                placement="bottom-end"
                              >
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
                                    bg: 'var(--slate-50-alt)'
                                  }}
                                  onClick={(e: React.MouseEvent) =>
                                    e.stopPropagation()
                                  }
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
                                    onClick={(e: React.MouseEvent) =>
                                      e.stopPropagation()
                                    }
                                  >
                                    <Box
                                      px="12px"
                                      pt="6px"
                                      pb="12px"
                                    >
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
                                      onClick={() => handleOpenRedirect(link)}
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
                                      onClick={() => handleOpenCampaign(link)}
                                    >
                                      <Flex
                                        mr="12px"
                                        align="center"
                                        justify="center"
                                        color="brand.800"
                                      >
                                        {hideCampaignFilter ||
                                        (link.campaign &&
                                          link.campaign !== 'Без кампании') ? (
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
                                            <line
                                              x1="4"
                                              y1="12"
                                              x2="16"
                                              y2="12"
                                            />
                                            <polyline points="11 7 16 12 11 17" />
                                            <line
                                              x1="20"
                                              y1="5"
                                              x2="20"
                                              y2="19"
                                            />
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
                                            <line
                                              x1="12"
                                              y1="5"
                                              x2="12"
                                              y2="19"
                                            />
                                            <line
                                              x1="5"
                                              y1="12"
                                              x2="19"
                                              y2="12"
                                            />
                                          </svg>
                                        )}
                                      </Flex>
                                      <Text
                                        fontSize="14px"
                                        fontWeight="500"
                                        color="brand.800"
                                      >
                                        {hideCampaignFilter ||
                                        (link.campaign &&
                                          link.campaign !== 'Без кампании')
                                          ? 'Переместить в другую кампанию'
                                          : 'Добавить в кампанию'}
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
                                      onClick={() => handleOpenEdit(link)}
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
                                          <line
                                            x1="9"
                                            y1="21"
                                            x2="15"
                                            y2="21"
                                          />
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
                                      onClick={() => handleToggleStatus(link)}
                                    >
                                      <Flex
                                        mr="12px"
                                        align="center"
                                        justify="center"
                                        color="brand.800"
                                      >
                                        {link.status === 'неактивна' ? (
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
                                        {link.status === 'неактивна'
                                          ? 'Активировать'
                                          : 'Деактивировать'}
                                      </Text>
                                    </MenuItem>
                                  </MenuList>
                                </Portal>
                              </Menu>
                            </HStack>
                          </Td>
                        </Tr>
                      );
                    })}
                  </Tbody>
                </Table>
              </Box>
              {totalPages > 1 && (
                <Flex
                  justify="center"
                  mt="24px"
                  gap="4px"
                  align="center"
                >
                  <IconButton
                    aria-label="Previous"
                    icon={<ChevronLeftIcon />}
                    variant="ghost"
                    size="sm"
                    color="var(--text-placeholder)"
                    isDisabled={safePage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  />
                  {paginationPages.map((p, idx) =>
                    p === '...' ? (
                      <Text
                        key={`dots-${idx}`}
                        color="var(--text-placeholder)"
                        px="4px"
                      >
                        ⋯
                      </Text>
                    ) : (
                      <Button
                        key={p}
                        size="sm"
                        variant={safePage === p ? 'solid' : 'ghost'}
                        bg={safePage === p ? 'var(--primary)' : 'transparent'}
                        color={
                          safePage === p ? 'white' : 'var(--text-secondary)'
                        }
                        borderRadius="8px"
                        minW="36px"
                        fontSize="14px"
                        _hover={
                          safePage === p ? {} : { bg: 'var(--slate-50-alt)' }
                        }
                        onClick={() => setCurrentPage(p as number)}
                      >
                        {p}
                      </Button>
                    )
                  )}
                  <IconButton
                    aria-label="Next"
                    icon={<ChevronRightIcon />}
                    variant="ghost"
                    size="sm"
                    color="var(--text-placeholder)"
                    isDisabled={safePage === totalPages}
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                  />
                </Flex>
              )}
            </>
          )}
        </Box>
          </>
        )}
      </Box>

      {/* QR Modal */}
      {qrLink && (
        <QrModal
          shortUrl={qrLink.shortUrl}
          shortcut={qrLink.shortcut || extractShortcut(qrLink.shortUrl)}
          onClose={() => setQrLink(null)}
        />
      )}

      {/* Shorten Modal */}
      <ShortenModal
        isOpen={isShortenModalOpen}
        onClose={() => setIsShortenModalOpen(false)}
        onCreated={handleLinkCreated}
        campaigns={allCampaigns}
        availableTags={allTags}
      />

      {/* Limit Exceeded Modal */}
      <LimitExceededModal
        isOpen={isLimitModalOpen}
        onClose={() => setIsLimitModalOpen(false)}
        resource="shortcuts"
        limit={limits?.shortcuts.max}
        used={limits?.shortcuts.used}
      />

      {/* Claim Guest Shortcuts Modal */}
      {isClaimModalOpen && pendingGuestLinks.length > 0 && limits && (
        <ClaimGuestShortcutsModal
          isOpen={isClaimModalOpen}
          onClose={() => setIsClaimModalOpen(false)}
          guestLinks={pendingGuestLinks}
          maxSelectable={limits.shortcuts.remaining}
          onClaim={handleClaimSpecific}
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

      {/* Redirect Prompt Modal */}
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
      {campaignLink && (
        <Modal
          isOpen={Boolean(campaignLink)}
          onClose={() => setCampaignLink(null)}
          isCentered
          size="2xl"
        >
          <ModalOverlay />
          <ModalContent
            maxW="720px"
            borderRadius="16px"
            p={{ base: '12px', md: '16px' }}
          >
            <ModalHeader
              fontSize="var(--font-size-lg)"
              fontWeight={700}
              color="var(--text)"
              pb="16px"
            >
              {hideCampaignFilter ||
              (campaignLink.campaign &&
                campaignLink.campaign !== 'Без кампании')
                ? 'Переместить в другую кампанию'
                : 'Добавить ссылку в кампанию'}
            </ModalHeader>
            <ModalCloseButton />
            <ModalBody pb="24px">
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
                  {campaignLink.shortUrl}
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
                  {campaignLink.targetUrl}
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
                    <option
                      key={c}
                      value={c}
                    >
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
                  {hideCampaignFilter ||
                  (campaignLink.campaign &&
                    campaignLink.campaign !== 'Без кампании')
                    ? 'Выберите кампанию, в которую хотите переместить ссылку.'
                    : 'Выберите созданную вами кампанию и добавьте в нее ссылку.'}
                </FormHelperText>
              </FormControl>
            </ModalBody>
            <ModalFooter pt="0">
              <HStack
                spacing="16px"
                justify="flex-end"
                w="100%"
              >
                <Button
                  variant="ghost"
                  color="var(--text)"
                  fontSize="var(--font-size-sm)"
                  fontWeight={500}
                  h="42px"
                  px="16px"
                  borderRadius="10px"
                  _hover={{ bg: 'var(--slate-100-alt2)' }}
                  onClick={() => setCampaignLink(null)}
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
                  {hideCampaignFilter ||
                  (campaignLink.campaign &&
                    campaignLink.campaign !== 'Без кампании')
                    ? 'Переместить в кампанию'
                    : 'Добавить в кампанию'}
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      {/* Edit Link Info Modal */}
      <EditLinkModal
        isOpen={Boolean(editLink)}
        onClose={() => {
          const pendingId = pendingRedirectHighlightIdRef.current;
          pendingRedirectHighlightIdRef.current = null;
          setEditLink(null);
          if (pendingId) {
            showChangesSavedToast();
            highlightRow(pendingId);
          }
        }}
        link={editLink}
        onSaved={handleEditSave}
        availableTags={allTags}
      />

      {/* Activate Confirmation Modal */}
      {activateConfirmLink && (
        <ActivateLinkModal
          isOpen
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
      {deactivateConfirmLink && (
        <DeactivateLinkModal
          isOpen
          onClose={() => setDeactivateConfirmLink(null)}
          onConfirm={handleConfirmDeactivate}
          link={deactivateConfirmLink}
        />
      )}

      {/* Deactivate Progress Modal */}
      {deactivateProgressLink && (
        <ProgressModal
          key={`${deactivateProgressLink.id}-${deactivateRetryCount}`}
          title="Деактивация ссылки"
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

export default LinksRegistryTable;
