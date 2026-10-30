import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '../../i18n/I18nProvider';
import { useUnits, type Unit } from '../../api/units';
import { useBookingSources, useUpdateBooking } from '../../api/bookings';
import { useCalendar, type CalendarOccupancyItem, type CalendarBookingDetails } from '../../api/calendar';
import type { CalendarUnitFilter } from './CalendarToolbar';
import { todayISO, eachNight, addDaysISO, parseDateRange, formatDateHuman } from '../../lib/dates';
import { formatIDR } from '../../lib/money';
import { friendlyError } from '../../lib/errors';
import { Spinner } from '../ui/Spinner';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

export interface RoomCalendarProps {
  startDate: string;
  daysCount: 7 | 14 | 30;
  unitFilter?: CalendarUnitFilter;
  unitSearch?: string;
  collapsedVillas?: boolean;
  maxHeightClass?: string;
}

export const RoomCalendar: React.FC<RoomCalendarProps> = ({
  startDate,
  daysCount,
  unitFilter = 'all',
  unitSearch = '',
  collapsedVillas = false,
  maxHeightClass,
}) => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const endDate = addDaysISO(startDate, daysCount);
  const dates = eachNight(startDate, endDate);
  const today = todayISO();

  // Local state for toggling specific villa collapse
  const [toggledVillaIds, setToggledVillaIds] = useState<Set<number>>(new Set());

  // Quick Action Modal state
  const [selectedBooking, setSelectedBooking] = useState<CalendarBookingDetails | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);

  // Floating Hover Card state
  const [hoveredData, setHoveredData] = useState<{
    item: CalendarOccupancyItem;
    unitName: string;
    x: number;
    y: number;
  } | null>(null);

  const { data: units = [], isLoading: loadingUnits } = useUnits();
  const { data: occupancy = [], isLoading: loadingOccupancy } = useCalendar(startDate, endDate);
  const { data: sources = [] } = useBookingSources();
  const updateBookingMutation = useUpdateBooking();

  const sourceColorMap = new Map<string, string>();
  const sourceLabelMap = new Map<string, string>();
  for (const s of sources) {
    sourceColorMap.set(s.code, s.color);
    sourceLabelMap.set(s.code, s.label);
  }

  // Map occupancy by room_id: room_id -> CalendarOccupancyItem[]
  const occupancyByRoom = new Map<number, CalendarOccupancyItem[]>();
  // Map occupancy by villa_id: villa_id -> CalendarOccupancyItem[]
  const occupancyByVilla = new Map<number, CalendarOccupancyItem[]>();

  for (const item of occupancy) {
    const list = occupancyByRoom.get(item.room_id) || [];
    list.push(item);
    occupancyByRoom.set(item.room_id, list);

    if (item.bookings && item.bookings.unit_id) {
      const villaId = item.bookings.unit_id;
      const vList = occupancyByVilla.get(villaId) || [];
      if (!vList.some((existing) => existing.booking_id === item.booking_id)) {
        vList.push(item);
        occupancyByVilla.set(villaId, vList);
      }
    } else if (item.unit_blocks && item.unit_blocks.unit_id) {
      const villaId = item.unit_blocks.unit_id;
      const vList = occupancyByVilla.get(villaId) || [];
      if (!vList.some((existing) => existing.block_id === item.block_id)) {
        vList.push(item);
        occupancyByVilla.set(villaId, vList);
      }
    }
  }

  // Filter units
  const filteredUnits = units.filter((unit) => {
    if (unitFilter === 'villas' && unit.kind !== 'villa') return false;
    if (unitFilter === 'independent') {
      if (unit.kind !== 'room' || unit.parent_id !== null) return false;
    }

    // Check if parent villa is collapsed
    if (unit.kind === 'room' && unit.parent_id) {
      const isParentVillaCollapsed = collapsedVillas
        ? !toggledVillaIds.has(unit.parent_id)
        : toggledVillaIds.has(unit.parent_id);
      if (isParentVillaCollapsed) return false;
    }

    if (unitSearch && unitSearch.trim()) {
      const q = unitSearch.toLowerCase().trim();
      const matchesSelf = unit.name.toLowerCase().includes(q);
      let matchesParent = false;
      if (unit.parent_id) {
        const parent = units.find((u) => u.id === unit.parent_id);
        if (parent && parent.name.toLowerCase().includes(q)) matchesParent = true;
      }
      let matchesChild = false;
      if (unit.kind === 'villa') {
        const children = units.filter((u) => u.parent_id === unit.id);
        if (children.some((c) => c.name.toLowerCase().includes(q))) matchesChild = true;
      }

      // Also search through bookings covering this unit
      const items = unit.kind === 'villa'
        ? occupancyByVilla.get(unit.id) || []
        : occupancyByRoom.get(unit.id) || [];
      const matchesBooking = items.some((it) => {
        const b = it.bookings;
        if (!b) return false;
        return (
          b.code.toLowerCase().includes(q) ||
          (b.guests?.full_name && b.guests.full_name.toLowerCase().includes(q)) ||
          (b.notes && b.notes.toLowerCase().includes(q)) ||
          (b.ota_reference && b.ota_reference.toLowerCase().includes(q))
        );
      });

      if (!matchesSelf && !matchesParent && !matchesChild && !matchesBooking) return false;
    }
    return true;
  });

  const toggleVilla = (villaId: number) => {
    setToggledVillaIds((prev) => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else next.add(villaId);
      return next;
    });
  };

  const getUnitTodayStatus = (unit: Unit) => {
    const isVilla = unit.kind === 'villa';
    const items = isVilla ? occupancyByVilla.get(unit.id) || [] : occupancyByRoom.get(unit.id) || [];
    const todayItem = items.find((item) => {
      try {
        const { start, end } = parseDateRange(item.stay);
        return today >= start && today < end;
      } catch {
        return false;
      }
    });

    if (!todayItem) return { color: 'bg-success', title: t('calendar.availableToday') };
    if (todayItem.block_id) return { color: 'bg-muted/60', title: t('unitStatus.blocked') };
    if (todayItem.bookings?.check_in === today) {
      return { color: 'bg-gold', title: t('calendar.arrivalsToday') };
    }
    return { color: 'bg-navy', title: t('calendar.occupiedToday') };
  };

  const handleQuickStatusChange = async (newStatus: string) => {
    if (!selectedBooking) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: selectedBooking.id,
        updates: { status: newStatus },
      });
      showToast('success', t('common.success'));
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-occupied-today'] });
      queryClient.invalidateQueries({ queryKey: ['calendar-inhouse-today'] });
      setIsQuickModalOpen(false);
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  if (loadingUnits || loadingOccupancy) {
    return (
      <div className="py-24 flex items-center justify-center bg-white rounded-xl border border-line">
        <Spinner size="lg" />
      </div>
    );
  }

  const colMinWidth = daysCount === 7 ? '110px' : daysCount === 14 ? '68px' : '44px';

  return (
    <div className="bg-white rounded-xl border border-line shadow-xs overflow-hidden text-start w-full relative">
      <div className={`overflow-x-auto overflow-y-auto ${maxHeightClass || 'max-h-[calc(100vh-310px)]'} min-h-[440px] relative scroll-smooth overscroll-y-auto`}>
        <table className="w-full min-w-full table-fixed border-collapse text-xs select-none">
          {/* Header Row: Days */}
          <thead className="sticky top-0 z-30 bg-stone/95 backdrop-blur-xs shadow-xs border-b border-line">
            <tr>
              {/* Unit Column Header */}
              <th className="sticky start-0 z-40 bg-stone/95 p-3 text-start font-bold text-navy border-e border-line w-[210px] min-w-[210px]">
                <div className="flex items-center justify-between">
                  <span>{t('booking.unit')}</span>
                  <span className="text-[11px] text-muted font-mono font-normal">
                    ({filteredUnits.length})
                  </span>
                </div>
              </th>

              {/* Day Headers */}
              {dates.map((date) => {
                const isCurrentToday = date === today;
                const d = new Date(date + 'T00:00:00Z');
                const dayNum = d.getUTCDate();
                const dayOfWeek = d.getUTCDay();
                const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0; // Fri, Sat, Sun
                const dayName = d.toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'id-ID', {
                  weekday: 'narrow',
                  timeZone: 'UTC',
                });

                return (
                  <th
                    key={date}
                    style={{ minWidth: colMinWidth }}
                    className={`p-2 text-center border-e border-line transition-colors ${
                      isCurrentToday
                        ? 'bg-gold/25 text-navy font-black ring-2 ring-gold ring-inset'
                        : isWeekend
                        ? 'bg-stone/40 text-ink'
                        : 'text-muted'
                    }`}
                  >
                    <div className="text-[10px] uppercase font-semibold tracking-wider">{dayName}</div>
                    <div className="text-sm font-black font-mono">{dayNum}</div>
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Body: Units & Calendar Rows */}
          <tbody className="divide-y divide-line">
            {filteredUnits.map((unit) => {
              const isVilla = unit.kind === 'villa';
              const isChildRoom = unit.kind === 'room' && unit.parent_id !== null;
              const isVillaCollapsed = isVilla
                ? collapsedVillas
                  ? !toggledVillaIds.has(unit.id)
                  : toggledVillaIds.has(unit.id)
                : false;

              const todayStatus = getUnitTodayStatus(unit);

              // Items for this row
              const rowItems = isVilla
                ? occupancyByVilla.get(unit.id) || []
                : occupancyByRoom.get(unit.id) || [];

              const isIndependentStart = unit.name === 'Kamar Lepas 1';
              const hasDivider = isVilla || isIndependentStart;

              return (
                <tr
                  key={unit.id}
                  className={`group transition-colors ${
                    hasDivider ? 'border-t-4 border-navy/30' : ''
                  } ${
                    isVilla ? 'bg-stone/30 font-semibold' : 'hover:bg-mist/40 bg-white'
                  }`}
                >
                  {/* Sticky Unit Column */}
                  <td
                    className={`sticky start-0 z-20 p-2.5 border-e border-line whitespace-nowrap w-[210px] min-w-[210px] ${
                      hasDivider ? 'border-t-4 border-navy/30' : ''
                    } ${
                      isVilla
                        ? 'bg-stone/80 text-navy font-bold shadow-xs'
                        : 'bg-white group-hover:bg-mist/80 text-ink'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isVilla ? (
                          <button
                            type="button"
                            onClick={() => toggleVilla(unit.id)}
                            className="p-0.5 rounded hover:bg-stone/60 text-navy transition text-xs"
                            title={isVillaCollapsed ? t('calendar.expandVillas') : t('calendar.collapseVillas')}
                          >
                            {isVillaCollapsed ? '▸' : '▾'}
                          </button>
                        ) : isChildRoom ? (
                          <span className="text-muted/60 text-[10px] ps-4">└</span>
                        ) : null}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span
                              className={`w-2 h-2 rounded-full shrink-0 ${todayStatus.color}`}
                              title={todayStatus.title}
                            />
                            <span className={`truncate text-xs ${isVilla ? 'font-black text-navy' : 'font-medium'}`}>
                              {unit.name}
                            </span>
                          </div>
                          <div className="text-[10px] text-muted font-mono ps-3">
                            {unit.default_rate && Number(unit.default_rate) > 0
                              ? formatIDR(Number(unit.default_rate))
                              : isVilla
                              ? t('calendar.wholeVilla')
                              : t('unitKind.room')}
                          </div>
                        </div>
                      </div>

                      {isVilla && (
                        <span className="text-[10px] bg-gold/15 text-gold-text px-1.5 py-0.2 rounded font-semibold shrink-0">
                          4 Kamar
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Day Cells */}
                  {dates.map((day, dayIndex) => {
                    const isCurrentToday = day === today;
                    const d = new Date(day + 'T00:00:00Z');
                    const dayOfWeek = d.getUTCDay();
                    const isWeekend = dayOfWeek === 5 || dayOfWeek === 6 || dayOfWeek === 0;

                    // Check if an item covers this day
                    const matchingItem = rowItems.find((item) => {
                      try {
                        const { start, end } = parseDateRange(item.stay);
                        return day >= start && day < end;
                      } catch {
                        return false;
                      }
                    });

                    let isBarStart = false;
                    let barSpan = 1;
                    let barColor = '#163B6B';
                    let isVillaPattern = false;
                    let isVillaBlockPattern = false;

                    if (matchingItem) {
                      const { start, end } = parseDateRange(matchingItem.stay);
                      isBarStart = day === start || (dayIndex === 0 && day > start && day < end);

                      if (isBarStart) {
                        const startIndex = Math.max(0, dates.indexOf(start));
                        const endIndex = dates.indexOf(end);
                        const effectiveEnd = endIndex === -1 ? dates.length : endIndex;
                        barSpan = Math.max(1, effectiveEnd - startIndex);

                        if (matchingItem.bookings) {
                          const src = matchingItem.bookings.source_code;
                          barColor = sourceColorMap.get(src) || '#163B6B';

                          if (!isVilla && matchingItem.bookings.unit_id === unit.parent_id) {
                            isVillaPattern = true;
                          }
                        } else if (matchingItem.unit_blocks) {
                          barColor = '#718096';
                          if (!isVilla && matchingItem.unit_blocks.unit_id === unit.parent_id) {
                            isVillaBlockPattern = true;
                          }
                        }
                      }
                    }

                    return (
                      <td
                        key={day}
                        onClick={() => {
                          if (matchingItem?.bookings) {
                            setSelectedBooking(matchingItem.bookings);
                            setSelectedUnit(unit);
                            setIsQuickModalOpen(true);
                          } else if (!matchingItem) {
                            navigate(`/bookings/new?unit=${unit.id}&from=${day}`);
                          }
                        }}
                        className={`p-0 h-11 border-e border-line relative text-center cursor-pointer transition-colors ${
                          hasDivider ? 'border-t-4 border-navy/30' : ''
                        } ${
                          isCurrentToday ? 'bg-gold/10' : isWeekend ? 'bg-stone/15' : ''
                        }`}
                      >
                        {/* Empty Cell Hover Indicator */}
                        {!matchingItem && (
                          <div className="absolute inset-0 opacity-0 hover:opacity-100 flex items-center justify-center text-[10px] text-muted font-bold transition-opacity">
                            +
                          </div>
                        )}

                        {/* Occupancy Bar */}
                        {matchingItem && isBarStart && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              if (matchingItem.bookings) {
                                setSelectedBooking(matchingItem.bookings);
                                setSelectedUnit(unit);
                                setIsQuickModalOpen(true);
                              }
                            }}
                            onMouseEnter={(e) => {
                              setHoveredData({
                                item: matchingItem,
                                unitName: unit.name,
                                x: e.clientX,
                                y: e.clientY,
                              });
                            }}
                            onMouseMove={(e) => {
                              if (hoveredData) {
                                setHoveredData((prev) =>
                                  prev ? { ...prev, x: e.clientX, y: e.clientY } : null
                                );
                              }
                            }}
                            onMouseLeave={() => setHoveredData(null)}
                            style={{
                              backgroundColor: isVillaPattern
                                ? 'rgba(212, 160, 23, 0.15)'
                                : isVillaBlockPattern
                                ? 'rgba(113, 128, 150, 0.15)'
                                : barColor,
                              width: `calc(${barSpan * 100}% - 3px)`,
                            }}
                            className={`absolute top-1 bottom-1 start-0.5 z-10 rounded-md px-2 flex items-center justify-start text-[11px] font-semibold transition-all hover:brightness-110 shadow-xs border ${
                              isVillaPattern
                                ? 'text-gold-text border-gold/40 border-dashed bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(212,160,23,0.12)_5px,rgba(212,160,23,0.12)_10px)]'
                                : isVillaBlockPattern
                                ? 'text-navy border-slate-400 border-dashed bg-[repeating-linear-gradient(45deg,transparent,transparent_5px,rgba(113,128,150,0.15)_5px,rgba(113,128,150,0.15)_10px)]'
                                : 'text-white border-white/20'
                            }`}
                          >
                            {/* Inner Bar Content */}
                            {isVillaPattern ? (
                              <span className="truncate text-[10px] text-gold-text font-bold">
                                🏛️ {t('calendar.childRoomOfVilla')}
                                {matchingItem.bookings?.guests?.full_name ? ` (${matchingItem.bookings.guests.full_name})` : ''}
                              </span>
                            ) : isVillaBlockPattern ? (
                              <span className="truncate text-[10px] text-navy font-bold">
                                🔒 {t('calendar.childRoomOfBlockedVilla')} ({matchingItem.unit_blocks?.reason || t('unitStatus.blocked')})
                              </span>
                            ) : matchingItem.bookings ? (
                              <div className="flex items-center justify-between w-full min-w-0 gap-1.5">
                                <div className="flex items-center gap-1 min-w-0">
                                  <span className="shrink-0 text-[10px]">
                                    {matchingItem.bookings.status === 'checked_in'
                                      ? '🏠'
                                      : matchingItem.bookings.status === 'checked_out'
                                      ? '✓'
                                      : '📅'}
                                  </span>
                                  <span className="truncate font-black tracking-tight text-[11px]">
                                    {matchingItem.bookings.guests?.full_name ||
                                      matchingItem.bookings.notes ||
                                      matchingItem.bookings.ota_reference ||
                                      matchingItem.bookings.code}
                                  </span>
                                </div>

                                {/* Financial status pill */}
                                {barSpan >= 2 && matchingItem.bookings.balance !== undefined && (
                                  <span
                                    className={`shrink-0 text-[9px] font-bold px-1 py-0.2 rounded font-mono ${
                                      Number(matchingItem.bookings.balance) > 0
                                        ? 'bg-danger text-white'
                                        : 'bg-success text-white'
                                    }`}
                                  >
                                    {Number(matchingItem.bookings.balance) > 0
                                      ? `⚠️ ${formatIDR(Number(matchingItem.bookings.balance))}`
                                      : '✓'}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="truncate text-[11px]">
                                🔒 {matchingItem.unit_blocks?.reason || t('unitStatus.blocked')}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}

            {/* End of list buffer so the last rows (Kamar Lepas 5 & 6) are never cut off or cramped */}
            <tr>
              <td
                colSpan={dates.length + 1}
                className="p-3 bg-stone/20 text-center text-xs text-muted font-medium border-t-2 border-line/80 select-none"
              >
                — {t('calendar.endOfUnits', { count: filteredUnits.length })} —
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Floating Hover Card (Tooltip) */}
      {hoveredData && (hoveredData.item.bookings || hoveredData.item.unit_blocks) && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(hoveredData.y + 12, window.innerHeight - 240),
            left:
              hoveredData.x > window.innerWidth / 2
                ? undefined
                : Math.max(16, hoveredData.x - 20),
            right:
              hoveredData.x > window.innerWidth / 2
                ? Math.max(16, window.innerWidth - hoveredData.x - 20)
                : undefined,
          }}
          className="z-50 bg-navy-dark text-white p-3.5 rounded-xl shadow-2xl border border-white/10 w-72 pointer-events-none text-xs text-start space-y-2 animate-fadeIn"
        >
          {hoveredData.item.bookings ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-2">
                <div>
                  <div className="font-black text-sm text-gold-light">
                    {hoveredData.item.bookings.guests?.full_name || t('booking.unassignedGuest')}
                  </div>
                  <div className="text-[10px] text-stone font-mono">
                    {hoveredData.item.bookings.code}
                  </div>
                </div>
                <Badge variant="gold" className="text-[9px]">
                  {sourceLabelMap.get(hoveredData.item.bookings.source_code) || hoveredData.item.bookings.source_code}
                </Badge>
              </div>

              {/* Unit & Stay */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('booking.unit')}:</span>
                  <span className="font-bold">{hoveredData.unitName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('booking.checkIn')}:</span>
                  <span className="font-mono">{hoveredData.item.bookings.check_in}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('booking.checkOut')}:</span>
                  <span className="font-mono">{hoveredData.item.bookings.check_out}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('booking.nights')}:</span>
                  <span className="font-bold">{hoveredData.item.bookings.nights || '—'}</span>
                </div>
              </div>

              {/* Financial summary */}
              <div className="pt-2 border-t border-white/10 text-[11px] space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('booking.totalAmount')}:</span>
                  <span className="font-mono font-bold">
                    {formatIDR(Number(hoveredData.item.bookings.total_amount || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('booking.paidAmount')}:</span>
                  <span className="font-mono text-success font-bold">
                    {formatIDR(Number(hoveredData.item.bookings.paid || 0))}
                  </span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="text-stone/70">{t('booking.balanceAmount')}:</span>
                  <span
                    className={
                      Number(hoveredData.item.bookings.balance || 0) > 0
                        ? 'text-danger font-mono'
                        : 'text-success font-mono'
                    }
                  >
                    {formatIDR(Number(hoveredData.item.bookings.balance || 0))}
                  </span>
                </div>
              </div>

              {/* Phone / Notes */}
              {hoveredData.item.bookings.guests?.phone && (
                <div className="text-[10px] text-stone/80 pt-1 border-t border-white/10">
                  📞 {hoveredData.item.bookings.guests.phone}
                </div>
              )}

              <div className="text-[9px] text-gold-light/90 pt-1 text-center font-semibold">
                👆 {t('calendar.quickDetails')}
              </div>
            </>
          ) : hoveredData.item.unit_blocks ? (
            <>
              {/* Block Header */}
              <div className="flex items-start justify-between border-b border-white/10 pb-2">
                <div>
                  <div className="font-black text-sm text-gold-light">
                    🔒 {hoveredData.item.unit_blocks.reason || t('unitStatus.blocked')}
                  </div>
                  <div className="text-[10px] text-stone">
                    {t('settings.tabs.blocks')}
                  </div>
                </div>
                <Badge variant="default" className="text-[9px]">
                  {t('unitStatus.blocked')}
                </Badge>
              </div>

              {/* Unit & Dates */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('booking.unit')}:</span>
                  <span className="font-bold">{hoveredData.unitName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('common.from')}:</span>
                  <span className="font-mono">{parseDateRange(hoveredData.item.stay).start}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone/70">{t('common.to')}:</span>
                  <span className="font-mono">{parseDateRange(hoveredData.item.stay).end}</span>
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Quick Action Reception Modal */}
      <Modal
        isOpen={isQuickModalOpen}
        onClose={() => setIsQuickModalOpen(false)}
        title={t('calendar.quickDetails')}
        maxWidth="lg"
      >
        {selectedBooking && (
          <div className="space-y-4 text-start text-xs">
            {/* Header info */}
            <div className="p-3 bg-stone/30 rounded-lg border border-line flex items-start justify-between">
              <div>
                <h3 className="text-base font-black text-navy">
                  {selectedBooking.guests?.full_name || selectedBooking.notes || t('booking.unassignedGuest')}
                </h3>
                <div className="font-mono text-xs text-muted mt-0.5">
                  {selectedBooking.code} • {sourceLabelMap.get(selectedBooking.source_code) || selectedBooking.source_code}
                </div>
              </div>
              <Badge variant={selectedBooking.status === 'checked_in' ? 'success' : 'navy'}>
                {t(`status.${selectedBooking.status}`)}
              </Badge>
            </div>

            {/* Grid Stay & Financial Info */}
            <div className="grid grid-cols-2 gap-3">
              {/* Stay Info */}
              <div className="p-3 bg-white rounded-lg border border-line space-y-1.5">
                <div className="font-bold text-navy text-[11px] uppercase border-b border-line pb-1">
                  🏛️ {t('booking.unit')} &amp; {t('nav.calendar')}
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('booking.unit')}:</span>
                  <span className="font-bold text-ink">{selectedUnit?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('booking.checkIn')}:</span>
                  <span className="font-semibold text-ink">
                    {formatDateHuman(selectedBooking.check_in, lang)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('booking.checkOut')}:</span>
                  <span className="font-semibold text-ink">
                    {formatDateHuman(selectedBooking.check_out, lang)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('booking.nights')}:</span>
                  <span className="font-bold text-navy">
                    {t('booking.nightsCount', { count: selectedBooking.nights || 1 })}
                  </span>
                </div>
              </div>

              {/* Financial Box */}
              <div className="p-3 bg-white rounded-lg border border-line space-y-1.5">
                <div className="font-bold text-navy text-[11px] uppercase border-b border-line pb-1 flex justify-between">
                  <span>💰 {t('booking.totalAmount')}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                      Number(selectedBooking.balance || 0) <= 0
                        ? 'bg-success text-white'
                        : 'bg-danger text-white'
                    }`}
                  >
                    {Number(selectedBooking.balance || 0) <= 0
                      ? t('calendar.paidBadge')
                      : t('calendar.unpaidBadge')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('booking.totalAmount')}:</span>
                  <span className="font-bold font-mono text-ink">
                    {formatIDR(Number(selectedBooking.total_amount || 0))}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted">{t('booking.paidAmount')}:</span>
                  <span className="font-bold font-mono text-success">
                    {formatIDR(Number(selectedBooking.paid || 0))}
                  </span>
                </div>
                <div className="flex justify-between pt-1 border-t border-line">
                  <span className="font-bold text-navy">{t('booking.balanceAmount')}:</span>
                  <span
                    className={`font-black font-mono ${
                      Number(selectedBooking.balance || 0) > 0 ? 'text-danger' : 'text-success'
                    }`}
                  >
                    {formatIDR(Number(selectedBooking.balance || 0))}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-line">
              <div className="flex items-center gap-2">
                {selectedBooking.status === 'confirmed' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleQuickStatusChange('checked_in')}
                    className="font-semibold"
                  >
                    🏠 {t('booking.checkInBtn')}
                  </Button>
                )}
                {selectedBooking.status === 'checked_in' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleQuickStatusChange('checked_out')}
                    className="font-semibold"
                  >
                    🚪 {t('booking.checkOutBtn')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsQuickModalOpen(false);
                    navigate(`/bookings/${selectedBooking.id}`);
                  }}
                  className="font-semibold"
                >
                  🔗 {t('calendar.openFullBooking')}
                </Button>
              </div>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsQuickModalOpen(false)}
              >
                {t('common.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};