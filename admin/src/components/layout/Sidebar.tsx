import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  Fingerprint,
  ExternalLink,
  ShieldCheck,
  Radio,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';

export interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const { staff, role } = useAuth();
  const { t, lang } = useI18n();

  const isManager = role === 'manager';
  const isAr = lang === 'ar';

  const operationalNav = [
    { to: '/', label: t('nav.today'), icon: LayoutDashboard },
    { to: '/calendar', label: t('nav.calendar'), icon: CalendarDays },
    { to: '/bookings', label: t('nav.bookings'), icon: ClipboardList },
    { to: '/guests', label: t('nav.guests'), icon: Users },
  ];

  const managementNav = [
    { to: '/attendance', label: t('nav.attendance'), icon: Fingerprint },
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside
      className={`hidden md:flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-[#00132b] via-[#001938] to-[#001124] text-white fixed inset-y-0 start-0 z-30 border-e border-white/10 shadow-2xl select-none transition-all duration-300 ease-in-out`}
    >
      {/* Brand Header */}
      <div className="px-3 py-3 border-b border-white/10 flex flex-col items-center text-center relative">
        {!isCollapsed ? (
          /* ================= EXPANDED HEADER ================= */
          <div className="w-full flex flex-col items-center">
            {/* Collapse button at header end */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="absolute top-2.5 end-2.5 p-1.5 rounded-lg text-slate-400 hover:text-gold-light hover:bg-white/10 transition-colors z-10"
                title={isAr ? 'تصغير القائمة الجانبية' : 'Ciutkan Sidebar'}
              >
                {isAr ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            )}

            {/* 1. Primary Company Logo (ALMAGD) */}
            <div className="w-full flex items-center justify-center py-2 px-3 rounded-xl bg-white/[0.03] border border-white/10 shadow-inner group">
              <img
                src={`${import.meta.env.BASE_URL}logo-almagd-light.png`}
                alt="ALMAGD"
                className="w-full max-w-[140px] h-auto max-h-9 object-contain drop-shadow transition-transform duration-300 group-hover:scale-105"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}logo-almagd.png`;
                }}
              />
            </div>

            {/* Subtle gold separator */}
            <div className="h-px w-20 bg-gradient-to-r from-transparent via-gold/30 to-transparent my-2" />

            {/* 2. Complex Logo (New Pratama) */}
            <div className="flex flex-col items-center text-center w-full">
              <div className="relative group/emblem">
                <div className="h-16 w-16 rounded-full bg-white p-1 shadow-md shadow-black/40 ring-1.5 ring-gold/50 flex items-center justify-center transition-all duration-300 group-hover/emblem:scale-105 group-hover/emblem:ring-gold group-hover/emblem:shadow-gold/20">
                  <img
                    src={`${import.meta.env.BASE_URL}a_clean_isolated_logo_graphic_on_a_transparent_bac.png`}
                    alt="New Pratama Complex"
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}logo-new-pratama.png`;
                    }}
                  />
                </div>
              </div>

              <div className="mt-1.5 text-center w-full">
                <p className="text-[11px] font-bold text-white tracking-wide">
                  {isAr ? 'مجمع نيو براتاما الفندقي' : 'New Pratama Villa Complex'}
                </p>
                <p className="text-[9.5px] text-slate-300 font-medium mt-0.5">
                  {isAr ? 'نظام الحجوزات وإدارة العمليات' : 'Sistem Booking & Operasional'}
                </p>
              </div>
            </div>

            {/* 3. Live Cloud Sync Indicator */}
            <div className="mt-2.5 w-full flex items-center justify-between px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[9.5px] text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span className="font-medium">{isAr ? 'مزامنة سحابية حية' : 'Supabase Live'}</span>
              </span>
              <Radio className="w-3 h-3 text-emerald-400" />
            </div>
          </div>
        ) : (
          /* ================= COLLAPSED HEADER ================= */
          <div className="w-full flex flex-col items-center pt-1">
            {/* Dedicated Expand Button at Top */}
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="w-8 h-8 rounded-lg text-slate-400 hover:text-gold-light hover:bg-white/10 flex items-center justify-center transition-all mb-2"
                title={isAr ? 'توسيع القائمة الجانبية' : 'Perluas Sidebar'}
              >
                {isAr ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
              </button>
            )}

            {/* Compact New Pratama Emblem */}
            <div
              className="relative group/emblem cursor-pointer"
              onClick={onToggleCollapse}
              title={isAr ? 'مجمع نيو براتاما الفندقي' : 'New Pratama Villa Complex'}
            >
              <div className="h-11 w-11 rounded-full bg-white p-1 shadow-md shadow-black/40 ring-1.5 ring-gold/60 flex items-center justify-center transition-all duration-300 group-hover/emblem:scale-110 group-hover/emblem:ring-gold">
                <img
                  src={`${import.meta.env.BASE_URL}a_clean_isolated_logo_graphic_on_a_transparent_bac.png`}
                  alt="New Pratama"
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}logo-new-pratama.png`;
                  }}
                />
              </div>
            </div>

            {/* Compact ALMAGD Pill */}
            <div
              className="mt-2 px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 shadow-xs cursor-pointer hover:bg-white/10 transition-colors"
              onClick={onToggleCollapse}
              title="ALMAGD PMS"
            >
              <span className="text-[9px] font-black tracking-widest text-gold-light">
                ALMAGD
              </span>
            </div>

            {/* Live Pulsing Dot */}
            <div
              className="mt-2 flex items-center justify-center"
              title={isAr ? 'مزامنة سحابية حية' : 'Supabase Live'}
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Sections */}
      <div
        className={`flex-1 py-4 ${
          isCollapsed ? 'px-2 overflow-visible' : 'px-3 overflow-y-auto overflow-x-hidden'
        } space-y-5`}
      >
        {/* Section 1: Operations */}
        <div>
          {!isCollapsed ? (
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-start flex items-center gap-1.5">
              <span>{isAr ? 'العمليات التشغيلية' : 'Operasional'}</span>
            </div>
          ) : (
            <div className="h-px w-6 bg-white/10 mx-auto my-2" />
          )}

          <nav className="space-y-1.5">
            {operationalNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  title={item.label}
                  className={({ isActive }) =>
                    `group relative flex items-center ${
                      isCollapsed
                        ? 'justify-center w-11 h-11 mx-auto rounded-xl'
                        : 'gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium'
                    } transition-all duration-200 ${
                      isActive
                        ? isCollapsed
                          ? 'bg-gradient-to-br from-gold/30 to-gold/15 text-gold-light font-bold ring-1.5 ring-gold/60 shadow-md shadow-gold/10'
                          : 'bg-gradient-to-r from-gold/25 via-gold/15 to-transparent text-white font-semibold shadow-xs border-s-4 border-gold'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
                        strokeWidth={isActive ? 2.3 : 1.8}
                      />

                      {!isCollapsed && (
                        <>
                          <span className="flex-1 text-start truncate">{item.label}</span>
                          {isActive && (
                            <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#c88b2c]" />
                          )}
                        </>
                      )}

                      {/* Tooltip for Collapsed Mode */}
                      {isCollapsed && (
                        <div
                          className={`absolute top-1/2 -translate-y-1/2 ${
                            isAr ? 'right-full mr-3' : 'left-full ml-3'
                          } hidden group-hover:flex items-center px-3 py-1.5 rounded-lg bg-[#001938] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-gold/50 z-50 pointer-events-none drop-shadow-xl`}
                        >
                          <span>{item.label}</span>
                          <span
                            className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#001938] border-gold/50 rotate-45 ${
                              isAr
                                ? '-right-1 border-t border-r'
                                : '-left-1 border-b border-l'
                            }`}
                          />
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* Section 2: Management (Manager Role) */}
        {isManager && (
          <div>
            {!isCollapsed ? (
              <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-start flex items-center gap-1.5">
                <span>{isAr ? 'الإدارة والتقارير' : 'Manajemen'}</span>
              </div>
            ) : (
              <div className="h-px w-6 bg-white/10 mx-auto my-2" />
            )}

            <nav className="space-y-1.5">
              {managementNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    title={item.label}
                    className={({ isActive }) =>
                      `group relative flex items-center ${
                        isCollapsed
                          ? 'justify-center w-11 h-11 mx-auto rounded-xl'
                          : 'gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium'
                      } transition-all duration-200 ${
                        isActive
                          ? isCollapsed
                            ? 'bg-gradient-to-br from-gold/30 to-gold/15 text-gold-light font-bold ring-1.5 ring-gold/60 shadow-md shadow-gold/10'
                            : 'bg-gradient-to-r from-gold/25 via-gold/15 to-transparent text-white font-semibold shadow-xs border-s-4 border-gold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.08]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className="w-5 h-5 transition-transform duration-200 group-hover:scale-110 flex-shrink-0"
                          strokeWidth={isActive ? 2.3 : 1.8}
                        />

                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-start truncate">{item.label}</span>
                            {isActive && (
                              <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#c88b2c]" />
                            )}
                          </>
                        )}

                        {/* Tooltip for Collapsed Mode */}
                        {isCollapsed && (
                          <div
                            className={`absolute top-1/2 -translate-y-1/2 ${
                              isAr ? 'right-full mr-3' : 'left-full ml-3'
                            } hidden group-hover:flex items-center px-3 py-1.5 rounded-lg bg-[#001938] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-gold/50 z-50 pointer-events-none drop-shadow-xl`}
                          >
                            <span>{item.label}</span>
                            <span
                              className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#001938] border-gold/50 rotate-45 ${
                                isAr
                                  ? '-right-1 border-t border-r'
                                  : '-left-1 border-b border-l'
                              }`}
                            />
                          </div>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>
          </div>
        )}
      </div>

      {/* Staff & Public Portal Footer */}
      <div
        className={`border-t border-white/10 space-y-2 bg-black/20 ${
          isCollapsed ? 'px-2 py-3 overflow-visible' : 'p-3'
        }`}
      >
        {/* Public Website Quick Link */}
        {!isCollapsed ? (
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-xs text-slate-300 hover:text-white transition group border border-white/5"
            title={isAr ? 'عرض الموقع التسويقي العام' : 'Kunjungi Website Publik'}
          >
            <span className="truncate flex items-center gap-2">
              <span className="text-gold-light">↗</span>
              <span>{isAr ? 'الموقع التسويقي' : 'Website Publik'}</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
          </a>
        ) : (
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative w-11 h-11 mx-auto flex items-center justify-center rounded-xl bg-white/[0.05] hover:bg-white/[0.12] text-slate-300 hover:text-gold-light border border-white/10 transition-colors"
            title={isAr ? 'الموقع التسويقي' : 'Website Publik'}
          >
            <ExternalLink className="w-4 h-4" />
            <div
              className={`absolute top-1/2 -translate-y-1/2 ${
                isAr ? 'right-full mr-3' : 'left-full ml-3'
              } hidden group-hover:flex items-center px-3 py-1.5 rounded-lg bg-[#001938] text-white text-xs font-semibold whitespace-nowrap shadow-2xl border border-gold/50 z-50 pointer-events-none drop-shadow-xl`}
            >
              <span>{isAr ? 'الموقع التسويقي' : 'Website Publik'}</span>
              <span
                className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#001938] border-gold/50 rotate-45 ${
                  isAr
                    ? '-right-1 border-t border-r'
                    : '-left-1 border-b border-l'
                }`}
              />
            </div>
          </a>
        )}

        {/* Staff Profile Card */}
        {staff && (
          !isCollapsed ? (
            <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5 text-start">
              <div className="h-8 w-8 rounded-lg bg-gold/20 border border-gold/40 text-gold-light flex items-center justify-center font-bold text-xs flex-shrink-0">
                {staff.full_name?.slice(0, 2).toUpperCase() || 'ST'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate">
                  {staff.full_name}
                </p>
                <div className="flex items-center gap-1 text-[10px] text-slate-400">
                  <ShieldCheck className="w-3 h-3 text-gold" />
                  <span className="truncate">{role ? t(`role.${role}`) : ''}</span>
                </div>
              </div>
            </div>
          ) : (
            <div
              className="group relative w-11 h-11 mx-auto flex items-center justify-center rounded-xl bg-gold/20 border border-gold/40 text-gold-light font-bold text-xs cursor-default transition-transform hover:scale-105"
            >
              {staff.full_name?.slice(0, 2).toUpperCase() || 'ST'}
              <div
                className={`absolute top-1/2 -translate-y-1/2 ${
                  isAr ? 'right-full mr-3' : 'left-full ml-3'
                } hidden group-hover:flex flex-col px-3 py-1.5 rounded-lg bg-[#001938] text-white text-xs whitespace-nowrap shadow-2xl border border-gold/50 z-50 pointer-events-none drop-shadow-xl text-start`}
              >
                <span className="font-bold text-white">{staff.full_name}</span>
                <span className="text-[10px] text-gold-light">
                  {role ? t(`role.${role}`) : ''}
                </span>
                <span
                  className={`absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-[#001938] border-gold/50 rotate-45 ${
                    isAr
                      ? '-right-1 border-t border-r'
                      : '-left-1 border-b border-l'
                  }`}
                />
              </div>
            </div>
          )
        )}

        {/* Version */}
        {!isCollapsed && (
          <div className="px-2 pt-1 text-[10px] text-slate-400 text-center">
            ALMAGD Platform v1.0.4
          </div>
        )}
      </div>
    </aside>
  );
};
