import Button from '../../../components/ui/Button';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function Hero() {
  const { user } = useAuth();
  const { t } = useLanguage();

  return (
    <section className="hero">
      <div className="container hero__grid">
        <div>
          <span className="hero__badge">🏠 {t('heroBadge')}</span>
          <h1>
            {t('heroTitleStart')} <span>{t('heroTitleEnd')}</span>
          </h1>
          <p>{t('heroText')}</p>
          {!user && (
            <div className="hero__cta">
              <Button to="/register">{t('getStarted')}</Button>
              <Button to="/login" variant="outline">{t('login')}</Button>
            </div>
          )}
        </div>
        <div className="hero__art" aria-hidden="true">🛋️</div>
      </div>
    </section>
  );
}
