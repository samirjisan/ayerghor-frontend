import { useEffect, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../i18n/LanguageContext';
import { fetchCategories } from '../../landing/api/landingApi';
import { createMarketingAccount, createSellerProduct, createWithdrawal, fetchCustomerDashboard, fetchMarketingAccounts, submitSalesFeedback } from '../api/customerApi';
import { fetchFeaturedProducts } from '../../landing/api/landingApi';

const initialProduct = {
  category_id: '', name: '', description: '', price: '', sale_price: '', stock: '1',
};

export default function CustomerAccountPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [dashboard, setDashboard] = useState(null);
  const [marketingAccounts, setMarketingAccounts] = useState([]);
  const [parentAccountCode, setParentAccountCode] = useState('');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(initialProduct);
  const [productImage, setProductImage] = useState(null);
  const [withdrawal, setWithdrawal] = useState({ type: 'cash', amount: '', product_id: '', points: '' });
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [savingProduct, setSavingProduct] = useState(false);
  const [savingWithdrawal, setSavingWithdrawal] = useState(false);
  const [feedbackValues, setFeedbackValues] = useState({});
  const profile = user.profile;

  const loadDashboard = async () => {
    const data = await fetchCustomerDashboard();
    setDashboard(data);
  };

  useEffect(() => {
    Promise.all([fetchCustomerDashboard(), fetchCategories(), fetchFeaturedProducts(), fetchMarketingAccounts()])
      .then(([data, categoryList, listedProducts, accounts]) => {
        setDashboard(data);
        setCategories(categoryList);
        setProducts(listedProducts);
        setMarketingAccounts(accounts);
      })
      .catch(() => setError(t('reviewError')));
  }, [t]);

  const handleProductSubmit = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    setSavingProduct(true);
    try {
      const payload = new FormData();
      Object.entries({
        ...productForm,
        category_id: Number(productForm.category_id),
        price: Number(productForm.price),
        sale_price: productForm.sale_price || '',
        stock: Number(productForm.stock),
      }).forEach(([key, value]) => payload.append(key, String(value)));
      if (productImage) payload.append('image', productImage);
      const result = await createSellerProduct(payload);
      setNotice(result.message || t('submitted'));
      setProductForm(initialProduct);
      setProductImage(null);
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    } finally {
      setSavingProduct(false);
    }
  };

  const handleWithdrawal = async (event) => {
    event.preventDefault();
    setNotice('');
    setError('');
    setSavingWithdrawal(true);
    try {
      const payload = withdrawal.type === 'cash'
        ? { type: 'cash', amount: Number(withdrawal.amount) }
        : { type: 'product_adjustment', product_id: Number(withdrawal.product_id), points: Number(withdrawal.points) };
      const result = await createWithdrawal(payload);
      setNotice(result.message);
      setWithdrawal({ type: 'cash', amount: '', product_id: '', points: '' });
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    } finally {
      setSavingWithdrawal(false);
    }
  };

  const handleFeedback = async (event, sale) => {
    event.preventDefault();
    setNotice('');
    setError('');
    try {
      await submitSalesFeedback(sale.id, feedbackValues[sale.id] || { rating: '5', feedback: '' });
      setNotice(t('feedbackSaved'));
      setFeedbackValues((current) => ({ ...current, [sale.id]: { ...current[sale.id], submitted: true } }));
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    }
  };

  const handleCreateMarketingAccount = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    try {
      await createMarketingAccount(parentAccountCode.trim()
        ? { parent_account_code: parentAccountCode.trim() }
        : {});
      setParentAccountCode('');
      setMarketingAccounts(await fetchMarketingAccounts());
      setNotice(t('marketingIdCreated'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    }
  };

  const summary = dashboard?.summary;
  const tiles = summary && [
    { icon: '↗', title: t('sellerSales'), value: summary.sales },
    { icon: '🛍', title: t('purchases'), value: summary.purchases },
    { icon: '৳', title: t('walletBalance'), value: `৳ ${Number(summary.balance).toLocaleString('en-BD')}` },
    { icon: '✦', title: t('pointsBalance'), value: Number(summary.points).toLocaleString('en-BD') },
  ];

  return (
    <div className="container dash customer-dashboard">
      <div className="dashboard-heading">
        <div>
          <span className="hero__badge">{t('accountId')}: {user.mobile}</span>
          <h1>{t('accountTitle')}</h1>
          <p>{t('accountWelcome')}, {user.name}</p>
        </div>
      </div>

      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--success" role="status">{notice}</div>}

      <section className="dashboard-tiles" aria-label={t('dashboard')}>
        {tiles?.map((tile) => (
          <article className="dashboard-tile card" key={tile.title}>
            <span className="dashboard-tile__icon">{tile.icon}</span>
            <div className="dashboard-tile__value">{tile.value}</div>
            <h2>{tile.title}</h2>
          </article>
        ))}
      </section>

      <div className="dashboard-columns dashboard-columns--bottom">
        <section className="card card--pad" id="sales-history">
          <h2>{t('sellerSales')}</h2>
          {dashboard?.sales_history?.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>{t('productName')}</th><th>{t('order')}</th><th>{t('status')}</th><th>{t('feedback')}</th></tr></thead>
                <tbody>
                  {dashboard.sales_history.map((sale) => (
                    <tr key={sale.id}>
                      <td>{sale.product?.name || sale.product_name}</td>
                      <td>{sale.order?.order_no}</td>
                      <td>{t(sale.order?.status || 'pending')}</td>
                      <td>
                        {sale.feedback ? `${sale.feedback.rating}/5 · ${sale.feedback.feedback}` :
                          sale.order?.status === 'delivered' ? (
                            <form className="feedback-form" onSubmit={(event) => handleFeedback(event, sale)}>
                              <select aria-label={t('feedback')} value={feedbackValues[sale.id]?.rating || '5'}
                                onChange={(event) => setFeedbackValues((current) => ({ ...current, [sale.id]: { ...current[sale.id], rating: event.target.value } }))}>
                                {[5, 4, 3, 2, 1].map((rating) => <option key={rating} value={rating}>{rating}/5</option>)}
                              </select>
                              <input required maxLength="2000" placeholder={t('feedbackPrompt')}
                                value={feedbackValues[sale.id]?.feedback || ''}
                                onChange={(event) => setFeedbackValues((current) => ({ ...current, [sale.id]: { ...current[sale.id], feedback: event.target.value } }))} />
                              <button className="btn btn--outline" type="submit">{t('sendFeedback')}</button>
                            </form>
                          ) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="dashboard-note">{t('noSales')}</p>}
        </section>
        <section className="card card--pad" id="purchase-history">
          <h2>{t('purchases')}</h2>
          {dashboard?.purchase_history?.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>{t('order')}</th><th>{t('date')}</th><th>{t('status')}</th><th>{t('price')}</th></tr></thead>
                <tbody>
                  {dashboard.purchase_history.map((order) => (
                    <tr key={order.id}>
                      <td>{order.order_no}</td>
                      <td>{new Date(order.created_at).toLocaleDateString()}</td>
                      <td>{t(order.status)}</td>
                      <td>৳ {Number(order.total).toLocaleString('en-BD')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="dashboard-note">{t('noPurchases')}</p>}
        </section>
      </div>

      <section className="card card--pad marketing-panel" id="marketing-accounts">
        <h2>{t('marketingIds')}</h2>
        <p className="dashboard-note">{t('marketingLayerNotice')}</p>
        <form className="marketing-form" onSubmit={handleCreateMarketingAccount}>
          <label className="field">
            <span>{t('parentMarketingId')}</span>
            <input value={parentAccountCode} onChange={(event) => setParentAccountCode(event.target.value)} maxLength="20" />
          </label>
          <button className="btn btn--primary" type="submit">{t('createMarketingId')}</button>
        </form>
        {marketingAccounts.length ? (
          <ul className="marketing-list">
            {marketingAccounts.map((account) => (
              <li key={account.id}>
                <strong>{account.account_code}</strong>
                <span>{account.parent_account?.account_code || '—'}</span>
              </li>
            ))}
          </ul>
        ) : <p className="dashboard-note">{t('noMarketingIds')}</p>}
      </section>

      <div className="dashboard-columns">
        <section className="card card--pad">
          <h2>{t('sellerProfile')}</h2>
          <dl className="kv">
            <dt>{t('name')}</dt><dd>{user.name}</dd>
            <dt>{t('accountId')}</dt><dd>{user.mobile}</dd>
            <dt>{t('email')}</dt><dd>{user.email || '—'}</dd>
            <dt>{t('facebook')}</dt><dd>{user.facebook_id || '—'}</dd>
            {profile && (
              <>
                <dt>{t('village')}</dt><dd>{profile.village_holding}</dd>
                <dt>{t('postOffice')}</dt><dd>{profile.post_office_area}</dd>
                <dt>{t('thana')}</dt><dd>{profile.thana?.name || '—'}</dd>
                <dt>{t('district')}</dt><dd>{profile.district?.name || '—'}</dd>
              </>
            )}
          </dl>
        </section>

        <section className="card card--pad" id="product-submission">
          <h2>{t('submitProduct')}</h2>
          <p className="dashboard-note">{t('submissionNote')}</p>
          <form className="form-grid" onSubmit={handleProductSubmit}>
            <label className="field">
              <span>{t('productName')} *</span>
              <input required maxLength="200" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} />
            </label>
            <label className="field">
              <span>{t('category')} *</span>
              <select required value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}>
                <option value="">{t('select')}</option>
                {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{t('price')} *</span>
              <input required type="number" min="0.01" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} />
            </label>
            <label className="field">
              <span>{t('salePrice')}</span>
              <input type="number" min="0.01" step="0.01" value={productForm.sale_price} onChange={(e) => setProductForm({ ...productForm, sale_price: e.target.value })} />
            </label>
            <label className="field">
              <span>{t('stock')} *</span>
              <input required type="number" min="1" step="1" value={productForm.stock} onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })} />
            </label>
            <label className="field">
              <span>{t('productImage')}</span>
              <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => setProductImage(e.target.files?.[0] || null)} />
              <small className="field__hint">{t('imageUploadHint')}</small>
            </label>
            <label className="field full">
              <span>{t('description')}</span>
              <textarea rows="3" value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} />
            </label>
            <div className="full">
              <button className="btn btn--primary" type="submit" disabled={savingProduct}>{savingProduct ? t('pleaseWait') : t('submitForReview')}</button>
            </div>
          </form>
        </section>
      </div>

      <div className="dashboard-columns dashboard-columns--bottom">
        <section className="card card--pad" id="seller-products">
          <h2>{t('myListings')}</h2>
          {dashboard?.products?.length ? (
            <div className="table-wrap">
              <table className="data-table">
                <thead><tr><th>{t('productName')}</th><th>{t('category')}</th><th>{t('price')}</th><th>{t('status')}</th></tr></thead>
                <tbody>
                  {dashboard.products.map((product) => (
                    <tr key={product.id}>
                      <td>{product.name}</td><td>{product.category?.name}</td><td>৳ {Number(product.price).toLocaleString('en-BD')}</td>
                      <td><span className={`status status--${product.approval_status}`}>{t(product.approval_status)}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="dashboard-note">{t('noListings')}</p>}
        </section>

        <section className="card card--pad" id="balance-history">
          <h2>{t('balanceHistory')}</h2>
          {dashboard?.transactions?.length ? (
            <ul className="activity-list">
              {dashboard.transactions.map((item) => (
                <li key={item.id}>
                  <span>{item.description || t(item.type)}</span>
                  <strong>{item.amount ? `৳ ${Number(item.amount).toLocaleString('en-BD')}` : `${item.points} ${t('points')}`}</strong>
                </li>
              ))}
            </ul>
          ) : <p className="dashboard-note">{t('noActivity')}</p>}
        </section>
      </div>

      <section className="card card--pad withdrawal-panel">
        <h2>{t('incomeHistory')}</h2>
        {dashboard?.income_history?.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('accountCode')}</th><th>{t('layer')}</th><th>{t('commission')}</th><th>{t('status')}</th></tr></thead>
              <tbody>
                {dashboard.income_history.map((income) => (
                  <tr key={income.id}>
                    <td>{income.account?.account_code || '—'}</td>
                    <td>{income.layer}</td>
                    <td>৳ {Number(income.amount).toLocaleString('en-BD')}</td>
                    <td>{t(income.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="dashboard-note">{t('noActivity')}</p>}
      </section>

      <section className="card card--pad withdrawal-panel" id="withdrawals">
        <h2>{t('cashWithdraw')} / {t('productAdjustment')}</h2>
        <p className="dashboard-note">{t('cashMinimum')}</p>
        <form className="form-grid" onSubmit={handleWithdrawal}>
          <label className="field">
            <span>{t('status')}</span>
            <select value={withdrawal.type} onChange={(e) => setWithdrawal({ ...withdrawal, type: e.target.value })}>
              <option value="cash">{t('cashWithdraw')}</option>
              <option value="product_adjustment">{t('productAdjustment')}</option>
            </select>
          </label>
          {withdrawal.type === 'cash' ? (
            <label className="field">
              <span>{t('amount')}</span>
              <input required type="number" min="500" step="0.01" value={withdrawal.amount} onChange={(e) => setWithdrawal({ ...withdrawal, amount: e.target.value })} />
            </label>
          ) : (
            <>
              <label className="field">
                <span>{t('productName')}</span>
                <select required value={withdrawal.product_id} onChange={(e) => setWithdrawal({ ...withdrawal, product_id: e.target.value })}>
                  <option value="">{t('select')}</option>
                  {products.map((product) => <option key={product.id} value={product.id}>{product.name} — ৳ {product.sale_price || product.price}</option>)}
                </select>
              </label>
              <label className="field">
                <span>{t('points')}</span>
                <input required type="number" min="1" step="1" value={withdrawal.points} onChange={(e) => setWithdrawal({ ...withdrawal, points: e.target.value })} />
              </label>
            </>
          )}
          <div className="full"><button className="btn btn--primary" type="submit" disabled={savingWithdrawal}>{savingWithdrawal ? t('pleaseWait') : t('submitForReview')}</button></div>
        </form>
      </section>

      <section className="card card--pad withdrawal-panel" id="withdrawal-requests">
        <h2>{t('myWithdrawals')}</h2>
        {dashboard?.withdrawals?.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('type')}</th><th>{t('amount')}</th><th>{t('status')}</th><th>{t('deliveryFee')}</th></tr></thead>
              <tbody>
                {dashboard.withdrawals.map((item) => (
                  <tr key={item.id}>
                    <td>{t(item.type)}{item.product ? ` · ${item.product.name}` : ''}</td>
                    <td>{item.type === 'cash' ? `৳ ${Number(item.amount).toLocaleString('en-BD')}` : `${item.points} ${t('points')}`}</td>
                    <td>{t(item.status)}</td>
                    <td>{item.type === 'product_adjustment' ? `৳ ${Number(item.delivery_fee).toLocaleString('en-BD')}` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="dashboard-note">{t('noActivity')}</p>}
      </section>
    </div>
  );
}
