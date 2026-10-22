import LoginForm from '../components/LoginForm';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function LoginPage() {
  const { t } = useLanguage();
  return (
    <div className="auth-page">
      <div className="card auth-card">
        <h2>{t('loginTitle')} 👋</h2>
        <p className="auth-card__sub">{t('loginSub')}</p>
        <LoginForm />
      </div>
    </div>
  );
}
