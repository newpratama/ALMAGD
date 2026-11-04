import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from 'recharts';
import { useI18n } from '../../i18n/I18nProvider';
import { formatIDR } from '../../lib/money';
import { Table, Thead, Tbody, Tr, Th, Td } from '../ui/Table';

export interface UnitPerformanceItem {
  id: number;
  name: string;
  arabicName: string;
  kind: 'villa' | 'room';
  sortOrder: number;
  bookingsCount: number;
  nightsOccupied: number;
  revenue: number;
  paid: number;
  adr: number;
  sharePercent: number;
}

export interface UnitPerformanceTotals {
  bookingsCount: number;
  nightsOccupied: number;
  revenue: number;
  paid: number;
  adr: number;
  sharePercent: number;
}

export interface UnitPerformanceReportProps {
  items: UnitPerformanceItem[];
  totalVillas: UnitPerformanceTotals;
  totalRooms: UnitPerformanceTotals;
  grandTotal: UnitPerformanceTotals;
  periodLabel?: string;
}

export const UnitPerformanceReport: React.FC<UnitPerformanceReportProps> = ({
  items,
  totalVillas,
  totalRooms,
  grandTotal,
  periodLabel,
}) => {
  const { t, lang } = useI18n();

  // Tab filter: 'all' | 'villas' | 'rooms'
  const [activeTab, setActiveTab] = useState<'all' | 'villas' | 'rooms'>('all');
  // Sort: 'unit' (natural 1..24, 1..6) | 'highest_paid' | 'highest_rev'
  const [sortMode, setSortMode] = useState<'unit' | 'highest_paid'>('unit');
  // Metric for chart: 'paid' | 'revenue'
  const [chartMetric, setChartMetric] = useState<'paid' | 'revenue'>('paid');

  // Filter items
  const filteredItems = useMemo(() => {
    let list = items;
    if (activeTab === 'villas') list = list.filter((i) => i.kind === 'villa');
    else if (activeTab === 'rooms') list = list.filter((i) => i.kind === 'room');

    if (sortMode === 'highest_paid') {
      return [...list].sort((a, b) => b.paid - a.paid);
    }
    return [...list].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [items, activeTab, sortMode]);

  // Chart data: take units that have revenue > 0 or paid > 0, or all if few
  const chartData = useMemo(() => {
    let list = filteredItems;
    // For cleaner chart, prioritize units with activity if many
    const active = list.filter((i) => i.paid > 0 || i.revenue > 0);
    const target = active.length > 0 ? active : list;

    return target.map((u) => ({
      rawName: u.name,
      displayName: lang === 'ar' ? u.arabicName : u.name,
      kind: u.kind,
      value: chartMetric === 'paid' ? u.paid : u.revenue,
      paid: u.paid,
      revenue: u.revenue,
      nights: u.nightsOccupied,
      bookings: u.bookingsCount,
      share: grandTotal.paid > 0 ? ((u.paid / grandTotal.paid) * 100).toFixed(1) : '0.0',
    }));
  }, [filteredItems, chartMetric, lang, grandTotal.paid]);

  // Separate lists for table if in 'all' view to show subtotals like the user's reference
  const villaItems = useMemo(() => items.filter((i) => i.kind === 'villa'), [items]);
  const roomItems = useMemo(() => items.filter((i) => i.kind === 'room'), [items]);

  const maxPaid = Math.max(1, ...items.map((i) => i.paid));

  return (
    <div className="space-y-6">
      {/* Header with Title and Controls */}
      <div className="bg-surface rounded-2xl border border-divider p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🏛️</span>
              <h2 className="text-lg font-bold text-ink">
                {t('report.unitPerformanceTitle')}
              </h2>
            </div>
            <p className="text-xs text-text-muted mt-1">
              {t('report.unitPerformanceSubtitle')} {periodLabel ? `(${periodLabel})` : ''}
            </p>
          </div>

          {/* Quick Metrics Selector */}
          <div className="flex items-center gap-2 bg-surface-alt p-1 rounded-xl border border-divider text-xs">
            <button
              type="button"
              onClick={() => setChartMetric('paid')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                chartMetric === 'paid'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-text-muted hover:text-ink'
              }`}
            >
              💵 {t('report.metricPaid')}
            </button>
            <button
              type="button"
              onClick={() => setChartMetric('revenue')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                chartMetric === 'revenue'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-text-muted hover:text-ink'
              }`}
            >
              📈 {t('report.metricRevenue')}
            </button>
          </div>
        </div>

        {/* Filters and View Switchers */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-divider text-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-surface-alt p-1 rounded-xl border border-divider">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'all'
                  ? 'bg-white text-navy shadow-xs border border-divider/60'
                  : 'text-text-muted hover:text-ink'
              }`}
            >
              {t('report.allUnitsTab')} ({items.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('villas')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'villas'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-text-muted hover:text-ink'
              }`}
            >
              🏡 {t('report.villasOnlyTab')} ({villaItems.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('rooms')}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                activeTab === 'rooms'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-text-muted hover:text-ink'
              }`}
            >
              🚪 {t('report.roomsOnlyTab')} ({roomItems.length})
            </button>
          </div>

          {/* Sort order */}
          <div className="flex items-center gap-2">
            <span className="text-text-muted">{lang === 'ar' ? 'الترتيب:' : 'Urutkan:'}</span>
            <div className="flex items-center gap-1 bg-surface-alt p-1 rounded-xl border border-divider">
              <button
                type="button"
                onClick={() => setSortMode('unit')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  sortMode === 'unit'
                    ? 'bg-white text-navy shadow-xs border border-divider/60 font-bold'
                    : 'text-text-muted hover:text-ink'
                }`}
              >
                {t('report.sortByUnit')}
              </button>
              <button
                type="button"
                onClick={() => setSortMode('highest_paid')}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  sortMode === 'highest_paid'
                    ? 'bg-white text-navy shadow-xs border border-divider/60 font-bold'
                    : 'text-text-muted hover:text-ink'
                }`}
              >
                {t('report.sortByRevenue')}
              </button>
            </div>
          </div>
        </div>

        {/* Bar Chart Section */}
        <div className="pt-2">
          <div className="flex items-center justify-between text-xs text-text-muted mb-2">
            <span className="font-bold flex items-center gap-1.5 text-ink">
              <span>📊</span>
              <span>{t('report.unitPerformanceChart')}</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500 inline-block"></span>
                <span>{lang === 'ar' ? 'الفلل' : 'Villa'}</span>
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-sm bg-blue-600 inline-block"></span>
                <span>{lang === 'ar' ? 'الغرف المستقلة' : 'Kamar Lepas'}</span>
              </span>
            </div>
          </div>

          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 10, left: 10, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis
                  dataKey="displayName"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  angle={-45}
                  textAnchor="end"
                  interval={0}
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}M`}
                />
                <Tooltip
                  formatter={(val: number) => [formatIDR(val), chartMetric === 'paid' ? t('report.metricPaid') : t('report.metricRevenue')]}
                  content={({ active, payload }) => {
                    if (!active || !payload || !payload.length) return null;
                    const d = payload[0].payload;
                    return (
                      <div className="bg-surface p-3 rounded-xl shadow-lg border border-divider text-xs space-y-1.5 min-w-[200px]">
                        <div className="font-bold text-ink border-b border-divider pb-1 text-sm flex items-center justify-between">
                          <span>{d.displayName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-surface-alt text-text-muted font-normal">
                            {d.kind === 'villa' ? (lang === 'ar' ? 'فيلا' : 'Villa') : (lang === 'ar' ? 'غرفة' : 'Kamar')}
                          </span>
                        </div>
                        <div className="flex justify-between text-emerald-700 font-bold">
                          <span>💵 {t('report.metricPaid')}:</span>
                          <span>{formatIDR(d.paid)}</span>
                        </div>
                        <div className="flex justify-between text-navy font-semibold">
                          <span>📈 {t('report.metricRevenue')}:</span>
                          <span>{formatIDR(d.revenue)}</span>
                        </div>
                        <div className="flex justify-between text-text-muted">
                          <span>🌙 {t('report.roomNights')}:</span>
                          <span>{d.nights} {lang === 'ar' ? 'ليلة' : 'malam'}</span>
                        </div>
                        <div className="flex justify-between text-amber-700 font-semibold pt-1 border-t border-divider/60">
                          <span>📊 {t('report.shareOfTotal')}:</span>
                          <span>{d.share}%</span>
                        </div>
                      </div>
                    );
                  }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.kind === 'villa' ? '#D97706' : '#2563EB'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Comprehensive Table Modeled after User Reference Image */}
      <div className="bg-surface rounded-2xl border border-divider shadow-sm overflow-hidden">
        <div className="p-4 bg-surface-alt/70 border-b border-divider flex items-center justify-between">
          <div className="font-bold text-ink text-sm flex items-center gap-2">
            <span>📋</span>
            <span>{t('report.unitPerformanceTitle')}</span>
          </div>
          <div className="text-xs text-text-muted">
            جميع المبالغ بالروبية الإندونيسية (IDR)
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <Thead>
              <Tr className="bg-slate-100/90 text-slate-700 text-xs font-bold">
                <Th className="w-12 text-center">#</Th>
                <Th>{lang === 'ar' ? 'الوحدة' : 'Unit'}</Th>
                <Th className="text-center">{lang === 'ar' ? 'النوع' : 'Tipe'}</Th>
                <Th className="text-center">{t('report.bookingsCountLabel')}</Th>
                <Th className="text-center">{t('report.roomNights')}</Th>
                <Th className="text-right">{t('report.metricRevenue')}</Th>
                <Th className="text-right text-emerald-900 bg-emerald-50/50">{t('report.metricPaid')}</Th>
                <Th className="text-right">{t('report.adrLabel')}</Th>
                <Th className="text-center w-28">{t('report.shareOfTotal')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {/* When activeTab is 'all' or 'villas', render villas */}
              {(activeTab === 'all' || activeTab === 'villas') && (
                <>
                  {activeTab === 'all' && (
                    <Tr className="bg-amber-50/70 border-y border-amber-200/80">
                      <Td colSpan={9} className="py-2 px-4 font-bold text-amber-900 text-xs">
                        🏡 {lang === 'ar' ? 'قسم الفلل الكاملة (Villa 1 ➔ Villa 24)' : 'Bagian Villa (Villa 1 ➔ Villa 24)'}
                      </Td>
                    </Tr>
                  )}

                  {villaItems.map((u, idx) => (
                    <Tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors text-xs border-b border-divider/60"
                    >
                      <Td className="text-center font-mono text-text-muted">{idx + 1}</Td>
                      <Td className="font-bold text-ink">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-600">🏡</span>
                          <span>{lang === 'ar' ? u.arabicName : u.name}</span>
                          <span className="text-[11px] text-text-muted font-normal font-mono">
                            ({u.name})
                          </span>
                        </div>
                      </Td>
                      <Td className="text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {lang === 'ar' ? 'فيلا كاملة' : 'Villa'}
                        </span>
                      </Td>
                      <Td className="text-center font-medium">{u.bookingsCount}</Td>
                      <Td className="text-center font-medium font-mono">{u.nightsOccupied}</Td>
                      <Td className="text-right font-mono font-medium text-slate-700">
                        {u.revenue > 0 ? formatIDR(u.revenue) : '—'}
                      </Td>
                      <Td className="text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                        {u.paid > 0 ? formatIDR(u.paid) : '—'}
                      </Td>
                      <Td className="text-right font-mono text-text-muted">
                        {u.adr > 0 ? formatIDR(u.adr) : '—'}
                      </Td>
                      <Td className="text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-amber-500 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, (u.paid / maxPaid) * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {u.sharePercent.toFixed(1)}%
                          </span>
                        </div>
                      </Td>
                    </Tr>
                  ))}

                  {/* Subtotal for Villas */}
                  <Tr className="bg-amber-100/60 font-bold border-y-2 border-amber-300 text-amber-950 text-xs">
                    <Td className="text-center">✓</Td>
                    <Td colSpan={2} className="py-2.5 font-black text-amber-950">
                      {t('report.totalVillasRow')}
                    </Td>
                    <Td className="text-center font-black">{totalVillas.bookingsCount}</Td>
                    <Td className="text-center font-black font-mono">{totalVillas.nightsOccupied}</Td>
                    <Td className="text-right font-black font-mono text-amber-950">
                      {formatIDR(totalVillas.revenue)}
                    </Td>
                    <Td className="text-right font-black font-mono text-emerald-800 bg-emerald-100/50">
                      {formatIDR(totalVillas.paid)}
                    </Td>
                    <Td className="text-right font-black font-mono text-amber-950">
                      {formatIDR(totalVillas.adr)}
                    </Td>
                    <Td className="text-center font-black text-amber-900 font-mono">
                      {totalVillas.sharePercent.toFixed(1)}%
                    </Td>
                  </Tr>
                </>
              )}

              {/* When activeTab is 'all' or 'rooms', render rooms */}
              {(activeTab === 'all' || activeTab === 'rooms') && (
                <>
                  {activeTab === 'all' && (
                    <Tr className="bg-blue-50/70 border-y border-blue-200/80">
                      <Td colSpan={9} className="py-2 px-4 font-bold text-blue-900 text-xs">
                        🚪 {lang === 'ar' ? 'قسم الغرف المستقلة (Kamar Lepas 1 ➔ Kamar Lepas 6)' : 'Bagian Kamar Lepas (Kamar 1 ➔ Kamar 6)'}
                      </Td>
                    </Tr>
                  )}

                  {roomItems.map((u, idx) => (
                    <Tr
                      key={u.id}
                      className="hover:bg-slate-50/80 transition-colors text-xs border-b border-divider/60"
                    >
                      <Td className="text-center font-mono text-text-muted">
                        {villaItems.length + idx + 1}
                      </Td>
                      <Td className="font-bold text-ink">
                        <div className="flex items-center gap-1.5">
                          <span className="text-blue-600">🚪</span>
                          <span>{lang === 'ar' ? u.arabicName : u.name}</span>
                          <span className="text-[11px] text-text-muted font-normal font-mono">
                            ({u.name})
                          </span>
                        </div>
                      </Td>
                      <Td className="text-center">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          {lang === 'ar' ? 'غرفة مستقلة' : 'Kamar'}
                        </span>
                      </Td>
                      <Td className="text-center font-medium">{u.bookingsCount}</Td>
                      <Td className="text-center font-medium font-mono">{u.nightsOccupied}</Td>
                      <Td className="text-right font-mono font-medium text-slate-700">
                        {u.revenue > 0 ? formatIDR(u.revenue) : '—'}
                      </Td>
                      <Td className="text-right font-mono font-bold text-emerald-700 bg-emerald-50/30">
                        {u.paid > 0 ? formatIDR(u.paid) : '—'}
                      </Td>
                      <Td className="text-right font-mono text-text-muted">
                        {u.adr > 0 ? formatIDR(u.adr) : '—'}
                      </Td>
                      <Td className="text-center">
                        <div className="flex items-center gap-1.5 justify-center">
                          <div className="w-12 bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className="bg-blue-600 h-1.5 rounded-full"
                              style={{ width: `${Math.min(100, (u.paid / maxPaid) * 100)}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] font-bold text-slate-700">
                            {u.sharePercent.toFixed(1)}%
                          </span>
                        </div>
                      </Td>
                    </Tr>
                  ))}

                  {/* Subtotal for Rooms */}
                  <Tr className="bg-blue-100/60 font-bold border-y-2 border-blue-300 text-blue-950 text-xs">
                    <Td className="text-center">✓</Td>
                    <Td colSpan={2} className="py-2.5 font-black text-blue-950">
                      {t('report.totalRoomsRow')}
                    </Td>
                    <Td className="text-center font-black">{totalRooms.bookingsCount}</Td>
                    <Td className="text-center font-black font-mono">{totalRooms.nightsOccupied}</Td>
                    <Td className="text-right font-black font-mono text-blue-950">
                      {formatIDR(totalRooms.revenue)}
                    </Td>
                    <Td className="text-right font-black font-mono text-emerald-800 bg-emerald-100/50">
                      {formatIDR(totalRooms.paid)}
                    </Td>
                    <Td className="text-right font-black font-mono text-blue-950">
                      {formatIDR(totalRooms.adr)}
                    </Td>
                    <Td className="text-center font-black text-blue-900 font-mono">
                      {totalRooms.sharePercent.toFixed(1)}%
                    </Td>
                  </Tr>
                </>
              )}

              {/* Grand Total Row */}
              <Tr className="bg-slate-900 text-white font-black text-sm border-t-2 border-slate-700">
                <Td className="text-center text-amber-400">🏆</Td>
                <Td colSpan={2} className="py-3 font-black text-amber-300 text-sm">
                  {t('report.grandTotalUnitsRow')}
                </Td>
                <Td className="text-center font-mono text-white">{grandTotal.bookingsCount}</Td>
                <Td className="text-center font-mono text-white">{grandTotal.nightsOccupied}</Td>
                <Td className="text-right font-mono text-amber-200">
                  {formatIDR(grandTotal.revenue)}
                </Td>
                <Td className="text-right font-mono text-emerald-300 bg-emerald-950/40">
                  {formatIDR(grandTotal.paid)}
                </Td>
                <Td className="text-right font-mono text-slate-300">
                  {formatIDR(grandTotal.adr)}
                </Td>
                <Td className="text-center font-mono text-emerald-300">
                  {grandTotal.sharePercent.toFixed(1)}%
                </Td>
              </Tr>
            </Tbody>
          </Table>
        </div>
      </div>
    </div>
  );
};
