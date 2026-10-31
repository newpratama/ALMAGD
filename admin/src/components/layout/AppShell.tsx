import React, { Suspense, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { PanelLeft, PanelLeftClose } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { LanguageToggle } from './LanguageToggle';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { IdlePrefetcher } from '../data/IdlePrefetcher';

export const AppShell: React.FC = () => {
  const { staff, role, signOut } = useAuth();
  const { t, lang } = useI18n();
  const isAr = lang === 'ar';

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('almagd_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('almagd_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-mist text-ink flex flex-col">
      {/* Background Idle Prefetcher (0ms Page Navigation) */}
      <IdlePrefetcher />

      {/* Sidebar (Desktop) */}
      <Sidebar isCollapsed={isSidebarCollapsed} onToggleCollapse={toggleSidebar} />

      {/* Main Wrapper */}
      <div
        className={`${
          isSidebarCollapsed ? 'md:ps-20' : 'md:ps-64'
        } flex flex-col flex-1 min-w-0 pb-16 md:pb-6 transition-all duration-300 ease-in-out`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-xs border-b border-line px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shadow-xs">
          {/* Left / Start: Desktop toggle button & Mobile brand */}
          <div className="flex items-center gap-3">
            {/* Desktop Sidebar Toggle Button */}
            <button
              type="button"
              onClick={toggleSidebar}
              className="hidden md:flex items-center justify-center p-2 rounded-lg text-slate-500 hover:text-navy hover:bg-stone/60 border border-line/70 transition-all shadow-xs"
              title={
                isSidebarCollapsed
                  ? isAr
                    ? 'توسيع القائمة الجانبية'
                    : 'Perluas Sidebar'
                  : isAr
                  ? 'تصغير القائمة الجانبية'
                  : 'Ciutkan Sidebar'
              }
            >
              {isSidebarCollapsed ? (
                <PanelLeft className="w-4 h-4 text-navy" />
              ) : (
                <PanelLeftClose className="w-4 h-4 text-navy" />
              )}
            </button>

            <div className="md:hidden flex items-center gap-2">
              <img
                src={`${import.meta.env.BASE_URL}logo-almagd.png`}
                alt="ALMAGD"
                className="h-7 w-auto object-contain"
              />
              <span className="h-4 w-px bg-slate-300" aria-hidden="true" />
              <img
                src={`${import.meta.env.BASE_URL}a_clean_isolated_logo_graphic_on_a_transparent_bac.png`}
                alt="New Pratama"
                className="h-7 w-7 rounded-full bg-white object-contain ring-1 ring-gold/50 p-0.5"
              />
              <span className="font-bold text-navy text-xs hidden sm:inline">نيو براتاما</span>
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
          <Suspense
            fallback={
              <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 text-muted">
                <Spinner size="lg" />
                <span className="text-xs font-medium text-slate-500 animate-pulse">
                  {lang === 'ar' ? 'جاري تحميل الصفحة...' : 'Memuat halaman...'}
                </span>
              </div>
            }
          >
            <Outlet />
          </Suspense>
        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <BottomNav />
    </div>
  );
};
