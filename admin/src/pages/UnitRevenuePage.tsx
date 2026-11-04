import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Building2,
  Calendar,
  FileSpreadsheet,
  Home,
  DoorOpen,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase } from '../lib/supabase';
import { useI18n } from '../i18n/I18nProvider';
import { formatIDR } from '../lib/money';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Input } from '../components/ui/Input';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import {
  UnitPerformanceReport,
  type UnitPerformanceItem,
  type UnitPerformanceTotals,
} from '../components/report/UnitPerformanceReport';
import { todayISO, addDaysISO, formatDateHuman } from '../lib/dates';
import type { BookingOverview } from '../api/bookings';

type PeriodMode = 'thisMonth' | 'lastMonth' | 'thisQuarter' | 'thisYear' | 'custom';

function getUnitPeriodDates(mode: PeriodMode): { from: string; to: string } {
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

  // default custom: last 30 days
  return { from: addDaysISO(todayISO(), -30), to: todayISO() };
}

export const UnitRevenuePage: React.FC = () => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  // Period mode defaults to 'lastMonth' (October 2026 for rich historical data)
  const [periodMode, setPeriodMode] = useState<PeriodMode>('lastMonth');
  const [customFrom, setCustomFrom] = useState(() => addDaysISO(todayISO(), -30));
  const [customTo, setCustomTo] = useState(() => todayISO());

  const { from, to } = useMemo(() => {
    if (periodMode === 'custom') {
      return { from: customFrom, to: customTo };
    }
    return getUnitPeriodDates(periodMode);
  }, [periodMode, customFrom, customTo]);

  // Query performance data
  const { data: reportData, isLoading, refetch } = useQuery({
    queryKey: ['unit-revenue-performance', from, to],
    queryFn: async () => {
      if (!supabase || !from || !to) return null;

      // 1. Fetch units
      const { data: allUnitsData, error: unitsErr } = await supabase
        .from('units')
        .select('id, name, kind, sort_order, active, parent_id')
        .order('sort_order', { ascending: true });
      if (unitsErr) throw unitsErr;
      const allUnits = allUnitsData || [];

      // Map parent units
      const parentUnitMap = new Map<number, any>();
      allUnits.forEach((u) => {
        if (!u.parent_id) parentUnitMap.set(u.id, u);
      });

      const subToParent = new Map<number, number>();
      allUnits.forEach((u) => {
        if (u.parent_id) subToParent.set(u.id, u.parent_id);
        else subToParent.set(u.id, u.id);
      });

      function getArabicUnitName(name: string): string {
        const v = name.match(/Villa\s+(\d+)/i);
        if (v) return `فيلا ${v[1]}`;
        const k = name.match(/Kamar\s+Lepas\s+(\d+)/i);
        if (k) return `غرفة مستقلة ${k[1]}`;
        return name;
      }

      const unitMetrics = new Map<number, {
        id: number;
        name: string;
        arabicName: string;
        kind: 'villa' | 'room';
        sortOrder: number;
        bookingsCount: Set<string>;
        nightsOccupied: number;
        revenue: number;
        paid: number;
      }>();

      for (const [id, u] of parentUnitMap.entries()) {
        unitMetrics.set(id, {
          id,
          name: u.name,
          arabicName: getArabicUnitName(u.name),
          kind: u.kind === 'villa' ? 'villa' : 'room',
          sortOrder: u.sort_order ?? 9999,
          bookingsCount: new Set(),
          nightsOccupied: 0,
          revenue: 0,
          paid: 0,
        });
      }

      // 2. Fetch payments paid in [from, to]
      const { data: paymentsData, error: payErr } = await supabase
        .from('payments')
        .select('*, bookings(id, code, unit_id, check_in, check_out, total_amount, source_code, status)')
        .gte('paid_on', from)
        .lte('paid_on', to)
        .order('created_at', { ascending: true });
      if (payErr) throw payErr;
      const payments = paymentsData || [];

      for (const p of payments) {
        const b = (p as any).bookings;
        if (!b?.unit_id || b.status === 'cancelled') continue;
        const parentId = subToParent.get(b.unit_id);
        if (parentId && unitMetrics.has(parentId)) {
          unitMetrics.get(parentId)!.paid += Number(p.amount || 0);
        }
      }

      // 3. Fetch in-house stays overlapping [from, to]
      const { data: inHouseData, error: inHouseErr } = await supabase
        .from('booking_overview')
        .select('*')
        .lte('check_in', to)
        .gt('check_out', from)
        .neq('status', 'cancelled')
        .order('check_in', { ascending: true });
      if (inHouseErr) throw inHouseErr;
      const inHouse = (inHouseData || []) as BookingOverview[];

      for (const b of inHouse) {
        if (!b.unit_id || b.status === 'cancelled' || !b.check_in || !b.check_out) continue;
        const parentId = subToParent.get(b.unit_id);
        if (!parentId || !unitMetrics.has(parentId)) continue;
        const m = unitMetrics.get(parentId)!;

        // Calculate overlap nights
        const bCheckIn = b.check_in;
        const bCheckOut = b.check_out;
        const cIn = bCheckIn < from ? from : bCheckIn;
        const toPlusOne = new Date(new Date(to).getTime() + 86400000).toISOString().slice(0, 10);
        const cOut = bCheckOut > toPlusOne ? toPlusOne : bCheckOut;

        const totalNights = Math.max(1, (new Date(bCheckOut).getTime() - new Date(bCheckIn).getTime()) / 86400000);
        const overlapNights = Math.max(0, (new Date(cOut).getTime() - new Date(cIn).getTime()) / 86400000);
        const nightRate = Number(b.total_amount || 0) / totalNights;
        const rev = nightRate * overlapNights;

        m.revenue += rev;
        m.nightsOccupied += overlapNights;
        if (b.id) m.bookingsCount.add(b.id);
      }

      // Totals
      let totalVillasPaid = 0, totalVillasRev = 0, totalVillasNights = 0, totalVillasBookings = 0;
      let totalRoomsPaid = 0, totalRoomsRev = 0, totalRoomsNights = 0, totalRoomsBookings = 0;
      let grandTotalUnitPaid = 0, grandTotalUnitRev = 0, grandTotalUnitNights = 0, grandTotalUnitBookings = 0;

      for (const m of unitMetrics.values()) {
        const bCount = m.bookingsCount.size;
        grandTotalUnitPaid += m.paid;
        grandTotalUnitRev += m.revenue;
        grandTotalUnitNights += m.nightsOccupied;
        grandTotalUnitBookings += bCount;

        if (m.kind === 'villa') {
          totalVillasPaid += m.paid;
          totalVillasRev += m.revenue;
          totalVillasNights += m.nightsOccupied;
          totalVillasBookings += bCount;
        } else {
          totalRoomsPaid += m.paid;
          totalRoomsRev += m.revenue;
          totalRoomsNights += m.nightsOccupied;
          totalRoomsBookings += bCount;
        }
      }

      // Base share denominator on paid collections (or revenue fallback)
      const denominator = grandTotalUnitPaid > 0 ? grandTotalUnitPaid : (grandTotalUnitRev > 0 ? grandTotalUnitRev : 1);

      const items: UnitPerformanceItem[] = Array.from(unitMetrics.values()).map((m) => {
        const shareBasis = grandTotalUnitPaid > 0 ? m.paid : m.revenue;
        const sharePercent = Number(((shareBasis / denominator) * 100).toFixed(1));
        const adr = m.nightsOccupied > 0 ? Math.round(m.revenue / m.nightsOccupied) : 0;
        return {
          id: m.id,
          name: m.name,
          arabicName: m.arabicName,
          kind: m.kind,
          sortOrder: m.sortOrder,
          bookingsCount: m.bookingsCount.size,
          nightsOccupied: m.nightsOccupied,
          revenue: Math.round(m.revenue),
          paid: m.paid,
          adr,
          sharePercent,
        };
      });

      const totalVillas: UnitPerformanceTotals = {
        bookingsCount: totalVillasBookings,
        nightsOccupied: totalVillasNights,
        revenue: Math.round(totalVillasRev),
        paid: totalVillasPaid,
        adr: totalVillasNights > 0 ? Math.round(totalVillasRev / totalVillasNights) : 0,
        sharePercent: Number((((grandTotalUnitPaid > 0 ? totalVillasPaid : totalVillasRev) / denominator) * 100).toFixed(1)),
      };

      const totalRooms: UnitPerformanceTotals = {
        bookingsCount: totalRoomsBookings,
        nightsOccupied: totalRoomsNights,
        revenue: Math.round(totalRoomsRev),
        paid: totalRoomsPaid,
        adr: totalRoomsNights > 0 ? Math.round(totalRoomsRev / totalRoomsNights) : 0,
        sharePercent: Number((((grandTotalUnitPaid > 0 ? totalRoomsPaid : totalRoomsRev) / denominator) * 100).toFixed(1)),
      };

      const grandTotal: UnitPerformanceTotals = {
        bookingsCount: grandTotalUnitBookings,
        nightsOccupied: grandTotalUnitNights,
        revenue: Math.round(grandTotalUnitRev),
        paid: grandTotalUnitPaid,
        adr: grandTotalUnitNights > 0 ? Math.round(grandTotalUnitRev / grandTotalUnitNights) : 0,
        sharePercent: 100,
      };

      return {
        items,
        totalVillas,
        totalRooms,
        grandTotal,
      };
    },
    enabled: Boolean(from && to && to >= from),
  });

  // Export to Excel
  const handleExportExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();

    const headers = [
      '#',
      lang === 'ar' ? 'الوحدة' : 'Unit',
      lang === 'ar' ? 'الاسم' : 'Nama',
      lang === 'ar' ? 'النوع' : 'Tipe',
      lang === 'ar' ? 'الحجوزات' : 'Booking',
      lang === 'ar' ? 'ليالي الإشغال' : 'Malam Terisi',
      lang === 'ar' ? 'الإيراد الموزع (IDR)' : 'Pendapatan (IDR)',
      lang === 'ar' ? 'المقبوض الفعلي (IDR)' : 'Penerimaan Kas (IDR)',
      lang === 'ar' ? 'متوسط السعر ADR' : 'ADR',
      lang === 'ar' ? 'نسبة المساهمة %' : 'Kontribusi %',
    ];

    const rows: (string | number)[][] = [];

    // Villas
    const villas = reportData.items.filter((i) => i.kind === 'villa');
    villas.forEach((v, idx) => {
      rows.push([
        idx + 1,
        lang === 'ar' ? v.arabicName : v.name,
        v.name,
        lang === 'ar' ? 'فيلا' : 'Villa',
        v.bookingsCount,
        v.nightsOccupied,
        v.revenue,
        v.paid,
        v.adr,
        `${v.sharePercent}%`,
      ]);
    });

    // Subtotal Villas
    rows.push([
      '—',
      lang === 'ar' ? '🏛️ إجمالي الفلل' : 'Total Villa',
      '—',
      'Villa',
      reportData.totalVillas.bookingsCount,
      reportData.totalVillas.nightsOccupied,
      reportData.totalVillas.revenue,
      reportData.totalVillas.paid,
      reportData.totalVillas.adr,
      `${reportData.totalVillas.sharePercent}%`,
    ]);

    // Empty separator
    rows.push([]);

    // Rooms
    const rooms = reportData.items.filter((i) => i.kind === 'room');
    rooms.forEach((r, idx) => {
      rows.push([
        idx + 1,
        lang === 'ar' ? r.arabicName : r.name,
        r.name,
        lang === 'ar' ? 'غرفة' : 'Kamar',
        r.bookingsCount,
        r.nightsOccupied,
        r.revenue,
        r.paid,
        r.adr,
        `${r.sharePercent}%`,
      ]);
    });

    // Subtotal Rooms
    rows.push([
      '—',
      lang === 'ar' ? '🚪 إجمالي الغرف' : 'Total Kamar',
      '—',
      'Kamar',
      reportData.totalRooms.bookingsCount,
      reportData.totalRooms.nightsOccupied,
      reportData.totalRooms.revenue,
      reportData.totalRooms.paid,
      reportData.totalRooms.adr,
      `${reportData.totalRooms.sharePercent}%`,
    ]);

    // Grand Total
    rows.push([]);
    rows.push([
      '🏆',
      lang === 'ar' ? 'الإجمالي العام' : 'GRAND TOTAL',
      '—',
      '—',
      reportData.grandTotal.bookingsCount,
      reportData.grandTotal.nightsOccupied,
      reportData.grandTotal.revenue,
      reportData.grandTotal.paid,
      reportData.grandTotal.adr,
      '100%',
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, 'Unit Revenue');

    const fileName = `تقرير_دخل_الوحدات_${from}_إلى_${to}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const periodLabel = useMemo(() => {
    if (periodMode === 'lastMonth') {
      return lang === 'ar' ? 'أكتوبر 2026' : 'Oktober 2026';
    }
    if (periodMode === 'thisMonth') {
      return lang === 'ar' ? 'نوفمبر 2026' : 'November 2026';
    }
    return `${formatDateHuman(from, lang)} ➔ ${formatDateHuman(to, lang)}`;
  }, [periodMode, from, to, lang]);

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="p-2 rounded-xl bg-gold/15 text-gold border border-gold/30">
              <Building2 className="w-6 h-6" />
            </span>
            <h1 className="text-xl sm:text-2xl font-bold text-navy">
              {isAr ? 'تقرير دخل وأداء الوحدات' : 'Laporan Kinerja & Pendapatan Unit'}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-muted">
            {isAr
              ? 'تحليل إيرادات ومدفوعات كل فيلا وغرفة مستقلة على حدة مع المقارنة البيانية ونسب الإشغال والمساهمة'
              : 'Analisis pendapatan dan penerimaan kas per villa dan kamar mandiri dengan grafik visual dan kontribusi'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportExcel}
            disabled={!reportData || isLoading}
            className="flex items-center gap-1.5 text-xs font-bold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'تصدير إلى Excel' : 'Ekspor Excel'}</span>
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="text-xs"
          >
            {isAr ? 'تحديث' : 'Segarkan'}
          </Button>
        </div>
      </div>

      {/* Navigation Tabs between General Reports & Unit Revenue */}
      <div className="flex items-center gap-2 border-b border-line pb-3">
        <Link
          to="/reports"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white text-muted hover:text-ink hover:bg-stone/40 border border-line transition-colors"
        >
          <BarChart3 className="w-4 h-4 text-gold" />
          <span>{isAr ? 'التقارير المالية والتشغيلية' : 'Laporan Operasional & Keuangan'}</span>
        </Link>
        <Link
          to="/reports/units"
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-navy text-white shadow-xs"
        >
          <Building2 className="w-4 h-4 text-gold" />
          <span>{isAr ? 'دخل وأداء الوحدات (الفلل والغرف)' : 'Kinerja Unit (Villa & Kamar)'}</span>
        </Link>
      </div>

      {/* Period Selector Card */}
      <Card className="border-gold/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-gold" />
            <span className="text-xs font-bold text-navy">
              {isAr ? 'الفترة الزمنية:' : 'Periode:'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setPeriodMode('lastMonth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                periodMode === 'lastMonth'
                  ? 'bg-navy text-white border-navy shadow-xs'
                  : 'bg-white text-muted border-line hover:text-ink'
              }`}
            >
              {isAr ? 'الشهر الماضي (أكتوبر 2026)' : 'Bulan Lalu (Oktober 2026)'}
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('thisMonth')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                periodMode === 'thisMonth'
                  ? 'bg-navy text-white border-navy shadow-xs'
                  : 'bg-white text-muted border-line hover:text-ink'
              }`}
            >
              {isAr ? 'هذا الشهر (نوفمبر 2026)' : 'Bulan Ini (November 2026)'}
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('thisQuarter')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                periodMode === 'thisQuarter'
                  ? 'bg-navy text-white border-navy shadow-xs'
                  : 'bg-white text-muted border-line hover:text-ink'
              }`}
            >
              {isAr ? 'هذا الربع' : 'Kuartal Ini'}
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('thisYear')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                periodMode === 'thisYear'
                  ? 'bg-navy text-white border-navy shadow-xs'
                  : 'bg-white text-muted border-line hover:text-ink'
              }`}
            >
              {isAr ? 'هذه السنة' : 'Tahun Ini'}
            </button>
            <button
              type="button"
              onClick={() => setPeriodMode('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                periodMode === 'custom'
                  ? 'bg-navy text-white border-navy shadow-xs'
                  : 'bg-white text-muted border-line hover:text-ink'
              }`}
            >
              {isAr ? 'مخصص 📅' : 'Kustom 📅'}
            </button>
          </div>
        </div>

        {/* Custom Date Pickers */}
        {periodMode === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-line">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">{isAr ? 'من:' : 'Dari:'}</span>
              <Input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="text-xs py-1"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted">{isAr ? 'إلى:' : 'Sampai:'}</span>
              <Input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="text-xs py-1"
              />
            </div>
          </div>
        )}
      </Card>

      {/* Loading state */}
      {isLoading ? (
        <div className="py-20 flex justify-center items-center">
          <Spinner size="lg" />
        </div>
      ) : !reportData ? (
        <EmptyState
          title={isAr ? 'لا توجد بيانات' : 'Tidak Ada Data'}
          description={isAr ? 'لم يتم العثور على أي بيانات للفترة المحددة' : 'Data tidak ditemukan untuk periode ini'}
        />
      ) : (
        <>
          {/* Top KPI StatCards for Unit Revenue */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title={isAr ? 'إجمالي المقبوض الفعلي' : 'Total Penerimaan Kas'}
              value={formatIDR(reportData.grandTotal.paid)}
              subtitle={isAr ? `لكافة الفلل والغرف (${periodLabel})` : `Semua villa & kamar (${periodLabel})`}
              icon={<DollarSign className="w-5 h-5" />}
              variant="gold"
            />
            <StatCard
              title={isAr ? 'دخل الفلل (🏛️ 24 فيلا)' : 'Penerimaan Villa (🏛️ 24 Villa)'}
              value={formatIDR(reportData.totalVillas.paid)}
              subtitle={isAr ? `تمثل ${reportData.totalVillas.sharePercent}% من إجمالي التحصيل` : `${reportData.totalVillas.sharePercent}% dari total penerimaan`}
              icon={<Home className="w-5 h-5" />}
              variant="navy"
            />
            <StatCard
              title={isAr ? 'دخل الغرف المستقلة (🚪 6 غرف)' : 'Penerimaan Kamar (🚪 6 Kamar)'}
              value={formatIDR(reportData.totalRooms.paid)}
              subtitle={isAr ? `تمثل ${reportData.totalRooms.sharePercent}% من إجمالي التحصيل` : `${reportData.totalRooms.sharePercent}% dari total penerimaan`}
              icon={<DoorOpen className="w-5 h-5" />}
              variant="default"
            />
            <StatCard
              title={isAr ? 'إجمالي ليالي الإشغال' : 'Total Malam Terisi'}
              value={`${reportData.grandTotal.nightsOccupied} ${isAr ? 'ليلة' : 'malam'}`}
              subtitle={isAr ? `متوسط ADR: ${formatIDR(reportData.grandTotal.adr)}` : `Rata-rata ADR: ${formatIDR(reportData.grandTotal.adr)}`}
              icon={<TrendingUp className="w-5 h-5" />}
              variant="success"
            />
          </div>

          {/* Unit Performance Report Component (Visual Chart + Detailed Breakdown Table) */}
          <UnitPerformanceReport
            items={reportData.items}
            totalVillas={reportData.totalVillas}
            totalRooms={reportData.totalRooms}
            grandTotal={reportData.grandTotal}
            periodLabel={periodLabel}
          />
        </>
      )}
    </div>
  );
};
