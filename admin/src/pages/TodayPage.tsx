import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import { supabase } from '../lib/supabase';
import type { BookingOverview } from '../api/bookings';
import { todayISO, addDaysISO, formatDateHuman } from '../lib/dates';
import { formatIDR } from '../lib/money';
import { friendlyError } from '../lib/errors';
import { isOtaSource, formatLeadTime } from '../lib/bookingHelpers';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/booking/StatusBadge';
import { PaymentStatusBadge } from '../components/booking/PaymentStatusBadge';
import { useToast } from '../components/ui/Toast';
import { useUnits } from '../api/units';

export const TodayPage: React.FC = () => {
  const { role } = useAuth();
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isManager = role === 'manager';
  const [selectedDate, setSelectedDate] = useState<string>(todayISO());
  const [checkoutTarget, setCheckoutTarget] = useState<BookingOverview | null>(null);
  const [occupiedFilter, setOccupiedFilter] = useState<'all' | 'villas' | 'rooms'>('all');
  const [occupiedSearch, setOccupiedSearch] = useState<string>('');

  // 1. Arrivals today
  const { data: arrivals = [], isLoading: loadingArrivals } = useQuery({
    queryKey: ['today-arrivals', selectedDate],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('booking_overview')
        .select('*')
        .eq('check_in', selectedDate)
        .neq('status', 'cancelled')
        .order('unit_name', { ascending: true });
      if (error) throw error;
      return (data || []) as BookingOverview[];
    },
  });

  // 2. Departures today
  const { data: departures = [], isLoading: loadingDepartures } = useQuery({
    queryKey: ['today-departures', selectedDate],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('booking_overview')
        .select('*')
        .eq('check_out', selectedDate)
        .neq('status', 'cancelled')
        .order('unit_name', { ascending: true });
      if (error) throw error;
      return (data || []) as BookingOverview[];
    },
  });

  // 3. In-house bookings (All units occupied today)
  const { data: inHouse = [], isLoading: loadingInHouse } = useQuery({
    queryKey: ['today-in-house', selectedDate],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('booking_overview')
        .select('*')
        .lte('check_in', selectedDate)
        .gt('check_out', selectedDate)
        .in('status', ['confirmed', 'checked_in'])
        .order('unit_name', { ascending: true });
      if (error) throw error;
      return (data || []) as BookingOverview[];
    },
  });

  // 4. Units & Operational Rooms (Excludes units closed for maintenance)
  const { data: allUnits = [] } = useUnits();
  const totalOperationalRooms = useMemo(() => {
    const activeRooms = allUnits.filter((u) => u.kind === 'room' && u.active);
    return activeRooms.length > 0 ? activeRooms.length : 66;
  }, [allUnits]);

  const activeRoomIds = useMemo(() => {
    return new Set(allUnits.filter((u) => u.kind === 'room' && u.active).map((u) => u.id));
  }, [allUnits]);

  // Occupied rooms count from room_occupancy for active operational rooms only
  const nextDate = addDaysISO(selectedDate, 1);
  const { data: occupiedRoomsCount = 0 } = useQuery({
    queryKey: ['today-occupancy', selectedDate, Array.from(activeRoomIds).join(',')],
    queryFn: async () => {
      if (!supabase) return 0;
      const { data, error } = await supabase
        .from('room_occupancy')
        .select('room_id')
        .not('booking_id', 'is', null)
        .overlaps('stay', `[${selectedDate},${nextDate})`);
      if (error) throw error;
      const unique = new Set(
        (data || [])
          .map((d) => d.room_id)
          .filter((id) => (activeRoomIds.size > 0 ? activeRoomIds.has(id) : true))
      );
      return unique.size;
    },
  });

  // 5. Manager: Payments received today
  const { data: todayPayments = [] } = useQuery({
    queryKey: ['today-payments', selectedDate],
    queryFn: async () => {
      if (!supabase || !isManager) return [];
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('paid_on', selectedDate);
      if (error) throw error;
      return data || [];
    },
    enabled: isManager,
  });

  // 6. Outstanding balance (active bookings with balance > 0)
  const { data: unpaidBookings = [] } = useQuery({
    queryKey: ['today-unpaid'],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('booking_overview')
        .select('*')
        .gt('balance', 0)
        .in('status', ['confirmed', 'checked_in'])
        .order('check_in', { ascending: true })
        .limit(20);
      if (error) throw error;
      return (data || []) as BookingOverview[];
    },
  });

  // 7. Overdue bookings requiring action
  const { data: overdueBookings = [] } = useQuery({
    queryKey: ['today-overdue', selectedDate],
    queryFn: async () => {
      if (!supabase) return [];
      const { data, error } = await supabase
        .from('booking_overview')
        .select('*')
        .or(`and(status.eq.checked_in,check_out.lt.${selectedDate}),and(status.eq.confirmed,check_in.lt.${selectedDate})`)
        .order('check_out', { ascending: true });
      if (error) throw error;
      return (data || []) as BookingOverview[];
    },
  });

  // Status mutation (Check-in / Check-out)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      if (!supabase) throw new Error('Supabase not configured');
      const { error } = await supabase
        .from('bookings')
        .update({ status })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['today-arrivals'] });
      queryClient.invalidateQueries({ queryKey: ['today-departures'] });
      queryClient.invalidateQueries({ queryKey: ['today-in-house'] });
      queryClient.invalidateQueries({ queryKey: ['today-overdue'] });
      queryClient.invalidateQueries({ queryKey: ['today-occupancy'] });
      queryClient.invalidateQueries({ queryKey: ['today-unpaid'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      showToast('success', t('common.success'));
    },
    onError: (err) => {
      showToast('error', t(friendlyError(err)));
    },
  });

  const handleCheckIn = (b: BookingOverview) => {
    if (!b.id) return;
    updateStatusMutation.mutate({ id: b.id, status: 'checked_in' });
  };

  const handleCheckOut = (b: BookingOverview) => {
    if (!b.id) return;
    if (Number(b.balance || 0) > 0) {
      setCheckoutTarget(b);
    } else {
      updateStatusMutation.mutate({ id: b.id, status: 'checked_out' });
    }
  };

  const confirmCheckoutWithBalance = () => {
    if (!checkoutTarget || !checkoutTarget.id) return;
    updateStatusMutation.mutate({ id: checkoutTarget.id, status: 'checked_out' });
    setCheckoutTarget(null);
  };

  // Payment totals split by method
  const totalReceived = todayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const cashTotal = todayPayments.filter((p) => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0);
  const transferTotal = todayPayments.filter((p) => p.method === 'transfer').reduce((sum, p) => sum + Number(p.amount), 0);
  const appTotal = todayPayments.filter((p) => p.method === 'app').reduce((sum, p) => sum + Number(p.amount), 0);
  const otherTotal = todayPayments.filter((p) => p.method === 'other').reduce((sum, p) => sum + Number(p.amount), 0);

  const totalOutstanding = unpaidBookings.reduce((sum, b) => sum + Number(b.balance || 0), 0);
  const occupancyPercent = totalOperationalRooms > 0
    ? Math.round((occupiedRoomsCount / totalOperationalRooms) * 100)
    : 0;

  // Filter occupied units
  const occupiedUnits = useMemo(() => {
    return inHouse.filter((b) => {
      if (occupiedFilter === 'villas' && b.unit_kind !== 'villa') return false;
      if (occupiedFilter === 'rooms' && b.unit_kind !== 'room') return false;
      if (occupiedSearch.trim()) {
        const q = occupiedSearch.toLowerCase().trim();
        const matchesUnit = (b.unit_name || '').toLowerCase().includes(q);
        const matchesGuest = b.guest_name ? b.guest_name.toLowerCase().includes(q) : false;
        const matchesCode = (b.code || '').toLowerCase().includes(q);
        return matchesUnit || matchesGuest || matchesCode;
      }
      return true;
    });
  }, [inHouse, occupiedFilter, occupiedSearch]);

  const occupiedVillasCount = inHouse.filter((b) => b.unit_kind === 'villa').length;
  const occupiedRoomsOnlyCount = inHouse.filter((b) => b.unit_kind === 'room').length;

  const isLoading = loadingArrivals || loadingDepartures || loadingInHouse;

  const handleExportDailyExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Harian (Summary)
    const summaryRows = [
      { 'Parameter': 'Tanggal / التاريخ', 'Nilai': selectedDate },
      { 'Parameter': 'Tingkat Hunian / نسبة الإشغال', 'Nilai': `${occupancyPercent}% (${occupiedRoomsCount} / ${totalOperationalRooms})` },
      { 'Parameter': 'Kedatangan / وصول اليوم', 'Nilai': arrivals.length },
      { 'Parameter': 'Keberangkatan / مغادرة اليوم', 'Nilai': departures.length },
      { 'Parameter': 'Tamu Menginap / الوحدات المشغولة', 'Nilai': inHouse.length },
      { 'Parameter': 'Total Diterima / إجمالي المقبوضات (Rp)', 'Nilai': totalReceived },
      { 'Parameter': 'Kas Tunai / نقد (Rp)', 'Nilai': cashTotal },
      { 'Parameter': 'Transfer Bank / تحويل (Rp)', 'Nilai': transferTotal },
      { 'Parameter': 'Aplikasi OTA / تطبيقات (Rp)', 'Nilai': appTotal + otherTotal },
      { 'Parameter': 'Sisa Belum Lunas / الرصيد المتبقي (Rp)', 'Nilai': totalOutstanding },
    ];
    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Harian');

    // Sheet 2: Kedatangan (Arrivals)
    if (arrivals.length > 0) {
      const arrRows = arrivals.map((b) => ({
        'Kode Booking': b.code,
        'Nama Tamu': b.guest_name || '—',
        'Unit': b.unit_name,
        'Check-in': b.check_in,
        'Check-out': b.check_out,
        'Malam': b.nights,
        'Status': b.status,
        'Total (Rp)': Number(b.total_amount || 0),
        'Dibayar (Rp)': Number(b.paid || 0),
        'Sisa (Rp)': Number(b.balance || 0),
      }));
      const wsArr = XLSX.utils.json_to_sheet(arrRows);
      XLSX.utils.book_append_sheet(wb, wsArr, 'Kedatangan');
    }

    // Sheet 3: Keberangkatan (Departures)
    if (departures.length > 0) {
      const depRows = departures.map((b) => ({
        'Kode Booking': b.code,
        'Nama Tamu': b.guest_name || '—',
        'Unit': b.unit_name,
        'Check-in': b.check_in,
        'Check-out': b.check_out,
        'Malam': b.nights,
        'Status': b.status,
        'Sisa (Rp)': Number(b.balance || 0),
      }));
      const wsDep = XLSX.utils.json_to_sheet(depRows);
      XLSX.utils.book_append_sheet(wb, wsDep, 'Keberangkatan');
    }

    // Sheet 4: Unit Terisi (الفلل والغرف الممتلئة فقط)
    if (inHouse.length > 0) {
      const occRows = inHouse.map((b) => ({
        'Unit / الوحدة': b.unit_name || '—',
        'Jenis / التصنيف':
          b.unit_kind === 'villa'
            ? 'Villa Lengkap (فيلا بالكامل)'
            : (b.unit_name || '').includes(' - ')
            ? 'Kamar dalam Villa (غرفة ضمن فيلا)'
            : 'Kamar Lepas (غرفة مستقلة)',
        'Nama Tamu / النزيل': b.guest_name || '—',
        'Telepon / الهاتف': b.guest_phone || '—',
        'Kode Booking / رمز الحجز': b.code,
        'Sumber / المصدر': b.source_code,
        'Check-in / الدخول': b.check_in,
        'Check-out / الخروج': b.check_out,
        'Malam / الليالي': b.nights,
        'Total (Rp) / الإجمالي': Number(b.total_amount || 0),
        'Dibayar (Rp) / المدفوع': Number(b.paid || 0),
        'Sisa (Rp) / المتبقي': Number(b.balance || 0),
        'Status / الحالة': b.status,
      }));
      const wsOcc = XLSX.utils.json_to_sheet(occRows);
      XLSX.utils.book_append_sheet(wb, wsOcc, 'Unit Terisi (الممتلئة)');
    }

    XLSX.writeFile(wb, `almagd-daily-report-${selectedDate}.xlsx`);
  };

  const handlePrintDaily = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Print-Only Official Report Header */}
      <div className="print-only mb-6 border-b-2 border-navy pb-4 text-start">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-navy">ALMAGD — New Villa Pratama</h1>
            <p className="text-sm font-bold text-ink mt-0.5">{t('report.villaDailyReport')}</p>
          </div>
          <div className="text-end text-xs text-muted">
            <div>{t('report.date')}: <span className="font-bold text-ink">{selectedDate}</span></div>
            <div>{t('stats.occupancy')}: <span className="font-bold text-navy">{occupiedRoomsCount} / {totalOperationalRooms} ({occupancyPercent}%)</span></div>
          </div>
        </div>
      </div>

      {/* Date Navigator Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-line shadow-sm no-print">
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedDate((d) => addDaysISO(d, -1))}
          >
            ◀
          </Button>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="w-auto"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedDate((d) => addDaysISO(d, 1))}
          >
            ▶
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedDate(todayISO())}
          >
            {t('calendar.todayBtn')}
          </Button>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="text-sm font-semibold text-navy">
            {formatDateHuman(selectedDate, lang)}
          </div>
          <div className="h-4 w-px bg-line" aria-hidden="true" />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportDailyExcel}
            className="text-xs font-semibold"
          >
            📥 {t('report.exportExcel')}
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={handlePrintDaily}
            className="text-xs font-semibold"
          >
            🖨️ {t('report.printPdf')}
          </Button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title={t('stats.occupancy')}
          value={`${occupiedRoomsCount} / ${totalOperationalRooms}`}
          subtitle={`${occupancyPercent}%`}
          variant="gold"
        />
        <StatCard
          title={t('stats.arrivalsToday')}
          value={arrivals.length}
          variant="navy"
        />
        <StatCard
          title={t('stats.departuresToday')}
          value={departures.length}
          variant="default"
        />
        <StatCard
          title={t('today.occupiedUnitsTitle')}
          value={inHouse.length}
          subtitle={`🏛️ ${occupiedVillasCount} | 🚪 ${occupiedRoomsOnlyCount}`}
          variant="success"
        />
      </div>

      {/* Manager Specific Cards */}
      {isManager && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <StatCard
            title={t('stats.receivedToday')}
            value={formatIDR(totalReceived)}
            subtitle={`💵 ${formatIDR(cashTotal)} | 🏦 ${formatIDR(transferTotal)} | 📱 ${formatIDR(appTotal + otherTotal)}`}
            variant="success"
          />
          <StatCard
            title={t('stats.outstandingBalance')}
            value={formatIDR(totalOutstanding)}
            subtitle={`${unpaidBookings.length} ${t('nav.bookings')}`}
            variant="danger"
          />
        </div>
      )}

      {/* Main Content Sections */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Overdue Bookings Alert */}
          {overdueBookings.length > 0 && (
            <Card className="border-warning/60 bg-warning/5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-warning-text flex items-center gap-2">
                  <span>⚠️</span>
                  <span>{t('today.overdueTitle')} ({overdueBookings.length})</span>
                </h2>
              </div>
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('booking.code')}</Th>
                    <Th>{t('booking.guest')}</Th>
                    <Th>{t('booking.unit')}</Th>
                    <Th>{t('booking.checkIn')}</Th>
                    <Th>{t('booking.checkOut')}</Th>
                    <Th>{t('common.status')}</Th>
                    <Th>{t('common.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {overdueBookings.map((b) => {
                    const isOverdueCheckOut =
                      b.status === 'checked_in' && b.check_out && b.check_out < selectedDate;
                    return (
                      <Tr key={b.id} className="hover:bg-warning/10">
                        <Td
                          className="font-mono text-xs font-bold text-navy cursor-pointer"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                        >
                          {b.code}
                        </Td>
                        <Td className="font-semibold text-ink">
                          {b.guest_name || '—'}
                        </Td>
                        <Td className="text-xs font-medium">{b.unit_name}</Td>
                        <Td className="text-xs text-muted">{b.check_in}</Td>
                        <Td className="text-xs text-danger font-semibold">{b.check_out}</Td>
                        <Td>
                          <Badge variant="danger">
                            {isOverdueCheckOut
                              ? t('today.overdueCheckOut')
                              : t('today.overdueCheckIn')}
                          </Badge>
                        </Td>
                        <Td>
                          {b.status === 'confirmed' ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => handleCheckIn(b)}
                              disabled={updateStatusMutation.isPending}
                            >
                              {t('today.checkInAction')}
                            </Button>
                          ) : (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleCheckOut(b)}
                              disabled={updateStatusMutation.isPending}
                            >
                              {t('today.checkOutAction')}
                            </Button>
                          )}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </Card>
          )}

          {/* Occupied Units Today (الفلل والغرف الممتلئة فقط) */}
          <Card className="border-gold/40 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-black text-navy flex items-center gap-2">
                  <span>🏛️</span>
                  <span>{t('today.occupiedUnitsTitle')}</span>
                  <span className="text-xs bg-navy text-white px-2.5 py-0.5 rounded-full font-mono font-bold">
                    {inHouse.length}
                  </span>
                </h2>
                <p className="text-xs text-muted mt-0.5">
                  {t('today.occupiedUnitsSubtitle')}
                </p>
              </div>

              {/* Sub-Filters and Search */}
              <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
                <div className="flex items-center gap-1 bg-stone/40 p-1 rounded-lg border border-line text-xs font-semibold">
                  <button
                    type="button"
                    onClick={() => setOccupiedFilter('all')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      occupiedFilter === 'all'
                        ? 'bg-navy text-white shadow-xs'
                        : 'text-muted hover:text-navy'
                    }`}
                  >
                    {t('today.filterAllOccupied', { count: inHouse.length })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOccupiedFilter('villas')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      occupiedFilter === 'villas'
                        ? 'bg-navy text-white shadow-xs'
                        : 'text-muted hover:text-navy'
                    }`}
                  >
                    {t('today.filterVillasOnly', { count: occupiedVillasCount })}
                  </button>
                  <button
                    type="button"
                    onClick={() => setOccupiedFilter('rooms')}
                    className={`px-2.5 py-1 rounded-md transition-all ${
                      occupiedFilter === 'rooms'
                        ? 'bg-navy text-white shadow-xs'
                        : 'text-muted hover:text-navy'
                    }`}
                  >
                    {t('today.filterRoomsOnly', { count: occupiedRoomsOnlyCount })}
                  </button>
                </div>

                <div className="w-full sm:w-48 no-print">
                  <Input
                    type="text"
                    placeholder={t('common.search')}
                    value={occupiedSearch}
                    onChange={(e) => setOccupiedSearch(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            {occupiedUnits.length === 0 ? (
              <EmptyState title={t('today.noOccupiedUnits')} className="py-8" />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('booking.unit')}</Th>
                    <Th>{t('booking.guest')}</Th>
                    <Th>{t('booking.code')}</Th>
                    <Th>{t('booking.checkIn')}</Th>
                    <Th>{t('booking.checkOut')}</Th>
                    <Th>{t('booking.totalAmount')}</Th>
                    <Th>{t('booking.balanceAmount')}</Th>
                    <Th>{t('common.status')}</Th>
                    <Th>{t('common.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {occupiedUnits.map((b) => {
                    const isVilla = b.unit_kind === 'villa';
                    const isChildRoom = b.unit_kind === 'room' && (b.unit_name || '').includes(' - ');

                    return (
                      <Tr key={b.id} className="hover:bg-mist/80 transition-colors">
                        <Td className="whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-navy text-xs">
                              {b.unit_name}
                            </span>
                            <Badge
                              variant={isVilla ? 'gold' : isChildRoom ? 'info' : 'navy'}
                              className="text-[10px]"
                            >
                              {isVilla
                                ? t('today.wholeVillaBadge')
                                : isChildRoom
                                ? t('today.roomInVillaBadge')
                                : t('today.independentRoomBadge')}
                            </Badge>
                          </div>
                        </Td>
                        <Td>
                          <div className="font-semibold text-ink text-xs">
                            {b.guest_name || '—'}
                          </div>
                          {b.guest_phone && (
                            <div className="text-[10px] text-muted font-mono">
                              📞 {b.guest_phone}
                            </div>
                          )}
                        </Td>
                        <Td
                          className="font-mono text-xs font-bold text-navy cursor-pointer hover:underline"
                          onClick={() => navigate(`/bookings/${b.id}`)}
                        >
                          {b.code}
                        </Td>
                        <Td className="text-xs text-muted font-mono whitespace-nowrap">
                          {b.check_in ? (
                            <div className="flex flex-col">
                              <span>{formatDateHuman(b.check_in, lang)}</span>
                              {formatLeadTime(b.check_in, selectedDate, lang) && (
                                <span className="text-[10px] text-blue-700 font-semibold mt-0.5">
                                  ⏳ {formatLeadTime(b.check_in, selectedDate, lang)}
                                </span>
                              )}
                            </div>
                          ) : '—'}
                        </Td>
                        <Td className="text-xs text-muted font-mono whitespace-nowrap">
                          {b.check_out ? formatDateHuman(b.check_out, lang) : '—'}
                          <span className="ms-1 text-[10px] text-ink font-sans font-semibold">
                            ({t('booking.nightsCount', { count: b.nights ?? 1 })})
                          </span>
                        </Td>
                        <Td className="text-xs font-mono font-bold text-navy whitespace-nowrap">
                          {formatIDR(Number(b.total_amount || 0))}
                        </Td>
                        <Td className="whitespace-nowrap">
                          {b.status === 'cancelled' ? (
                            <span className="text-muted text-xs">—</span>
                          ) : isOtaSource(b.source_code) && Number(b.balance || 0) > 0 ? (
                            <Badge variant="navy" className="text-[10px] whitespace-nowrap font-medium" title={t('booking.otaPayoutNote')}>
                              📱 {t('booking.otaPrepaidBadge')}
                            </Badge>
                          ) : Number(b.balance || 0) > 0 ? (
                            <Badge variant="danger" className="text-[10px] font-mono">
                              ⚠️ {formatIDR(Number(b.balance))}
                            </Badge>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              ✓ {t('calendar.paidBadge')}
                            </Badge>
                          )}
                        </Td>
                        <Td>
                          <StatusBadge status={b.status} />
                        </Td>
                        <Td className="whitespace-nowrap no-print">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/bookings/${b.id}`)}
                              className="text-xs"
                            >
                              {t('common.details')}
                            </Button>
                            {b.status === 'confirmed' ? (
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => handleCheckIn(b)}
                                disabled={updateStatusMutation.isPending}
                                className="text-xs"
                              >
                                {t('today.checkInAction')}
                              </Button>
                            ) : (
                              <Button
                                variant="secondary"
                                size="sm"
                                onClick={() => handleCheckOut(b)}
                                disabled={updateStatusMutation.isPending}
                                className="text-xs"
                              >
                                {t('today.checkOutAction')}
                              </Button>
                            )}
                          </div>
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            )}
          </Card>

          {/* Arrivals Today */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-navy">
                🛬 {t('stats.arrivalsToday')} ({arrivals.length})
              </h2>
            </div>
            {arrivals.length === 0 ? (
              <EmptyState
                title={t('today.noArrivals')}
                className="py-8"
              />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('booking.code')}</Th>
                    <Th>{t('booking.guest')}</Th>
                    <Th>{t('booking.unit')}</Th>
                    <Th>{t('booking.nights')}</Th>
                    <Th>{t('common.status')}</Th>
                    <Th>{t('booking.balanceAmount')}</Th>
                    <Th>{t('common.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {arrivals.map((b) => (
                    <Tr key={b.id} className="hover:bg-mist/80">
                      <Td
                        className="font-mono text-xs font-bold text-navy cursor-pointer"
                        onClick={() => navigate(`/bookings/${b.id}`)}
                      >
                        {b.code}
                      </Td>
                      <Td className="font-semibold text-ink">
                        {b.guest_name || '—'}
                      </Td>
                      <Td className="text-xs font-medium">
                        {b.unit_name}
                      </Td>
                      <Td className="text-xs font-semibold">
                        {b.nights}
                      </Td>
                      <Td>
                        <StatusBadge status={b.status} />
                      </Td>
                      <Td className="text-xs font-semibold whitespace-nowrap">
                        {isOtaSource(b.source_code) && Number(b.balance || 0) > 0 ? (
                          <span className="text-navy font-semibold text-[11px]" title={t('booking.otaPayoutNote')}>
                            📱 {t('paymentStatus.otaPrepaid')}
                          </span>
                        ) : Number(b.balance || 0) > 0 ? (
                          <span className="text-danger">{formatIDR(Number(b.balance))}</span>
                        ) : (
                          <span className="text-success">0</span>
                        )}
                      </Td>
                      <Td>
                        {b.status === 'confirmed' ? (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleCheckIn(b)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {t('today.checkInAction')}
                          </Button>
                        ) : (
                          <Badge variant="navy">
                            {t(`status.${b.status}`)}
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>

          {/* Departures Today */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-navy">
                🛫 {t('stats.departuresToday')} ({departures.length})
              </h2>
            </div>
            {departures.length === 0 ? (
              <EmptyState
                title={t('today.noDepartures')}
                className="py-8"
              />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('booking.code')}</Th>
                    <Th>{t('booking.guest')}</Th>
                    <Th>{t('booking.unit')}</Th>
                    <Th>{t('booking.nights')}</Th>
                    <Th>{t('common.status')}</Th>
                    <Th>{t('booking.balanceAmount')}</Th>
                    <Th>{t('common.actions')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {departures.map((b) => (
                    <Tr key={b.id} className="hover:bg-mist/80">
                      <Td
                        className="font-mono text-xs font-bold text-navy cursor-pointer"
                        onClick={() => navigate(`/bookings/${b.id}`)}
                      >
                        {b.code}
                      </Td>
                      <Td className="font-semibold text-ink">
                        {b.guest_name || '—'}
                      </Td>
                      <Td className="text-xs font-medium">
                        {b.unit_name}
                      </Td>
                      <Td className="text-xs font-semibold">
                        {b.nights}
                      </Td>
                      <Td>
                        <StatusBadge status={b.status} />
                      </Td>
                      <Td className="text-xs font-semibold whitespace-nowrap">
                        {isOtaSource(b.source_code) && Number(b.balance || 0) > 0 ? (
                          <span className="text-navy font-semibold text-[11px]" title={t('booking.otaPayoutNote')}>
                            📱 {t('paymentStatus.otaPrepaid')}
                          </span>
                        ) : Number(b.balance || 0) > 0 ? (
                          <span className="text-danger">{formatIDR(Number(b.balance))}</span>
                        ) : (
                          <span className="text-success">0</span>
                        )}
                      </Td>
                      <Td>
                        {b.status === 'checked_in' || b.status === 'confirmed' ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleCheckOut(b)}
                            disabled={updateStatusMutation.isPending}
                          >
                            {t('today.checkOutAction')}
                          </Button>
                        ) : (
                          <Badge variant="default">
                            {t(`status.${b.status}`)}
                          </Badge>
                        )}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>

          {/* Unpaid Bookings */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold text-navy">
                ⚠️ {t('today.unpaidList')} ({unpaidBookings.length})
              </h2>
            </div>
            {unpaidBookings.length === 0 ? (
              <EmptyState
                title={t('today.noUnpaid')}
                className="py-8"
              />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('booking.code')}</Th>
                    <Th>{t('booking.guest')}</Th>
                    <Th>{t('booking.unit')}</Th>
                    <Th>{t('booking.checkIn')}</Th>
                    <Th>{t('booking.totalAmount')}</Th>
                    <Th>{t('booking.balanceAmount')}</Th>
                    <Th>{t('common.status')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {unpaidBookings.map((b) => (
                    <Tr key={b.id} className="hover:bg-mist/80">
                      <Td
                        className="font-mono text-xs font-bold text-navy cursor-pointer"
                        onClick={() => navigate(`/bookings/${b.id}`)}
                      >
                        {b.code}
                      </Td>
                      <Td className="font-semibold text-ink">
                        {b.guest_name || '—'}
                      </Td>
                      <Td className="text-xs font-medium">{b.unit_name}</Td>
                      <Td className="text-xs text-muted whitespace-nowrap">
                        {b.check_in ? (
                          <div className="flex flex-col">
                            <span>{formatDateHuman(b.check_in, lang)}</span>
                            {formatLeadTime(b.check_in, selectedDate, lang) && (
                              <span className="text-[10px] text-blue-700 font-semibold mt-0.5">
                                ⏳ {formatLeadTime(b.check_in, selectedDate, lang)}
                              </span>
                            )}
                          </div>
                        ) : '—'}
                      </Td>
                      <Td className="text-xs font-mono font-bold text-navy">
                        {formatIDR(Number(b.total_amount || 0))}
                      </Td>
                      <Td className="text-xs font-mono font-bold whitespace-nowrap">
                        {isOtaSource(b.source_code) ? (
                          <span className="text-navy" title={t('booking.otaPayoutNote')}>
                            📱 {formatIDR(Number(b.balance || 0))}
                            <span className="block text-[10px] text-muted font-sans font-normal">
                              {t('booking.otaPayoutExpected')}
                            </span>
                          </span>
                        ) : (
                          <span className="text-danger">{formatIDR(Number(b.balance || 0))}</span>
                        )}
                      </Td>
                      <Td>
                        <PaymentStatusBadge status={b.payment_status || 'unpaid'} sourceCode={b.source_code} />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>

          {/* Manager Section: Payments Received Today */}
          {isManager && (
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-navy">
                  💰 {t('stats.receivedToday')} ({todayPayments.length})
                </h2>
              </div>
              {todayPayments.length === 0 ? (
                <EmptyState title={t('common.noData')} className="py-8" />
              ) : (
                <Table>
                  <Thead>
                    <Tr>
                      <Th>{t('payment.amount')}</Th>
                      <Th>{t('payment.method')}</Th>
                      <Th>{t('payment.reference')}</Th>
                      <Th>{t('payment.paidOn')}</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {todayPayments.map((p) => (
                      <Tr key={p.id} className="hover:bg-mist/80">
                        <Td className="font-mono text-xs font-bold text-success">
                          {formatIDR(Number(p.amount))}
                        </Td>
                        <Td>
                          <Badge variant="default" className="uppercase text-[10px]">
                            {p.method}
                          </Badge>
                        </Td>
                        <Td className="font-mono text-xs text-muted">
                          {p.reference || '—'}
                        </Td>
                        <Td className="text-xs text-muted font-mono">{p.paid_on}</Td>
                      </Tr>
                    ))}
                  </Tbody>
                </Table>
              )}
            </Card>
          )}
        </div>
      )}

      {/* Confirmation Dialog for Check-out with Balance */}
      <ConfirmDialog
        isOpen={Boolean(checkoutTarget)}
        title={t('today.checkoutConfirmTitle')}
        message={t('today.balanceWarning', {
          balance: checkoutTarget ? formatIDR(Number(checkoutTarget.balance || 0)) : '0',
        })}
        confirmLabel={t('today.checkOutAction')}
        variant="danger"
        onConfirm={confirmCheckoutWithBalance}
        onClose={() => setCheckoutTarget(null)}
      />
    </div>
  );
};
