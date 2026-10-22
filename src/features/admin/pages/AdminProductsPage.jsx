import { useEffect, useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { fetchCategories } from '../../landing/api/landingApi';
import {
  createAdminProduct,
  deleteAdminProduct,
  fetchAdminProducts,
  updateAdminProduct,
} from '../api/adminApi';

const blankProduct = {
  category_id: '',
  name: '',
  description: '',
  price: '',
  sale_price: '',
  stock: '1',
  is_active: true,
  is_featured: false,
};

function toFormData(values) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === 'image') {
      if (value) data.append(key, value);
    } else if (key === 'remove_image') {
      data.append(key, value ? '1' : '0');
    } else if (value !== null && value !== undefined) {
      data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }
  });
  return data;
}

export default function AdminProductsPage() {
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blankProduct);
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async (query = search) => {
    setLoading(true);
    try {
      const [productList, categoryList] = await Promise.all([
        fetchAdminProducts({ search: query, per_page: 100 }),
        fetchCategories(),
      ]);
      setProducts(productList);
      setCategories(categoryList);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminProductsError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load('');
  }, []);

  const resetForm = () => {
    setForm(blankProduct);
    setImage(null);
    setRemoveImage(false);
    setEditingId(null);
  };

  const startEdit = (product) => {
    setEditingId(product.id);
    setForm({
      category_id: String(product.category_id),
      name: product.name,
      description: product.description || '',
      price: product.price,
      sale_price: product.sale_price || '',
      stock: String(product.stock),
      is_active: Boolean(product.is_active),
      is_featured: Boolean(product.is_featured),
    });
    setImage(null);
    setRemoveImage(false);
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveProduct = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    const payload = toFormData({
      ...form,
      sale_price: form.sale_price,
      image,
      remove_image: removeImage,
    });

    try {
      if (editingId) {
        await updateAdminProduct(editingId, payload);
        setNotice(t('productUpdated'));
      } else {
        await createAdminProduct(payload);
        setNotice(t('productCreated'));
      }
      resetForm();
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.errors
          ? Object.values(requestError.response.data.errors).flat().join(' ')
          : requestError.response?.data?.message || t('adminProductsError')
      );
    } finally {
      setSaving(false);
    }
  };

  const removeProduct = async (product) => {
    if (!window.confirm(t('confirmDeleteProduct'))) return;
    setError('');
    setNotice('');
    try {
      await deleteAdminProduct(product.id);
      setProducts((current) => current.filter((item) => item.id !== product.id));
      if (editingId === product.id) resetForm();
      setNotice(t('productDeleted'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminProductsError'));
    }
  };

  return (
    <div className="container dash admin-products-page">
      <h1>{t('manageProducts')}</h1>
      <p className="dashboard-note">{t('adminProductHelp')}</p>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--success" role="status">{notice}</div>}

      <form className="card card--pad admin-product-form" onSubmit={saveProduct}>
        <h2>{editingId ? t('editProduct') : t('createProduct')}</h2>
        <div className="form-grid">
          <label className="field">
            <span>{t('productName')} *</span>
            <input required maxLength="200" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('category')} *</span>
            <select required value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
              <option value="">{t('select')}</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label className="field">
            <span>{t('price')} *</span>
            <input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('salePrice')}</span>
            <input type="number" min="0" step="0.01" value={form.sale_price} onChange={(event) => setForm({ ...form, sale_price: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('stock')} *</span>
            <input required type="number" min="0" step="1" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} />
          </label>
          <label className="field">
            <span>{t('productImage')}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => setImage(event.target.files?.[0] || null)} />
            <small className="field__hint">{t('imageUploadHint')}</small>
          </label>
          <label className="field full">
            <span>{t('description')}</span>
            <textarea rows="4" maxLength="10000" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <div className="admin-product-options full">
            <label className="check-field"><input type="checkbox" checked={form.is_active} onChange={(event) => setForm({ ...form, is_active: event.target.checked })} /> {t('active')}</label>
            <label className="check-field"><input type="checkbox" checked={form.is_featured} onChange={(event) => setForm({ ...form, is_featured: event.target.checked })} /> {t('featured')}</label>
            {editingId && (
              <label className="check-field"><input type="checkbox" checked={removeImage} onChange={(event) => setRemoveImage(event.target.checked)} /> {t('removeCurrentImage')}</label>
            )}
          </div>
          <div className="full admin-product-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>{saving ? t('pleaseWait') : editingId ? t('saveChanges') : t('createProduct')}</button>
            {editingId && <button className="btn btn--outline" type="button" onClick={resetForm}>{t('cancel')}</button>}
          </div>
        </div>
      </form>

      <section className="card card--pad admin-product-list">
        <div className="section-heading">
          <h2>{t('products')}</h2>
          <form className="admin-search" onSubmit={(event) => { event.preventDefault(); load(search); }}>
            <input aria-label={t('search')} value={search} onChange={(event) => setSearch(event.target.value)} placeholder={t('searchProducts')} />
            <button className="btn btn--outline" type="submit">{t('search')}</button>
          </form>
        </div>
        {loading ? <p className="dashboard-note">{t('pleaseWait')}</p> : products.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr><th>{t('productName')}</th><th>{t('category')}</th><th>{t('price')}</th><th>{t('stock')}</th><th>{t('status')}</th><th>{t('actions')}</th></tr></thead>
              <tbody>
                {products.map((product) => (
                  <tr key={product.id}>
                    <td><div className="admin-product-name">{product.image && <img src={product.image} alt="" />}<span>{product.name}</span></div></td>
                    <td>{product.category?.name || '—'}</td>
                    <td>{product.sale_price ? <><del>৳ {Number(product.price).toLocaleString('en-BD')}</del> ৳ {Number(product.sale_price).toLocaleString('en-BD')}</> : `৳ ${Number(product.price).toLocaleString('en-BD')}`}</td>
                    <td>{product.stock}</td>
                    <td><span className={`status status--${product.is_active ? 'approved' : 'pending'}`}>{product.is_active ? t('active') : t('inactive')}</span></td>
                    <td><div className="admin-product-actions"><button className="btn btn--ghost" type="button" onClick={() => startEdit(product)}>{t('edit')}</button><button className="btn btn--outline" type="button" onClick={() => removeProduct(product)}>{t('delete')}</button></div></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="dashboard-note">{t('noProducts')}</p>}
      </section>
    </div>
  );
}
