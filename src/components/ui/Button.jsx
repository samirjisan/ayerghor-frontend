import { Link } from 'react-router-dom';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * variant: primary | outline | ghost
 * pass `to` to render a router link styled as a button.
 */
export default function Button({
  children, variant = 'primary', block = false, loading = false, to, className = '', ...rest
}) {
  const { t } = useLanguage();
  const cls = `btn btn--${variant} ${block ? 'btn--block' : ''} ${className}`;

  if (to) return <Link to={to} className={cls}>{children}</Link>;

  return (
    <button className={cls} disabled={loading || rest.disabled} {...rest}>
      {loading ? t('pleaseWait') : children}
    </button>
  );
}
