import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useI18n } from '../i18n/I18nProvider';
import { supabase } from '../lib/supabase';
import { todayISO, addDaysISO } from '../lib/dates';
import { useAvailableUnits } from '../api/units';
import { CalendarToolbar, type CalendarUnitFilter } from '../components/calendar/CalendarToolbar';
import { RoomCalendar } from '../components/calendar/RoomCalendar';
import { Button } from '../components/ui/Button';

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
    </div>
  );
};
