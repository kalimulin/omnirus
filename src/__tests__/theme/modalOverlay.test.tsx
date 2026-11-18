import {
  ChakraProvider,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay
} from '@chakra-ui/react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within
} from '@testing-library/react';
import type { ReactElement } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import {
  checkUrlSafety,
  createShortcut,
  getQrCode
} from '@/api/shortenerPublic';
import LogoutModal from '@/components/organisms/Modals/LogoutModal';
import { DeactivateLinkModal } from '@/components/shortener/DeactivateLinkModal/DeactivateLinkModal';
import { EditLinkModal } from '@/components/shortener/EditLinkModal/EditLinkModal';
import ProgressModal from '@/components/shortener/ProgressModal/ProgressModal';
import { QrModal } from '@/components/shortener/QrModal/QrModal';
import { RedirectModal } from '@/components/shortener/RedirectModal/RedirectModal';
import { RedirectPromptModal } from '@/components/shortener/RedirectPromptModal/RedirectPromptModal';
import { ShortenModal } from '@/components/shortener/ShortenModal/ShortenModal';
import CampaignsPage from '@/pages/Shortener/CampaignsPage/CampaignsPage';
import LinksRegistryPage from '@/pages/Shortener/LinksRegistryPage/LinksRegistryPage';
import theme from '@/theme';

vi.mock('@/api/shortenerPublic', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/api/shortenerPublic')>();
  return {
    ...actual,
    getQrCode: vi.fn(),
    checkUrlSafety: vi.fn(),
    createShortcut: vi.fn()
  };
});

const mockedGetQrCode = vi.mocked(getQrCode);
const mockedCheckUrlSafety = vi.mocked(checkUrlSafety);
const mockedCreateShortcut = vi.mocked(createShortcut);

function renderWithTheme(ui: ReactElement) {
  return render(
    <MemoryRouter>
      <ChakraProvider theme={theme}>{ui}</ChakraProvider>
    </MemoryRouter>
  );
}

function getOverlayElements(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>('.chakra-modal__overlay')
  );
}

function getLastOverlayElement(): HTMLElement {
  const overlays = getOverlayElements();
  expect(overlays.length).toBeGreaterThan(0);
  return overlays[overlays.length - 1]!;
}

function getOverlayCssRules(overlay: HTMLElement): string {
  const classes = Array.from(overlay.classList).filter((cls) =>
    cls.startsWith('css-')
  );
  const styleTexts = Array.from(document.querySelectorAll('style'))
    .map((el) => el.textContent ?? '')
    .join('\n');

  const sheetRuleTexts = Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText);
      } catch {
        return [];
      }
    })
    .join('\n');

  const allCss = `${styleTexts}\n${sheetRuleTexts}`;
  return classes
    .flatMap((cls) =>
      allCss
        .split('}')
        .filter((chunk) => chunk.includes(`.${cls}`))
        .map((chunk) => `${chunk}}`)
    )
    .join('\n');
}

function expectUnifiedOverlay(overlay: HTMLElement) {
  const computed = window.getComputedStyle(overlay);
  const css = getOverlayCssRules(overlay);

  expect(computed.backgroundColor).toBe('rgba(18, 35, 63, 0.3)');
  expect(css).toContain('rgba(18, 35, 63, 0.3)');
  expect(css).toContain('backdrop-filter:none');
  expect(css).not.toContain('blur(');
  expect(css).not.toContain('0.35');
  expect(css).not.toContain('0.45');
}

