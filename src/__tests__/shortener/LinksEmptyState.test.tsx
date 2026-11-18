import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import { LinksEmptyState } from '@/components/shortener/LinksRegistryTable/LinksEmptyState';

describe('LinksEmptyState', () => {
  test('отображает полное пустое состояние и реагирует на клик кнопки', () => {
    const handleShortenClick = vi.fn();

    render(
      <LinksEmptyState
        title="Сократите ссылку до удобного короткого адреса"
        onShortenClick={handleShortenClick}
      />
    );

    // Заголовок страницы
    expect(
      screen.getByText('Сократите ссылку до удобного короткого адреса')
    ).toBeInTheDocument();

    // Верхняя карточка пустого состояния
    expect(
      screen.getByText('Здесь появится список ваших ссылок')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Нажмите кнопку ниже, чтобы сократить вашу первую ссылку'
      )
    ).toBeInTheDocument();

    const shortenBtn = screen.getByRole('button', { name: 'Сократить ссылку' });
    expect(shortenBtn).toBeInTheDocument();
    fireEvent.click(shortenBtn);
    expect(handleShortenClick).toHaveBeenCalledTimes(1);

    // Нижняя карточка возможностей
    expect(screen.getByText('Больше возможностей')).toBeInTheDocument();
    expect(screen.getByText('для вашего маркетинга')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Храните все короткие ссылки в личном кабинете, редактируйте целевой URL и отслеживайте переход.'
      )
    ).toBeInTheDocument();

    // 4 карточки преимуществ
    expect(screen.getByText('Короткие ссылки')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Легко делитесь ссылками в мессенджерах, соцсетях и письмах'
      )
    ).toBeInTheDocument();

    expect(screen.getByText('Аналитика переходов')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Смотрите, сколько людей переходят по ссылкам, и откуда'
      )
    ).toBeInTheDocument();

    expect(
      screen.getByText('Удобное управление с регистрацией')
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Редактируйте ссылки, добавляйте UTM-метки и сохраняйте их в личном кабинете'
      )
    ).toBeInTheDocument();

    expect(screen.getByText('Безопасность и надежность')).toBeInTheDocument();
    expect(
      screen.getByText('Проверяем ссылки на вирусы и фишинг')
    ).toBeInTheDocument();
  });

  test('скрывает заголовок, если title === null', () => {
    render(
      <LinksEmptyState
        title={null}
        onShortenClick={vi.fn()}
      />
    );

    expect(
      screen.queryByText('Сократите ссылку до удобного короткого адреса')
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('Здесь появится список ваших ссылок')
    ).toBeInTheDocument();
  });
});
