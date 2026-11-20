import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode
} from 'react';

import { fetchUserLimits } from '@/api/profile';
import { setUserId } from '@/services/metrika';
import type { UserLimits } from '@/types/profile';
import { AuthContext } from './AuthContext';
import {
  clearAuthCookies,
  readAuthCookies,
  saveAuthCookies,
  updateAuthCookies
} from './authCookies';
import type { AuthCredentials, AuthState } from './types';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [authState, setAuthState] = useState<AuthState | null>(readAuthCookies);
  const [limits, setLimits] = useState<UserLimits | null>(null);

  const refreshLimits = useCallback(async () => {
    if (!readAuthCookies()?.userId) {
      setLimits(null);
      return;
    }
    const data = await fetchUserLimits();
    if (data) {
      setLimits(data);
    }
  }, []);

  const login = useCallback((auth: AuthCredentials) => {
    saveAuthCookies(auth);
    setAuthState({
      userId: auth.userId,
      login: auth.login,
      accountId: auth.accountId ?? null,
      firstName: auth.firstName,
      lastName: auth.lastName
    });
    void fetchUserLimits(auth.accessToken).then((data) => {
      if (data) setLimits(data);
    });
  }, []);

  const updateUser = useCallback((partial: Partial<AuthState>) => {
    updateAuthCookies(partial);
    setAuthState((current) => (current ? { ...current, ...partial } : current));
  }, []);

  const logout = useCallback(() => {
    clearAuthCookies();
    sessionStorage.removeItem('profile_data');
    setAuthState(null);
    setLimits(null);
  }, []);

  useEffect(() => {
    if (authState?.userId) {
      setUserId(authState.userId);
      void refreshLimits();
    } else {
      setLimits(null);
    }
  }, [authState?.userId, refreshLimits]);

  useEffect(() => {
    localStorage.removeItem('usercenter_auth');
  }, []);

  useEffect(() => {
    const syncAuth = () => {
      const current = readAuthCookies();
      setAuthState(current);
      if (current?.userId) {
        void refreshLimits();
      } else {
        setLimits(null);
      }
    };

    window.addEventListener('focus', syncAuth);
    return () => window.removeEventListener('focus', syncAuth);
  }, [refreshLimits]);

  const value = useMemo(
    () => ({
      authState,
      isAuthorized: Boolean(authState),
      limits,
      refreshLimits,
      login,
      logout,
      updateUser
    }),
    [authState, limits, refreshLimits, login, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
