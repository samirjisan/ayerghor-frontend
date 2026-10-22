import { useEffect, useState } from 'react';
import { fetchDashboard, fetchOrders, fetchPendingSellerProducts, fetchWithdrawals, reviewSellerProduct, updateOrderStatus, updateWithdrawal } from '../api/adminApi';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../i18n/LanguageContext';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [stats, setStats] = useState(null);
  const [pendingProducts, setPendingProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [reviewingId, setReviewingId] = useState(null);
  const [deliveryFees, setDeliveryFees] = useState({});

  useEffect(() => {
    Promise.all([fetchDashboard(), fetchPendingSellerProducts(), fetchOrders(), fetchWithdrawals()])
      .then(([dashboard, submissions, orderList, withdrawalList]) => {
        setStats(dashboard);
        setPendingProducts(submissions);
        setOrders(orderList);
        setWithdrawals(withdrawalList);
      })
      .catch(() => setError(t('reviewError')));
  }, [t]);

  const review = async (product, approval_status) => {
    setError('');
    setNotice('');
    setReviewingId(product.id);
    try {
      const result = await reviewSellerProduct(product.id, { approval_status });
      setPendingProducts((items) => items.filter((item) => item.id !== product.id));
      setStats((current) => current ? {
        ...current,
        pending_products: Math.max(0, current.pending_products - 1),
        products: approval_status === 'approved' ? current.products + 1 : current.products,
      } : current);
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    } finally {
      setReviewingId(null);
    }
  };

  const changeOrderStatus = async (order, status) => {
    setError('');
    setNotice('');
    setReviewingId(`order-${order.id}`);
    try {
      const result = await updateOrderStatus(order.id, status);
      setOrders((items) => items.map((item) => item.id === order.id ? result.order : item));
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    } finally {
      setReviewingId(null);
    }
  };

  const changeWithdrawalStatus = async (withdrawal, status) => {
    setError('');
    setNotice('');
    setReviewingId(`withdrawal-${withdrawal.id}`);
    try {
      const payload = {
        status,
        ...(withdrawal.type === 'product_adjustment'
          ? { delivery_fee: Number(deliveryFees[withdrawal.id] ?? withdrawal.delivery_fee ?? 0) }
          : {}),
      };
      const result = await updateWithdrawal(withdrawal.id, payload);
      setWithdrawals((items) => items.map((item) => item.id === withdrawal.id ? result.withdrawal : item));
      setNotice(result.message);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('reviewError'));
    } finally {
      setReviewingId(null);
    }
  };

  const cards = stats && [
    { label: t('customers'), value: stats.customers },
    { label: t('products'), value: stats.products },
    { label: t('orders'), value: stats.orders },
    { label: t('pendingOrders'), value: stats.pending },
    { label: t('reviewListings'), value: stats.pending_products },
    { label: t('pendingWithdrawals'), value: stats.pending_withdrawals },
    { label: t('revenue'), value: `৳ ${Number(stats.revenue).toLocaleString('en-BD')}` },
  ];

  return (
    <div className="container dash">
      <h1>{t('adminDashboard')}</h1>
      <p className="dashboard-note">{t('welcome')}, {user.name} · Super Admin</p>

      {error && <div className="alert alert--error">{error}</div>}
      {notice && <div className="alert alert--success" role="status">{notice}</div>}

      <div className="grid grid--4 admin-stats" style={{ marginTop: 20 }}>
        {cards?.map((c) => (
          <div key={c.label} className="card stat">
            <div className="stat__num">{c.value}</div>
            <div className="stat__label">{c.label}</div>
          </div>
        ))}
      </div>

      <section className="card card--pad admin-review" id="seller-approvals">
        <div className="section-heading">
          <div>
            <h2>{t('reviewListings')}</h2>
            <p className="dashboard-note">{t('externalNotice')}</p>
          </div>
          <span className="status status--pending">{pendingProducts.length}</span>
        </div>
        {pendingProducts.length ? (
          <div className="review-list">
            {pendingProducts.map((product) => (
              <article className="review-item" key={product.id}>
                <div className="review-item__image">{product.image ? <img src={product.image} alt="" /> : '🛍️'}</div>
                <div className="review-item__content">
                  <h3>{product.name}</h3>
                  <p>{product.category?.name} · ৳ {Number(product.sale_price || product.price).toLocaleString('en-BD')} · {product.stock} in stock</p>
                  <p className="dashboard-note">Seller: {product.seller?.name} ({product.seller?.mobile})</p>
                  {product.description && <p>{product.description}</p>}
                  <div className="review-item__actions">
                    <button className="btn btn--primary" disabled={reviewingId === product.id} onClick={() => review(product, 'approved')}>{t('approve')}</button>
                    <button className="btn btn--outline" disabled={reviewingId === product.id} onClick={() => review(product, 'rejected')}>{t('reject')}</button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : <p className="dashboard-note">{t('noReviewListings')}</p>}
      </section>

      <section className="card card--pad admin-review" id="orders">
        <h2>{t('orders')}</h2>
        {orders.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('order')}</th><th>{t('buyer')}</th><th>{t('price')}</th><th>{t('status')}</th><th>{t('updateStatus')}</th></tr></thead>
              <tbody>
                {orders.map((order) => {
                  const nextStatuses = {
                    pending: ['confirmed', 'cancelled'],
                    confirmed: ['shipped', 'cancelled'],
                    shipped: ['delivered'],
                  }[order.status] || [];

                  return (
                    <tr key={order.id}>
                      <td>{order.order_no}</td><td>{order.user?.name} ({order.user?.mobile})</td>
                      <td>৳ {Number(order.total).toLocaleString('en-BD')}</td><td>{t(order.status)}</td>
                      <td>
                        <div className="review-item__actions">
                          {nextStatuses.map((status) => (
                            <button key={status} className={`btn ${status === 'cancelled' ? 'btn--outline' : 'btn--ghost'}`}
                              disabled={reviewingId === `order-${order.id}`}
                              onClick={() => changeOrderStatus(order, status)}>{t(status)}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="dashboard-note">{t('noPurchases')}</p>}
      </section>

      <section className="card card--pad admin-review" id="withdrawals">
        <h2>{t('pendingWithdrawals')}</h2>
        {withdrawals.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('name')}</th><th>{t('type')}</th><th>{t('amount')}</th><th>{t('deliveryFee')}</th><th>{t('status')}</th><th>{t('updateStatus')}</th></tr></thead>
              <tbody>
                {withdrawals.map((withdrawal) => {
                  const actions = withdrawal.status === 'pending' ? ['approved', 'rejected']
                    : withdrawal.status === 'approved' ? ['completed'] : [];
                  return (
                    <tr key={withdrawal.id}>
                      <td>{withdrawal.user?.name} ({withdrawal.user?.mobile})</td>
                      <td>{t(withdrawal.type)}</td>
                      <td>{withdrawal.type === 'cash' ? `৳ ${Number(withdrawal.amount).toLocaleString('en-BD')}` : `${withdrawal.points} ${t('points')}`}</td>
                      <td>{withdrawal.type === 'cash' ? '—' : (
                        <input className="cart-quantity" type="number" min="0" step="0.01" aria-label={t('deliveryFee')}
                          value={deliveryFees[withdrawal.id] ?? withdrawal.delivery_fee}
                          onChange={(event) => setDeliveryFees((current) => ({ ...current, [withdrawal.id]: event.target.value }))} />
                      )}</td>
                      <td>{t(withdrawal.status)}</td>
                      <td>
                        <div className="review-item__actions">
                          {actions.map((status) => (
                            <button key={status} className={`btn ${status === 'rejected' ? 'btn--outline' : 'btn--ghost'}`}
                              disabled={reviewingId === `withdrawal-${withdrawal.id}`}
                              onClick={() => changeWithdrawalStatus(withdrawal, status)}>{t(status)}</button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : <p className="dashboard-note">{t('noActivity')}</p>}
      </section>
    </div>
  );
}
