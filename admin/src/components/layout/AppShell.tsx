import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { Badge } from '../ui/Badge';
import { IdlePrefetcher } from '../data/IdlePrefetcher';

export const AppShell: React.FC = () => {
  const { staff, role, signOut } = useAuth();
  const { t } = useI18n();

  return (
    <div className="min-h-screen bg-mist text-ink flex flex-col">
      {/* Background Idle Prefetcher (0ms Page Navigation) */}
      <IdlePrefetcher />

      {/* Sidebar (Desktop) */}
      <Sidebar />

      {/* Main Wrapper */}
      <div className="md:ps-64 flex flex-col flex-1 min-w-0 pb-16 md:pb-6">
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-line px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-xs">
          {/* Left / Start: Mobile brand & Title */}
          <div className="flex items-center gap-3">
            <div className="md:hidden flex items-center gap-2">
              <img
                src={`${import.meta.env.BASE_URL}logo-almagd.png`}
                alt="ALMAGD"
                className="h-8 w-auto object-contain"
              />
              <span className="font-bold text-navy text-sm">ALMAGD</span>
            </div>
          </div>

          {/* Right / End: Staff info, Role, Lang, Logout */}
          <div className="flex items-center gap-2 sm:gap-3">
            {staff && (
              <div className="flex items-center gap-2 text-start">
                <span className="text-xs sm:text-sm font-semibold text-ink truncate max-w-[120px] sm:max-w-[200px]">
                  {staff.full_name}
                </span>
                <Badge
                  variant={role === 'manager' ? 'gold' : 'navy'}
                  className="text-[10px] sm:text-xs"
                >
                  {role ? t(`role.${role}`) : ''}
                </Badge>
              </div>
            )}

            <div className="h-4 w-px bg-line" aria-hidden="true" />

            <LanguageToggle />

            <button
              type="button"
              onClick={signOut}
              className="text-xs font-medium text-danger hover:text-danger/80 p-1.5 rounded-lg border border-danger/20 hover:bg-danger/10 transition"
              title={t('nav.logout')}
            >
              {t('nav.logout')}
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 w-full max-w-full">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav />
    </div>
  );
};
