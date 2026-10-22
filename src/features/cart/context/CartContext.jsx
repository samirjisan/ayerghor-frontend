import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../auth/hooks/useAuth';
import { useLanguage } from '../../../i18n/LanguageContext';
import { addCartItem, fetchCart, mergeCart, removeCartItem, updateCartItem } from '../api/cartApi';

const CartContext = createContext(null);
const GUEST_CART_KEY = 'ag_guest_cart';

const readGuestCart = () => {
  try {
    const items = JSON.parse(localStorage.getItem(GUEST_CART_KEY) || '[]');
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
};

export function CartProvider({ children }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user || !['customer', 'reseller'].includes(user.role)) {
      const guestItems = readGuestCart();
      setItems(guestItems);
      setError('');
      return guestItems;
    }
    setLoading(true);
    try {
      const guestItems = readGuestCart();
      if (guestItems.length) {
        await mergeCart(guestItems.map(({ product_id, quantity }) => ({ product_id, quantity })));
        localStorage.removeItem(GUEST_CART_KEY);
      }
      const cartItems = await fetchCart();
      setItems(cartItems);
      setError('');
      return cartItems;
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('cartLoadError'));
      throw requestError;
    } finally {
      setLoading(false);
    }
  }, [user?.id, user?.role, t]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const add = useCallback(async (product, quantity = 1) => {
    const productId = typeof product === 'object' ? product.id : product;
    if (user && ['customer', 'reseller'].includes(user.role)) {
      const response = await addCartItem(productId, quantity);
      await refresh();
      return response;
    }

    const guestItems = readGuestCart();
    const existing = guestItems.find((item) => Number(item.product_id) === Number(productId));
    const productData = typeof product === 'object' ? product : existing?.product;
    if (!productData) throw new Error('Product details are required for a guest cart.');
    const stock = Number(productData.stock);
    if (!Number.isFinite(stock) || stock < 1) throw new Error(t('outOfStock'));
    const next = existing
      ? guestItems.map((item) => item === existing
        ? { ...item, quantity: Math.min(stock, Number(item.quantity) + quantity) }
        : item)
      : [...guestItems, { id: `guest-${productId}`, product_id: productId, quantity, product: productData }];
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
    setItems(next);
    setError('');
    return { message: t('addedToCart') };
  }, [refresh, t, user?.id, user?.role]);

  const update = useCallback(async (id, quantity) => {
    if (String(id).startsWith('guest-')) {
      const productId = Number(String(id).replace('guest-', ''));
      const next = readGuestCart().map((item) => Number(item.product_id) === productId
        ? { ...item, quantity: Math.min(Number(item.product.stock) || 100, quantity) }
        : item);
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
      setItems(next);
      return;
    }
    await updateCartItem(id, quantity);
    await refresh();
  }, [refresh]);

  const remove = useCallback(async (id) => {
    if (String(id).startsWith('guest-')) {
      const next = readGuestCart().filter((item) => item.id !== id);
      localStorage.setItem(GUEST_CART_KEY, JSON.stringify(next));
      setItems(next);
      return;
    }
    await removeCartItem(id);
    await refresh();
  }, [refresh]);

  const count = items.reduce((total, item) => total + Number(item.quantity), 0);
  const value = useMemo(() => ({ items, count, error, loading, add, update, remove, refresh }), [items, count, error, loading, add, update, remove, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider.');
  return context;
}
