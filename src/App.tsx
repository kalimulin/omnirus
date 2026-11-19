import { Flex } from '@chakra-ui/react';
import { lazy, Suspense, ComponentType } from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';

import CookieBanner from './components/molecules/CookieBanner/CookieBanner';
import MetrikaTracker from './components/atoms/MetrikaTracker/MetrikaTracker';
import SpinnerLoader from './components/atoms/Loaders/SpinnerLoader/SpinnerLoader';
import SidebarLayout from './components/layouts/SidebarLayout';
import { NotFoundPage } from './pages/NotFoundPage/NotFoundPage';
import AuthPages from './pages/Auth/AuthPages';
import ProtectedRoute from './routing/ProtectedRoute';
import { ROUTES } from './routing/routes';

function lazyWithMinDelay<P extends object>(
  factory: () => Promise<{ default: ComponentType<P> }>,
  minDelay = 400
) {
  return lazy(() =>
    Promise.all([
      factory(),
      new Promise((resolve) => setTimeout(resolve, minDelay))
    ]).then(([moduleExports]) => moduleExports)
  );
}

const AboutYourselfPage = lazyWithMinDelay(
  () => import('@/pages/Auth/AboutYourselfPage')
);
const LinksRegistryPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/LinksRegistryPage/LinksRegistryPage')
);
const LinkDetailPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/LinkDetailPage/LinkDetailPage')
);
const CampaignsPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/CampaignsPage/CampaignsPage')
);
const CampaignDetailPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/CampaignDetailPage/CampaignDetailPage')
);
const AddCampaignLinkPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/AddCampaignLinkPage/AddCampaignLinkPage')
);
const LinksLandingPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/LinksLandingPage/LinksLandingPage')
);
const ProfilePage = lazyWithMinDelay(
  () => import('@/pages/ProfilePage/ProfilePage')
);
const LinkServiceErrorPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/LinkServiceErrorPage/LinkServiceErrorPage')
);
const ShortLinkRedirectPage = lazyWithMinDelay(
  () => import('@/pages/Shortener/ShortLinkRedirectPage/ShortLinkRedirectPage')
);
const TermsPage = lazyWithMinDelay(() => import('@/pages/TermsPage/TermsPage'));
const PrivacyPage = lazyWithMinDelay(
  () => import('@/pages/PrivacyPage/PrivacyPage')
);
const FeedbackPage = lazyWithMinDelay(
  () => import('@/pages/FeedbackPage/FeedbackPage')
);

function App() {
  return (
    <>
      <MetrikaTracker />
      <Suspense
        fallback={
          <Flex
            minW={'full'}
            minH={'100vh'}
            justifyContent={'center'}
            alignItems={'center'}
            bg={'var(--bg)'}
          >
            <SpinnerLoader />
          </Flex>
        }
      >
        <Routes>
          {/* Главная страница: гостям — лендинг сокращателя, авторизованным — редирект на /links */}
          <Route
            path={ROUTES.home}
            element={<LinksLandingPage />}
          />
          <Route
            path={ROUTES.linksLanding}
            element={
              <Navigate
                to={ROUTES.home}
                replace
              />
            }
          />

          {/* Защищённые страницы внутри бокового меню (Ссылки и Кампании) */}
          <Route element={<SidebarLayout />}>
            <Route element={<ProtectedRoute />}>
              <Route
                path={ROUTES.links}
                element={<LinksRegistryPage />}
              />
              <Route
                path={ROUTES.linkDetails}
                element={<LinkDetailPage />}
              />
              <Route
                path={ROUTES.campaigns}
                element={<CampaignsPage />}
              />
              <Route
                path={ROUTES.campaignDetails}
                element={<CampaignDetailPage />}
              />
              <Route
                path={ROUTES.addCampaignLink}
                element={<AddCampaignLinkPage />}
              />
              <Route
                path={ROUTES.editCampaignLink}
                element={<AddCampaignLinkPage />}
              />
              <Route
                path={ROUTES.profile}
                element={<ProfilePage />}
              />
              <Route
                path="/dashboard/profile"
                element={
                  <Navigate
                    to={ROUTES.profile}
                    replace
                  />
                }
              />
              <Route
                path="/dashboard"
                element={
                  <Navigate
                    to={ROUTES.links}
                    replace
                  />
                }
              />
            </Route>
          </Route>

          {/* Авторизация */}
          <Route
            path={ROUTES.login}
            element={<AuthPages mode="login" />}
          />
          <Route
            path={ROUTES.registration}
            element={<AuthPages mode="register" />}
          />
          <Route
            path={ROUTES.forgotPassword}
            element={<AuthPages mode="forgot-password" />}
          />
          <Route element={<ProtectedRoute />}>
            <Route
              path={ROUTES.about}
              element={<AboutYourselfPage />}
            />
          </Route>

          {/* Ошибки и редиректы коротких ссылок */}
          <Route
            path="/links/errors/:type"
            element={<LinkServiceErrorPage />}
          />
          <Route
            path="/links/errors"
            element={<LinkServiceErrorPage />}
          />
          <Route
            path="/link-error/:type"
            element={<LinkServiceErrorPage />}
          />
          <Route
            path="/link-error"
            element={<LinkServiceErrorPage />}
          />
          <Route
            path={ROUTES.shortRedirect}
            element={<ShortLinkRedirectPage />}
          />

          {/* Пользовательское соглашение и правила сервиса */}
          <Route
            path={ROUTES.terms}
            element={<TermsPage />}
          />
          <Route
            path="/agreement"
            element={
              <Navigate
                to={ROUTES.terms}
                replace
              />
            }
          />
          <Route
            path={ROUTES.privacy}
            element={<PrivacyPage />}
          />

          {/* Форма обратной связи */}
          <Route
            path={ROUTES.feedback}
            element={<FeedbackPage />}
          />
          <Route
            path="/support"
            element={
              <Navigate
                to={ROUTES.feedback}
                replace
              />
            }
          />
          <Route
            path="/contact"
            element={
              <Navigate
                to={ROUTES.feedback}
                replace
              />
            }
          />

          {/* 404 */}
          <Route
            path="*"
            element={<NotFoundPage />}
          />
        </Routes>
        <CookieBanner />
      </Suspense>
    </>
  );
}

export default App;
