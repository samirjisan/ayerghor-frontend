import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import Logo from './Logo';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';
import { useCart } from '../../features/cart/context/CartContext';

export default function Navbar() {
  const { user, logout, isAdmin, isCustomer } = useAuth();
  const { count: cartCount } = useCart();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [languageError, setLanguageError] = useState('');

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const changeLanguage = async (nextLanguage) => {
    setLanguageError('');
    try {
      await setLanguage(nextLanguage);
    } catch {
      setLanguageError(t('settingsError'));
    }
  };

  const submitSearch = (event) => {
    event.preventDefault();
    navigate(search.trim() ? `/?search=${encodeURIComponent(search.trim())}` : '/');
  };

  return (
    <header className="navbar">
      <div className="container navbar__inner">
        <Logo />

        <form className="navbar__search" role="search" onSubmit={submitSearch}>
          <input aria-label={t('search')} placeholder={t('search')} value={search} onChange={(event) => setSearch(event.target.value)} />
          <button type="submit" aria-label={t('search')}>⌕</button>
        </form>

        <div className="navbar__actions">
          <a className="navbar__category-link" href="/#categories">{t('shopByCategory')}</a>
          <div className="language-toggle" aria-label={t('language')}>
            <button type="button" className={language === 'en' ? 'is-active' : ''} onClick={() => changeLanguage('en')}>EN</button>
            <button type="button" className={language === 'bn' ? 'is-active' : ''} onClick={() => changeLanguage('bn')}>বাংলা</button>
          </div>
          {user ? (
            <>
              <span className="navbar__hello">{t('welcome')}, {user.name}</span>
              {isCustomer && <Button to="/cart" variant="outline">{t('cart')} ({cartCount})</Button>}
              <Button to={isAdmin ? '/admin' : '/account'} variant="outline">
                {isAdmin ? t('adminDashboard') : t('myAccount')}
              </Button>
              <Button variant="ghost" onClick={handleLogout}>{t('logout')}</Button>
            </>
          ) : (
            <>
              <Button to="/cart" variant="outline">{t('cart')} ({cartCount})</Button>
              <Button to="/login" variant="ghost">{t('login')}</Button>
              <Button to="/register">{t('register')}</Button>
            </>
          )}
        </div>
      </div>
      {languageError && <div className="navbar__error" role="alert">{languageError}</div>}
    </header>
  );
}
