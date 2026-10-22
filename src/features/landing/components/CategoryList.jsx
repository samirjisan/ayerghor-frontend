import { useLanguage } from '../../../i18n/LanguageContext';

export default function CategoryList({ categories }) {
  const { t } = useLanguage();
  if (!categories.length) return null;

  return (
    <section className="section" id="categories">
      <div className="container">
        <h2 className="section__title">{t('categoriesTitle')}</h2>
        <p className="section__sub">{t('categoriesSub')}</p>

        <div className="grid grid--4">
          {categories.map((c) => (
            <div key={c.id} className="card category-chip">{c.name}</div>
          ))}
        </div>
      </div>
    </section>
  );
}
