import { LuBan, LuLink2Off, LuPause } from 'react-icons/lu';
import type { LinkErrorConfig, LinkErrorType } from './types';

export const LINK_ERROR_CONFIGS: Record<LinkErrorType, LinkErrorConfig> = {
  'not-found': {
    title: 'Такой ссылки не существует',
    subtitle: 'Проверьте адрес: возможно, при копировании потерялся символ.',
    icon: <LuLink2Off size={24} strokeWidth={2} />
  },
  inactive: {
    title: 'Ссылка временно не работает',
    subtitle:
      'Автор приостановил переходы по этой короткой ссылке. Возможно, она заработает позже — уточните у того, кто ее прислал.',
    icon: <LuPause size={24} strokeWidth={2} />
  },
  blocked: {
    title: 'Переход по ссылке остановлен',
    subtitle:
      'Адрес назначения не прошел проверку безопасности и заблокирован модератором сервиса. Если вы получили эту ссылку в сообщении, будьте осторожны с отправителем.',
    icon: <LuBan size={24} strokeWidth={2} />
  }
};
