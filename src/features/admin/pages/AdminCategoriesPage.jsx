import { useEffect, useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import {
  createAdminCategory,
  deleteAdminCategory,
  fetchAdminCategories,
  updateAdminCategory,
} from '../api/adminApi';

const blankCategory = { name: '', is_active: true };

function toFormData(values) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => {
    if (key === 'image') {
      if (value) data.append(key, value);
    } else if (value !== null && value !== undefined) {
      data.append(key, typeof value === 'boolean' ? (value ? '1' : '0') : String(value));
    }
  });
  return data;
}

export default function AdminCategoriesPage() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blankCategory);
  const [image, setImage] = useState(null);
  const [removeImage, setRemoveImage] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      setCategories(await fetchAdminCategories());
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminCategoriesError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const resetForm = () => {
    setForm(blankCategory);
    setImage(null);
    setRemoveImage(false);
    setEditingId(null);
  };

  const startEdit = (category) => {
    setEditingId(category.id);
    setForm({ name: category.name, is_active: Boolean(category.is_active) });
    setImage(null);
    setRemoveImage(false);
    setNotice('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveCategory = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    try {
      const payload = toFormData({ ...form, image, remove_image: removeImage });
      if (editingId) {
        await updateAdminCategory(editingId, payload);
        setNotice(t('categoryUpdated'));
      } else {
        await createAdminCategory(payload);
        setNotice(t('categoryCreated'));
      }
      resetForm();
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.errors
          ? Object.values(requestError.response.data.errors).flat().join(' ')
          : requestError.response?.data?.message || t('adminCategoriesError')
      );
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category) => {
    if (!window.confirm(t('confirmDeleteCategory'))) return;
    setError('');
    setNotice('');
    setDeletingId(category.id);
    try {
      await deleteAdminCategory(category.id);
      setCategories((current) => current.filter((item) => item.id !== category.id));
      if (editingId === category.id) resetForm();
      setNotice(t('categoryDeleted'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminCategoriesError'));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="container dash admin-products-page">
      <h1>{t('manageCategories')}</h1>
      <p className="dashboard-note">{t('adminCategoryHelp')}</p>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--success" role="status">{notice}</div>}

      <form className="card card--pad admin-product-form" onSubmit={saveCategory}>
        <h2>{editingId ? t('editCategory') : t('createCategory')}</h2>
        <div className="form-grid">
          <label className="field">
            <span>{t('categoryName')} *</span>
            <input
              required
              maxLength="255"
              value={form.name}
              onChange={(event) => setForm({ ...form, name: event.target.value })}
            />
          </label>
          <label className="field">
            <span>{t('categoryImage')}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(event) => setImage(event.target.files?.[0] || null)}
            />
            <small className="field__hint">{t('imageUploadHint')}</small>
          </label>
          <div className="admin-product-options full">
            <label className="check-field">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(event) => setForm({ ...form, is_active: event.target.checked })}
              />
              {t('active')}
            </label>
            {editingId && (
              <label className="check-field">
                <input
                  type="checkbox"
                  checked={removeImage}
                  onChange={(event) => setRemoveImage(event.target.checked)}
                />
                {t('removeCurrentImage')}
              </label>
            )}
          </div>
          <div className="full admin-product-actions">
            <button className="btn btn--primary" type="submit" disabled={saving}>
              {saving ? t('pleaseWait') : editingId ? t('saveChanges') : t('createCategory')}
            </button>
            {editingId && (
              <button className="btn btn--outline" type="button" onClick={resetForm}>
                {t('cancel')}
              </button>
            )}
          </div>
        </div>
      </form>

      <section className="card card--pad admin-product-list">
        <h2>{t('manageCategories')}</h2>
        {loading ? <p className="dashboard-note">{t('pleaseWait')}</p> : categories.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t('categoryName')}</th>
                  <th>{t('status')}</th>
                  <th>{t('actions')}</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="admin-product-name">
                        {category.image && <img src={category.image} alt="" />}
                        <span>{category.name}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status status--${category.is_active ? 'approved' : 'pending'}`}>
                        {category.is_active ? t('active') : t('inactive')}
                      </span>
                    </td>
                    <td>
                      <div className="admin-product-actions">
                        <button className="btn btn--ghost" type="button" onClick={() => startEdit(category)}>
                          {t('edit')}
                        </button>
                        <button
                          className="btn btn--outline"
                          type="button"
                          disabled={deletingId === category.id}
                          onClick={() => removeCategory(category)}
                        >
                          {t('delete')}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="dashboard-note">{t('noCategories')}</p>}
      </section>
    </div>
  );
}
