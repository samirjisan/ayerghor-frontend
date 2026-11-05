import { useEffect, useState } from 'react';
import { useLanguage } from '../../../i18n/LanguageContext';
import { useLocations } from '../../location/hooks/useLocations';
import { fetchAdminUsers, updateAdminUser, updateAdminUserStatus } from '../api/adminApi';

const blankUser = {
  name: '',
  mobile: '',
  email: '',
  facebook_id: '',
  village_holding: '',
  post_office_area: '',
  district_id: '',
  thana_id: '',
};

const perPage = 20;

export default function AdminUsersPage() {
  const { t } = useLanguage();
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(blankUser);
  const [districtId, setDistrictId] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState(null);
  const { districts, thanas, loadingThanas, error: locationError } = useLocations(districtId);

  const load = async (filters = {}) => {
    setLoading(true);
    try {
      const result = await fetchAdminUsers({
        search: filters.search ?? search,
        status: filters.status ?? statusFilter,
        page: filters.page ?? page,
        per_page: perPage,
      });
      setUsers(result.data);
      setPage(result.current_page);
      setLastPage(result.last_page);
      setTotal(result.total);
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminUsersError'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load({ search: '', status: '', page: 1 });
  }, []);

  const resetForm = () => {
    setForm(blankUser);
    setDistrictId('');
    setEditingId(null);
  };

  const startEdit = (user) => {
    setEditingId(user.id);
    setForm({
      name: user.name,
      mobile: user.mobile,
      email: user.email || '',
      facebook_id: user.facebook_id || '',
      village_holding: user.profile?.village_holding || '',
      post_office_area: user.profile?.post_office_area || '',
      district_id: user.profile?.district?.id ? String(user.profile.district.id) : '',
      thana_id: user.profile?.thana?.id ? String(user.profile.thana.id) : '',
    });
    setDistrictId(user.profile?.district?.id ? String(user.profile.district.id) : '');
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const saveUser = async (event) => {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);
    try {
      await updateAdminUser(editingId, {
        ...form,
        email: form.email.trim() || null,
        facebook_id: form.facebook_id.trim() || null,
        district_id: Number(form.district_id),
        thana_id: Number(form.thana_id),
      });
      resetForm();
      setNotice(t('userUpdated'));
      await load();
    } catch (requestError) {
      setError(
        requestError.response?.data?.errors
          ? Object.values(requestError.response.data.errors).flat().join(' ')
          : requestError.response?.data?.message || t('adminUsersError')
      );
    } finally {
      setSaving(false);
    }
  };

  const changeUserStatus = async (user) => {
    const nextStatus = !user.is_active;
    if (!window.confirm(nextStatus ? t('confirmActivateUser') : t('confirmDeactivateUser'))) return;
    setError('');
    setNotice('');
    setUpdatingStatusId(user.id);
    try {
      await updateAdminUserStatus(user.id, nextStatus);
      setUsers((current) => current.map((item) => (
        item.id === user.id ? { ...item, is_active: nextStatus } : item
      )));
      setNotice(nextStatus ? t('userActivated') : t('userDeactivated'));
    } catch (requestError) {
      setError(requestError.response?.data?.message || t('adminUsersError'));
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const applyFilters = (event) => {
    event.preventDefault();
    setSearch(searchInput);
    setPage(1);
    load({ search: searchInput, status: statusFilter, page: 1 });
  };

  const changeStatusFilter = (event) => {
    const nextStatus = event.target.value;
    setStatusFilter(nextStatus);
    setPage(1);
    load({ search, status: nextStatus, page: 1 });
  };

  const changePage = (nextPage) => {
    setPage(nextPage);
    load({ page: nextPage });
  };

  const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';

  return (
    <div className="container dash admin-products-page">
      <h1>{t('manageUsers')}</h1>
      <p className="dashboard-note">{t('adminUsersHelp')}</p>
      {error && <div className="alert alert--error" role="alert">{error}</div>}
      {notice && <div className="alert alert--success" role="status">{notice}</div>}
      {locationError && <div className="alert alert--error" role="alert">{locationError}</div>}

      {editingId && (
        <form className="card card--pad admin-product-form" onSubmit={saveUser}>
          <h2>{t('editUser')}</h2>
          <div className="form-grid">
            <label className="field">
              <span>{t('name')} *</span>
              <input required maxLength="120" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            </label>
            <label className="field">
              <span>{t('mobile')} *</span>
              <input required inputMode="numeric" maxLength="11" value={form.mobile} onChange={(event) => setForm({ ...form, mobile: event.target.value })} />
            </label>
            <label className="field">
              <span>{t('email')}</span>
              <input type="email" maxLength="150" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="field">
              <span>{t('facebook')}</span>
              <input maxLength="150" value={form.facebook_id} onChange={(event) => setForm({ ...form, facebook_id: event.target.value })} />
            </label>
            <label className="field">
              <span>{t('village')} *</span>
              <input required maxLength="255" value={form.village_holding} onChange={(event) => setForm({ ...form, village_holding: event.target.value })} />
            </label>
            <label className="field">
              <span>{t('postOffice')} *</span>
              <input required maxLength="255" value={form.post_office_area} onChange={(event) => setForm({ ...form, post_office_area: event.target.value })} />
            </label>
            <label className="field">
              <span>{t('district')} *</span>
              <select
                required
                value={form.district_id}
                onChange={(event) => {
                  setForm({ ...form, district_id: event.target.value, thana_id: '' });
                  setDistrictId(event.target.value);
                }}
              >
                <option value="">{t('select')}</option>
                {districts.map((district) => <option key={district.id} value={district.id}>{district.name}</option>)}
              </select>
            </label>
            <label className="field">
              <span>{t('thana')} *</span>
              <select
                required
                disabled={!form.district_id || loadingThanas}
                value={form.thana_id}
                onChange={(event) => setForm({ ...form, thana_id: event.target.value })}
              >
                <option value="">{loadingThanas ? t('pleaseWait') : t('selectThana')}</option>
                {thanas.map((thana) => <option key={thana.id} value={thana.id}>{thana.name}</option>)}
              </select>
            </label>
            <div className="full admin-product-actions">
              <button className="btn btn--primary" type="submit" disabled={saving}>
                {saving ? t('pleaseWait') : t('saveChanges')}
              </button>
              <button className="btn btn--outline" type="button" onClick={resetForm}>
                {t('cancel')}
              </button>
            </div>
          </div>
        </form>
      )}

      <section className="card card--pad admin-product-list">
        <div className="section-heading">
          <h2>{t('registeredUsers')} ({total})</h2>
          <form className="admin-search" onSubmit={applyFilters}>
            <input
              aria-label={t('searchUsers')}
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t('searchUsers')}
            />
            <select aria-label={t('status')} value={statusFilter} onChange={changeStatusFilter}>
              <option value="">{t('allStatuses')}</option>
              <option value="active">{t('active')}</option>
              <option value="inactive">{t('inactive')}</option>
            </select>
            <button className="btn btn--outline" type="submit">{t('search')}</button>
          </form>
        </div>
        {loading ? <p className="dashboard-note">{t('pleaseWait')}</p> : users.length ? (
          <>
            <div className="table-wrap">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('name')}</th>
                    <th>{t('mobile')}</th>
                    <th>{t('email')}</th>
                    <th>{t('facebook')}</th>
                    <th>{t('accountType')}</th>
                    <th>{t('address')}</th>
                    <th>{t('registeredAt')}</th>
                    <th>{t('lastLogin')}</th>
                    <th>{t('status')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{user.name}</td>
                      <td>{user.mobile}</td>
                      <td>{user.email || '—'}</td>
                      <td>{user.facebook_id || '—'}</td>
                      <td>{user.role === 'reseller' ? t('resellerAccount') : t('customerAccount')}</td>
                      <td>
                        {user.profile ? (
                          <>
                            {[user.profile.village_holding, user.profile.post_office_area, user.profile.thana?.name, user.profile.district?.name]
                              .filter(Boolean)
                              .join(', ')}
                          </>
                        ) : '—'}
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>{formatDate(user.last_login_at)}</td>
                      <td>
                        <span className={`status status--${user.is_active ? 'approved' : 'pending'}`}>
                          {user.is_active ? t('active') : t('inactive')}
                        </span>
                      </td>
                      <td>
                        <div className="admin-product-actions">
                          <button className="btn btn--ghost" type="button" onClick={() => startEdit(user)}>
                            {t('edit')}
                          </button>
                          <button
                            className="btn btn--outline"
                            type="button"
                            disabled={updatingStatusId === user.id}
                            onClick={() => changeUserStatus(user)}
                          >
                            {user.is_active ? t('deactivate') : t('activate')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="admin-product-actions" style={{ justifyContent: 'space-between', marginTop: 16 }}>
              <span>{t('page')} {page} {t('of')} {lastPage}</span>
              <div className="admin-product-actions">
                <button className="btn btn--outline" type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>
                  {t('previous')}
                </button>
                <button className="btn btn--outline" type="button" disabled={page >= lastPage} onClick={() => changePage(page + 1)}>
                  {t('next')}
                </button>
              </div>
            </div>
          </>
        ) : <p className="dashboard-note">{t('noRegisteredUsers')}</p>}
      </section>
    </div>
  );
}
