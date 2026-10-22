import client from '../../../api/axiosClient';

export const fetchCustomerDashboard = () => client.get('/customer/dashboard').then((r) => r.data);
export const createSellerProduct = (payload) => client.post('/customer/seller-products', payload).then((r) => r.data);
export const createWithdrawal = (payload) => client.post('/customer/withdrawals', payload).then((r) => r.data);
export const submitSalesFeedback = (orderItemId, payload) =>
  client.post(`/customer/sales/${orderItemId}/feedback`, payload).then((r) => r.data);
export const placeOrder = (payload) => client.post('/customer/orders', payload).then((r) => r.data);
export const fetchMarketingAccounts = () => client.get('/customer/marketing-accounts').then((r) => r.data.data);
export const createMarketingAccount = (payload) =>
  client.post('/customer/marketing-accounts', payload).then((r) => r.data);
