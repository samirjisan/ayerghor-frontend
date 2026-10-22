import RegisterForm from '../components/RegisterForm';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function RegisterPage() {
  const { t } = useLanguage();
  return (
    <div className="auth-page">
      <div className="card auth-card auth-card--wide">
        <h2>{t('registerTitle')}</h2>
        <p className="auth-card__sub">{t('requiredNote')}</p>
        <RegisterForm />
      </div>
    </div>
  );
}
