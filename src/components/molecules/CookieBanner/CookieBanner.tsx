import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routing/routes';
import './CookieBanner.scss';

const COOKIE_CONSENT_KEY = 'omni_cookie_consent';

export interface CookiePreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  timestamp: string;
}

export default function CookieBanner() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [functional, setFunctional] = useState(true);
  const [analytics, setAnalytics] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
      if (!stored) {
        setIsOpen(true);
      }
    } catch {
      // In case localStorage is blocked in private browsing
      setIsOpen(false);
    }
  }, []);

  const saveConsent = (prefs: { necessary: boolean; functional: boolean; analytics: boolean }) => {
    try {
      const data: CookiePreferences = {
        ...prefs,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(data));
    } catch {
      // ignore storage error
    }
    setIsOpen(false);
  };

  const handleAcceptAll = () => {
    saveConsent({ necessary: true, functional: true, analytics: true });
  };

  const handleOnlyNecessary = () => {
    saveConsent({ necessary: true, functional: false, analytics: false });
  };

  const handleSaveSettings = () => {
    saveConsent({ necessary: true, functional, analytics });
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      className="cookie-banner"
      role="dialog"
      aria-label="Cookie на омни.рус"
      aria-modal="false"
    >
      <div className="cookie-banner__container">
        <div className="cookie-banner__main">
          <div className="cookie-banner__content">
            <h2 className="cookie-banner__title">Cookie на омни.рус</h2>
            <p className="cookie-banner__text">
              Мы используем cookie, чтобы сайт работал, запоминал вас в Личном кабинете и считал
              посещения. Необходимые cookie включены всегда — без них сайт не работает. Аналитические
              cookie (Яндекс.Метрика) помогают понять, какие функции полезны. Подробнее — в{' '}
              <Link to={ROUTES.privacy}>Политике конфиденциальности</Link>.
            </p>
          </div>

          <div className="cookie-banner__actions">
            <button
              type="button"
              className="cookie-banner__btn cookie-banner__btn--necessary"
              onClick={handleOnlyNecessary}
            >
              Только необходимые
            </button>
            <button
              type="button"
              className="cookie-banner__btn cookie-banner__btn--accept"
              onClick={handleAcceptAll}
            >
              Принять все
            </button>
            <button
              type="button"
              className="cookie-banner__btn cookie-banner__btn--settings"
              onClick={() => setShowSettings((prev) => !prev)}
            >
              {showSettings ? 'Скрыть настройки' : 'Настройки'}
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="cookie-banner__settings-panel">
            <div className="cookie-banner__toggles">
              <label className="cookie-banner__toggle-label cookie-banner__toggle-label--disabled">
                <input type="checkbox" checked disabled />
                <span>Необходимые (всегда активны)</span>
              </label>

              <label className="cookie-banner__toggle-label">
                <input
                  type="checkbox"
                  checked={functional}
                  onChange={(e) => setFunctional(e.target.checked)}
                />
                <span>Функциональные</span>
              </label>

              <label className="cookie-banner__toggle-label">
                <input
                  type="checkbox"
                  checked={analytics}
                  onChange={(e) => setAnalytics(e.target.checked)}
                />
                <span>Аналитические</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="cookie-banner__btn cookie-banner__btn--save"
                onClick={handleSaveSettings}
              >
                Сохранить настройки
              </button>
            </div>
          </div>
        )}

        <p className="cookie-banner__footer-note">
          <Link to={ROUTES.privacy}>Политика конфиденциальности</Link>
        </p>
      </div>
    </aside>
  );
}
