import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import LandingHeader from '@/components/shortener/landing/LandingHeader/LandingHeader';

import { renderWithProviders } from '../../test/utils';

let mockIsAuthorized = false;
let mockAuthState: {
  firstName?: string;
  lastName?: string;
  login: string;
} = {
  firstName: 'Тест',
  lastName: 'Пользователь',
  login: 'test@example.com'
};

vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({
    isAuthorized: mockIsAuthorized,
    logout: vi.fn(),
    authState: mockAuthState,
    updateUser: vi.fn()
  })
}));

vi.mock('@/api/profile', () => ({
  fetchMyProfile: vi.fn().mockResolvedValue(null)
}));

describe('LandingHeader', () => {
  beforeEach(() => {
    mockIsAuthorized = false;
    mockAuthState = {
      firstName: 'Тест',
      lastName: 'Пользователь',
      login: 'test@example.com'
    };
    sessionStorage.clear();
  });

  test('для неавторизованного пользователя отображает кнопку Войти и Зарегистрироваться, но не меню пользователя', () => {
    mockIsAuthorized = false;
    renderWithProviders(<LandingHeader />);

    expect(screen.getByRole('link', { name: /войти/i })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /зарегистрироваться/i })
    ).toBeInTheDocument();
    expect(screen.queryByText('Тест Пользователь')).not.toBeInTheDocument();
  });

  test('для авторизованного пользователя скрывает Войти и отображает AccountWidget рядом с кнопкой Зарегистрироваться', () => {
    mockIsAuthorized = true;
    renderWithProviders(<LandingHeader />);

    expect(
      screen.queryByRole('link', { name: /войти/i })
    ).not.toBeInTheDocument();

    const registerButton = screen.getByRole('link', { name: /зарегистрироваться/i });
    expect(registerButton).toBeInTheDocument();

    const accountMenu = screen.getByText('Тест Пользователь');
    expect(accountMenu).toBeInTheDocument();

    expect(
      registerButton.compareDocumentPosition(accountMenu) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy();
  });
});
