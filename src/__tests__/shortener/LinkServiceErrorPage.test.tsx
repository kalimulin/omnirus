import { ChakraProvider } from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, test } from 'vitest';

import LinkServiceErrorPage from '@/pages/Shortener/LinkServiceErrorPage/LinkServiceErrorPage';

function renderWithRoute(
  initialEntry: string,
  element: React.ReactNode,
  path = '/links/errors/:type'
) {
  return render(
    <ChakraProvider>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path={path} element={element} />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );
}

describe('LinkServiceErrorPage — маршрутизация служебных экранов', () => {
  test('отображает экран not-found при маршруте /links/errors/not-found', () => {
    renderWithRoute('/links/errors/not-found', <LinkServiceErrorPage />);

    expect(
      screen.getByRole('heading', { name: 'Такой ссылки не существует' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Проверьте адрес: возможно, при копировании потерялся символ.'
      )
    ).toBeInTheDocument();
  });

  test('отображает экран inactive при маршруте /links/errors/inactive', () => {
    renderWithRoute('/links/errors/inactive', <LinkServiceErrorPage />);

    expect(
      screen.getByRole('heading', { name: 'Ссылка временно не работает' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Автор приостановил переходы по этой короткой ссылке. Возможно, она заработает позже — уточните у того, кто ее прислал.'
      )
    ).toBeInTheDocument();
  });

  test('отображает экран blocked при маршруте /links/errors/blocked', () => {
    renderWithRoute('/links/errors/blocked', <LinkServiceErrorPage />);

    expect(
      screen.getByRole('heading', { name: 'Переход по ссылке остановлен' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Адрес назначения не прошел проверку безопасности и заблокирован модератором сервиса. Если вы получили эту ссылку в сообщении, будьте осторожны с отправителем.'
      )
    ).toBeInTheDocument();
  });

  test('поддерживает определение типа через query-параметр ?type=inactive', () => {
    renderWithRoute(
      '/links/errors?type=inactive',
      <LinkServiceErrorPage />,
      '/links/errors'
    );

    expect(
      screen.getByRole('heading', { name: 'Ссылка временно не работает' })
    ).toBeInTheDocument();
  });
});
