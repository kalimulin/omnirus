export interface DateRangeValue {
  period: string;
  days: number;
  startDate: string;
  endDate: string;
  dateFrom?: string;
  dateTo?: string;
}

export const periodDays: Record<string, number> = {
  '7days': 7,
  today: 1,
  yesterday: 1,
  thisMonth: 30,
  '30days': 30,
  allTime: 90,
};

export const parseRuDate = (value: string): Date => {
  const [d, m, y] = value.split('.').map(Number);
  return new Date(y || 2026, (m || 1) - 1, d || 1);
};

export const formatRuDate = (date: Date): string => {
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
};

/** Разница в днях между датами формата DD.MM.YYYY */
export const diffDays = (start: string, end: string): number => {
  const s = parseRuDate(start);
  const e = parseRuDate(end);
  const utcStart = Date.UTC(s.getFullYear(), s.getMonth(), s.getDate());
  const utcEnd = Date.UTC(e.getFullYear(), e.getMonth(), e.getDate());
  const diff = Math.round((utcEnd - utcStart) / (24 * 60 * 60 * 1000));
  return Math.min(Math.max(diff + 1, 1), 365);
};

export const buildRangeValue = (
  selectedPeriod: string,
  startDate: string,
  endDate: string,
): DateRangeValue => {
  const startObj = parseRuDate(startDate);
  const endObj = parseRuDate(endDate);
  const [orderedStart, orderedEnd] =
    startObj.getTime() <= endObj.getTime()
      ? [startObj, endObj]
      : [endObj, startObj];

  const startStr = formatRuDate(orderedStart);
  const endStr = formatRuDate(orderedEnd);

  if (selectedPeriod === 'allTime') {
    return {
      period: selectedPeriod,
      days: periodDays.allTime,
      startDate: startStr,
      endDate: endStr,
    };
  }

  const from = new Date(
    orderedStart.getFullYear(),
    orderedStart.getMonth(),
    orderedStart.getDate(),
    0,
    0,
    0,
    0,
  );
  const to = new Date(
    orderedEnd.getFullYear(),
    orderedEnd.getMonth(),
    orderedEnd.getDate(),
    23,
    59,
    59,
    999,
  );

  return {
    period: selectedPeriod,
    days:
      selectedPeriod === 'custom'
        ? diffDays(startStr, endStr)
        : (periodDays[selectedPeriod] ?? diffDays(startStr, endStr)),
    startDate: startStr,
    endDate: endStr,
    dateFrom: from.toISOString(),
    dateTo: to.toISOString(),
  };
};

export const getInitialSevenDaysRange = (): DateRangeValue => {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - 6);
  return buildRangeValue('7days', formatRuDate(start), formatRuDate(now));
};
