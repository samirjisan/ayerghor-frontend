import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import Hero from '../components/Hero';
import CategoryList from '../components/CategoryList';
import FeaturedProducts from '../components/FeaturedProducts';
import Features from '../components/Features';
import { fetchCategories, fetchFeaturedProducts, searchProducts } from '../api/landingApi';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function LandingPage() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');
  const { t } = useLanguage();
  const [searchParams] = useSearchParams();
  const search = searchParams.get('search')?.trim() || '';

  useEffect(() => {
    Promise.all([fetchCategories(), search ? searchProducts(search) : fetchFeaturedProducts()])
      .then(([nextCategories, nextProducts]) => {
        setCategories(nextCategories);
        setProducts(nextProducts);
      })
      .catch(() => setError(t('catalogError')));
  }, [search, t]);

  return (
    <>
      <Hero />
      {error && <div className="container alert alert--error" role="alert">{error}</div>}
      <CategoryList categories={categories} />
      <FeaturedProducts products={products} searching={Boolean(search)} />
      <Features />
    </>
  );
}
