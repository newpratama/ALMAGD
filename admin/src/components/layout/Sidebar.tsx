import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';

export const Sidebar: React.FC = () => {
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
    <aside className="hidden md:flex flex-col w-64 bg-navy text-white fixed inset-y-0 start-0 z-30 border-e border-navy-light/40 shadow-md">
      {/* Brand header */}
      <div className="p-5 border-b border-navy-light/40 flex items-center gap-3">
        <img
          src={`${import.meta.env.BASE_URL}logo-almagd.png`}
          alt="ALMAGD"
          className="h-10 w-auto object-contain bg-white/10 p-1 rounded-lg"
        />
        <div className="text-start">
          <h1 className="font-bold text-sm tracking-wide text-white">ALMAGD</h1>
          <p className="text-[11px] text-white/60">New Pratama</p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition ${
                isActive
                  ? 'bg-gold text-white shadow-xs font-semibold'
                  : 'text-white/80 hover:bg-navy-light hover:text-white'
              }`
            }
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Footer brand indicator */}
      <div className="p-4 border-t border-navy-light/30 text-[11px] text-white/50 text-start">
        New Pratama Booking v1.0
      </div>
    </aside>
  );
};
