import client from '../../../api/axiosClient';

export const fetchAdminProducts = (params = {}) =>
  client.get('/admin/products', { params }).then((r) => r.data.data);
export const createAdminProduct = (formData) =>
  client.post('/admin/products', formData).then((r) => r.data);
export const updateAdminProduct = (id, formData) => {
  formData.append('_method', 'PUT');
  return client.post(`/admin/products/${id}`, formData).then((r) => r.data);
};
export const deleteAdminProduct = (id) => client.delete(`/admin/products/${id}`).then((r) => r.data);
export const fetchAdminCoupons = () => client.get('/admin/coupons').then((r) => r.data.data);
export const createAdminCoupon = (payload) => client.post('/admin/coupons', payload).then((r) => r.data);
export const updateAdminCoupon = (id, payload) => client.put(`/admin/coupons/${id}`, payload).then((r) => r.data);
export const deleteAdminCoupon = (id) => client.delete(`/admin/coupons/${id}`).then((r) => r.data);
export const fetchStoreSettings = () => client.get('/admin/settings').then((r) => r.data);
export const saveStoreSettings = (payload) => client.patch('/admin/settings', payload).then((r) => r.data);

export const fetchDashboard = () => client.get('/admin/dashboard').then((r) => r.data);
export const fetchPendingSellerProducts = () =>
  client.get('/admin/seller-products/pending').then((r) => r.data.data);
export const reviewSellerProduct = (productId, payload) =>
  client.patch(`/admin/seller-products/${productId}/review`, payload).then((r) => r.data);
export const fetchOrders = () => client.get('/admin/orders').then((r) => r.data.data);
export const updateOrderStatus = (orderId, status) =>
  client.patch(`/admin/orders/${orderId}/status`, { status }).then((r) => r.data);
export const fetchWithdrawals = () => client.get('/admin/withdrawals').then((r) => r.data.data);
export const updateWithdrawal = (id, payload) => client.patch(`/admin/withdrawals/${id}`, payload).then((r) => r.data);
