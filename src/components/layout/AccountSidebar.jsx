import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../features/auth/hooks/useAuth';
import { useLanguage } from '../../i18n/LanguageContext';

export default function AccountSidebar() {
  const { isAdmin, isReseller } = useAuth();
  const { t } = useLanguage();
  const location = useLocation();
  const [open, setOpen] = useState(false);
  const links = isAdmin
    ? [
      { to: '/admin', label: t('adminDashboard'), icon: '▦', end: true },
      { to: '/admin/products', label: t('manageProducts'), icon: '□' },
      { to: '/admin/coupons', label: t('couponsAndDelivery'), icon: '%' },
      { to: '/admin#orders', label: t('orders'), icon: '▤' },
      { to: '/admin#withdrawals', label: t('withdrawals'), icon: '↗' },
    ]
    : [
      { to: '/account', label: t('myDashboard'), icon: '▦', end: true },
      { to: '/cart', label: t('cart'), icon: '▱' },
      { to: '/account#sales-history', label: t('sellerSales'), icon: '↗' },
      { to: '/account#purchase-history', label: t('purchases'), icon: '▤' },
      { to: '/account#product-submission', label: t('submitProduct'), icon: '+' },
      { to: '/account#seller-products', label: t('myListings'), icon: '□' },
      { to: '/account#balance-history', label: t('walletBalance'), icon: '৳' },
      { to: '/account#marketing-accounts', label: t('marketingIds'), icon: '◎' },
      { to: '/account#withdrawals', label: t('withdrawals'), icon: '⇧' },
    ];

  return (
    <>
      <button className="sidebar-mobile-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {t('menu')}
      </button>
      <aside className={`account-sidebar ${open ? 'account-sidebar--open' : ''}`}>
        <div className="account-sidebar__title">{isAdmin ? t('adminWorkspace') : isReseller ? t('resellerWorkspace') : t('accountWorkspace')}</div>
        <nav aria-label={t('dashboard')}>
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => {
                const hash = link.to.split('#')[1];
                const activeHashMatches = hash ? location.hash === `#${hash}` : !location.hash;
                return `account-sidebar__link ${isActive && activeHashMatches ? 'is-active' : ''}`;
              }}
              onClick={() => setOpen(false)}
            >
              <span aria-hidden="true">{link.icon}</span>
              {link.label}
            </NavLink>
          ))}
        </nav>
      </aside>
      {open && <button className="sidebar-backdrop" type="button" aria-label={t('closeMenu')} onClick={() => setOpen(false)} />}
    </>
  );
}
