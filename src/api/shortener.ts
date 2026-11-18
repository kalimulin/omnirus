import {
  getShortenerAccessToken,
  getShortenerCoreBaseUrl,
  getShortenerOrigin,
  isShortenerApiConfigured,
} from '@/api/shortenerConfig';
import type {
  LinkRow,
  CampaignRow,
  TagItem,
  LinkStatistics,
  DailyDataPoint,
  ShortcutStatItem,
} from '@/types/shortener';

// Базовый URL единого PHP API.
export const SHORTENER_CORE_API_BASE_URL = getShortenerCoreBaseUrl();

export const isApiConfigured = (): boolean => isShortenerApiConfigured();

interface PaginatedResponse<T> {
  items: T[];
  meta?: {
    total?: number;
    count?: number;
    page?: number;
    perPage?: number;
  };
}

interface ApiShortcut {
  shortcutId?: string;
  title?: string | null;
  target?: string | null;
  description?: string | null;
  shortUrl?: string | null;
  shortcut: string;
  status?: 'active' | 'inactive' | 'blocked' | null;
  blockReason?: string | null;
  reserveUrl?: string | null;
  clicksCount?: number | null;
  createdAt?: string | null;
  modifiedAt?: string | null;
  tags?: string[] | null;
  campaignId?: string | null;
  campaign?: string | null;
  channel?: string | null;
}

interface ApiCampaign {
  campaignId?: string;
  name?: string | null;
  description?: string | null;
  tags?: string[] | null;
  linksCount?: number | null;
  totalClicks?: number | null;
  createdAt?: string | null;
  modifiedAt?: string | null;
}

interface ApiTag {
  name?: string;
  count?: number;
}

interface ApiStatistics {
  dateFrom?: string;
  dateTo?: string;
  granularity?: 'hour' | 'day';
  total?: number;
  unique?: number;
  byDay?: { date: string; value: number }[];
  series?: { period: string; clicks: number; uniqueVisitors?: number }[];
  linksCount?: number | null;
  shortcuts?:
    | {
        shortcutId?: string | null;
        shortcut?: string | null;
        clicks: number;
        uniqueVisitors?: number;
      }[]
    | null;
}

interface ApiError extends Error {
  status?: number;
  code?: string;
}

const linkStatusToRu = (
  status?: ApiShortcut['status'] | string,
): LinkRow['status'] => {
  if (status === 'inactive' || status === 'неактивна') return 'неактивна';
  if (status === 'blocked' || status === 'заблокирована') return 'заблокирована';
  return 'активна';
};

