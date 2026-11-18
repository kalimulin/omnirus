import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import { usePageHeaderTitle } from '@/components/layouts/PageHeaderContext';
import SidebarLayout from '@/components/layouts/SidebarLayout';

// ===== МОКИ =====

vi.mock('@/components/organisms/Sidebar/Sidebar', () => ({
  Sidebar: () => <div data-testid="sidebar">Sidebar</div>
}));

vi.mock('@/components/molecules/PageHeader/PageHeader', () => ({
  default: ({
    title,
    breadcrumbTitle,
    breadcrumbs = []
  }: {
    title: string;
    breadcrumbTitle?: string;
    breadcrumbs?: { label: string; href?: string }[];
  }) => (
    <div data-testid="page-header">
      <span data-testid="page-header-breadcrumbs">
        {breadcrumbs.map((b) => b.label).join(' > ')}
        {breadcrumbs.length ? ' > ' : ''}
        {breadcrumbTitle ?? title}
      </span>
      <span data-testid="page-header-title">{title}</span>
    </div>
  )
}));

let mockIsAuthorized = false;
vi.mock('@/auth/AuthContext', () => ({
  useAuth: () => ({ isAuthorized: mockIsAuthorized, login: vi.fn() })
}));

// ===== СВОЙ RENDER (с MemoryRouter + initialEntries) =====

function renderLayout(path: string) {
  return render(
    <ChakraProvider>
      <MemoryRouter
        initialEntries={[path]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <SidebarLayout />
      </MemoryRouter>
    </ChakraProvider>
  );
}

// ===== ТЕСТЫ =====

describe('SidebarLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsAuthorized = false;
  });

  test('показывает заголовок для /create/email', () => {
    renderLayout('/create/email');
    expect(screen.getByTestId('page-header')).toHaveTextContent(
      /Создание e-mail рассылки/i
    );
  });

  test('показывает заголовок для /create/push', () => {
    renderLayout('/create/push');
    expect(screen.getByTestId('page-header')).toHaveTextContent(
      /Создание рассылки push-уведомлений/i
    );
  });

  test('показывает заголовок для /links как на /create/email', () => {
    renderLayout('/links');
    expect(screen.getByTestId('page-header')).toHaveTextContent(
      /Короткие ссылки/i
    );
  });

  test('показывает заголовок для /profile как на /create/email', () => {
    renderLayout('/profile');
    expect(screen.getByTestId('page-header')).toHaveTextContent(
      /Настройка профиля/i
    );
  });

  test('не показывает заголовок для неизвестного пути', () => {
    renderLayout('/unknown');
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('');
  });

  test('показывает заголовок и хлебную крошку «Короткие ссылки» для /links/:id', () => {
    renderLayout('/links/sc-1');
    expect(screen.getByTestId('page-header-title')).toHaveTextContent(
      /Карточка ссылки/i
    );
    expect(screen.getByTestId('page-header-breadcrumbs')).toHaveTextContent(
      /Короткие ссылки/i
    );
  });

  test('показывает заголовок и хлебную крошку «Кампании» для /campaigns/:id', () => {
    renderLayout('/campaigns/camp-1');
    expect(screen.getByTestId('page-header-title')).toHaveTextContent(
      /Кампания/i
    );
    expect(screen.getByTestId('page-header-breadcrumbs')).toHaveTextContent(
      /Кампании/i
    );
  });

  test('переопределяет заголовок страницы через usePageHeaderTitle, сохраняя хлебные крошки маршрута', () => {
    function DynamicChild() {
      usePageHeaderTitle('Пост в Telegram');
      return <div>Содержимое карточки</div>;
    }

    render(
      <ChakraProvider>
        <MemoryRouter
          initialEntries={['/links/sc-1']}
          future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
        >
          <Routes>
            <Route element={<SidebarLayout />}>
              <Route path="/links/:id" element={<DynamicChild />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </ChakraProvider>
    );

    expect(screen.getByTestId('page-header-title')).toHaveTextContent(
      'Пост в Telegram'
    );
    expect(screen.getByTestId('page-header-breadcrumbs')).toHaveTextContent(
      'Короткие ссылки > Карточка ссылки'
    );
  });
});
