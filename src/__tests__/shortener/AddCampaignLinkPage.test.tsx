import { ChakraProvider } from '@chakra-ui/react';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

import * as shortenerApi from '@/api/shortener';
import { clearAuthCookies, saveAuthCookies } from '@/auth/authCookies';
import AddCampaignLinkPage from '@/pages/Shortener/AddCampaignLinkPage/AddCampaignLinkPage';
import theme from '@/theme';

const renderAddCampaignLinkPage = (campaignId = 'camp-1') =>
  render(
    <ChakraProvider theme={theme}>
      <MemoryRouter initialEntries={[`/campaigns/${campaignId}/add-link`]}>
        <Routes>
          <Route
            path="/campaigns/:id/add-link"
            element={<AddCampaignLinkPage />}
          />
        </Routes>
      </MemoryRouter>
    </ChakraProvider>
  );

describe('AddCampaignLinkPage — поле Теги', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    saveAuthCookies({
      userId: 'user-1',
      login: 'tester@example.ru',
      accessToken: 'jwt-token-123'
    });

    vi.spyOn(shortenerApi, 'fetchCampaign').mockResolvedValue({
      id: 'camp-1',
      name: 'Тестовая кампания',
      description: 'Описание кампании',
      linksCount: 0,
      shortLinksCount: 0,
      clicksCount: 0,
      createdAt: '2026-11-10T10:00:00.000Z'
    });
    vi.spyOn(shortenerApi, 'fetchTags').mockResolvedValue([]);
  });

  afterEach(() => {
    clearAuthCookies();
  });

  test('инпут тегов имеет плейсхолдер и размер шрифта var(--font-size-sm)', async () => {
    renderAddCampaignLinkPage('camp-1');

    const tagInput = await screen.findByPlaceholderText(
      'Введите тег и нажмите Enter'
    );
    expect(tagInput).toBeInTheDocument();
    expect(tagInput.id).toBe('tag-input');
    expect(tagInput).toHaveStyle({
      fontSize: 'var(--font-size-sm)'
    });

    const tagsContainer = tagInput.closest('.add-link-page__tags-input');
    expect(tagsContainer).toBeInTheDocument();
  });

  test('рендерит карточки каналов с классом add-link-page__channel-card', async () => {
    const { container } = renderAddCampaignLinkPage('camp-1');

    await screen.findByPlaceholderText('Введите тег и нажмите Enter');

    const channelCards = container.querySelectorAll(
      '.add-link-page__channel-card'
    );
    expect(channelCards.length).toBeGreaterThan(0);
  });

  test('на вкладке "Задать метки вручную" рендерит поля формы в карточке add-link-page__manual-channel-card', async () => {
    const { container } = renderAddCampaignLinkPage('camp-1');

    await screen.findByPlaceholderText('Введите тег и нажмите Enter');

    const manualTab = screen.getByText('Задать метки вручную');
    fireEvent.click(manualTab);

    const manualCards = container.querySelectorAll(
      '.add-link-page__manual-channel-card'
    );
    expect(manualCards.length).toBeGreaterThan(0);

    const manualInputs = manualCards[0].querySelectorAll(
      '.add-link-page__input'
    );
    expect(manualInputs.length).toBe(5);
  });
});
