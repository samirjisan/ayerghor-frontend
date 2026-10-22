import { useEffect, useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import {
  createAdminCoupon,
  deleteAdminCoupon,
  fetchAdminCoupons,
  fetchStoreSettings,
  saveStoreSettings,
  updateAdminCoupon,
} from '../api/adminApi';

const blankCoupon = {
  code: '',
  discount_type: 'fixed',
  discount_value: '',
  minimum_order_amount: '0',
  maximum_discount: '',
  usage_limit: '',
  per_user_limit: '',
  starts_at: '',
  expires_at: '',
  is_active: true,
};

const localDateTime = (value) => value ? new Date(value).toISOString().slice(0, 16) : '';

export default function AdminCommercePage() {
  const { t } = useLanguage();
  const [coupons, setCoupons] = useState([]);
  const [coupon, setCoupon] = useState(blankCoupon);
  const [editingId, setEditingId] = useState(null);
  const [deliveryCharge, setDeliveryCharge] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [couponList, settings] = await Promise.all([fetchAdminCoupons(), fetchStoreSettings()]);
      setCoupons(couponList);
      setDeliveryCharge(String(settings.delivery_charge ?? 0));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('commerceSettingsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const saveCoupon = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    const payload = {
      ...coupon,
      code: coupon.code.trim().toUpperCase(),
      discount_value: Number(coupon.discount_value),
      minimum_order_amount: Number(coupon.minimum_order_amount || 0),
      maximum_discount: coupon.maximum_discount === '' ? null : Number(coupon.maximum_discount),
      usage_limit: coupon.usage_limit === '' ? null : Number(coupon.usage_limit),
      per_user_limit: coupon.per_user_limit === '' ? null : Number(coupon.per_user_limit),
      starts_at: coupon.starts_at || null,
      expires_at: coupon.expires_at || null,
    };
    try {
      if (editingId) {
        await updateAdminCoupon(editingId, payload);
        setNotice(t('couponUpdated'));
      } else {
        await createAdminCoupon(payload);
        setNotice(t('couponCreated'));
      }
      setCoupon(blankCoupon);
      setEditingId(null);
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.errors
          ? Object.values(requestError.response.data.errors).flat().join(' ')
          : requestError.response?.data?.message || t('commerceSettingsError')
      );
    } finally {
      setSaving(false);
    }
  };

  const editCoupon = (item) => {
    setEditingId(item.id);
    setCoupon({
      code: item.code,
      discount_type: item.discount_type,
      discount_value: String(item.discount_value),
      minimum_order_amount: String(item.minimum_order_amount ?? 0),
      maximum_discount: item.maximum_discount ?? '',
      usage_limit: item.usage_limit ?? '',
      per_user_limit: item.per_user_limit ?? '',
      starts_at: localDateTime(item.starts_at),
      expires_at: localDateTime(item.expires_at),
      is_active: Boolean(item.is_active),
    });
    setError('');
  };

  const removeCoupon = async (item) => {
    if (!window.confirm(t('confirmDeleteCoupon'))) return;
    setError('');
    setNotice('');
    try {
      await deleteAdminCoupon(item.id);
      setCoupons((current) => current.filter((entry) => entry.id !== item.id));
      setNotice(t('couponDeleted'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('couponDeleteError'));
    }
  };

  const saveDeliveryCharge = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      const result = await saveStoreSettings({ delivery_charge: Number(deliveryCharge) });
      setDeliveryCharge(String(result.delivery_charge));
      setNotice(t('deliveryChargeSaved'));
    } catch (requestError) {
      setError(requestError.response?.data?.errors?.delivery_charge?.[0] || requestError.response?.data?.message || t('commerceSettingsError'));
    }
  };

  return (
    <div className="container dash admin-commerce-page">
      <h1>{t('couponsAndDelivery')}</h1>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--success" role="status">{notice}</div>}

      <form className="card card--pad delivery-settings" onSubmit={saveDeliveryCharge}>
        <h2>{t('deliverySettings')}</h2>
        <div className="delivery-settings__row">
          <label className="field">
            <span>{t('deliveryCharge')} *</span>
            <input required type="number" min="0" step="0.01" value={deliveryCharge} onChange={(event) => setDeliveryCharge(event.target.value)} />
          </label>
          <button className="btn btn--primary" type="submit">{t('saveChanges')}</button>
        </div>
      </form>

      <form className="card card--pad coupon-form" onSubmit={saveCoupon}>
        <h2>{editingId ? t('editCoupon') : t('createCoupon')}</h2>
        <div className="form-grid">
          <label className="field">
            <span>{t('couponCode')} *</span>
            <input required maxLength="40" value={coupon.code} onChange={(event) => setCoupon({ ...coupon, code: event.target.value.toUpperCase() })} />
          </label>
          <label className="field">
            <span>{t('discountType')} *</span>
            <select value={coupon.discount_type} onChange={(event) => setCoupon({ ...coupon, discount_type: event.target.value })}>
              <option value="fixed">{t('fixedAmount')}</option>
              <option value="percentage">{t('percentage')}</option>
            </select>
          </label>
          <label className="field">
            <span>{t('discountValue')} *</span>
            <input required type="number" min="0.01" max={coupon.discount_type === 'percentage' ? '100' : '100000'} step="0.01" value={coupon.discount_value} onChange={(event) => setCoupon({ ...coupon, discount_value: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('minimumOrderAmount')}</span>
            <input type="number" min="0" step="0.01" value={coupon.minimum_order_amount} onChange={(event) => setCoupon({ ...coupon, minimum_order_amount: event.target.value })} />
          </label>
          {coupon.discount_type === 'percentage' && (
            <label className="field">
              <span>{t('maximumDiscount')}</span>
              <input type="number" min="0.01" step="0.01" value={coupon.maximum_discount} onChange={(event) => setCoupon({ ...coupon, maximum_discount: event.target.value })} />
            </label>
          )}
          <label className="field">
            <span>{t('usageLimit')}</span>
            <input type="number" min="1" step="1" value={coupon.usage_limit} onChange={(event) => setCoupon({ ...coupon, usage_limit: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('perUserLimit')}</span>
            <input type="number" min="1" step="1" value={coupon.per_user_limit} onChange={(event) => setCoupon({ ...coupon, per_user_limit: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('startsAt')}</span>
            <input type="datetime-local" value={coupon.starts_at} onChange={(event) => setCoupon({ ...coupon, starts_at: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('expiresAt')}</span>
            <input type="datetime-local" value={coupon.expires_at} onChange={(event) => setCoupon({ ...coupon, expires_at: event.target.value })} />
          </label>
          <label className="check-field full">
            <input type="checkbox" checked={coupon.is_active} onChange={(event) => setCoupon({ ...coupon, is_active: event.target.checked })} />
            {t('active')}
          </label>
          <div className="full admin-product-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? t('pleaseWait') : editingId ? t('saveChanges') : t('createCoupon')}</button>
            {editingId && <button className="btn btn--outline" type="button" onClick={() => { setCoupon(blankCoupon); setEditingId(null); }}>{t('cancel')}</button>}
          </div>
        </div>
      </form>

      <section className="card card--pad coupon-list">
        <h2>{t('coupons')}</h2>
        {loading ? <p className="dashboard-note">{t('pleaseWait')}</p> : coupons.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('couponCode')}</th><th>{t('discount')}</th><th>{t('minimumOrderAmount')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr></thead>
              <tbody>
                {coupons.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.code}</strong></td>
                    <td>{item.discount_type === 'percentage' ? `${item.discount_value}%` : `৳ ${Number(item.discount_value).toLocaleString('en-BD')}`}</td>
                    <td>৳ {Number(item.minimum_order_amount).toLocaleString('en-BD')}</td>
                    <td><span className={`status status--${item.is_active ? 'approved' : 'pending'}`}>{item.is_active ? t('active') : t('inactive')}</span></td>
                    <td><div className="admin-product-actions"><button className="btn btn--ghost" type="button" onClick={() => editCoupon(item)}>{t('edit')}</button><button className="btn btn--outline" type="button" onClick={() => removeCoupon(item)}>{t('delete')}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="dashboard-note">{t('noCoupons')}</p>}
      </section>
    </div>
  );
}
