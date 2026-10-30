import React, { useState, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { useI18n } from '../i18n/I18nProvider';
import { supabase } from '../lib/supabase';
import type { BookingOverview } from '../api/bookings';
import { useReportDaily, useReportBySource } from '../api/reports';
import { todayISO, addDaysISO, formatDateHuman } from '../lib/dates';
import { formatIDR, formatIDRWithCommas } from '../lib/money';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Input } from '../components/ui/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { StatusBadge } from '../components/booking/StatusBadge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';

type PeriodMode = 'today' | 'yesterday' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';

function getPeriodDates(mode: PeriodMode): { from: string; to: string } {
  const today = todayISO();

  if (mode === 'today') {
    return { from: today, to: today };
  }

  if (mode === 'yesterday') {
    const yesterday = addDaysISO(today, -1);
    return { from: yesterday, to: yesterday };
  }

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  if (mode === 'thisMonth') {
    const from = `${year}-${String(month + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month + 1, 0).getDate();
    const to = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
  }

  if (mode === 'lastMonth') {
    const prevMonthDate = new Date(year, month - 1, 1);
    const pYear = prevMonthDate.getFullYear();
    const pMonth = prevMonthDate.getMonth();
    const from = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(pYear, pMonth + 1, 0).getDate();
    const to = `${pYear}-${String(pMonth + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
  }

  if (mode === 'thisQuarter') {
    const qMonth = Math.floor(month / 3) * 3;
    const from = `${year}-${String(qMonth + 1).padStart(2, '0')}-01`;
    const lastDay = new Date(year, qMonth + 3, 0).getDate();
    const to = `${year}-${String(qMonth + 3).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    return { from, to };
  }

  if (mode === 'thisYear') {
    return { from: `${year}-01-01`, to: `${year}-12-31` };
  }

  // default custom
  return { from: addDaysISO(todayISO(), -30), to: todayISO() };
}

export const ReportsPage: React.FC = () => {
  const { t, lang } = useI18n();

  const [periodMode, setPeriodMode] = useState<PeriodMode>('thisMonth');
  const [customFrom, setCustomFrom] = useState(addDaysISO(todayISO(), -30));
  const [customTo, setCustomTo] = useState(todayISO());

  const { from, to } = useMemo(() => {
    if (periodMode === 'custom') {
      return { from: customFrom, to: customTo };
    }
    return getPeriodDates(periodMode);
  }, [periodMode, customFrom, customTo]);

  const { data: daily = [], isLoading: loadingDaily } = useReportDaily(from, to);
  const { data: bySource = [], isLoading: loadingSource } = useReportBySource(from, to);

  const isSingleDay = from === to;
  const { data: occupiedList = [] } = useQuery({
    queryKey: ['report-occupied-units', from],
    queryFn: async () => {
      if (!supabase || !isSingleDay) return [];
      const { data, error } = await supabase
        .from('booking_overview')
        .select('*')
        .lte('check_in', from)
        .gt('check_out', from)
        .in('status', ['confirmed', 'checked_in'])
        .order('unit_name', { ascending: true });
      if (error) throw error;
      return (data || []) as BookingOverview[];
    },
    enabled: isSingleDay,
  });

  // Compute KPIs
  const kpis = useMemo(() => {
    let totalRevenue = 0;
    let totalOccupied = 0;
    let totalCapacity = 0;
    let totalRooms = 0;
    let cash = 0;
    let transfer = 0;
    let app = 0;
    let other = 0;

    for (const d of daily) {
      totalRevenue += Number(d.revenue || 0);
      totalOccupied += d.rooms_occupied;
      totalCapacity += Math.max(0, d.rooms_total - d.rooms_blocked);
      totalRooms += d.rooms_total;
      cash += Number(d.paid_cash || 0);
      transfer += Number(d.paid_transfer || 0);
      app += Number(d.paid_app || 0);
      other += Number(d.paid_other || 0);
    }

    const totalReceived = cash + transfer + app + other;
    const occupancyPercent = totalCapacity > 0 ? Math.round((totalOccupied / totalCapacity) * 100) : 0;
    const adr = totalOccupied > 0 ? Math.round(totalRevenue / totalOccupied) : 0;
    const revpar = totalRooms > 0 ? Math.round(totalRevenue / totalRooms) : 0;

    return {
      totalRevenue,
      occupancyPercent,
      adr,
      revpar,
      totalReceived,
      cash,
      transfer,
      app,
      other,
      totalOccupied,
    };
  }, [daily]);

  // Aggregate monthly rows
  const monthlyData = useMemo(() => {
    const map = new Map<
      string,
      {
        month: string;
        revenue: number;
        cash: number;
        transfer: number;
        app: number;
        roomNights: number;
        capacity: number;
      }
    >();

    for (const d of daily) {
      const m = d.day.slice(0, 7);
      const curr = map.get(m) || {
        month: m,
        revenue: 0,
        cash: 0,
        transfer: 0,
        app: 0,
        roomNights: 0,
        capacity: 0,
      };
      curr.revenue += Number(d.revenue || 0);
      curr.cash += Number(d.paid_cash || 0);
      curr.transfer += Number(d.paid_transfer || 0);
      curr.app += Number(d.paid_app || 0) + Number(d.paid_other || 0);
      curr.roomNights += d.rooms_occupied;
      curr.capacity += Math.max(0, d.rooms_total - d.rooms_blocked);
      map.set(m, curr);
    }

    return Array.from(map.values()).sort((a, b) => a.month.localeCompare(b.month));
  }, [daily]);

  // Chart data
  const occupancyChartData = useMemo(() => {
    return daily.map((d) => {
      const cap = Math.max(0, d.rooms_total - d.rooms_blocked);
      const pct = cap > 0 ? Math.round((d.rooms_occupied / cap) * 100) : 0;
      return {
        date: d.day.slice(5),
        occupancy: pct,
        occupied: d.rooms_occupied,
      };
    });
  }, [daily]);

  const revenueChartData = useMemo(() => {
    if (daily.length > 62) {
      return monthlyData.map((m) => ({
        label: m.month,
        revenue: m.revenue,
      }));
    }
    return daily.map((d) => ({
      label: d.day.slice(5),
      revenue: Number(d.revenue || 0),
    }));
  }, [daily, monthlyData]);

  const sourcePieData = useMemo(() => {
    return bySource
      .filter((s) => Number(s.revenue) > 0)
      .map((s) => ({
        name: s.label,
        value: Number(s.revenue),
        color: s.color || '#536275',
      }));
  }, [bySource]);

  // Export Excel with 3 sheets
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Daily
    const dailyRows = daily.map((d) => {
      const cap = Math.max(0, d.rooms_total - d.rooms_blocked);
      const occPct = cap > 0 ? Math.round((d.rooms_occupied / cap) * 100) : 0;
      const totalRec =
        Number(d.paid_cash || 0) +
        Number(d.paid_transfer || 0) +
        Number(d.paid_app || 0) +
        Number(d.paid_other || 0);
      const adr = d.rooms_occupied > 0 ? Math.round(Number(d.revenue || 0) / d.rooms_occupied) : 0;

      return {
        'Tanggal / التاريخ': d.day,
        'Kamar Total / الغرف': d.rooms_total,
        'Kamar Terisi / الغرف المشغولة': d.rooms_occupied,
        'Tingkat Hunian (%) / الإشغال': `${occPct}%`,
        'Pendapatan (Rp) / الإيرادات': Math.round(Number(d.revenue || 0)),
        'Kas Cash (Rp) / نقد': Number(d.paid_cash || 0),
        'Transfer Bank (Rp) / تحويل': Number(d.paid_transfer || 0),
        'Aplikasi OTA (Rp) / تطبيقات': Number(d.paid_app || 0) + Number(d.paid_other || 0),
        'Total Diterima (Rp) / المقبوضات': totalRec,
        'ADR (Rp) / متوسط السعر': adr,
      };
    });
    const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
    XLSX.utils.book_append_sheet(wb, wsDaily, 'Daily');

    // Sheet 2: By Source
    const sourceRows = bySource.map((s) => ({
      Sumber: s.label,
      Kode: s.source_code,
      Bookings: s.bookings,
      'Malam Kamar': s.nights,
      Pendapatan: Number(s.revenue),
    }));
    const wsSource = XLSX.utils.json_to_sheet(sourceRows);
    XLSX.utils.book_append_sheet(wb, wsSource, 'By Source');

    // Sheet 3: Monthly
    const monthlyRows = monthlyData.map((m) => ({
      Bulan: m.month,
      Pendapatan: m.revenue,
      'Kas (Cash)': m.cash,
      Transfer: m.transfer,
      Aplikasi: m.app,
      'Malam Kamar': m.roomNights,
      'Tingkat Hunian (%)': m.capacity > 0 ? Math.round((m.roomNights / m.capacity) * 100) : 0,
    }));
    const wsMonthly = XLSX.utils.json_to_sheet(monthlyRows);
    XLSX.utils.book_append_sheet(wb, wsMonthly, 'Monthly');

    // Sheet 4: Unit Terisi (When single day)
    if (isSingleDay && occupiedList.length > 0) {
      const occRows = occupiedList.map((b) => ({
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
      XLSX.utils.book_append_sheet(wb, wsOcc, 'Unit Terisi');
    }

    XLSX.writeFile(wb, `almagd-report-${from}-to-${to}.xlsx`);
  };

  const handlePrint = () => {
    window.print();
  };

  const isLoading = loadingDaily || loadingSource;

  return (
    <div className="space-y-6 text-start">
      {/* Header & Print/Export Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('nav.reports')}</h1>
          <p className="text-xs text-muted mt-1">
            {from} ➔ {to}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="secondary" size="sm" onClick={handleExportExcel}>
            📥 {t('report.exportExcel')}
          </Button>
          <Button variant="secondary" size="sm" onClick={handlePrint}>
            🖨️ {t('report.printPdf')}
          </Button>
        </div>
      </div>

      {/* Period Picker */}
      <div className="bg-white p-4 rounded-xl border border-line shadow-sm space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          {(['today', 'yesterday', 'thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', 'custom'] as PeriodMode[]).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPeriodMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  periodMode === mode
                    ? 'bg-navy text-white shadow-sm'
                    : 'bg-stone/50 text-muted hover:text-ink'
                }`}
              >
                {t(`report.${mode}`)}
              </button>
            )
          )}
        </div>

        {periodMode === 'custom' && (
          <div className="flex items-center gap-3 pt-2">
            <div>
              <label className="block text-[11px] text-muted mb-1">{t('booking.checkIn')}</label>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-[11px] text-muted mb-1">{t('booking.checkOut')}</label>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="py-24 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : daily.length === 0 ? (
        <EmptyState title={t('common.noData')} description={t('nav.reports')} />
      ) : (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title={t('report.kpiRevenue')}
              value={formatIDR(kpis.totalRevenue)}
              subtitle={t('report.revenueNote')}
              variant="gold"
            />
            <StatCard
              title={t('report.kpiOccupancy')}
              value={`${kpis.occupancyPercent}%`}
              subtitle={`${kpis.totalOccupied} ${t('report.roomNights')}`}
              variant="navy"
            />
            <StatCard
              title={t('report.kpiAdr')}
              value={formatIDR(kpis.adr)}
              variant="default"
            />
            <StatCard
              title={t('report.kpiRevpar')}
              value={formatIDR(kpis.revpar)}
              variant="default"
            />
            <StatCard
              title={t('report.kpiReceived')}
              value={formatIDR(kpis.totalReceived)}
              subtitle={t('report.cashNote')}
              variant="success"
            />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Occupancy Line Chart */}
            <Card>
              <h3 className="text-sm font-bold text-navy mb-4">
                📈 {t('report.dailyOccupancyChart')}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={occupancyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="date" stroke="#718096" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#718096" fontSize={11} unit="%" />
                    <Tooltip
                      formatter={(val: number) => [`${val}%`, t('report.kpiOccupancy')]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="occupancy"
                      stroke="#0F2942"
                      strokeWidth={2.5}
                      dot={{ r: 2 }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Revenue Bar Chart */}
            <Card>
              <h3 className="text-sm font-bold text-navy mb-4">
                📊 {t('report.dailyRevenueChart')}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={revenueChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="label" stroke="#718096" fontSize={11} />
                    <YAxis stroke="#718096" fontSize={11} />
                    <Tooltip
                      formatter={(val: number) => [formatIDR(val), t('report.kpiRevenue')]}
                      contentStyle={{ backgroundColor: '#fff', borderRadius: '8px' }}
                    />
                    <Bar dataKey="revenue" fill="#D4A017" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </div>

          {/* Source Share Pie Chart */}
          <Card>
            <h3 className="text-sm font-bold text-navy mb-4">
              🥧 {t('report.sourceShareChart')}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-6">
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={sourcePieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      innerRadius={45}
                      paddingAngle={3}
                    >
                      {sourcePieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: number) => [formatIDR(val), t('report.kpiRevenue')]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              {/* Source Breakdown Table */}
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('booking.source')}</Th>
                    <Th>{t('nav.bookings')}</Th>
                    <Th>{t('report.roomNights')}</Th>
                    <Th>{t('report.kpiRevenue')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {bySource.map((s) => (
                    <Tr key={s.source_code}>
                      <Td className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block"
                          style={{ backgroundColor: s.color }}
                        />
                        <span className="font-semibold text-xs">{s.label}</span>
                      </Td>
                      <Td className="text-xs">{s.bookings}</Td>
                      <Td className="text-xs">{s.nights}</Td>
                      <Td className="text-xs font-bold text-navy">
                        {formatIDR(Number(s.revenue))}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            </div>
          </Card>

          {/* Single Day Occupied Units (الفلل والغرف الممتلئة فقط في هذا اليوم) */}
          {isSingleDay && (
            <Card className="border-gold/40 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                    <span>🏛️</span>
                    <span>{t('today.occupiedUnitsTitle')}</span>
                    <span className="text-xs bg-navy text-white px-2.5 py-0.5 rounded-full font-mono font-bold">
                      {occupiedList.length}
                    </span>
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {t('today.occupiedUnitsSubtitle')} ({formatDateHuman(from, lang)})
                  </p>
                </div>
              </div>

              {occupiedList.length === 0 ? (
                <EmptyState title={t('today.noOccupiedUnits')} className="py-6" />
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <Thead>
                      <Tr>
                        <Th>{t('booking.unit')}</Th>
                        <Th>{t('booking.guest')}</Th>
                        <Th>{t('booking.code')}</Th>
                        <Th>{t('booking.checkIn')} / {t('booking.checkOut')}</Th>
                        <Th>{t('booking.totalAmount')}</Th>
                        <Th>{t('booking.balanceAmount')}</Th>
                        <Th>{t('common.status')}</Th>
                      </Tr>
                    </Thead>
                    <Tbody>
                      {occupiedList.map((b) => {
                        const isVilla = b.unit_kind === 'villa';
                        const isChildRoom = b.unit_kind === 'room' && (b.unit_name || '').includes(' - ');

                        return (
                          <Tr key={b.id} className="hover:bg-mist/80">
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
                            <Td className="font-mono text-xs font-bold text-navy">
                              {b.code}
                            </Td>
                            <Td className="text-xs text-muted font-mono whitespace-nowrap">
                              {b.check_in} ➔ {b.check_out}
                              <span className="ms-1 text-[10px] text-ink font-sans font-semibold">
                                ({t('booking.nightsCount', { count: b.nights ?? 1 })})
                              </span>
                            </Td>
                            <Td className="text-xs font-mono font-bold text-navy whitespace-nowrap">
                              {formatIDR(Number(b.total_amount || 0))}
                            </Td>
                            <Td className="whitespace-nowrap">
                              {Number(b.balance || 0) > 0 ? (
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
                          </Tr>
                        );
                      })}
                    </Tbody>
                  </Table>
                </div>
              )}
            </Card>
          )}

          {/* Daily Breakdown Table */}
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <span>📆</span>
                <span>{t('report.dailyTable')}</span>
                <span className="text-xs font-normal text-muted font-mono">
                  ({daily.length} {daily.length === 1 ? t('booking.nightsCount', { count: 1 }) : `${daily.length}`})
                </span>
              </h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('report.date')}</Th>
                    <Th>{t('report.occupiedRooms')}</Th>
                    <Th>{t('report.kpiOccupancy')}</Th>
                    <Th>{t('report.kpiRevenue')}</Th>
                    <Th>Cash</Th>
                    <Th>Transfer</Th>
                    <Th>App / Other</Th>
                    <Th>{t('report.totalReceived')}</Th>
                    <Th>{t('report.adr')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {[...daily].reverse().map((d) => {
                    const cap = Math.max(0, d.rooms_total - d.rooms_blocked);
                    const occPct = cap > 0 ? Math.round((d.rooms_occupied / cap) * 100) : 0;
                    const dayTotalReceived =
                      Number(d.paid_cash || 0) +
                      Number(d.paid_transfer || 0) +
                      Number(d.paid_app || 0) +
                      Number(d.paid_other || 0);
                    const adr =
                      d.rooms_occupied > 0
                        ? Math.round(Number(d.revenue || 0) / d.rooms_occupied)
                        : 0;

                    return (
                      <Tr key={d.day}>
                        <Td className="font-semibold text-navy whitespace-nowrap text-xs">
                          {formatDateHuman(d.day, lang)}
                        </Td>
                        <Td className="font-mono text-xs">
                          {d.rooms_occupied} <span className="text-muted/70">/ {cap}</span>
                        </Td>
                        <Td>
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-bold text-xs ${
                              occPct >= 70
                                ? 'bg-success/15 text-success'
                                : occPct >= 30
                                ? 'bg-gold/15 text-gold-text'
                                : 'bg-stone/50 text-muted'
                            }`}
                          >
                            {occPct}%
                          </span>
                        </Td>
                        <Td className="font-bold text-ink whitespace-nowrap font-mono text-xs">
                          {formatIDRWithCommas(Math.round(Number(d.revenue || 0)))}
                        </Td>
                        <Td className="text-xs text-muted whitespace-nowrap font-mono">
                          {Number(d.paid_cash) > 0 ? formatIDRWithCommas(Number(d.paid_cash)) : '—'}
                        </Td>
                        <Td className="text-xs text-muted whitespace-nowrap font-mono">
                          {Number(d.paid_transfer) > 0 ? formatIDRWithCommas(Number(d.paid_transfer)) : '—'}
                        </Td>
                        <Td className="text-xs text-muted whitespace-nowrap font-mono">
                          {Number(d.paid_app) + Number(d.paid_other) > 0
                            ? formatIDRWithCommas(Number(d.paid_app) + Number(d.paid_other))
                            : '—'}
                        </Td>
                        <Td className="font-bold text-navy whitespace-nowrap font-mono text-xs">
                          {dayTotalReceived > 0 ? formatIDRWithCommas(dayTotalReceived) : '—'}
                        </Td>
                        <Td className="text-xs text-muted whitespace-nowrap font-mono">
                          {adr > 0 ? formatIDRWithCommas(adr) : '—'}
                        </Td>
                      </Tr>
                    );
                  })}
                </Tbody>
              </Table>
            </div>
          </Card>

          {/* Monthly Summary Table */}
          <Card>
            <h3 className="text-sm font-bold text-navy mb-4">
              📅 {t('report.monthlyTable')}
            </h3>
            <Table>
              <Thead>
                <Tr>
                  <Th>{t('report.month')}</Th>
                  <Th>{t('report.kpiRevenue')}</Th>
                  <Th>Cash</Th>
                  <Th>Transfer</Th>
                  <Th>App / Other</Th>
                  <Th>{t('report.roomNights')}</Th>
                  <Th>{t('report.kpiOccupancy')}</Th>
                </Tr>
              </Thead>
              <Tbody>
                {monthlyData.map((m) => {
                  const occPct =
                    m.capacity > 0 ? Math.round((m.roomNights / m.capacity) * 100) : 0;

                  return (
                    <Tr key={m.month}>
                      <Td className="font-bold text-navy">{m.month}</Td>
                      <Td className="font-bold text-ink">{formatIDR(m.revenue)}</Td>
                      <Td className="text-xs text-muted">{formatIDR(m.cash)}</Td>
                      <Td className="text-xs text-muted">{formatIDR(m.transfer)}</Td>
                      <Td className="text-xs text-muted">{formatIDR(m.app)}</Td>
                      <Td className="text-xs font-medium">{m.roomNights}</Td>
                      <Td className="text-xs">
                        <span className="inline-flex px-2 py-0.5 rounded-full bg-gold/15 text-gold-text font-semibold">
                          {occPct}%
                        </span>
                      </Td>
                    </Tr>
                  );
                })}
              </Tbody>
            </Table>
          </Card>
        </div>
      )}
    </div>
  );
};
