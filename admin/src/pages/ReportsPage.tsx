import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useBookingSources, type BookingOverview } from '../api/bookings';
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

type PeriodMode = 'today' | 'yesterday' | 'singleDay' | 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';

function getPeriodDates(mode: PeriodMode, singleDate?: string): { from: string; to: string } {
  const today = todayISO();

  if (mode === 'today') {
    return { from: today, to: today };
  }

  if (mode === 'yesterday') {
    const yesterday = addDaysISO(today, -1);
    return { from: yesterday, to: yesterday };
  }

  if (mode === 'singleDay') {
    const d = singleDate || today;
    return { from: d, to: d };
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

export interface DailyReportRow {
  id: string;
  unitId?: number | null;
  unitName: string;
  unitKind: string;
  sortOrder: number;
  guestName: string;
  guestPhone: string | null;
  bookingCode: string;
  bookingId?: string | null;
  stayType: 'checkInToday' | 'stayover' | 'outsideTodayStay' | 'vacant';
  isOutsideStay: boolean;
  isVacant: boolean;
  checkIn: string;
  checkOut: string;
  nights: number;
  sourceCode: string;
  todayCollected: number;
  payments: Array<{
    id: string;
    amount: number;
    method: string;
    seq: number;
    reference?: string | null;
  }>;
  totalAmount: number;
  balance: number;
  status: string;
}

export const ReportsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();

  const [periodMode, setPeriodMode] = useState<PeriodMode>('today');
  const [singleDayDate, setSingleDayDate] = useState<string>(todayISO());
  const [customFrom, setCustomFrom] = useState(addDaysISO(todayISO(), -30));
  const [customTo, setCustomTo] = useState(todayISO());

  // Density & View filters for operational report
  const [isDense, setIsDense] = useState<boolean>(true);
  const [unitViewFilter, setUnitViewFilter] = useState<'all' | 'occupied' | 'villas' | 'rooms'>('all');
  const [unitSearch, setUnitSearch] = useState<string>('');

  const { from, to } = useMemo(() => {
    if (periodMode === 'singleDay') {
      return { from: singleDayDate, to: singleDayDate };
    }
    if (periodMode === 'custom') {
      return { from: customFrom, to: customTo };
    }
    return getPeriodDates(periodMode, singleDayDate);
  }, [periodMode, singleDayDate, customFrom, customTo]);

  const { data: daily = [], isLoading: loadingDaily } = useReportDaily(from, to);
  const { data: bySource = [], isLoading: loadingSource } = useReportBySource(from, to);
  const { data: sources = [] } = useBookingSources();

  const sourceColorMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sources) map.set(s.code, s.color);
    return map;
  }, [sources]);

  const sourceLabelMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const s of sources) map.set(s.code, s.label);
    return map;
  }, [sources]);

  const isSingleDay = from === to;
  const { data: operationalReport, isLoading: loadingOperational } = useQuery({
    queryKey: ['report-daily-operational', from],
    queryFn: async () => {
      if (!supabase || !isSingleDay) return null;

      // 0. Fetch all units for complete property listing
      const { data: allUnitsData, error: unitsErr } = await supabase
        .from('units')
        .select('id, name, kind, sort_order, active')
        .order('sort_order', { ascending: true });
      if (unitsErr) throw unitsErr;
      const allUnits = allUnitsData || [];

      // 1. In-house stays on selected date (non-cancelled)
      const { data: inHouseData, error: inHouseErr } = await supabase
        .from('booking_overview')
        .select('*')
        .lte('check_in', from)
        .gt('check_out', from)
        .neq('status', 'cancelled')
        .order('unit_name', { ascending: true });
      if (inHouseErr) throw inHouseErr;
      const inHouse = (inHouseData || []) as BookingOverview[];

      // 2. Payments collected on this date
      const { data: paymentsData, error: payErr } = await supabase
        .from('payments')
        .select('*, bookings(id, code, unit_id, check_in, check_out, total_amount, source_code, status, guests(full_name, phone), units(id, name, kind, sort_order))')
        .eq('paid_on', from)
        .order('created_at', { ascending: true });
      if (payErr) throw payErr;
      const paymentsToday = paymentsData || [];

      // 3. Get sequence numbers for all payments of these bookings
      const allBookingIds = new Set<string>();
      inHouse.forEach((b) => {
        if (b.id) allBookingIds.add(b.id);
      });
      paymentsToday.forEach((p) => {
        if (p.booking_id) allBookingIds.add(p.booking_id);
      });

      let allPaymentsData: Array<{ id: string; booking_id: string; created_at: string; paid_on: string }> = [];
      if (allBookingIds.size > 0) {
        const { data: allPay, error: allPayErr } = await supabase
          .from('payments')
          .select('id, booking_id, created_at, paid_on')
          .in('booking_id', Array.from(allBookingIds))
          .order('created_at', { ascending: true });
        if (allPayErr) throw allPayErr;
        allPaymentsData = allPay || [];
      }

      const seqMap = new Map<string, number>();
      const countMap = new Map<string, number>();
      for (const p of allPaymentsData) {
        const cur = (countMap.get(p.booking_id) || 0) + 1;
        countMap.set(p.booking_id, cur);
        seqMap.set(p.id, cur);
      }

      // Group payments by booking
      const paymentsByBooking = new Map<string, any[]>();
      for (const p of paymentsToday) {
        const arr = paymentsByBooking.get(p.booking_id) || [];
        arr.push({
          ...p,
          seq: seqMap.get(p.id) || 1,
        });
        paymentsByBooking.set(p.booking_id, arr);
      }

      const inHouseByUnitId = new Map<number, BookingOverview[]>();
      const inHouseByUnitName = new Map<string, BookingOverview[]>();
      const processedInHouseIds = new Set<string>();

      for (const b of inHouse) {
        if (!b.id) continue;
        if (b.unit_id) {
          const arr = inHouseByUnitId.get(b.unit_id) || [];
          arr.push(b);
          inHouseByUnitId.set(b.unit_id, arr);
        }
        if (b.unit_name) {
          const arr = inHouseByUnitName.get(b.unit_name) || [];
          arr.push(b);
          inHouseByUnitName.set(b.unit_name, arr);
        }
      }

      const rows: DailyReportRow[] = [];

      // A. Populate from allUnits to guarantee complete property display
      for (const u of allUnits) {
        const unitBookings = inHouseByUnitId.get(u.id) || inHouseByUnitName.get(u.name) || [];

        if (unitBookings.length > 0) {
          for (const b of unitBookings) {
            if (!b.id) continue;
            processedInHouseIds.add(b.id);
            const isCheckInToday = b.check_in === from;
            const stayType: 'checkInToday' | 'stayover' = isCheckInToday ? 'checkInToday' : 'stayover';
            const payments = paymentsByBooking.get(b.id) || [];
            const todayCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

            rows.push({
              id: b.id,
              unitId: u.id,
              unitName: u.name,
              unitKind: u.kind,
              sortOrder: u.sort_order,
              guestName: b.guest_name || '—',
              guestPhone: b.guest_phone || null,
              bookingCode: b.code || '—',
              bookingId: b.id,
              stayType,
              isOutsideStay: false,
              isVacant: false,
              checkIn: b.check_in || '—',
              checkOut: b.check_out || '—',
              nights: b.nights ?? 1,
              sourceCode: b.source_code || 'walk_in',
              todayCollected,
              payments,
              totalAmount: Number(b.total_amount || 0),
              balance: Number(b.balance || 0),
              status: b.status || 'confirmed',
            });
          }
        } else {
          // Vacant unit
          rows.push({
            id: `vacant-${u.id}`,
            unitId: u.id,
            unitName: u.name,
            unitKind: u.kind,
            sortOrder: u.sort_order,
            guestName: '—',
            guestPhone: null,
            bookingCode: '—',
            bookingId: null,
            stayType: 'vacant',
            isOutsideStay: false,
            isVacant: true,
            checkIn: '',
            checkOut: '',
            nights: 0,
            sourceCode: '—',
            todayCollected: 0,
            payments: [],
            totalAmount: 0,
            balance: 0,
            status: 'available',
          });
        }
      }

      // Any in-house bookings not matched to allUnits
      for (const b of inHouse) {
        if (b.id && !processedInHouseIds.has(b.id)) {
          const isCheckInToday = b.check_in === from;
          const stayType: 'checkInToday' | 'stayover' = isCheckInToday ? 'checkInToday' : 'stayover';
          const payments = paymentsByBooking.get(b.id) || [];
          const todayCollected = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

          rows.push({
            id: b.id,
            unitId: b.unit_id || null,
            unitName: b.unit_name || '—',
            unitKind: b.unit_kind || 'room',
            sortOrder: 9999,
            guestName: b.guest_name || '—',
            guestPhone: b.guest_phone || null,
            bookingCode: b.code || '—',
            bookingId: b.id,
            stayType,
            isOutsideStay: false,
            isVacant: false,
            checkIn: b.check_in || '—',
            checkOut: b.check_out || '—',
            nights: b.nights ?? 1,
            sourceCode: b.source_code || 'walk_in',
            todayCollected,
            payments,
            totalAmount: Number(b.total_amount || 0),
            balance: Number(b.balance || 0),
            status: b.status || 'confirmed',
          });
        }
      }

      // Sort rows by sortOrder, then unitName
      rows.sort((a, b) => {
        if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
        return (a.unitName || '').localeCompare(b.unitName || '', undefined, { numeric: true });
      });

      // Financial summary
      let totalCash = 0;
      let totalTransfer = 0;
      let totalApp = 0;
      let totalOther = 0;
      let grandTotal = 0;

      for (const r of rows) {
        for (const p of r.payments) {
          const amt = Number(p.amount || 0);
          grandTotal += amt;
          if (p.method === 'cash') totalCash += amt;
          else if (p.method === 'transfer') totalTransfer += amt;
          else if (p.method === 'app') totalApp += amt;
          else totalOther += amt;
        }
      }

      return {
        rows,
        totalCount: allUnits.length,
        inHouseCount: inHouse.length,
        vacantCount: Math.max(0, allUnits.length - inHouse.length),
        outsideCount: rows.filter((r) => r.isOutsideStay).length,
        villaCount: allUnits.filter((u) => u.kind === 'villa').length,
        roomCount: allUnits.filter((u) => u.kind === 'room').length,
        summary: {
          totalCash,
          totalTransfer,
          totalApp,
          totalOther,
          grandTotal,
        },
      };
    },
    enabled: isSingleDay,
  });

  const filteredRows = useMemo(() => {
    if (!operationalReport) return [];
    let list = operationalReport.rows;

    if (unitViewFilter === 'occupied') {
      list = list.filter((r) => !r.isVacant);
    } else if (unitViewFilter === 'villas') {
      list = list.filter((r) => r.unitKind === 'villa');
    } else if (unitViewFilter === 'rooms') {
      list = list.filter((r) => r.unitKind === 'room');
    }

    if (unitSearch.trim()) {
      const q = unitSearch.toLowerCase().trim();
      list = list.filter(
        (r) =>
          r.unitName.toLowerCase().includes(q) ||
          r.guestName.toLowerCase().includes(q) ||
          r.bookingCode.toLowerCase().includes(q) ||
          (r.guestPhone && r.guestPhone.includes(q))
      );
    }

    return list;
  }, [operationalReport, unitViewFilter, unitSearch]);

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

    // Sheet 4: Unit Operational Report (When single day)
    if (isSingleDay && operationalReport && operationalReport.rows.length > 0) {
      const occRows = operationalReport.rows.map((r) => {
        const payDetails =
          r.payments
            .map((p) => `دفعة رقم ${p.seq} (${p.method}: ${Number(p.amount).toLocaleString()})`)
            .join(' + ') || '—';

        return {
          'Unit / الوحدة': r.unitName,
          'Jenis / نوع الوحدة':
            r.unitKind === 'villa'
              ? 'Villa (فيلا بالكامل)'
              : r.unitName.includes(' - ')
              ? 'Kamar Villa (غرفة ضمن فيلا)'
              : 'Kamar Lepas (غرفة مستقلة)',
          'Tipe Tamu / نوع النزيل':
            r.isVacant
              ? 'شاغرة / متاحة (Kosong)'
              : r.stayType === 'checkInToday'
              ? 'دخول اليوم (Check-in)'
              : r.stayType === 'stayover'
              ? 'نزيل مقيم / قديم (Stayover)'
              : 'خارج إقامة اليوم (Outside Stay)',
          'Nama Tamu / اسم الضيف': r.isVacant ? '—' : r.guestName + (r.isOutsideStay ? ' (دفعة خارج إقامة اليوم)' : ''),
          'Telepon / الهاتف': r.guestPhone || '—',
          'Kode Booking / رمز الحجز': r.bookingCode || '—',
          'Sumber / المصدر': r.sourceCode || '—',
          'Check-in / الدخول': r.checkIn || '—',
          'Check-out / الخروج': r.checkOut || '—',
          'Malam / عدد الليالي': r.nights || 0,
          'Diterima Hari Ini (Rp) / المقبوض اليوم': r.todayCollected,
          'Detail Pembayaran / تفاصيل الدفعة': payDetails,
          'Total Booking (Rp) / إجمالي الحجز': r.totalAmount,
          'Sisa (Rp) / المتبقي': r.balance,
          'Status / الحالة': r.isVacant ? 'Tersedia' : r.status,
        };
      });
      const wsOcc = XLSX.utils.json_to_sheet(occRows);
      XLSX.utils.book_append_sheet(wb, wsOcc, 'Laporan Harian');
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
          {(['today', 'yesterday', 'singleDay', 'thisMonth', 'lastMonth', 'thisQuarter', 'thisYear', 'custom'] as PeriodMode[]).map(
            (mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setPeriodMode(mode);
                  if (mode === 'singleDay' && !singleDayDate) {
                    setSingleDayDate(todayISO());
                  }
                }}
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

        {/* Dedicated Single Day Selector */}
        {periodMode === 'singleDay' && (
          <div className="flex flex-wrap items-center gap-3 p-3 bg-gold/10 border border-gold/30 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-base">📅</span>
              <label className="text-xs font-bold text-navy whitespace-nowrap">
                {t('report.singleDayPickerLabel')}:
              </label>
              <Input
                type="date"
                value={singleDayDate}
                onChange={(e) => {
                  if (e.target.value) setSingleDayDate(e.target.value);
                }}
                className="font-mono text-xs w-44 bg-white border-gold/60 focus:border-navy"
              />
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSingleDayDate(addDaysISO(singleDayDate, -1))}
                className="text-xs font-mono"
                title={t('report.prevDay')}
              >
                ◀ {t('report.prevDay')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSingleDayDate(todayISO())}
                className="text-xs font-semibold"
              >
                {t('report.today')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSingleDayDate(addDaysISO(singleDayDate, 1))}
                className="text-xs font-mono"
                title={t('report.nextDay')}
              >
                {t('report.nextDay')} ▶
              </Button>
            </div>

            <div className="ms-auto flex items-center gap-2">
              <span className="text-xs font-bold text-navy bg-white px-3 py-1.5 rounded-lg border border-line shadow-2xs font-mono">
                {formatDateHuman(singleDayDate, lang)}
              </span>
            </div>
          </div>
        )}

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

          {/* Single Day Operational & Collection Report (تقرير إشغال وتحصيل الوحدات اليومي) */}
          {isSingleDay && (
            <Card className="border-gold/40 shadow-xs">
              {/* Header with Title, Counts, and Quick Day Navigation */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4 border-b border-line pb-3">
                <div>
                  <h3 className="text-base font-bold text-navy flex items-center gap-2 flex-wrap">
                    <span>🏛️</span>
                    <span>{t('report.dailyOperationalReportTitle')}</span>
                    {operationalReport && (
                      <>
                        <span className="text-xs bg-navy text-white px-2.5 py-0.5 rounded-full font-mono font-bold" title={t('report.filterAllUnits')}>
                          {operationalReport.totalCount} {t('today.wholeVillaBadge')} / {t('unitKind.room')}
                        </span>
                        <span className="text-[11px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                          {operationalReport.inHouseCount} {t('report.filterOccupiedOnly')}
                        </span>
                        <span className="text-[11px] bg-slate-100 text-slate-700 border border-slate-300 px-2 py-0.5 rounded-full font-bold">
                          {operationalReport.vacantCount} {t('report.availableCountLabel')}
                        </span>
                      </>
                    )}
                  </h3>
                  <p className="text-xs text-muted mt-0.5">
                    {t('report.dailyOperationalReportSubtitle')} ({formatDateHuman(from, lang)})
                  </p>
                </div>

                {/* Day navigation buttons in header */}
                <div className="flex items-center gap-1.5 self-start md:self-auto">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const prevD = addDaysISO(from, -1);
                      setSingleDayDate(prevD);
                      setPeriodMode('singleDay');
                    }}
                    className="text-xs font-mono"
                    title={t('report.prevDay')}
                  >
                    ◀ {t('report.prevDay')}
                  </Button>
                  <span className="text-xs font-bold text-navy bg-stone/40 px-2.5 py-1.5 rounded-lg border border-line font-mono">
                    {from}
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      const nextD = addDaysISO(from, 1);
                      setSingleDayDate(nextD);
                      setPeriodMode('singleDay');
                    }}
                    className="text-xs font-mono"
                    title={t('report.nextDay')}
                  >
                    {t('report.nextDay')} ▶
                  </Button>
                </div>
              </div>

              {/* View Filters Bar: Tabs, Search, and Density Toggle */}
              {operationalReport && (
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 mb-3 p-2 bg-stone/30 rounded-xl border border-line">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setUnitViewFilter('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        unitViewFilter === 'all'
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-white text-muted hover:text-ink border border-line'
                      }`}
                    >
                      {t('report.filterAllUnits')} ({operationalReport.totalCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitViewFilter('occupied')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        unitViewFilter === 'occupied'
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-white text-muted hover:text-ink border border-line'
                      }`}
                    >
                      {t('report.filterOccupiedOnly')} ({operationalReport.inHouseCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitViewFilter('villas')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        unitViewFilter === 'villas'
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-white text-muted hover:text-ink border border-line'
                      }`}
                    >
                      {t('report.filterVillasOnly')} ({operationalReport.villaCount})
                    </button>
                    <button
                      type="button"
                      onClick={() => setUnitViewFilter('rooms')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        unitViewFilter === 'rooms'
                          ? 'bg-navy text-white shadow-xs'
                          : 'bg-white text-muted hover:text-ink border border-line'
                      }`}
                    >
                      {t('report.filterRoomsOnly')} ({operationalReport.roomCount})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Search box */}
                    <div className="relative flex-1 sm:w-56">
                      <Input
                        type="text"
                        placeholder={t('report.searchUnitOrGuest')}
                        value={unitSearch}
                        onChange={(e) => setUnitSearch(e.target.value)}
                        className="h-8 text-xs ps-8 bg-white"
                      />
                      <span className="absolute start-2.5 top-2 text-muted text-xs pointer-events-none">
                        🔍
                      </span>
                    </div>

                    {/* Density Toggle (أسطر صغيرة / أسطر عادية) */}
                    <button
                      type="button"
                      onClick={() => setIsDense(!isDense)}
                      className={`px-2.5 py-1 h-8 rounded-lg text-xs font-bold border transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                        isDense
                          ? 'bg-navy text-white border-navy shadow-xs'
                          : 'bg-white text-navy border-line hover:bg-mist'
                      }`}
                      title={isDense ? t('report.denseView') : t('report.comfortableView')}
                    >
                      <span>{isDense ? '📏' : '📐'}</span>
                      <span>{isDense ? t('report.denseView') : t('report.comfortableView')}</span>
                    </button>
                  </div>
                </div>
              )}

              {loadingOperational ? (
                <div className="py-12 flex justify-center">
                  <Spinner size="md" />
                </div>
              ) : !operationalReport || operationalReport.rows.length === 0 ? (
                <EmptyState title={t('today.noOccupiedUnits')} className="py-6" />
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto border border-line rounded-xl">
                    <table className="w-full text-start text-sm">
                      <thead className="bg-stone/60 text-muted uppercase font-bold border-b border-line sticky top-0 backdrop-blur z-10">
                        <tr>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('booking.unit')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('report.stayTypeHeader')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('booking.guest')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('booking.code')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('booking.checkIn')} / {t('booking.checkOut')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('booking.source')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold bg-gold/15 text-navy' : 'px-4 py-3 text-start text-xs font-semibold bg-gold/10 text-navy'}>{t('report.collectedToday')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('report.totalBookingAmount')}</th>
                          <th className={isDense ? 'px-2.5 py-1.5 text-[10px] text-start font-bold' : 'px-4 py-3 text-start text-xs font-semibold'}>{t('common.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line bg-white">
                        {filteredRows.map((r) => {
                          const isVilla = r.unitKind === 'villa';
                          const isChildRoom = r.unitKind === 'room' && (r.unitName || '').includes(' - ');
                          const tdClass = isDense
                            ? 'px-2.5 py-1 text-xs text-ink align-middle whitespace-nowrap'
                            : 'px-4 py-3 text-xs text-ink align-middle whitespace-nowrap';

                          if (r.isVacant) {
                            return (
                              <tr
                                key={r.id}
                                className="bg-slate-50/30 hover:bg-slate-100/50 transition-colors text-slate-500"
                              >
                                {/* 1. Unit */}
                                <td className={tdClass}>
                                  <div className="flex items-center gap-1.5">
                                    <span className="font-bold text-navy text-xs">
                                      {r.unitName}
                                    </span>
                                    <Badge
                                      variant={isVilla ? 'gold' : isChildRoom ? 'info' : 'navy'}
                                      className="text-[9px] py-0 px-1"
                                    >
                                      {isVilla
                                        ? t('today.wholeVillaBadge')
                                        : isChildRoom
                                        ? t('today.roomInVillaBadge')
                                        : t('today.independentRoomBadge')}
                                    </Badge>
                                  </div>
                                </td>

                                {/* 2. Stay Type */}
                                <td className={tdClass}>
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
                                    🟢 {t('report.unitVacant')}
                                  </span>
                                </td>

                                {/* 3. Guest */}
                                <td className={tdClass}>
                                  <span className="text-slate-400 font-mono">—</span>
                                </td>

                                {/* 4. Booking Code */}
                                <td className={tdClass}>
                                  <span className="text-slate-400 font-mono">—</span>
                                </td>

                                {/* 5. Stay Dates */}
                                <td className={tdClass}>
                                  <span className="text-slate-400 font-mono">—</span>
                                </td>

                                {/* 6. Source */}
                                <td className={tdClass}>
                                  <span className="text-slate-400 font-mono">—</span>
                                </td>

                                {/* 7. Collected Today */}
                                <td className={`${tdClass} bg-gold/5`}>
                                  <span className="text-slate-400 font-mono">—</span>
                                </td>

                                {/* 8. Total Amount */}
                                <td className={tdClass}>
                                  <span className="text-slate-400 font-mono">—</span>
                                </td>

                                {/* 9. Status */}
                                <td className={tdClass}>
                                  <span className="text-[10px] text-slate-400 font-medium">
                                    {t('report.unitVacantBadge')}
                                  </span>
                                </td>
                              </tr>
                            );
                          }

                          return (
                            <tr
                              key={r.id}
                              className={`hover:bg-mist/80 transition-colors ${
                                r.isOutsideStay ? 'bg-amber-50/60' : ''
                              }`}
                            >
                              {/* 1. Unit */}
                              <td className={tdClass}>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-navy text-xs">
                                    {r.unitName}
                                  </span>
                                  <Badge
                                    variant={isVilla ? 'gold' : isChildRoom ? 'info' : 'navy'}
                                    className="text-[9px] py-0 px-1"
                                  >
                                    {isVilla
                                      ? t('today.wholeVillaBadge')
                                      : isChildRoom
                                      ? t('today.roomInVillaBadge')
                                      : t('today.independentRoomBadge')}
                                  </Badge>
                                </div>
                              </td>

                              {/* 2. Stay Type */}
                              <td className={tdClass}>
                                {r.stayType === 'checkInToday' ? (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-success/15 text-success border border-success/30">
                                    ✨ {t('report.stayTypeCheckInToday')}
                                  </span>
                                ) : r.stayType === 'stayover' ? (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-navy/10 text-navy border border-navy/20">
                                    🏠 {t('report.stayTypeStayover')}
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                    📌 {t('report.stayTypeOutsideStay')}
                                  </span>
                                )}
                              </td>

                              {/* 3. Guest */}
                              <td className={tdClass}>
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-semibold text-ink text-xs">
                                    {r.guestName}
                                  </span>
                                  {r.isOutsideStay && (
                                    <span className="text-[10px] text-amber-800 font-bold bg-amber-100/80 px-1 py-0.2 rounded border border-amber-200">
                                      ({t('report.outsideStayLabel')})
                                    </span>
                                  )}
                                  {r.guestPhone && !isDense && (
                                    <span className="text-[10px] text-muted font-mono">
                                      📞 {r.guestPhone}
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* 4. Booking Code */}
                              <td className={`${tdClass} font-mono font-bold text-navy`}>
                                {r.bookingId ? (
                                  <span
                                    onClick={() => navigate(`/bookings/${r.bookingId}`)}
                                    className="cursor-pointer hover:underline"
                                    title={r.guestPhone ? `📞 ${r.guestPhone}` : undefined}
                                  >
                                    {r.bookingCode}
                                  </span>
                                ) : (
                                  <span className="text-muted font-normal font-sans">—</span>
                                )}
                              </td>

                              {/* 5. Stay Dates & Nights */}
                              <td className={`${tdClass} text-muted font-mono`}>
                                {r.checkIn ? (
                                  <span>
                                    {r.checkIn.slice(5)} ➔ {r.checkOut.slice(5)}
                                    <span className="ms-1 text-navy font-sans font-bold text-[11px]">
                                      ({t('booking.nightsCount', { count: r.nights })})
                                    </span>
                                  </span>
                                ) : (
                                  '—'
                                )}
                              </td>

                              {/* 6. Source */}
                              <td className={tdClass}>
                                <span
                                  className="px-1.5 py-0.2 rounded text-[10px] font-bold text-white shadow-2xs"
                                  style={{ backgroundColor: sourceColorMap.get(r.sourceCode) || '#536275' }}
                                >
                                  {sourceLabelMap.get(r.sourceCode) || r.sourceCode}
                                </span>
                              </td>

                              {/* 7. Collected Today */}
                              <td className={`${tdClass} bg-gold/5`}>
                                {r.todayCollected > 0 ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className="font-mono text-xs font-black text-emerald-800">
                                      {formatIDR(r.todayCollected)}
                                    </span>
                                    {r.payments.map((p) => (
                                      <span
                                        key={p.id}
                                        className={`text-[9px] font-bold px-1 py-0.2 rounded border ${
                                          p.method === 'cash'
                                            ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                            : p.method === 'transfer'
                                            ? 'bg-blue-50 text-blue-700 border-blue-300'
                                            : 'bg-purple-50 text-purple-700 border-purple-300'
                                        }`}
                                      >
                                        {t('report.paymentNumberLabel', { num: p.seq })} ({t(`paymentMethod.${p.method}`) || p.method})
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted font-mono text-xs">
                                    —
                                  </span>
                                )}
                              </td>

                              {/* 8. Total Booking & Balance */}
                              <td className={tdClass}>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-mono text-muted">
                                    {formatIDR(r.totalAmount)}
                                  </span>
                                  {r.balance > 0 ? (
                                    <Badge variant="danger" className="text-[9px] py-0 px-1 font-mono">
                                      ⚠️ {formatIDR(r.balance)}
                                    </Badge>
                                  ) : (
                                    <Badge variant="success" className="text-[9px] py-0 px-1">
                                      ✓ {t('calendar.paidBadge')}
                                    </Badge>
                                  )}
                                </div>
                              </td>

                              {/* 9. Status */}
                              <td className={tdClass}>
                                <StatusBadge status={r.status as any} />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Summary Bar - Matching Excel Image 2 */}
                  <div className="p-4 rounded-xl bg-slate-900 text-white shadow-sm border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-700/60 pb-2 flex-wrap gap-2">
                      <span className="font-bold text-xs uppercase tracking-wider text-gold-light flex items-center gap-2">
                        <span>📊</span>
                        <span>{t('report.collectionSummaryTitle')} ({formatDateHuman(from, lang)})</span>
                      </span>
                      <span className="text-xs text-slate-400 font-mono">
                        {operationalReport.inHouseCount} {t('report.filterOccupiedOnly')} / {operationalReport.totalCount} {t('report.filterAllUnits')}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-start">
                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span className="text-[11px] text-slate-400 block mb-0.5">💵 {t('paymentMethod.cash')}</span>
                        <span className="font-mono text-sm font-bold text-emerald-400">
                          {formatIDR(operationalReport.summary.totalCash)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span className="text-[11px] text-slate-400 block mb-0.5">🏦 {t('paymentMethod.transfer')}</span>
                        <span className="font-mono text-sm font-bold text-blue-400">
                          {formatIDR(operationalReport.summary.totalTransfer)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-slate-800/80 border border-slate-700">
                        <span className="text-[11px] text-slate-400 block mb-0.5">📱 {t('paymentMethod.app')}</span>
                        <span className="font-mono text-sm font-bold text-purple-400">
                          {formatIDR(operationalReport.summary.totalApp)}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-lg bg-gold/15 border border-gold/40">
                        <span className="text-[11px] text-gold-light block mb-0.5">💰 {t('report.collectedToday')}</span>
                        <span className="font-mono text-sm font-black text-gold">
                          {formatIDR(operationalReport.summary.grandTotal)}
                        </span>
                      </div>
                    </div>
                  </div>
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
