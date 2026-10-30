import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';

export const BottomNav: React.FC = () => {
  const { role } = useAuth();
  const { t } = useI18n();

  const isManager = role === 'manager';

  const navItems = [
    { to: '/', label: t('nav.today'), icon: '📅' },
    { to: '/calendar', label: t('nav.calendar'), icon: '🗓️' },
    { to: '/bookings', label: t('nav.bookings'), icon: '📋' },
    { to: '/guests', label: t('nav.guests'), icon: '👥' },
    ...(isManager
      ? [
          { to: '/reports', label: t('nav.reports'), icon: '📊' },
          { to: '/settings', label: t('nav.settings'), icon: '⚙️' },
        ]
      : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-line shadow-lg z-40 flex items-center justify-around px-1 py-1.5 safe-bottom">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium transition ${
              isActive
                ? 'text-gold font-bold'
                : 'text-muted hover:text-navy'
            }`
          }
        >
          <span className="text-lg leading-none mb-0.5">{item.icon}</span>
          <span className="truncate max-w-[56px] text-center">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
