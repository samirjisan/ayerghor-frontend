import client from '../../../api/axiosClient';

export const fetchCart = () => client.get('/customer/cart').then((r) => r.data);
export const mergeCart = (items) => client.post('/customer/cart/merge', { items }).then((r) => r.data);
export const addCartItem = (product_id, quantity = 1) =>
  client.post('/customer/cart', { product_id, quantity }).then((r) => r.data);
export const updateCartItem = (id, quantity) =>
  client.patch(`/customer/cart/${id}`, { quantity }).then((r) => r.data);
export const removeCartItem = (id) => client.delete(`/customer/cart/${id}`).then((r) => r.data);
export const fetchStorefrontSettings = () => client.get('/storefront/settings').then((r) => r.data);
