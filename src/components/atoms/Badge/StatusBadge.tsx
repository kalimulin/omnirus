import { Badge, type BadgeProps } from '@chakra-ui/react';
import { forwardRef } from 'react';

export type StatusType =
  | 'active'
  | 'inactive'
  | 'blocked'
  | 'paused'
  | 'completed'
  | 'archived'
  | 'delivered'
  | 'failed'
  | 'активна'
  | 'неактивна'
  | 'заблокирована'
  | 'на паузе'
  | 'завершена'
  | 'в архиве'
  | 'отправлено'
  | 'ошибка'
  | (string & {});

export interface StatusConfig {
  label: string;
  color: string;
  bg: string;
}

export const STATUS_CONFIG_MAP: Record<string, StatusConfig> = {
  // English keys
  active: {
    label: 'активна',
    color: 'var(--green-600)',
    bg: 'var(--green-50)'
  },
  inactive: {
    label: 'неактивна',
    color: 'var(--text-secondary)',
    bg: 'var(--zinc-100)'
  },
  blocked: {
    label: 'заблокирована',
    color: 'var(--error)',
    bg: 'var(--error-bg)'
  },
  paused: {
    label: 'на паузе',
    color: 'var(--orange-600)',
    bg: 'var(--orange-50)'
  },
  completed: {
    label: 'завершена',
    color: 'var(--black)',
    bg: 'var(--snow)'
  },
  archived: {
    label: 'в архиве',
    color: 'var(--black)',
    bg: 'var(--snow)'
  },
  delivered: {
    label: 'отправлено',
    color: 'var(--green-600)',
    bg: 'var(--green-50)'
  },
  failed: {
    label: 'ошибка',
    color: 'var(--error)',
    bg: 'var(--error-bg)'
  },

  // Russian keys
  активна: {
    label: 'активна',
    color: 'var(--green-600)',
    bg: 'var(--green-50)'
  },
  неактивна: {
    label: 'неактивна',
    color: 'var(--text-secondary)',
    bg: 'var(--zinc-100)'
  },
  заблокирована: {
    label: 'заблокирована',
    color: 'var(--error)',
    bg: 'var(--error-bg)'
  },
  'на паузе': {
    label: 'на паузе',
    color: 'var(--orange-600)',
    bg: 'var(--orange-50)'
  },
  завершена: {
    label: 'завершена',
    color: 'var(--black)',
    bg: 'var(--snow)'
  },
  'в архиве': {
    label: 'в архиве',
    color: 'var(--black)',
    bg: 'var(--snow)'
  },
  отправлено: {
    label: 'отправлено',
    color: 'var(--green-600)',
    bg: 'var(--green-50)'
  },
  ошибка: {
    label: 'ошибка',
    color: 'var(--error)',
    bg: 'var(--error-bg)'
  }
};

export interface StatusBadgeProps extends Omit<BadgeProps, 'color'> {
  status: StatusType;
  label?: string;
  color?: string;
}

export const StatusBadge = forwardRef<HTMLSpanElement, StatusBadgeProps>(
  (
    {
      status,
      label,
      children,
      w = '128px',
      h = '28px',
      px = '12px',
      py = '4px',
      borderRadius = '6px',
      fontSize = '14px',
      fontWeight = 500,
      textTransform = 'none',
      border = 'none',
      bg,
      color,
      ...rest
    },
    ref
  ) => {
    const key = (status || '').toLowerCase().trim();
    const config = STATUS_CONFIG_MAP[key] || {
      label: status || '',
      color: 'var(--text-secondary)',
      bg: 'var(--zinc-100)'
    };

    return (
      <Badge
        ref={ref}
        display="inline-flex"
        alignItems="center"
        justifyContent="center"
        w={w}
        h={h}
        px={px}
        py={py}
        borderRadius={borderRadius}
        fontSize={fontSize}
        fontWeight={fontWeight}
        lineHeight="1"
        textTransform={textTransform}
        border={border}
        bg={bg ?? config.bg}
        color={color ?? config.color}
        {...rest}
      >
        {children ?? label ?? config.label}
      </Badge>
    );
  }
);

export default StatusBadge;
