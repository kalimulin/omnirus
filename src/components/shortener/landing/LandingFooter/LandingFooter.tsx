import { Link } from 'react-router-dom';
import { ROUTES } from '@/routing/routes';
import './LandingFooter.scss';

export default function LandingFooter() {
  return (
    <footer className="landing-footer">
      <div className="landing-footer__container">
        <nav className="landing-footer__links" aria-label="Ссылки в подвале">
          <Link to={ROUTES.terms} className="landing-footer__link">
            Пользовательское соглашение
          </Link>
          <span className="landing-footer__separator" aria-hidden="true">·</span>
          <Link to={ROUTES.privacy} className="landing-footer__link">
            Политика конфиденциальности
          </Link>
          <span className="landing-footer__separator" aria-hidden="true">·</span>
          <Link to={ROUTES.feedback} className="landing-footer__link">
            Обратная связь
          </Link>
        </nav>
        <p className="landing-footer__copy">
          © 2026 ОМНИ.РУС. Сервис предоставляется бесплатно на условиях{' '}
          <Link to={ROUTES.terms}>Пользовательского соглашения</Link>. Контакты — на странице{' '}
          <Link to={ROUTES.feedback}>Обратной связи</Link>.
        </p>
      </div>
    </footer>
  );
}
