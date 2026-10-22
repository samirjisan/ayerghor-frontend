import { useState } from 'react';
import { useLanguage } from '../../i18n/LanguageContext';

/**
 * Reusable text input.
 * required -> red star (mandatory), optional hint shown when not required.
 */
export default function Input({
  label, name, value, onChange, error, required = false,
  type = 'text', placeholder, hint, className = '', ...rest
}) {
  const [show, setShow] = useState(false);
  const { t } = useLanguage();
  const isPassword = type === 'password';

  return (
    <div className={`field ${error ? 'field--error' : ''} ${className}`}>
      {label && (
        <label htmlFor={name}>
          {label}
          {required ? <span className="req">*</span> : <span className="opt">({t('optional')})</span>}
        </label>
      )}

      <div className={isPassword ? 'field__pw' : undefined}>
        <input
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          type={isPassword && show ? 'text' : type}
          placeholder={placeholder}
          {...rest}
        />
        {isPassword && (
          <button type="button" onClick={() => setShow((s) => !s)}>
            {show ? 'Hide' : 'Show'}
          </button>
        )}
      </div>

      {error ? <div className="field__error">{error}</div> : hint && <div className="field__hint">{hint}</div>}
    </div>
  );
}
