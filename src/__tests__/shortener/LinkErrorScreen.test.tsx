import { screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';

import {
  LinkErrorScreen,
  LINK_ERROR_CONFIGS,
  normalizeLinkErrorType
} from '@/components/shortener/LinkErrorScreen';
import { renderWithProviders } from '../../test/utils';

describe('LinkErrorScreen — служебные экраны ошибок ссылок', () => {
  test('нормализует различные варианты обозначений ошибок', () => {
    expect(normalizeLinkErrorType('not-found')).toBe('not-found');
    expect(normalizeLinkErrorType('404')).toBe('not-found');
    expect(normalizeLinkErrorType(null)).toBe('not-found');
    expect(normalizeLinkErrorType(undefined)).toBe('not-found');

    expect(normalizeLinkErrorType('inactive')).toBe('inactive');
    expect(normalizeLinkErrorType('неактивна')).toBe('inactive');
    expect(normalizeLinkErrorType('paused')).toBe('inactive');
    expect(normalizeLinkErrorType('disabled')).toBe('inactive');

    expect(normalizeLinkErrorType('blocked')).toBe('blocked');
    expect(normalizeLinkErrorType('заблокирована')).toBe('blocked');
    expect(normalizeLinkErrorType('banned')).toBe('blocked');
    expect(normalizeLinkErrorType('forbidden')).toBe('blocked');
  });

  test('рендерит экран «Такой ссылки не существует» (not-found)', () => {
    renderWithProviders(<LinkErrorScreen type="not-found" />);

    expect(
      screen.getByRole('heading', { name: 'Такой ссылки не существует' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Проверьте адрес: возможно, при копировании потерялся символ.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('link-error-screen-not-found')).toBeInTheDocument();
  });

  test('рендерит экран «Ссылка временно не работает» (inactive / неактивна)', () => {
    renderWithProviders(<LinkErrorScreen type="inactive" />);

    expect(
      screen.getByRole('heading', { name: 'Ссылка временно не работает' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Автор приостановил переходы по этой короткой ссылке. Возможно, она заработает позже — уточните у того, кто ее прислал.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('link-error-screen-inactive')).toBeInTheDocument();
  });

  test('рендерит экран «Переход по ссылке остановлен» (blocked / заблокирована)', () => {
    renderWithProviders(<LinkErrorScreen type="blocked" />);

    expect(
      screen.getByRole('heading', { name: 'Переход по ссылке остановлен' })
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'Адрес назначения не прошел проверку безопасности и заблокирован модератором сервиса. Если вы получили эту ссылку в сообщении, будьте осторожны с отправителем.'
      )
    ).toBeInTheDocument();
    expect(screen.getByTestId('link-error-screen-blocked')).toBeInTheDocument();
  });

  test('поддерживает переопределение заголовка и подзаголовка', () => {
    renderWithProviders(
      <LinkErrorScreen
        type="not-found"
        title="Кастомный заголовок"
        subtitle="Кастомное пояснение для пользователя"
      >
        <button type="button">На главную</button>
      </LinkErrorScreen>
    );

    expect(
      screen.getByRole('heading', { name: 'Кастомный заголовок' })
    ).toBeInTheDocument();
    expect(
      screen.getByText('Кастомное пояснение для пользователя')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'На главную' })
    ).toBeInTheDocument();
  });

  test('проверяет соответствие текстов конфигурации LINK_ERROR_CONFIGS макету', () => {
    expect(LINK_ERROR_CONFIGS['not-found'].title).toBe('Такой ссылки не существует');
    expect(LINK_ERROR_CONFIGS['not-found'].subtitle).toBe(
      'Проверьте адрес: возможно, при копировании потерялся символ.'
    );

    expect(LINK_ERROR_CONFIGS.inactive.title).toBe('Ссылка временно не работает');
    expect(LINK_ERROR_CONFIGS.inactive.subtitle).toBe(
      'Автор приостановил переходы по этой короткой ссылке. Возможно, она заработает позже — уточните у того, кто ее прислал.'
    );

    expect(LINK_ERROR_CONFIGS.blocked.title).toBe('Переход по ссылке остановлен');
    expect(LINK_ERROR_CONFIGS.blocked.subtitle).toBe(
      'Адрес назначения не прошел проверку безопасности и заблокирован модератором сервиса. Если вы получили эту ссылку в сообщении, будьте осторожны с отправителем.'
    );
  });
});
