import React, { useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { formatIDRWithCommas } from '../../lib/money';
import { Card } from '../ui/Card';
import { Table, Thead, Tbody, Tr, Th, Td } from '../ui/Table';

export interface AppChannelItem {
  code: string;
  label: string;
  color: string;
  bookings: number;
  nights: number;
  collected: number;
  sharePercent: number;
}

export interface AppChannelsRevenueReportProps {
  items: AppChannelItem[];
  totalCollected: number;
  totalBookings: number;
  totalNights: number;
  periodLabel: string;
  periodMode: string;
  isLoading?: boolean;
}

const CHANNEL_ICONS: Record<string, { icon: string; badge: string }> = {
  walk_in: { icon: '🟢', badge: 'Walk-in (مباشر)' },
  tiket: { icon: '🟡', badge: 'Tiket.com' },
  booking: { icon: '🟣', badge: 'Booking.com' },
  agoda: { icon: '🔵', badge: 'Agoda' },
  traveloka: { icon: '🌐', badge: 'Traveloka' },
  other: { icon: '⚪', badge: 'Lainnya / أخرى' },
};

export const AppChannelsRevenueReport: React.FC<AppChannelsRevenueReportProps> = ({
  items,
  totalCollected,
  totalBookings,
  totalNights,
  periodLabel,
  periodMode,
  isLoading = false,
}) => {
  const { lang } = useI18n();

  // Period title helper
  const periodTypeLabel = useMemo(() => {
    if (periodMode === 'today') return lang === 'ar' ? 'التقرير اليومي (اليوم)' : 'Laporan Harian (Hari Ini)';
    if (periodMode === 'yesterday') return lang === 'ar' ? 'التقرير اليومي (أمس)' : 'Laporan Harian (Kemarin)';
    if (periodMode === 'singleDay') return lang === 'ar' ? 'التقرير اليومي (يوم محدد)' : 'Laporan Harian';
    if (periodMode === 'thisMonth') return lang === 'ar' ? 'التقرير الشهري (هذا الشهر)' : 'Laporan Bulanan (Bulan Ini)';
    if (periodMode === 'lastMonth') return lang === 'ar' ? 'التقرير الشهري (الشهر الماضي)' : 'Laporan Bulanan (Bulan Lalu)';
    if (periodMode === 'thisQuarter') return lang === 'ar' ? 'التقرير الربع سنوي' : 'Laporan Kuartalan';
    if (periodMode === 'thisYear') return lang === 'ar' ? 'التقرير السنوي (هذه السنة)' : 'Laporan Tahunan (Tahun Ini)';
    return lang === 'ar' ? 'تقرير الفترة المحددة' : 'Laporan Periode';
  }, [periodMode, lang]);

  // Filter out inactive channels to eliminate clutter
  const activeItems = useMemo(() => {
    const active = items.filter((it) => it.collected > 0 || it.bookings > 0 || it.nights > 0);
    return active.length > 0 ? active : items.filter((it) => it.bookings > 0);
  }, [items]);

  return (
    <Card className="border-line shadow-xs space-y-4 bg-white text-start">
      {/* Executive Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-line pb-3">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xl">💳</span>
            <h3 className="text-base sm:text-lg font-black text-navy tracking-tight">
              {lang === 'ar'
                ? 'بيان المقبوضات والدخل الفعلي حسب التطبيقات وقنوات الحجز'
                : 'Laporan Penerimaan Kas/Bank Berdasarkan Aplikasi & Saluran'}
            </h3>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-navy text-white shadow-2xs">
              {periodTypeLabel}
            </span>
          </div>
          <p className="text-xs text-muted mt-1 font-mono">
            {periodLabel}
          </p>
        </div>

        {/* Highlighted Grand Total Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className="px-3.5 py-1.5 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-950 flex items-center gap-2 shadow-2xs">
            <span>{lang === 'ar' ? 'إجمالي المقبوضات المحصلة:' : 'Total Diterima:'}</span>
            {isLoading ? (
              <span className="inline-block w-28 h-5 bg-emerald-200/70 animate-pulse rounded" />
            ) : (
              <span className="font-mono text-base font-black text-emerald-700">
                {formatIDRWithCommas(Math.round(totalCollected))}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Unified Professional Statement Table */}
      <div className="overflow-x-auto border border-line rounded-xl bg-white shadow-2xs">
        <Table>
          <Thead>
            <Tr className="bg-stone-50/90 text-navy font-bold">
              <Th>{lang === 'ar' ? 'التطبيق / مصدر الحجز' : 'Aplikasi / Sumber'}</Th>
              <Th>{lang === 'ar' ? 'عدد الحجوزات' : 'Jml Booking'}</Th>
              <Th>{lang === 'ar' ? 'ليالي الغرف' : 'Malam Kamar'}</Th>
              <Th className="bg-emerald-50/60 text-emerald-950 font-black">
                {lang === 'ar' ? 'المقبوضات المحصلة بالفعل (التي دخلت البنك)' : 'Penerimaan Bersih (Masuk Bank/Kas)'}
              </Th>
              <Th>{lang === 'ar' ? 'النسبة من إجمالي المقبوضات' : 'Pangsa Penerimaan'}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              // Loading Skeleton
              Array.from({ length: 4 }).map((_, idx) => (
                <Tr key={`skeleton-${idx}`} className="animate-pulse">
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full bg-stone-200" />
                      <div className="space-y-1.5">
                        <div className="w-24 h-3.5 bg-stone-200 rounded" />
                        <div className="w-12 h-2.5 bg-stone-100 rounded" />
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="w-12 h-3.5 bg-stone-200 rounded" />
                  </Td>
                  <Td>
                    <div className="w-14 h-3.5 bg-stone-200 rounded" />
                  </Td>
                  <Td className="bg-emerald-50/20">
                    <div className="w-24 h-4 bg-emerald-200/50 rounded" />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2 min-w-32">
                      <div className="flex-1 bg-stone-200 h-2 rounded-full" />
                      <div className="w-8 h-3 bg-stone-200 rounded" />
                    </div>
                  </Td>
                </Tr>
              ))
            ) : activeItems.length === 0 ? (
              <Tr>
                <Td colSpan={5} className="py-8 text-center text-xs text-muted">
                  {lang === 'ar' ? 'لا توجد مقبوضات مسجلة في هذه الفترة' : 'Tidak ada penerimaan tercatat pada periode ini'}
                </Td>
              </Tr>
            ) : (
              activeItems.map((item) => {
                const meta = CHANNEL_ICONS[item.code] || { icon: '📱', badge: item.label };
                const effectiveShare = totalCollected > 0 ? (item.collected / totalCollected) * 100 : item.sharePercent;

                return (
                  <Tr key={item.code} className="hover:bg-mist/50 transition-colors">
                    {/* Channel / App with Icon and Color */}
                    <Td className="flex items-center gap-2.5">
                      <span className="text-base shrink-0">{meta.icon}</span>
                      <span
                        className="w-2.5 h-2.5 rounded-full inline-block shrink-0 shadow-2xs"
                        style={{ backgroundColor: item.color }}
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-navy text-xs sm:text-sm">{item.label}</span>
                        <span className="text-[10px] text-muted font-mono">{item.code}</span>
                      </div>
                    </Td>

                    {/* Bookings Count */}
                    <Td className="font-mono text-xs text-ink">
                      <span className="font-bold text-sm">{item.bookings}</span>
                      {totalBookings > 0 && (
                        <span className="text-[11px] text-muted ms-1">
                          ({((item.bookings / totalBookings) * 100).toFixed(0)}%)
                        </span>
                      )}
                    </Td>

                    {/* Room Nights */}
                    <Td className="font-mono text-xs text-ink font-semibold">
                      {item.nights} {lang === 'ar' ? 'ليلة' : 'mlm'}
                    </Td>

                    {/* Actual Collected Amount */}
                    <Td className="bg-emerald-50/40 font-mono text-sm sm:text-base font-black text-emerald-800">
                      {formatIDRWithCommas(Math.round(item.collected))}
                    </Td>

                    {/* Share % with Visual Bar */}
                    <Td>
                      <div className="flex items-center gap-2.5 min-w-32">
                        <div className="flex-1 bg-stone-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${Math.min(100, Math.max(0, effectiveShare))}%`,
                              backgroundColor: item.color,
                            }}
                          />
                        </div>
                        <span className="font-mono text-xs font-bold text-navy w-12 text-end">
                          {effectiveShare.toFixed(1)}%
                        </span>
                      </div>
                    </Td>
                  </Tr>
                );
              })
            )}

            {/* Grand Total Row */}
            <Tr className="bg-slate-900 text-white font-bold border-t-2 border-slate-700">
              <Td className="text-gold flex items-center gap-2">
                <span>★</span>
                <span>{lang === 'ar' ? 'الإجمالي الكلي للمقبوضات' : 'TOTAL KESELURUHAN DITERIMA'}</span>
              </Td>
              <Td className="font-mono text-xs text-white">
                {isLoading ? (
                  <span className="inline-block w-12 h-3.5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  `${totalBookings} ${lang === 'ar' ? 'حجز' : 'booking'}`
                )}
              </Td>
              <Td className="font-mono text-xs text-white">
                {isLoading ? (
                  <span className="inline-block w-12 h-3.5 bg-slate-700 animate-pulse rounded" />
                ) : (
                  `${totalNights} ${lang === 'ar' ? 'ليلة' : 'malam'}`
                )}
              </Td>
              <Td className="font-mono text-base font-black text-emerald-400 bg-slate-800/80">
                {isLoading ? (
                  <span className="inline-block w-24 h-4 bg-slate-700 animate-pulse rounded" />
                ) : (
                  formatIDRWithCommas(Math.round(totalCollected))
                )}
              </Td>
              <Td className="font-mono text-xs font-bold text-gold">
                100.0%
              </Td>
            </Tr>
          </Tbody>
        </Table>
      </div>
    </Card>
  );
};
