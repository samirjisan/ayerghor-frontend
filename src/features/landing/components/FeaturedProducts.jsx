import { useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useAuth } from '../../auth/hooks/useAuth';
import { useCart } from '../../cart/context/CartContext';

const taka = (n) => `৳ ${Number(n).toLocaleString('en-BD')}`;

function ProductCard({ p }) {
  const { user, isCustomer } = useAuth();
  const { add } = useCart();
  const { t } = useLanguage();
  const [message, setMessage] = useState('');
  const [adding, setAdding] = useState(false);
  const hasSale = p.sale_price && Number(p.sale_price) < Number(p.price);

  const handleAddToCart = async () => {
    if (user && !isCustomer) return;
    setMessage('');
    setAdding(true);
    try {
      await add(p);
      setMessage(t('addedToCart'));
    } catch (error) {
      setMessage(error.response?.data?.message || error.message || t('cartLoadError'));
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="card product-card">
      <div className="product-card__img">
        {p.image ? <img src={p.image} alt={p.name} /> : '🛍️'}
      </div>
      <div className="product-card__body">
        <div className="product-card__cat">{p.category?.name}</div>
        <div className="product-card__name">{p.name}</div>
        <div className="price">
          {taka(hasSale ? p.sale_price : p.price)}
          {hasSale && <del>{taka(p.price)}</del>}
        </div>
        {(!user || isCustomer) && (
          <button className="btn btn--outline btn--block product-card__action" type="button" onClick={handleAddToCart} disabled={adding || Number(p.stock) < 1}>
            {adding ? t('pleaseWait') : Number(p.stock) < 1 ? t('outOfStock') : t('addToCart')}
          </button>
        )}
        {message && <p className="product-card__message" role="status">{message}</p>}
      </div>
    </div>
  );
}

export default function FeaturedProducts({ products, searching = false }) {
  const { t } = useLanguage();
  return (
    <section className="section section--tint">
      <div className="container">
        <h2 className="section__title">{searching ? t('searchResults') : t('featuredTitle')}</h2>
        <p className="section__sub">{t('featuredSub')}</p>

        {products.length ? (
          <div className="grid grid--4">
            {products.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--color-muted)' }}>{t('noProducts')}</p>
        )}
      </div>
    </section>
  );
}
