import { DownloadIcon } from '@chakra-ui/icons';
import {
  Box,
  Button,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  useToast
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';

import { getQrCode } from '@/api/shortenerPublic';
import type { QrModalProps } from '@/types/shortener';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function triggerDownload(href: string, filename: string): void {
  const a = document.createElement('a');
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

async function svgBlobToPngBlob(svgBlob: Blob, size = 512): Promise<Blob> {
  const objectUrl = URL.createObjectURL(svgBlob);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () =>
        reject(new Error('Не удалось преобразовать QR-код в PNG'));
      image.src = objectUrl;
    });

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Canvas 2D контекст недоступен');
    }

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, 0, 0, size, size);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
    if (!pngBlob) {
      throw new Error('Не удалось сформировать PNG');
    }
    return pngBlob;
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export function QrModal({ shortUrl, shortcut, onClose }: QrModalProps) {
  const toast = useToast();
  const [qrImageUrl, setQrImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Загрузка QR (оверлей, Escape и блокировка скролла — штатные возможности
  // Chakra Modal, отдельная обработка не нужна)
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadError(false);
      try {
        const data = await getQrCode(shortcut);
        if (!cancelled) {
          setQrImageUrl(data.qrImageUrl);
          setLoading(false);
        }
      } catch {
        if (!cancelled) {
          setLoadError(true);
          setLoading(false);
        }
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [shortcut]);

  const doDownload = async (ext: 'png' | 'svg') => {
    if (!qrImageUrl) return;
    const filename = `qr-${shortcut}.${ext}`;
    setIsDownloading(true);
    try {
      if (qrImageUrl.startsWith('data:')) {
        triggerDownload(qrImageUrl, filename);
      } else {
        const res = await fetch(qrImageUrl);
        if (!res.ok) {
          throw new Error('Не удалось скачать QR-код');
        }
        const fetchedBlob = await res.blob();
        const isSvg =
          fetchedBlob.type.includes('svg') ||
          qrImageUrl.toLowerCase().includes('.svg');
        const outputBlob =
          ext === 'png' && isSvg
            ? await svgBlobToPngBlob(fetchedBlob)
            : fetchedBlob;

        const blobUrl = URL.createObjectURL(outputBlob);
        triggerDownload(blobUrl, filename);
        URL.revokeObjectURL(blobUrl);
      }
      toast({
        title: `QR-код (${ext.toUpperCase()}) успешно скачан`,
        status: 'success',
        duration: 4000,
        isClosable: true
      });
    } catch {
      toast({
        title: 'Не удалось скачать QR-код',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setIsDownloading(false);
    }
  };

  const canDownload = !loading && !loadError && !isDownloading;

  return (
    <Modal
      isOpen
      onClose={onClose}
      isCentered
    >
      <ModalOverlay />
      <ModalContent
        w="320px"
        borderRadius="12px"
        px={6}
        pt={6}
        pb={5}
      >
        <ModalHeader
          fontSize="16px"
          fontWeight="600"
          color="var(--text)"
          p={0}
          mb={5}
        >
          Скачать Qr-код
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody
          p={0}
          display="flex"
          flexDirection="column"
          alignItems="center"
        >
          <Box
            w="196px"
            h="196px"
            display="flex"
            alignItems="center"
            justifyContent="center"
            mb={5}
          >
            {loading && <Spinner color="var(--primary)" size="lg" />}
            {loadError && (
              <Text
                fontSize="13px"
                color="var(--error)"
                textAlign="center"
              >
                Не удалось загрузить QR-код
              </Text>
            )}
            {!loading && !loadError && qrImageUrl && (
              <img
                src={qrImageUrl}
                alt={`QR-код для ${shortUrl}`}
                onError={() => setLoadError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            )}
          </Box>
        </ModalBody>
        <ModalFooter
          p={0}
          pt={4}
          w="100%"
          gap={2}
        >
          <Button
            variant="ghost"
            flex={1}
            fontSize="14px"
            fontWeight="500"
            color="var(--primary-800)"
            isDisabled={!canDownload}
            _hover={{ bg: 'var(--zinc-100)', color: 'var(--text)' }}
            rightIcon={<DownloadIcon boxSize={3} />}
            onClick={() => doDownload('png')}
          >
            Скачать PNG
          </Button>
          <Button
            variant="ghost"
            flex={1}
            fontSize="14px"
            fontWeight="500"
            color="var(--primary-800)"
            isDisabled={!canDownload}
            _hover={{ bg: 'var(--zinc-100)', color: 'var(--text)' }}
            rightIcon={<DownloadIcon boxSize={3} />}
            onClick={() => doDownload('svg')}
          >
            Скачать SVG
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export default QrModal;
