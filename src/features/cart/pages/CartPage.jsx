import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useCart } from '../context/CartContext';
import { placeOrder } from '../../customer/api/customerApi';
import { validateCoupon } from '../../landing/api/landingApi';
import { fetchStorefrontSettings } from '../api/cartApi';

export default function CartPage() {
  const { user, isCustomer } = useAuth();
  const { t } = useLanguage();
  const { items, error: cartError, loading: cartLoading, update, remove, refresh } = useCart();
  const navigate = useNavigate();
  const [quantities, setQuantities] = useState({});
  const [address, setAddress] = useState(() => {
    const profile = user?.profile;
    if (!profile) return '';
    return [
      profile.village_holding,
      profile.post_office_area,
      profile.thana?.name,
      profile.district?.name,
    ].filter(Boolean).join(', ');
  });
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deliveryCharge, setDeliveryCharge] = useState(null);
  const [deliveryLoading, setDeliveryLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');
  const [couponPreview, setCouponPreview] = useState(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    setQuantities(Object.fromEntries(items.map((item) => [item.id, item.quantity])));
  }, [items]);

  useEffect(() => {
    fetchStorefrontSettings()
      .then((settings) => setDeliveryCharge(Number(settings.delivery_charge)))
      .catch((requestError) => setError(requestError.response?.data?.message || t('deliverySettingsError')))
      .finally(() => setDeliveryLoading(false));
  }, [t]);

  const total = items.reduce((sum, item) => {
    const price = Number(item.product?.sale_price || item.product?.price || 0);
    return sum + price * item.quantity;
  }, 0);

  const checkout = async (event) => {
    event.preventDefault();
    if (!isCustomer) {
      if (!user) navigate('/login', { state: { from: { pathname: '/cart' } } });
      else setError(t('customerOnlyCheckout'));
      return;
    }
    setError('');
    setNotice('');
    setSubmitting(true);
    try {
      const result = await placeOrder({
        items: items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
        shipping_address: address,
        payment_method: 'cod',
        coupon_code: couponIsCurrent ? couponPreview.coupon_code : null,
      });
      setNotice(`${t('orderPlaced')} ${result.order.order_no}`);
      await refresh();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    } finally {
      setSubmitting(false);
    }
  };

  const cartFingerprint = items.map((item) => `${item.product_id}:${item.quantity}`).join('|');
  const discount = couponPreview?.cartFingerprint === cartFingerprint
    ? Number(couponPreview.discount_amount)
    : 0;
  const couponIsCurrent = couponPreview?.cartFingerprint === cartFingerprint;
  const payable = Math.max(0, total - discount) + (deliveryCharge ?? 0);

  const applyCoupon = async () => {
    setCouponError('');
    setCouponPreview(null);
    try {
      const result = await validateCoupon({
        coupon_code: couponCode,
        items: items.map((item) => ({ product_id: item.product_id, quantity: item.quantity })),
      });
      setCouponPreview({ ...result, cartFingerprint });
    } catch (requestError) {
      setCouponError(
        requestError.response?.data?.errors?.coupon_code?.[0]
        || requestError.response?.data?.message
        || t('couponInvalid')
      );
    }
  };

  return (
    <div className="container dash cart-page">
      <h1>{t('cart')}</h1>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {cartError && <div className="alert alert--error" role="alert">{cartError}</div>}
      {notice && <div className="alert alert--success" role="status">{notice}</div>}
      {couponError && <div className="alert alert--error" role="alert">{couponError}</div>}
      {cartLoading && <p className="dashboard-note">{t('pleaseWait')}</p>}
      {items.length ? (
        <div className="cart-layout">
          <section className="card card--pad">
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>{t('productName')}</th><th>{t('price')}</th><th>{t('quantity')}</th><th>{t('total')}</th><th /></tr></thead>
                <tbody>
                  {items.map((item) => {
                    const price = Number(item.product?.sale_price || item.product?.price || 0);
                    return (
                      <tr key={item.id}>
                        <td>{item.product?.name || t('unavailableProduct')}</td>
                        <td>৳ {price.toLocaleString('en-BD')}</td>
                        <td>
                          <input aria-label={t('quantity')} className="cart-quantity" type="number" min="1" max={item.product?.stock || 100}
                            value={quantities[item.id] ?? item.quantity}
                            onChange={(event) => setQuantities((current) => ({ ...current, [item.id]: event.target.value }))}
                            onBlur={() => {
                              const quantity = Number(quantities[item.id]);
                              if (quantity > 0 && quantity !== item.quantity) {
                                update(item.id, quantity).catch((requestError) => setError(requestError.response?.data?.message || t('reviewError')));
                              }
                            }} />
                        </td>
                        <td>৳ {(price * item.quantity).toLocaleString('en-BD')}</td>
                        <td><button className="btn btn--ghost" type="button" onClick={() => remove(item.id).catch(() => setError(t('reviewError')))}>{t('remove')}</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
          <form className="card card--pad cart-checkout" onSubmit={checkout}>
            <h2>{t('checkout')}</h2>
            <label className="field">
              <span>{t('shippingAddress')} *</span>
              <textarea required={isCustomer} rows="4" maxLength="2000" value={address} onChange={(event) => setAddress(event.target.value)} />
            </label>
            <p>{t('paymentMethod')}: {t('cashOnDelivery')}</p>
            <div className="coupon-entry">
              <label className="field">
                <span>{t('couponCode')}</span>
                <input value={couponCode} maxLength="40" onChange={(event) => {
                  setCouponCode(event.target.value);
                  setCouponPreview(null);
                }} />
              </label>
              <button className="btn btn--outline" type="button" disabled={!couponCode.trim()} onClick={applyCoupon}>{t('applyCoupon')}</button>
            </div>
            {couponIsCurrent && <p className="coupon-success">{t('couponApplied')}: {couponPreview.coupon_code}</p>}
            {couponPreview && !couponIsCurrent && <p className="dashboard-note">{t('couponNeedsReapply')}</p>}
            <div className="cart-breakdown">
              <div><span>{t('subtotal')}</span><strong>৳ {total.toLocaleString('en-BD')}</strong></div>
              <div><span>{t('discount')}</span><strong>− ৳ {discount.toLocaleString('en-BD')}</strong></div>
              <div><span>{t('deliveryCharge')}</span><strong>{deliveryLoading || deliveryCharge === null ? '—' : `৳ ${deliveryCharge.toLocaleString('en-BD')}`}</strong></div>
            </div>
            <div className="cart-total"><span>{t('total')}</span><strong>{deliveryCharge === null ? '—' : `৳ ${payable.toLocaleString('en-BD')}`}</strong></div>
            <button className="btn btn--primary btn--block" disabled={submitting || cartLoading || deliveryLoading || deliveryCharge === null || !items.length || (user && !isCustomer)}>{submitting ? t('pleaseWait') : isCustomer ? t('placeOrder') : user ? t('customerOnlyCheckout') : t('signInToBuy')}</button>
          </form>
        </div>
      ) : <div className="card card--pad cart-empty">{t('emptyCart')}</div>}
    </div>
  );
}
