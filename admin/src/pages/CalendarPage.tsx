import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n/I18nProvider';
import { supabase } from '../lib/supabase';
import { todayISO, addDaysISO } from '../lib/dates';
import { useAvailableUnits } from '../api/units';
import { CalendarToolbar, type CalendarUnitFilter } from '../components/calendar/CalendarToolbar';
import { RoomCalendar } from '../components/calendar/RoomCalendar';
import { Button } from '../components/ui/Button';
import { DateInput } from '../components/ui/DateInput';

export const CalendarPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();

  // Start 2 days before today by default so recent stays are visible
  const [startDate, setStartDate] = useState<string>(addDaysISO(todayISO(), -2));
  const [daysCount, setDaysCount] = useState<7 | 14 | 30>(30);
  const [unitFilter, setUnitFilter] = useState<CalendarUnitFilter>('all');
  const [unitSearch, setUnitSearch] = useState<string>('');
  const [collapsedVillas, setCollapsedVillas] = useState<boolean>(false);
  const [showRibbon, setShowRibbon] = useState<boolean>(true);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const today = todayISO();
  const tomorrow = addDaysISO(today, 1);

  // 1. Live Stats: Available Today via Postgres RPC available_units
  const { data: availableUnits = [] } = useAvailableUnits(today, tomorrow);
  const availableVillasCount = availableUnits.filter((u) => u.kind === 'villa').length;
  const availableRoomsCount = availableUnits.filter((u) => u.kind === 'room').length;

  // 2. Arrivals Today
  const { data: arrivalsCount = 0 } = useQuery({
    queryKey: ['calendar-arrivals-today', today],
    queryFn: async () => {
      if (!supabase) return 0;
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('check_in', today)
        .neq('status', 'cancelled');
      if (error) throw error;
      return count || 0;
    },
  });

  // 3. Departures Today
  const { data: departuresCount = 0 } = useQuery({
    queryKey: ['calendar-departures-today', today],
    queryFn: async () => {
      if (!supabase) return 0;
      const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('check_out', today)
        .neq('status', 'cancelled');
      if (error) throw error;
      return count || 0;
    },
  });

  // 4. In-House Bookings (Occupied Today)
  const { data: inHouseBookings = [] } = useQuery({
    queryKey: ['calendar-inhouse-today', today],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('booking_overview')
        .select('id, unit_kind')
        .lte('check_in', today)
        .gt('check_out', today)
        .in('status', ['confirmed', 'checked_in']);
      if (error) throw error;
      return (data || []) as { id: string; unit_kind: string }[];
    },
  });

  const occupiedVillasCount = inHouseBookings.filter((b) => b.unit_kind === 'villa').length;
  const occupiedRoomsCount = inHouseBookings.filter((b) => b.unit_kind === 'room').length;

  // 5. Unpaid / Balance Due
  const { data: unpaidCount = 0 } = useQuery({
    queryKey: ['calendar-unpaid-today'],
    queryFn: async () => {
      if (!supabase) return 0;
      const { count, error } = await supabase
        .from('booking_overview')
        .select('*', { count: 'exact', head: true })
        .gt('balance', 0)
        .in('status', ['confirmed', 'checked_in']);
      if (error) throw error;
      return count || 0;
    },
  });

  const handlePrev = () => {
    const shift = daysCount === 7 ? -3 : daysCount === 14 ? -7 : -14;
    setStartDate((d) => addDaysISO(d, shift));
  };

  const handleNext = () => {
    const shift = daysCount === 7 ? 3 : daysCount === 14 ? 7 : 14;
    setStartDate((d) => addDaysISO(d, shift));
  };

  const handleToday = () => {
    setStartDate(addDaysISO(todayISO(), -2));
  };

  const handleEnterFullscreen = () => {
    setIsFullscreen(true);
    setDaysCount(30);
    setStartDate(todayISO()); // Directly starts with today so today + 29 days ahead are in view!
    try {
      if (document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
      }
    } catch {}
  };

  const handleExitFullscreen = () => {
    setIsFullscreen(false);
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    } catch {}
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isFullscreen) {
        handleExitFullscreen();
      }
    };
    const onFsChange = () => {
      if (!document.fullscreenElement && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('fullscreenchange', onFsChange);
    };
  }, [isFullscreen]);

  return (
    <div className="space-y-4 w-full text-start">
      {/* Page Header with New Booking Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-black text-navy tracking-tight">{t('nav.calendar')}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowRibbon((v) => !v)}
            className="text-xs text-muted hover:text-navy border border-line/60 bg-white shadow-xs"
            title={showRibbon ? t('calendar.hideRibbon') : t('calendar.showRibbon')}
          >
            <span>{showRibbon ? '▲' : '▼'}</span>
            <span>{showRibbon ? t('calendar.hideRibbon') : t('calendar.showRibbon')}</span>
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleEnterFullscreen}
            className="shadow-xs font-bold flex items-center gap-1.5 border-navy/30 bg-navy/5 text-navy hover:bg-navy hover:text-white transition-all"
            title={t('calendar.fullscreenTooltip')}
          >
            <span className="text-sm">⛶</span>
            <span>{t('calendar.fullscreenPageBtn')}</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/bookings/new')}
            className="shadow-sm font-semibold flex items-center gap-1.5"
          >
            <span>➕</span>
            <span>{t('calendar.newBookingBtn')}</span>
          </Button>
        </div>
      </div>

      {/* Reception Live Status Ribbon (5 KPIs) */}
      {showRibbon && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3">
          <div className="bg-white p-3 rounded-xl border border-line shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted font-semibold">{t('calendar.availableToday')}</div>
              <div className="text-lg font-black text-success font-mono mt-0.5">
                {availableUnits.length}
                <span className="text-[10px] text-muted font-normal ms-1">
                  ({t('calendar.villasCount', { count: availableVillasCount })} • {t('calendar.roomsCount', { count: availableRoomsCount })})
                </span>
              </div>
            </div>
            <span className="text-xl">🟢</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-line shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted font-semibold">{t('calendar.occupiedToday')}</div>
              <div className="text-lg font-black text-navy font-mono mt-0.5">
                {inHouseBookings.length}
                <span className="text-[10px] text-muted font-normal ms-1">
                  ({t('calendar.villasCount', { count: occupiedVillasCount })} • {t('calendar.roomsCount', { count: occupiedRoomsCount })})
                </span>
              </div>
            </div>
            <span className="text-xl">🏠</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-line shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted font-semibold">{t('calendar.arrivalsToday')}</div>
              <div className="text-lg font-black text-navy font-mono mt-0.5">
                {arrivalsCount}
              </div>
            </div>
            <span className="text-xl">🧳</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-line shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted font-semibold">{t('calendar.departuresToday')}</div>
              <div className="text-lg font-black text-muted font-mono mt-0.5">
                {departuresCount}
              </div>
            </div>
            <span className="text-xl">🚪</span>
          </div>

          <div className="bg-white p-3 rounded-xl border border-line shadow-xs flex items-center justify-between">
            <div>
              <div className="text-[11px] text-muted font-semibold">{t('calendar.balanceDueAlert')}</div>
              <div className="text-lg font-black text-danger font-mono mt-0.5">
                {unpaidCount}
              </div>
            </div>
            <span className="text-xl">⚠️</span>
          </div>
        </div>
      )}

      {/* Calendar Toolbar */}
      <CalendarToolbar
        startDate={startDate}
        daysCount={daysCount}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        onDaysCountChange={setDaysCount}
        onDateChange={setStartDate}
        unitFilter={unitFilter}
        onUnitFilterChange={setUnitFilter}
        unitSearch={unitSearch}
        onUnitSearchChange={setUnitSearch}
        collapsedVillas={collapsedVillas}
        onToggleCollapseVillas={() => setCollapsedVillas((v) => !v)}
        onFullscreen={handleEnterFullscreen}
      />

      {/* Grid */}
      <RoomCalendar
        startDate={startDate}
        daysCount={daysCount}
        unitFilter={unitFilter}
        unitSearch={unitSearch}
        collapsedVillas={collapsedVillas}
        maxHeightClass={showRibbon ? 'max-h-[calc(100vh-310px)]' : 'max-h-[calc(100vh-210px)]'}
      />

      {/* Fullscreen Dedicated View (Focus Mode: Calendar only, 30 days starting with Today, full screen height and width) */}
      {isFullscreen && (
        <div className="fixed inset-0 z-50 bg-[#F4F6F8] flex flex-col w-screen h-screen overflow-hidden text-start animate-in fade-in duration-200">
          {/* Fullscreen Header & Compact Navigation Bar */}
          <div className="bg-navy text-white px-4 py-2.5 flex items-center justify-between gap-3 shadow-md shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-white">
                    {t('calendar.fullscreenTitle')}
                  </h2>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-gold text-navy font-mono shadow-xs">
                    {t('calendar.todayBtn')}: {today}
                  </span>
                </div>
                <div className="text-[11px] text-slate-300 hidden sm:flex items-center gap-2 mt-0.5">
                  <span>{t('calendar.fsAvailableToday')} <b className="text-emerald-400 font-mono">{availableUnits.length}</b></span>
                  <span>•</span>
                  <span>{t('calendar.fsInHouse')} <b className="text-gold-light font-mono">{inHouseBookings.length}</b></span>
                  <span>•</span>
                  <span>{t('calendar.fsArrivals')} <b className="text-white font-mono">{arrivalsCount}</b></span>
                  <span>•</span>
                  <span>{t('calendar.fsDepartures')} <b className="text-slate-300 font-mono">{departuresCount}</b></span>
                </div>
              </div>
            </div>

            {/* Quick Navigation Controls in Fullscreen */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handlePrev}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                ◀ {t('calendar.prev')}
              </button>
              <DateInput
                value={startDate}
                onChange={(e) => e.target.value && setStartDate(e.target.value)}
                iconClassName="text-slate-300 hover:text-white"
                className="w-36 text-xs py-1 px-2 rounded-lg bg-slate-800 text-white border border-slate-700 font-mono"
              />
              <button
                type="button"
                onClick={() => setStartDate(todayISO())}
                className="px-2.5 py-1 text-xs font-bold rounded-lg bg-gold text-navy hover:bg-gold-light"
              >
                {t('calendar.todayBtn')}
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                {t('calendar.next')} ▶
              </button>

              <button
                type="button"
                onClick={() => setCollapsedVillas((v) => !v)}
                className="hidden md:flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
              >
                <span>🏛️</span>
                <span>{collapsedVillas ? t('calendar.expandVillas') : t('calendar.collapseVillas')}</span>
              </button>

              <button
                type="button"
                onClick={handleExitFullscreen}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-navy hover:bg-stone transition-all shadow-xs ms-2"
                title={t('calendar.exitFullscreenTooltip')}
              >
                <span className="text-sm">⤓</span>
                <span>{t('calendar.exitFullscreen')}</span>
              </button>
            </div>
          </div>

          {/* Fullscreen Sub-bar: Filters & Search */}
          <div className="bg-white px-4 py-2 border-b border-line flex items-center justify-between gap-3 shrink-0 flex-wrap">
            <div className="flex items-center gap-2.5 flex-wrap">
              <div className="flex items-center gap-1 bg-stone/40 p-0.5 rounded-lg border border-line text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setUnitFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${unitFilter === 'all' ? 'bg-navy text-white shadow-xs' : 'text-muted hover:text-ink'}`}
                >
                  {t('calendar.filterAll')}
                </button>
                <button
                  type="button"
                  onClick={() => setUnitFilter('villas')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${unitFilter === 'villas' ? 'bg-navy text-white shadow-xs' : 'text-muted hover:text-ink'}`}
                >
                  {t('calendar.filterVillas')}
                </button>
                <button
                  type="button"
                  onClick={() => setUnitFilter('independent')}
                  className={`px-2.5 py-1 rounded-md transition-colors ${unitFilter === 'independent' ? 'bg-navy text-white shadow-xs' : 'text-muted hover:text-ink'}`}
                >
                  {t('calendar.filterIndependent')}
                </button>
              </div>

              <input
                type="search"
                value={unitSearch}
                onChange={(e) => setUnitSearch(e.target.value)}
                placeholder={t('calendar.searchUnit')}
                className="h-8 text-xs px-3 rounded-lg border border-line bg-stone/20 focus:bg-white w-52 sm:w-72"
              />
            </div>

            {/* Sources mini legend */}
            <div className="hidden lg:flex items-center gap-3 text-xs text-muted">
              <span className="font-bold text-[11px]">{t('calendar.sourcesLabel')}</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#2E7D4F]" />Walk-in</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#0064D2]" />Tiket.com</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#003580]" />Booking.com</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-[#B0287A]" />Agoda</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-muted/40" />{t('calendar.maintenanceLabel')}</span>
            </div>
          </div>

          {/* Fullscreen Calendar Grid Container */}
          <div className="flex-1 overflow-hidden p-2 sm:p-3 bg-white">
            <RoomCalendar
              startDate={startDate}
              daysCount={30}
              unitFilter={unitFilter}
              unitSearch={unitSearch}
              collapsedVillas={collapsedVillas}
              maxHeightClass="h-[calc(100vh-125px)] max-h-[calc(100vh-125px)]"
            />
          </div>
        </div>
      )}
    </div>
  );
};
