import client from '../../../api/axiosClient';

export const fetchCategories = () => client.get('/categories').then((r) => r.data);
export const fetchFeaturedProducts = () =>
  client.get('/products', { params: { featured: 1, per_page: 8 } }).then((r) => r.data.data);

export const searchProducts = (search) =>
  client.get('/products', { params: { search, per_page: 12 } }).then((r) => r.data.data);

export const validateCoupon = (payload) =>
  client.post('/coupons/validate', payload).then((r) => r.data);
