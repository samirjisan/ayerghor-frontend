import { useLanguage } from '../../i18n/LanguageContext';

export default function Footer() {
  const { t } = useLanguage();
  return (
    <footer className="footer">
      <div className="container">
        <strong>Ayer<b>Ghor</b></strong> — {t('footerLine')}
        <div>© {new Date().getFullYear()} AyerGhor. {t('rights')}</div>
      </div>
    </footer>
  );
}
