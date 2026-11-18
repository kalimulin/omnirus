import { createContext, useContext, useEffect } from 'react';

interface PageHeaderContextValue {
  setTitleOverride: (title: string | null) => void;
}

export const PageHeaderContext = createContext<PageHeaderContextValue>({
  setTitleOverride: () => {},
});

export function usePageHeaderTitle(title?: string | null) {
  const { setTitleOverride } = useContext(PageHeaderContext);

  useEffect(() => {
    setTitleOverride(title || null);
    return () => {
      setTitleOverride(null);
    };
  }, [setTitleOverride, title]);
}
