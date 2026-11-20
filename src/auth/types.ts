import type { UserLimits } from '@/types/profile';

export interface AuthState {
  userId: string;
  login: string;
  accountId?: string | null;
  firstName?: string;
  lastName?: string;
}

export interface AuthCredentials extends AuthState {
  accessToken: string;
}

export interface AuthContextValue {
  authState: AuthState | null;
  isAuthorized: boolean;
  limits?: UserLimits | null;
  refreshLimits?: () => Promise<void>;
  login: (auth: AuthCredentials) => void;
  logout: () => void;
  updateUser: (partial: Partial<AuthState>) => void;
}
