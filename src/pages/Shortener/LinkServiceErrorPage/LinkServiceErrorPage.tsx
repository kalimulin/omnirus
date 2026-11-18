import { useParams, useSearchParams } from 'react-router-dom';

import {
  LinkErrorScreen,
  normalizeLinkErrorType,
  type LinkErrorType
} from '@/components/shortener/LinkErrorScreen';

interface LinkServiceErrorPageProps {
  defaultType?: LinkErrorType;
}

/**
 * Страница служебного экрана ошибок ссылок.
 * Определяет тип ошибки из параметров пути (:type) или query-параметров (?type=... или ?status=...).
 */
export default function LinkServiceErrorPage({
  defaultType
}: LinkServiceErrorPageProps) {
  const { type: pathType } = useParams<{ type?: string }>();
  const [searchParams] = useSearchParams();
  const queryType = searchParams.get('type') || searchParams.get('status');

  const resolvedType = normalizeLinkErrorType(
    pathType || queryType || defaultType || 'not-found'
  );

  return <LinkErrorScreen type={resolvedType} />;
}
