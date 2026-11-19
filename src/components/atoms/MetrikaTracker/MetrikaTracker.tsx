import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { reachHit } from '@/services/metrika';

export const MetrikaTracker = () => {
  const location = useLocation();

  useEffect(() => {
    reachHit(window.location.href, {
      title: document.title
    });
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleConsentChange = () => {
      reachHit(window.location.href, {
        title: document.title
      });
    };

    window.addEventListener('omni_cookie_consent_changed', handleConsentChange);
    return () => {
      window.removeEventListener(
        'omni_cookie_consent_changed',
        handleConsentChange
      );
    };
  }, []);

  return null;
};

export default MetrikaTracker;
