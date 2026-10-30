import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useBookingSources } from '../../api/bookings';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

export type CalendarUnitFilter = 'all' | 'villas' | 'independent';

export interface CalendarToolbarProps {
  startDate: string;
  daysCount: 7 | 14 | 30;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onDaysCountChange: (days: 7 | 14 | 30) => void;
  onDateChange: (date: string) => void;
  unitFilter: CalendarUnitFilter;
  onUnitFilterChange: (filter: CalendarUnitFilter) => void;
  unitSearch: string;
  onUnitSearchChange: (search: string) => void;
  collapsedVillas: boolean;
  onToggleCollapseVillas: () => void;
}

export const CalendarToolbar: React.FC<CalendarToolbarProps> = ({
  startDate,
  daysCount,
  onPrev,
  onNext,
  onToday,
  onDaysCountChange,
  onDateChange,
  unitFilter,
  onUnitFilterChange,
  unitSearch,
  onUnitSearchChange,
  collapsedVillas,
  onToggleCollapseVillas,
}) => {
  const { t } = useI18n();
  const { data: sources = [] } = useBookingSources();

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-line shadow-xs space-y-3 text-start">
      {/* Top Row: Date Navigation & Day Count Range & Collapse Button */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Navigation Group */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Button variant="secondary" size="sm" onClick={onPrev} className="px-2.5 py-1 text-xs">
            ◀ {t('calendar.prev')}
          </Button>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => e.target.value && onDateChange(e.target.value)}
            className="w-36 text-xs py-1 px-2.5 font-mono"
            title={t('calendar.jumpToDate')}
          />
          <Button variant="ghost" size="sm" onClick={onToday} className="px-2.5 py-1 text-xs font-semibold">
            {t('calendar.todayBtn')}
          </Button>
          <Button variant="secondary" size="sm" onClick={onNext} className="px-2.5 py-1 text-xs">
            {t('calendar.next')} ▶
          </Button>

          {/* 7 / 14 / 30 Days Selector */}
          <div className="flex items-center gap-1 bg-stone/40 p-1 rounded-lg ms-1 sm:ms-2 border border-line">
            <button
              type="button"
              onClick={() => onDaysCountChange(7)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                daysCount === 7
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('calendar.days7')}
            </button>
            <button
              type="button"
              onClick={() => onDaysCountChange(14)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                daysCount === 14
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('calendar.days14')}
            </button>
            <button
              type="button"
              onClick={() => onDaysCountChange(30)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                daysCount === 30
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('calendar.days30')}
            </button>
          </div>
        </div>

        {/* Right side: Villa Collapse/Expand Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleCollapseVillas}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-line bg-stone/30 hover:bg-stone/60 text-navy transition flex items-center gap-1.5 shadow-xs"
          >
            <span>🏛️</span>
            <span>{collapsedVillas ? t('calendar.expandVillas') : t('calendar.collapseVillas')}</span>
          </button>
        </div>
      </div>

      {/* Second Row: Filters, Search, and Source Legend */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-3 pt-3 border-t border-line/60">
        {/* Left: Unit Filter Tabs & Search */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-stone/30 p-1 rounded-lg border border-line">
            <button
              type="button"
              onClick={() => onUnitFilterChange('all')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                unitFilter === 'all'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('calendar.filterAll')}
            </button>
            <button
              type="button"
              onClick={() => onUnitFilterChange('villas')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                unitFilter === 'villas'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('calendar.filterVillas')}
            </button>
            <button
              type="button"
              onClick={() => onUnitFilterChange('independent')}
              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                unitFilter === 'independent'
                  ? 'bg-navy text-white shadow-xs'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {t('calendar.filterIndependent')}
            </button>
          </div>

          <div className="w-full sm:w-72">
            <Input
              type="search"
              value={unitSearch}
              onChange={(e) => onUnitSearchChange(e.target.value)}
              placeholder={t('calendar.searchUnit')}
              className="text-xs py-1"
            />
          </div>
        </div>

        {/* Right: Sources Legend */}
        <div className="flex items-center gap-3 flex-wrap text-xs bg-stone/20 p-2 rounded-lg border border-line/50">
          <span className="text-muted font-bold text-[11px]">{t('calendar.sourceLegend')}:</span>
          {sources.map((s) => (
            <div key={s.code} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block shadow-xs"
                style={{ backgroundColor: s.color }}
              />
              <span className="text-ink font-medium text-[11px]">{s.label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded bg-muted/40 border border-muted/60 inline-block" />
            <span className="text-muted text-[11px]">{t('unitStatus.blocked')}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
