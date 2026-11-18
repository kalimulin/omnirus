import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import { getQrCode } from '@/api/shortenerPublic';
import { QrModal } from '@/components/shortener/QrModal/QrModal';

vi.mock('@/api/shortenerPublic', () => ({
  getQrCode: vi.fn()
}));

const mockedGetQrCode = vi.mocked(getQrCode);

describe('QrModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  const renderModal = (onClose = vi.fn()) =>
    render(
      <ChakraProvider>
        <QrModal
          shortUrl="shortcut-external.fenimore.skroy.ru/s/3a0alc"
          shortcut="3a0alc"
          onClose={onClose}
        />
      </ChakraProvider>
    );

  test('загружает и отображает QR-код с resolved URL из API', async () => {
    mockedGetQrCode.mockResolvedValueOnce({
      shortcut: '3a0alc',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      qrImageUrl:
        'https://shortcut-external.fenimore.skroy.ru/public/qr/3a0alc/image'
    });

    renderModal();

    const img = await screen.findByRole('img', {
      name: 'QR-код для shortcut-external.fenimore.skroy.ru/s/3a0alc'
    });
    expect(img).toHaveAttribute(
      'src',
      'https://shortcut-external.fenimore.skroy.ru/public/qr/3a0alc/image'
    );
    expect(screen.getByRole('button', { name: 'Скачать SVG' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Скачать PNG' })).toBeEnabled();
  });

  test('при ошибке API отображает сообщение об ошибке без мок-фолбэка и блокирует кнопки', async () => {
    mockedGetQrCode.mockRejectedValueOnce(new Error('Network failure'));

    renderModal();

    expect(
      await screen.findByText('Не удалось загрузить QR-код')
    ).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
    expect(screen.getByRole('button', { name: 'Скачать SVG' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Скачать PNG' })).toBeDisabled();
  });

  test('скачивание SVG загружает изображение с API и инициирует загрузку файла', async () => {
    mockedGetQrCode.mockResolvedValueOnce({
      shortcut: '3a0alc',
      shortUrl: 'shortcut-external.fenimore.skroy.ru/s/3a0alc',
      qrImageUrl:
        'https://shortcut-external.fenimore.skroy.ru/public/qr/3a0alc/image'
    });

    const svgBlob = new Blob(['<svg width="41" height="41"></svg>'], {
      type: 'image/svg+xml'
    });
    const fetchMock = vi.fn().mockResolvedValueOnce({
      ok: true,
      blob: async () => svgBlob
    });
    vi.stubGlobal('fetch', fetchMock);

    const origCreateObjectUrl = URL.createObjectURL;
    const origRevokeObjectUrl = URL.revokeObjectURL;
    const createObjectUrlMock = vi.fn().mockReturnValue('blob:qr-test');
    const revokeObjectUrlMock = vi.fn();
    URL.createObjectURL = createObjectUrlMock;
    URL.revokeObjectURL = revokeObjectUrlMock;
    const anchorClickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {});

    try {
      renderModal();

      const downloadSvgBtn = await screen.findByRole('button', {
        name: 'Скачать SVG'
      });
      await waitFor(() => expect(downloadSvgBtn).toBeEnabled());

      fireEvent.click(downloadSvgBtn);

      await waitFor(() => {
        expect(fetchMock).toHaveBeenCalledWith(
          'https://shortcut-external.fenimore.skroy.ru/public/qr/3a0alc/image'
        );
        expect(createObjectUrlMock).toHaveBeenCalledWith(svgBlob);
        expect(anchorClickSpy).toHaveBeenCalled();
        expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:qr-test');
      });
    } finally {
      URL.createObjectURL = origCreateObjectUrl;
      URL.revokeObjectURL = origRevokeObjectUrl;
    }
  });
});
