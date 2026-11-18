import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Flex } from '@chakra-ui/react';

import SpinnerLoader from '@/components/atoms/Loaders/SpinnerLoader/SpinnerLoader';
import {
  LinkErrorScreen,
  type LinkErrorType
} from '@/components/shortener/LinkErrorScreen/LinkErrorScreen';
import { fetchLinks } from '@/api/shortener';
import type { LinkRow } from '@/types/shortener';

function findMatchingLink(
  links: LinkRow[],
  targetCode: string
): LinkRow | undefined {
  const clean = targetCode.trim().toLowerCase();
  return links.find((l) => {
    const shortcutPart = (
      l.shortcut ||
      l.shortUrl.split('/').pop() ||
      l.id ||
      ''
    )
      .trim()
      .toLowerCase();
    return shortcutPart === clean || l.id.trim().toLowerCase() === clean;
  });
}

/**
 * Страница перехода по короткой ссылке (/s/:code).
 * Проверяет статус ссылки и либо выполняет редирект, либо отображает соответствующий служебный экран.
 */
export default function ShortLinkRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const [errorType, setErrorType] = useState<LinkErrorType | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function resolveShortcut() {
      if (!code || !code.trim()) {
        setErrorType('not-found');
        setIsLoading(false);
        return;
      }

      const rawCode = code.trim();

      // 1. Поиск через API
      let matched: LinkRow | undefined;
      try {
        const apiShortcuts = await fetchLinks();
        matched = findMatchingLink(apiShortcuts, rawCode);
      } catch {
        // Игнорируем ошибку сети при поиске
      }

      if (cancelled) return;

      // 3. Ссылка не существует -> экран 404 ("Такой ссылки не существует")
      if (!matched) {
        setErrorType('not-found');
        setIsLoading(false);
        return;
      }

      // 4. Ссылка заблокирована -> экран блокировки ("Переход по ссылке остановлен")
      if (
        matched.status === 'заблокирована' ||
        (matched.status as string) === 'blocked'
      ) {
        setErrorType('blocked');
        setIsLoading(false);
        return;
      }

      // 5. Ссылка неактивна -> если есть резервный URL — редирект на него, иначе экран ("Ссылка временно не работает")
      if (
        matched.status === 'неактивна' ||
        (matched.status as string) === 'inactive'
      ) {
        const reserve = matched.reserveUrl?.trim();
        if (reserve) {
          window.location.replace(reserve);
          return;
        }
        setErrorType('inactive');
        setIsLoading(false);
        return;
      }

      // 6. Ссылка активна -> редирект на целевой URL
      const target = matched.targetUrl?.trim();
      if (target) {
        window.location.replace(target);
        return;
      }

      setErrorType('not-found');
      setIsLoading(false);
    }

    resolveShortcut();

    return () => {
      cancelled = true;
    };
  }, [code]);

  if (isLoading) {
    return (
      <Flex
        minH="100vh"
        w="100%"
        bg="var(--bg)"
        align="center"
        justify="center"
        data-testid="short-link-redirect-loading"
      >
        <SpinnerLoader />
      </Flex>
    );
  }

  if (errorType) {
    return <LinkErrorScreen type={errorType} />;
  }

  return null;
}
