import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  type AlertStatus,
  Box,
  Spinner,
  type ToastId
} from '@chakra-ui/react';
import { type ReactNode } from 'react';
import {
  LuCircleAlert,
  LuCircleCheck,
  LuInfo,
  LuTriangleAlert
} from 'react-icons/lu';

export interface StatusToastProps {
  id?: ToastId;
  status?: AlertStatus;
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
}

function getToastIcon(status: AlertStatus, customIcon?: ReactNode): ReactNode {
  if (customIcon) return customIcon;

  switch (status) {
    case 'success':
      return <LuCircleCheck size="100%" />;
    case 'error':
      return <LuCircleAlert size="100%" />;
    case 'warning':
      return <LuTriangleAlert size="100%" />;
    case 'loading':
      return (
        <Spinner
          w="100%"
          h="100%"
        />
      );
    case 'info':
    default:
      return <LuInfo size="100%" />;
  }
}

export function StatusToast({
  id,
  status = 'info',
  title,
  description,
  icon
}: StatusToastProps) {
  const ids = id
    ? {
        root: `toast-${id}`,
        title: `toast-${id}-title`,
        description: `toast-${id}-description`
      }
    : undefined;

  return (
    <Alert
      addRole={false}
      id={ids?.root}
      status={status}
      variant="toast"
    >
      <AlertIcon>{getToastIcon(status, icon)}</AlertIcon>
      <Box
        flex={1}
        minW={0}
      >
        {title && <AlertTitle id={ids?.title}>{title}</AlertTitle>}
        {description && (
          <AlertDescription id={ids?.description}>
            {description}
          </AlertDescription>
        )}
      </Box>
    </Alert>
  );
}

export default StatusToast;
