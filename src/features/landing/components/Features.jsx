import { useLanguage } from '../../../i18n/LanguageContext';

const items = [
  { icon: '🚚', titleKey: 'fastDelivery', textKey: 'deliveryText' },
  { icon: '💰', titleKey: 'earnPoints', textKey: 'pointsText' },
  { icon: '✅', titleKey: 'trustedProducts', textKey: 'sellerText' },
];

export default function Features() {
  const { t } = useLanguage();
  return (
    <section className="section">
      <div className="container">
        <h2 className="section__title">{t('why')} <span>AyerGhor?</span></h2>
        <p className="section__sub">{t('trusted')}</p>

        <div className="grid grid--3">
          {items.map((i) => (
            <div key={i.titleKey} className="card feature">
              <div className="feature__icon">{i.icon}</div>
              <h3>{t(i.titleKey)}</h3>
              <p style={{ color: 'var(--color-muted)', margin: 0 }}>{t(i.textKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