describe('Единое затемнение модальных окон без размытой подложки', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    Element.prototype.scrollTo = vi.fn();
    mockedGetQrCode.mockResolvedValue({
      shortcut: '3a0alc',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      qrImageUrl:
        'https://shortcut-external.fenimore.skroy.ru/public/qr/3a0alc/image'
    });
    mockedCheckUrlSafety.mockResolvedValue({
      url: 'https://example.ru/promo',
      threatLevel: 'safe',
      isSafe: true,
      isSuspicious: false,
      isBlocked: false,
      isInvalid: false,
      reasons: [],
      score: 0,
      timestamp: '2026-11-10T10:00:00Z',
      checkedBy: 'validator',
      recommendations: [],
      error: null
    });
    mockedCreateShortcut.mockResolvedValue({
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      originalUrl: 'https://example.ru/promo',
      createdAt: '2026-11-10T10:00:00Z',
      isSecure: true,
      shortcut: '3a0alc',
      shortcutId: 'uuid-3a0alc',
      securityScore: 0
    });
  });

  afterEach(() => {
    cleanup();
    localStorage.clear();
  });

  test('тема Modal задает затемнение #12233F с прозрачностью 30% и без размытия', () => {
    const modalTheme = theme.components.Modal;
    const resolvedBaseStyle =
      typeof modalTheme.baseStyle === 'function'
        ? modalTheme.baseStyle({ colorMode: 'light', theme })
        : modalTheme.baseStyle;

    expect(resolvedBaseStyle.overlay).toMatchObject({
      bg: 'rgba(18, 35, 63, 0.3)',
      backdropFilter: 'none'
    });
    expect(modalTheme.variants).toBeUndefined();
  });

  test('базовый Chakra Modal использует единый оверлей #12233F (30%) без размытия', () => {
    renderWithTheme(
      <Modal
        isOpen
        onClose={vi.fn()}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal</ModalHeader>
          <ModalBody>Content</ModalBody>
        </ModalContent>
      </Modal>
    );

    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('LogoutModal использует единое затемнение без подложки', () => {
    renderWithTheme(
      <LogoutModal
        isOpen
        onClose={vi.fn()}
        logout={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('ProgressModal использует единое затемнение без подложки', () => {
    renderWithTheme(
      <ProgressModal
        title="Сохраняем данные"
        error="Тестовая ошибка"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('QrModal использует единое затемнение без подложки', async () => {
    renderWithTheme(
      <QrModal
        shortUrl="shortcut-external.fenimore.skroy.ru/s/3a0alc"
        shortcut="3a0alc"
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('ShortenModal использует единое затемнение без подложки', () => {
    renderWithTheme(
      <ShortenModal
        isOpen
        onClose={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('EditLinkModal использует единое затемнение без подложки', () => {
    renderWithTheme(
      <EditLinkModal
        isOpen
        onClose={vi.fn()}
        link={{
          id: 'link-1',
          name: 'Пост в Телеграм',
          description: 'Описание',
          shortUrl: 'omni/fbl2V',
          shortcut: 'fbl2V',
          targetUrl: 'https://example.com/example_channel/5678/social-media',
          campaign: 'Без кампании',
          tags: ['promo'],
          status: 'active',
          clicks: 0,
          createdAt: '2026-11-12T10:00:00Z'
        }}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('DeactivateLinkModal использует единое затемнение без подложки', () => {
    renderWithTheme(
      <DeactivateLinkModal
        isOpen
        onClose={vi.fn()}
        onConfirm={vi.fn()}
        link={{
          id: 'link-1',
          name: 'Пост в Телеграм',
          description: 'Описание',
          shortUrl: 'omni/fbl2V',
          shortcut: 'fbl2V',
          targetUrl: 'https://example.com/example_channel/5678/social-media',
          campaign: 'Без кампании',
          tags: ['promo'],
          status: 'active',
          clicks: 0,
          createdAt: '2026-11-12T10:00:00Z'
        }}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('RedirectModal и окно подтверждения закрытия используют единое затемнение без подложки', () => {
    renderWithTheme(
      <RedirectModal
        isOpen
        onClose={vi.fn()}
        shortUrl="https://clck.ru/abc"
        initialTargetUrl="https://example.com"
        onSave={vi.fn()}
      />
    );

    const dialog = screen.getByRole('dialog');
    expectUnifiedOverlay(getLastOverlayElement());

    const input = within(dialog).getByDisplayValue('https://example.com');
    fireEvent.change(input, {
      target: { value: 'https://example.com/changed' }
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Отмена' }));

    expect(screen.getByText('Закрыть без сохранения?')).toBeInTheDocument();
    const overlays = getOverlayElements();
    expect(overlays).toHaveLength(2);
    overlays.forEach((overlay) => expectUnifiedOverlay(overlay));
  });

  test('RedirectPromptModal использует единое затемнение без подложки', () => {
    renderWithTheme(
      <RedirectPromptModal
        isOpen
        onClose={vi.fn()}
        onEdit={vi.fn()}
        shortUrl="https://clck.ru/abc"
        newTargetUrl="https://example.com/new"
        name="Промо"
        dontShowAgain={false}
        onDontShowAgainChange={vi.fn()}
      />
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('модальное окно создания/редактирования кампании в CampaignsPage использует единое затемнение без подложки', () => {
    renderWithTheme(<CampaignsPage />);

    fireEvent.click(
      screen.getByRole('button', { name: /Создать (первую )?кампанию/i })
    );

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });

  test('модальное окно добавления ссылки в кампанию в LinksRegistryPage использует единое затемнение без подложки', () => {
    const mockCampaign = {
      id: 'camp-1',
      name: 'Летние продажи',
      description: '',
      linksCount: 0,
      shortLinksCount: 0,
      totalClicks: 0,
      createdAt: '2026-09-01T10:00:00.000Z',
      tags: ['promo']
    };
    const mockLink = {
      id: '3a0alc',
      name: 'Черная пятница - Телеграм',
      description: 'Пост в Telegram',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      shortcut: '3a0alc',
      targetUrl: 'https://example.com/black-friday/social-media',
      campaign: 'Без кампании',
      tags: ['telegram'],
      status: 'active' as const,
      clicks: 0,
      createdAt: '2026-09-10T10:00:00.000Z'
    };

    renderWithTheme(
      <LinksRegistryPage links={[mockLink]} campaigns={[mockCampaign]} />
    );

    fireEvent.click(
      screen.getByRole('button', { name: 'Действия со ссылкой' })
    );
    fireEvent.click(screen.getByText('Добавить в кампанию'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expectUnifiedOverlay(getLastOverlayElement());
  });
});
