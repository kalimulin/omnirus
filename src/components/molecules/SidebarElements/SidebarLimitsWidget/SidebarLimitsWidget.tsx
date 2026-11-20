import { Box, Flex, Text, Tooltip } from '@chakra-ui/react';
import type { UserLimits } from '@/types/profile';
import './SidebarLimitsWidget.scss';

export interface SidebarLimitsWidgetProps {
  limits: UserLimits;
  onOpenModal?: (resource: 'shortcuts' | 'campaigns') => void;
}

export function getLimitStatus(
  used: number,
  max: number
): 'normal' | 'warning' | 'danger' {
  if (max <= 0) return 'normal';
  // Красный (danger) только при достижении лимита
  if (used >= max) return 'danger';

  // Предупреждение (warning / янтарный) только при близком приближении:
  // для большого пула (ссылки > 10) — осталось <= 5 слотов
  // для маленького пула (кампании <= 10) — остался ровно 1 свободный слот
  const remaining = max - used;
  const isNearLimit =
    max > 10
      ? remaining <= 5 || remaining / max <= 0.1
      : remaining === 1 && used > 0;

  if (isNearLimit) return 'warning';
  return 'normal';
}

export function SidebarLimitsWidget({
  limits,
  onOpenModal
}: SidebarLimitsWidgetProps) {
  const scStatus = getLimitStatus(
    limits.shortcuts.used,
    limits.shortcuts.max
  );
  const scPercent = Math.min(
    100,
    Math.round((limits.shortcuts.used / Math.max(1, limits.shortcuts.max)) * 100)
  );

  const cmpStatus = getLimitStatus(
    limits.campaigns.used,
    limits.campaigns.max
  );
  const cmpPercent = Math.min(
    100,
    Math.round((limits.campaigns.used / Math.max(1, limits.campaigns.max)) * 100)
  );

  return (
    <Box className="sidebar-limits-widget" role="region" aria-label="Лимиты использования">
      <Flex className="sidebar-limits-widget__header">
        <Text as="span">Лимиты тарифа</Text>
      </Flex>

      {/* Ссылки */}
      <Tooltip
        label={`Использовано ${limits.shortcuts.used} из ${limits.shortcuts.max} ссылок. Осталось: ${limits.shortcuts.remaining}`}
        placement="top"
        hasArrow
      >
        <Box
          className="sidebar-limits-widget__item"
          cursor={onOpenModal ? 'pointer' : 'default'}
          onClick={() => onOpenModal?.('shortcuts')}
        >
          <Flex className="sidebar-limits-widget__row">
            <Text as="span" className="sidebar-limits-widget__label">
              Ссылки
            </Text>
            <Text
              as="span"
              className={`sidebar-limits-widget__val sidebar-limits-widget__val--${scStatus}`}
            >
              {limits.shortcuts.used} / {limits.shortcuts.max}
            </Text>
          </Flex>
          <Box className="sidebar-limits-widget__bar-bg">
            <Box
              className={`sidebar-limits-widget__bar-fill sidebar-limits-widget__bar-fill--${scStatus}`}
              w={`${scPercent}%`}
            />
          </Box>
        </Box>
      </Tooltip>

      {/* Кампании */}
      <Tooltip
        label={`Использовано ${limits.campaigns.used} из ${limits.campaigns.max} кампаний. Осталось: ${limits.campaigns.remaining}`}
        placement="top"
        hasArrow
      >
        <Box
          className="sidebar-limits-widget__item"
          cursor={onOpenModal ? 'pointer' : 'default'}
          onClick={() => onOpenModal?.('campaigns')}
        >
          <Flex className="sidebar-limits-widget__row">
            <Text as="span" className="sidebar-limits-widget__label">
              Кампании
            </Text>
            <Text
              as="span"
              className={`sidebar-limits-widget__val sidebar-limits-widget__val--${cmpStatus}`}
            >
              {limits.campaigns.used} / {limits.campaigns.max}
            </Text>
          </Flex>
          <Box className="sidebar-limits-widget__bar-bg">
            <Box
              className={`sidebar-limits-widget__bar-fill sidebar-limits-widget__bar-fill--${cmpStatus}`}
              w={`${cmpPercent}%`}
            />
          </Box>
        </Box>
      </Tooltip>
    </Box>
  );
}

export default SidebarLimitsWidget;