export const toLinkRow = (item: ApiShortcut): LinkRow => {
  const shortcut = item.shortcut || '';
  const shortUrl =
    item.shortUrl ||
    (shortcut ? buildRedirectUrl(shortcut).replace(/^https?:\/\//, '') : '');

  return {
    id: item.shortcutId || shortcut,
    name: item.title || shortcut || item.target || '',
    description: item.description || '',
    shortUrl,
    shortcut,
    targetUrl: item.target || '',
    campaignId: item.campaignId ?? null,
    campaign: item.campaign || 'Без кампании',
    tags: Array.isArray(item.tags) ? item.tags : [],
    status: linkStatusToRu(item.status),
    blockReason: item.blockReason ?? null,
    reserveUrl: item.reserveUrl ?? null,
    channel: item.channel ?? null,
    clicks: item.clicksCount ?? 0,
    createdAt: item.createdAt || '',
    modifiedAt: item.modifiedAt || '',
  };
};

export const toCampaignRow = (campaign: ApiCampaign): CampaignRow => ({
  id: campaign.campaignId || '',
  name: campaign.name || '',
  description: campaign.description || '',
  linksCount: campaign.linksCount ?? 0,
  shortLinksCount: campaign.linksCount ?? 0,
  totalClicks: campaign.totalClicks ?? 0,
  createdAt: campaign.createdAt || '',
  modifiedAt: campaign.modifiedAt || undefined,
  tags: Array.isArray(campaign.tags) ? campaign.tags : [],
});

const toStatistics = (raw?: ApiStatistics): LinkStatistics => {
  const rawShortcuts = raw?.shortcuts;
  const shortcuts: ShortcutStatItem[] | undefined = Array.isArray(rawShortcuts)
    ? rawShortcuts.map((item) => ({
        shortcutId: item.shortcutId ?? null,
        shortcut: item.shortcut ?? null,
        clicks: item.clicks ?? 0,
        uniqueVisitors: item.uniqueVisitors ?? 0,
      }))
    : undefined;

  const rawSeries = raw?.series;
  const series = Array.isArray(rawSeries)
    ? rawSeries.map((point) => ({
        period: point.period,
        clicks: point.clicks,
        uniqueVisitors: point.uniqueVisitors ?? 0,
      }))
    : undefined;

  return {
    total: raw?.total ?? 0,
    unique: raw?.unique ?? 0,
    byDay: series
      ? series.map((point) => ({
          date: point.period,
          value: point.clicks,
        }))
      : ((raw?.byDay || []) as DailyDataPoint[]),
    series,
    dateFrom: raw?.dateFrom,
    dateTo: raw?.dateTo,
    granularity: raw?.granularity,
    linksCount: raw?.linksCount ?? (shortcuts ? shortcuts.length : null),
    shortcuts,
  };
};

const authHeaders = (): Record<string, string> => {
  const token = getShortenerAccessToken();
  if (!token) {
    throw new Error('Токен авторизации отсутствует');
  }

  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
};

const extractErrorInfo = (
  errorData: unknown,
): { message?: string; code?: string } => {
  if (!errorData || typeof errorData !== 'object') {
    return {};
  }

  const record = errorData as Record<string, unknown>;
  const errObj = record.error;
  if (errObj && typeof errObj === 'object') {
    const errRecord = errObj as Record<string, unknown>;
    return {
      message:
        typeof errRecord.message === 'string' && errRecord.message.trim()
          ? errRecord.message
          : undefined,
      code:
        typeof errRecord.code === 'string' && errRecord.code.trim()
          ? errRecord.code
          : undefined,
    };
  }

  if (typeof record.message === 'string' && record.message.trim()) {
    return { message: record.message };
  }

  return {};
};

async function request<T>(
  path: string,
  init?: RequestInit,
  options?: { allowNotFound?: boolean },
): Promise<T> {
  const response = await fetch(`${getShortenerCoreBaseUrl()}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers || {}) },
  });

  if (response.status === 404 && options?.allowNotFound) {
    return { items: [] } as T;
  }

  if (!response.ok) {
    let message = 'Ошибка сервера';
    let code: string | undefined;
    try {
      const errorData: unknown = await response.json();
      const parsed = extractErrorInfo(errorData);
      message = parsed.message || message;
      code = parsed.code;
    } catch {
      // игнорируем ошибку парсинга
    }
    const error = new Error(message) as ApiError;
    error.status = response.status;
    error.code = code;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

// ---------- Ссылки ----------

export const fetchLinks = async (campaignId?: string): Promise<LinkRow[]> => {
  const allItems: ApiShortcut[] = [];
  const initialQuery = campaignId
    ? `?campaignId=${encodeURIComponent(campaignId)}`
    : '';

  const firstPage = await request<PaginatedResponse<ApiShortcut>>(
    `/shortcuts${initialQuery}`,
    undefined,
    { allowNotFound: true },
  );

  const firstItems = firstPage?.items ?? [];
  allItems.push(...firstItems);

  const total =
    typeof firstPage?.meta?.total === 'number'
      ? firstPage.meta.total
      : typeof firstPage?.meta?.count === 'number'
        ? firstPage.meta.count
        : firstItems.length;

  const pageSize =
    typeof firstPage?.meta?.perPage === 'number' && firstPage.meta.perPage > 0
      ? firstPage.meta.perPage
      : firstItems.length > 0
        ? firstItems.length
        : 50;

  let page = 2;
  while (allItems.length < total) {
    const params = new URLSearchParams();
    if (campaignId) {
      params.set('campaignId', campaignId);
    }
    params.set('page', String(page));
    params.set('perPage', String(pageSize));

    const nextPage = await request<PaginatedResponse<ApiShortcut>>(
      `/shortcuts?${params.toString()}`,
      undefined,
      { allowNotFound: true },
    );

    const nextItems = nextPage?.items ?? [];
    if (nextItems.length === 0) {
      break;
    }

    allItems.push(...nextItems);
    page += 1;
  }

  return allItems.map(toLinkRow);
};

export const fetchLink = async (id: string): Promise<LinkRow> => {
  const item = await request<ApiShortcut>(
    `/shortcuts/${encodeURIComponent(id)}`,
  );
  if (!item || (!item.shortcutId && !item.shortcut)) {
    throw new Error('Ссылка не найдена');
  }
  return toLinkRow(item);
};

export interface CreateLinkInput {
  title: string;
  target: string;
  description?: string;
  tags?: string[];
  campaign_id?: string | null;
  campaignId?: string | null;
}

export const createLink = async (input: CreateLinkInput): Promise<LinkRow> => {
  const campaignId = input.campaignId ?? input.campaign_id;
  const body: Record<string, unknown> = {
    title: input.title,
    target: input.target,
  };
  if (input.description !== undefined) body.description = input.description;
  if (input.tags !== undefined) body.tags = input.tags;
  if (campaignId !== undefined) body.campaignId = campaignId;

  const raw = await request<ApiShortcut>('/shortcuts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  if (!raw?.shortcut && raw?.shortcutId) {
    try {
      const full = await fetchLink(raw.shortcutId);
      return {
        ...full,
        name: full.name || input.title,
        description: full.description || input.description || '',
        tags: full.tags.length > 0 ? full.tags : input.tags || [],
        campaignId: full.campaignId ?? campaignId ?? null,
      };
    } catch {
      // если дозагрузка не удалась — продолжаем с данными из ответа
    }
  }

  return toLinkRow({
    ...raw,
    title: raw?.title || input.title,
    target: raw?.target || input.target,
    description: raw?.description ?? input.description ?? '',
    campaignId: raw?.campaignId ?? campaignId ?? null,
    tags: Array.isArray(raw?.tags) ? raw.tags : input.tags || [],
    createdAt: raw?.createdAt || new Date().toISOString(),
  });
};

export interface UpdateLinkInput {
  title?: string;
  target?: string;
  description?: string;
  tags?: string[];
  campaign_id?: string | null;
  campaignId?: string | null;
  status?: 'active' | 'inactive' | 'blocked';
  reserve_url?: string | null;
  reserveUrl?: string | null;
}

export const updateLink = (
  id: string,
  input: UpdateLinkInput,
): Promise<unknown> => {
  const body: Record<string, unknown> = {};
  if (input.title !== undefined) body.title = input.title;
  if (input.target !== undefined) body.target = input.target;
  if (input.description !== undefined) body.description = input.description;
  if (input.tags !== undefined) body.tags = input.tags;
  if (input.status !== undefined) body.status = input.status;
  if (input.campaignId !== undefined || input.campaign_id !== undefined) {
    body.campaignId = input.campaignId ?? input.campaign_id ?? null;
  }
  if (input.reserveUrl !== undefined || input.reserve_url !== undefined) {
    body.reserveUrl = input.reserveUrl ?? input.reserve_url ?? null;
  }

  return request<unknown>(`/shortcuts/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
};

export const setLinkStatus = (
  id: string,
  status: LinkRow['status'] | 'active' | 'inactive',
): Promise<unknown> => {
  const apiStatus =
    status === 'неактивна' || status === 'inactive' ? 'inactive' : 'active';
  return request<unknown>(`/shortcuts/${encodeURIComponent(id)}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: apiStatus }),
  });
};

// ---------- Статистика ----------

export interface StatsQueryOptions {
  days?: number;
  dateFrom?: string;
  dateTo?: string;
  granularity?: 'hour' | 'day';
}

const buildStatsQuery = (
  optionsOrDays?: number | StatsQueryOptions,
  defaultGranularity: 'hour' | 'day' = 'day',
): string => {
  const options: StatsQueryOptions =
    typeof optionsOrDays === 'number'
      ? { days: optionsOrDays, granularity: defaultGranularity }
      : optionsOrDays || {};

  const params = new URLSearchParams();
  if (options.dateFrom) {
    params.set('dateFrom', options.dateFrom);
  }
  if (options.dateTo) {
    params.set('dateTo', options.dateTo);
  }

  if (
    !options.dateFrom &&
    !options.dateTo &&
    options.days !== undefined &&
    options.days > 0
  ) {
    const to = new Date();
    const from = new Date(to.getTime() - options.days * 24 * 60 * 60 * 1000);
    params.set('dateFrom', from.toISOString());
    params.set('dateTo', to.toISOString());
  }

  params.set('granularity', options.granularity ?? defaultGranularity);
  return params.toString();
};

/** Статистика кликов по ссылке. Принимает количество дней или объект фильтров (dateFrom, dateTo, granularity). */
export const fetchLinkStatistics = async (
  id: string,
  optionsOrDays: number | StatsQueryOptions = 30,
): Promise<LinkStatistics> => {
  const query = buildStatsQuery(optionsOrDays, 'day');
  const data = await request<ApiStatistics>(
    `/stats/shortcuts/${encodeURIComponent(id)}?${query}`,
    undefined,
    { allowNotFound: true },
  );
  return toStatistics(data);
};

export interface ExportStatsOptions extends StatsQueryOptions {
  format?: 'csv' | 'xlsx';
}

const parseDownloadFilename = (
  header: string | null,
  fallback: string,
): string => {
  if (!header) return fallback;
  const utf8Match = /filename\*=UTF-8''([^;\s]+)/i.exec(header);
  if (utf8Match?.[1]) {
    try {
      return decodeURIComponent(utf8Match[1]);
    } catch {
      return utf8Match[1];
    }
  }
  const plainMatch = /filename="?([^";\r\n]+)"?/i.exec(header);
  return plainMatch?.[1] || fallback;
};

/** Экспорт статистики ссылки за период в CSV или XLSX (GET /api/stats/shortcuts/{id}/export). */
export const exportLinkStatistics = async (
  id: string,
  options: ExportStatsOptions = {},
): Promise<{ blob: Blob; filename: string }> => {
  const format = options.format ?? 'csv';
  const params = new URLSearchParams(buildStatsQuery(options, 'day'));
  params.set('format', format);

  const response = await fetch(
    `${getShortenerCoreBaseUrl()}/stats/shortcuts/${encodeURIComponent(id)}/export?${params.toString()}`,
    {
      headers: authHeaders(),
    },
  );

  if (!response.ok) {
    let message = 'Ошибка сервера';
    try {
      const errorData: unknown = await response.json();
      message = extractErrorInfo(errorData).message || message;
    } catch {
      // игнорируем ошибку парсинга
    }
    const error = new Error(message) as ApiError;
    error.status = response.status;
    throw error;
  }

  const blob = await response.blob();
  const contentDisposition =
    typeof response.headers?.get === 'function'
      ? response.headers.get('Content-Disposition')
      : null;
  const filename = parseDownloadFilename(
    contentDisposition,
    `stats-${id}.${format}`,
  );
  return { blob, filename };
};

/** Статистика кликов по кампании (со сводкой по ссылкам). */
export const fetchCampaignStatistics = async (
  id: string,
  days?: number,
): Promise<LinkStatistics> => {
  const query = buildStatsQuery(days, 'day');
  const data = await request<ApiStatistics>(
    `/stats/campaigns/${encodeURIComponent(id)}?${query}`,
    undefined,
    { allowNotFound: true },
  );
  return toStatistics(data);
};

export interface CampaignLinksSummary {
  links: LinkRow[];
  shortLinksCount: number;
  targetUrlsCount: number;
}

/** Сводка по ссылкам кампании: фактический список, общее число коротких ссылок и уникальных целевых URL. */
export const fetchCampaignLinksSummary = async (
  campaignId: string,
): Promise<CampaignLinksSummary> => {
  const data = await request<PaginatedResponse<ApiShortcut>>(
    `/shortcuts?campaignId=${encodeURIComponent(campaignId)}&perPage=50`,
    undefined,
    { allowNotFound: true },
  );
  const links = (data?.items ?? []).map(toLinkRow);
  const totalFromMeta =
    typeof data?.meta?.total === 'number'
      ? data.meta.total
      : typeof data?.meta?.count === 'number'
        ? data.meta.count
        : links.length;
  const shortLinksCount = Math.max(links.length, totalFromMeta);
  const targetUrlsCount =
    links.length > 0
      ? new Set(links.map((l) => l.targetUrl?.trim()).filter(Boolean)).size
      : shortLinksCount;

  return { links, shortLinksCount, targetUrlsCount };
};

// ---------- Кампании ----------

export const fetchCampaigns = async (): Promise<CampaignRow[]> => {
  const allCampaigns: ApiCampaign[] = [];

  const firstPage = await request<PaginatedResponse<ApiCampaign>>(
    '/campaigns',
    undefined,
    { allowNotFound: true },
  );

  const firstItems = firstPage?.items ?? [];
  allCampaigns.push(...firstItems);

  const total =
    typeof firstPage?.meta?.total === 'number'
      ? firstPage.meta.total
      : typeof firstPage?.meta?.count === 'number'
        ? firstPage.meta.count
        : firstItems.length;

  const pageSize =
    typeof firstPage?.meta?.perPage === 'number' && firstPage.meta.perPage > 0
      ? firstPage.meta.perPage
      : firstItems.length > 0
        ? firstItems.length
        : 50;

  let page = 2;
  while (allCampaigns.length < total) {
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('perPage', String(pageSize));

    const nextPage = await request<PaginatedResponse<ApiCampaign>>(
      `/campaigns?${params.toString()}`,
      undefined,
      { allowNotFound: true },
    );

    const nextItems = nextPage?.items ?? [];
    if (nextItems.length === 0) {
      break;
    }

    allCampaigns.push(...nextItems);
    page += 1;
  }

  return allCampaigns.map(toCampaignRow);
};

export const fetchCampaign = async (id: string): Promise<CampaignRow> => {
  const data = await request<ApiCampaign>(
    `/campaigns/${encodeURIComponent(id)}`,
  );
  return toCampaignRow(data);
};

export interface CreateCampaignInput {
  name: string;
  description?: string;
  tags?: string[];
}

export const createCampaign = async (
  input: CreateCampaignInput,
): Promise<CampaignRow> => {
  const raw = await request<ApiCampaign>('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    }),
  });

  return toCampaignRow({
    ...raw,
    campaignId: raw?.campaignId || '',
    name: raw?.name ?? input.name,
    description: raw?.description ?? input.description ?? '',
    createdAt: raw?.createdAt || new Date().toISOString(),
    tags: raw?.tags ?? input.tags ?? [],
  });
};

export interface UpdateCampaignInput {
  name?: string;
  description?: string;
  tags?: string[];
}

export const updateCampaign = (
  id: string,
  input: UpdateCampaignInput,
): Promise<unknown> =>
  request<unknown>(`/campaigns/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.tags !== undefined ? { tags: input.tags } : {}),
    }),
  });

// ---------- Теги ----------

/** Список тегов текущего пользователя: [{ name, count }] */
export const fetchTags = async (): Promise<TagItem[]> => {
  const data = await request<PaginatedResponse<ApiTag>>('/tags', undefined, {
    allowNotFound: true,
  });
  return (data?.items ?? [])
    .map((tag) => ({
      name: tag.name || '',
      count: tag.count ?? 0,
    }))
    .filter((tag) => Boolean(tag.name));
};

// ---------- Редирект ----------

/** Построить URL редиректа короткой ссылки: {origin}/s/{код} */
export const buildRedirectUrl = (shortcut: string): string => {
  const origin = getShortenerOrigin();
  return origin ? `${origin}/s/${shortcut}` : `/s/${shortcut}`;
};

// Получить id кампании по имени, при отсутствии — создать новую.
export const ensureCampaignId = async (
  name: string,
): Promise<string | null> => {
  if (!name || name === 'Без кампании') return null;
  const existing = await fetchCampaigns();
  const found = existing.find((campaign) => campaign.name === name);
  if (found) return found.id;
  const created = await createCampaign({ name });
  return created.id;
};
