import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { validateLogin } from '../utils/validators';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function LoginForm() {
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState({ mobile: '', password: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const found = validateLogin(values, t);
    if (Object.keys(found).length) return setErrors(found);

    setSubmitting(true);
    try {
      const user = await login({ mobile: values.mobile.trim(), password: values.password });
      const fallback = user.role === 'super_admin' ? '/admin' : '/account';
      navigate(location.state?.from?.pathname || fallback, { replace: true });
    } catch (err) {
      setServerError(err.response?.data?.message || t('invalidLogin'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <div className="alert alert--error">{serverError}</div>}

      <div className="form-grid">
        <Input
          className="full" label={t('userId')} name="mobile" required
          value={values.mobile} onChange={handleChange} error={errors.mobile}
          placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11} autoComplete="username"
        />
        <Input
          className="full" label={t('password')} name="password" type="password" required
          value={values.password} onChange={handleChange} error={errors.password}
          autoComplete="current-password"
        />
        <div className="full">
          <Button type="submit" block loading={submitting}>{t('signIn')}</Button>
        </div>
      </div>

      <div className="auth-card__foot">
        {t('newCustomer')} <Link to="/register" state={{ from: location.state?.from }}>{t('createAccount')}</Link>
      </div>
    </form>
  );
}
