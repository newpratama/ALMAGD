import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';

export const BottomNav: React.FC = () => {
  const { role } = useAuth();
  const { t } = useI18n();

  const isManager = role === 'manager';

  const navItems = [
    { to: '/', label: t('nav.today'), icon: LayoutDashboard },
    { to: '/calendar', label: t('nav.calendar'), icon: CalendarDays },
    { to: '/bookings', label: t('nav.bookings'), icon: ClipboardList },
    { to: '/guests', label: t('nav.guests'), icon: Users },
    ...(isManager
      ? [
          { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
          { to: '/settings', label: t('nav.settings'), icon: Settings },
        ]
      : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/95 backdrop-blur-md border-t border-line shadow-lg z-40 flex items-center justify-around px-1 py-1.5 safe-bottom">
      {navItems.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-lg text-[10px] font-medium transition ${
                isActive
                  ? 'text-gold font-bold scale-105'
                  : 'text-muted hover:text-navy'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`w-5 h-5 mb-0.5 ${
                    isActive ? 'text-gold' : 'text-muted'
                  }`}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                <span className="truncate max-w-[56px] text-center leading-tight">
                  {item.label}
                </span>
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );
};
