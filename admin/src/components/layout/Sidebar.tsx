import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  Users,
  BarChart3,
  Settings,
  ExternalLink,
  ShieldCheck,
  Radio,
} from 'lucide-react';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';

export const Sidebar: React.FC = () => {
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
    { to: '/reports', label: t('nav.reports'), icon: BarChart3 },
    { to: '/settings', label: t('nav.settings'), icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[#00132b] via-[#001938] to-[#001124] text-white fixed inset-y-0 start-0 z-30 border-e border-white/10 shadow-2xl select-none">
      {/* Brand Header */}
      <div className="px-3.5 py-3 border-b border-white/10 flex flex-col items-center text-center">
        {/* 1. Primary Company Logo (ALMAGD) - Logo only */}
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

        {/* 2. Complex Logo (New Pratama) - Refined Size under company logo */}
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

      {/* Navigation Sections */}
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {/* Section 1: Operations */}
        <div>
          <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-start flex items-center gap-1.5">
            <span>{isAr ? 'العمليات التشغيلية' : 'Operasional'}</span>
          </div>
          <nav className="space-y-1">
            {operationalNav.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) =>
                    `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-gold/25 via-gold/15 to-transparent text-white font-semibold shadow-xs border-s-4 border-gold'
                        : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon
                        className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${
                          isActive
                            ? 'text-gold-light'
                            : 'text-slate-400 group-hover:text-gold-light'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.8}
                      />
                      <span className="flex-1 text-start truncate">{item.label}</span>
                      {isActive && (
                        <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#c88b2c]" />
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
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 text-start flex items-center gap-1.5">
              <span>{isAr ? 'الإدارة والتقارير' : 'Manajemen'}</span>
            </div>
            <nav className="space-y-1">
              {managementNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      `group relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                        isActive
                          ? 'bg-gradient-to-r from-gold/25 via-gold/15 to-transparent text-white font-semibold shadow-xs border-s-4 border-gold'
                          : 'text-slate-300 hover:text-white hover:bg-white/[0.06]'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 flex-shrink-0 ${
                            isActive
                              ? 'text-gold-light'
                              : 'text-slate-400 group-hover:text-gold-light'
                          }`}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                        <span className="flex-1 text-start truncate">{item.label}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-gold shadow-[0_0_8px_#c88b2c]" />
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
      <div className="p-3 border-t border-white/10 space-y-2 bg-black/20">
        {/* Public Website Quick Link */}
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

        {/* Staff Profile Card */}
        {staff && (
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
        )}

        {/* Version Badge */}
        <div className="px-2 pt-1 text-[10px] text-slate-400 text-center">
          ALMAGD Platform v1.0.4
        </div>
      </div>
    </aside>
  );
};
