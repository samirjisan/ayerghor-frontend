import { useLanguage } from '../../i18n/LanguageContext';

export default function Select({
  label, name, value, onChange, options = [], error, required = false,
  placeholder = 'Select', disabled = false, className = '',
}) {
  const { t } = useLanguage();
  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={name}>
          {label}
          {required ? <span className="req">*</span> : <span className="opt">({t('optional')})</span>}
        </label>
      )}

      <select id={name} name={name} value={value} onChange={onChange} disabled={disabled}>
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>

      {error && <div className="field__error">{error}</div>}
    </div>
  );
}
