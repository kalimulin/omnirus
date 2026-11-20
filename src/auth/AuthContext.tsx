import { createContext, useContext } from 'react';

import { AuthContextValue } from './types';

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      authState: null,
      isAuthorized: false,
      login: () => {},
      logout: () => {},
      updateUser: () => {}
    };
  }
  return ctx;
}
