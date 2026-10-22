import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import { useAuth } from '../hooks/useAuth';
import { useLocations } from '../../location/hooks/useLocations';
import { validateRegister } from '../utils/validators';
import { useLanguage } from '../../../i18n/LanguageContext';

const initial = {
  name: '',
  mobile: '',
  village_holding: '',
  post_office_area: '',
  district_id: '',
  thana_id: '',
  email: '',
  facebook_id: '',
  password: '',
  role: 'customer',
};

export default function RegisterForm() {
  const { register } = useAuth();
  const { language, t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { districts, thanas, loadingThanas, error: locationError } = useLocations(values.district_id);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setValues((v) => ({
      ...v,
      [name]: value,
      // changing the district clears the old thana
      ...(name === 'district_id' ? { thana_id: '' } : {}),
    }));
    setErrors((er) => ({ ...er, [name]: undefined }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    const found = validateRegister(values, t);
    if (Object.keys(found).length) return setErrors(found);

    setSubmitting(true);
    try {
      await register({
        ...values,
        name: values.name.trim(),
        mobile: values.mobile.trim(),
        email: values.email.trim() || null,
        facebook_id: values.facebook_id.trim() || null,
        preferred_language: language,
      });
      navigate(location.state?.from?.pathname || '/account', { replace: true });
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors) {
        // Laravel 422: { errors: { field: ['msg'] } }
        const mapped = {};
        Object.entries(data.errors).forEach(([k, msgs]) => (mapped[k] = msgs[0]));
        setErrors(mapped);
      }
      setServerError(data?.message || t('registerError'));
    } finally {
      setSubmitting(false);
    }
  };

  const districtOptions = districts.map((d) => ({ value: d.id, label: d.name }));
  const thanaOptions = thanas.map((thana) => ({ value: thana.id, label: thana.name }));

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && <div className="alert alert--error">{serverError}</div>}
      {locationError && <div className="alert alert--error" role="alert">{locationError}</div>}

      <div className="form-grid">
        <Input
          className="full" label={t('name')} name="name" required
          value={values.name} onChange={handleChange} error={errors.name}
        />

        <Input
          className="full" label={t('mobile')} name="mobile" required
          value={values.mobile} onChange={handleChange} error={errors.mobile}
          placeholder="01XXXXXXXXX" inputMode="numeric" maxLength={11}
          hint={t('userId')}
        />

        <div className="full section-label">{t('address')}</div>

        <Input
          label={t('village')} name="village_holding" required
          value={values.village_holding} onChange={handleChange} error={errors.village_holding}
        />
        <Input
          label={t('postOffice')} name="post_office_area" required
          value={values.post_office_area} onChange={handleChange} error={errors.post_office_area}
        />

        <Select
          label={t('district')} name="district_id" required
          value={values.district_id} onChange={handleChange} error={errors.district_id}
          options={districtOptions}
          placeholder={t('select')}
        />
        <Select
          label={t('thana')} name="thana_id" required
          value={values.thana_id} onChange={handleChange} error={errors.thana_id}
          options={thanaOptions}
          disabled={!values.district_id || loadingThanas}
          placeholder={values.district_id ? t('selectThana') : t('selectDistrictFirst')}
        />

        <Input
          label={t('email')} name="email" type="email"
          value={values.email} onChange={handleChange} error={errors.email}
        />
        <Input
          label={t('facebook')} name="facebook_id"
          value={values.facebook_id} onChange={handleChange} error={errors.facebook_id}
        />

        <Select
          className="full" label={t('accountType')} name="role" value={values.role}
          onChange={handleChange}
          options={[
            { value: 'customer', label: t('customerAccount') },
            { value: 'reseller', label: t('resellerAccount') },
          ]}
        />

        <Input
          className="full" label={t('password')} name="password" type="password" required
          value={values.password} onChange={handleChange} error={errors.password}
          autoComplete="new-password"
          hint={t('passwordHint')}
        />

        <div className="full">
          <Button type="submit" block loading={submitting}>{t('registerButton')}</Button>
        </div>
      </div>

      <div className="auth-card__foot">
        {t('alreadyAccount')} <Link to="/login">{t('signIn')}</Link>
      </div>
    </form>
  );
}
