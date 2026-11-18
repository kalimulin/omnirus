import {
  ChakraProvider,
  type AlertStatus,
  type ToastProviderProps,
  useToast
} from '@chakra-ui/react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test } from 'vitest';

import { StatusToast } from '@/components/atoms/StatusToast/StatusToast';
import theme from '@/theme';

const testToastOptions: ToastProviderProps = {
  defaultOptions: {
    duration: 4000,
    position: 'bottom',
    render: ({ id, status, title, description, icon }) => (
      <StatusToast
        id={id}
        status={status}
        title={title}
        description={description}
        icon={icon}
      />
    )
  }
};

function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ChakraProvider
      theme={theme}
      toastOptions={testToastOptions}
    >
      {ui}
    </ChakraProvider>
  );
}

describe('StatusToast', () => {
  test('рендерит заголовок и описание для статуса success', () => {
    renderWithTheme(
      <StatusToast
        status="success"
        title="Целевой URL успешно изменен"
        description="Все переходы теперь направляются по новому адресу"
      />
    );

    expect(screen.getByText('Целевой URL успешно изменен')).toBeInTheDocument();
    expect(
      screen.getByText('Все переходы теперь направляются по новому адресу')
    ).toBeInTheDocument();
  });

  test('корректно работает без описания и с кастомной иконкой', () => {
    renderWithTheme(
      <StatusToast
        status="info"
        title="Ссылка деактивирована"
        icon={<span data-testid="custom-toast-icon">!</span>}
      />
    );

    expect(screen.getByText('Ссылка деактивирована')).toBeInTheDocument();
    expect(screen.getByTestId('custom-toast-icon')).toBeInTheDocument();
  });

  const statuses: AlertStatus[] = [
    'success',
    'error',
    'warning',
    'info',
    'loading'
  ];

  statuses.forEach((status) => {
    test(`устанавливает атрибут data-status="${status}" и отображает иконку`, () => {
      const { container } = renderWithTheme(
        <StatusToast
          id={`test-${status}`}
          status={status}
          title={`Статус: ${status}`}
        />
      );

      const alert = container.querySelector('.chakra-alert');
      expect(alert).toHaveAttribute('data-status', status);
      expect(
        container.querySelector('.chakra-alert__icon')
      ).toBeInTheDocument();
    });
  });

  test('глобальные toastOptions рендерят стандартный вызов useToast через StatusToast', async () => {
    const user = userEvent.setup();

    function Trigger() {
      const toast = useToast();
      return (
        <button
          type="button"
          onClick={() =>
            toast({
              title: 'Ошибка сохранения',
              description: 'Попробуйте еще раз',
              status: 'error',
              isClosable: true
            })
          }
        >
          Показать уведомление
        </button>
      );
    }

    renderWithTheme(<Trigger />);

    await user.click(
      screen.getByRole('button', { name: 'Показать уведомление' })
    );

    expect(await screen.findByText('Ошибка сохранения')).toBeInTheDocument();
    expect(screen.getByText('Попробуйте еще раз')).toBeInTheDocument();
    expect(document.querySelector('.chakra-alert')).toHaveAttribute(
      'data-status',
      'error'
    );
    expect(
      screen.queryByRole('button', { name: 'Close' })
    ).not.toBeInTheDocument();
  });
});
