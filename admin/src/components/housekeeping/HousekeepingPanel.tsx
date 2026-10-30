import React, { useState, useEffect, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useUnits } from '../../api/units';
import {
  HousekeepingStatus,
  getHousekeepingMap,
  setUnitHousekeepingStatus,
} from '../../lib/housekeeping';

export const HousekeepingPanel: React.FC = () => {
  const { t } = useI18n();
  const { data: units = [] } = useUnits();
  const [hkMap, setHkMap] = useState(() => getHousekeepingMap());
  const [filter, setFilter] = useState<HousekeepingStatus | 'all'>('all');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleUpdate = () => setHkMap(getHousekeepingMap());
    window.addEventListener('almagd-housekeeping-updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('almagd-housekeeping-updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, []);

  const counts = useMemo(() => {
    let clean = 0;
    let cleaning = 0;
    let dirty = 0;
    units.forEach((u) => {
      const s = hkMap[u.id]?.status || 'clean';
      if (s === 'dirty') dirty++;
      else if (s === 'cleaning') cleaning++;
      else clean++;
    });
    return { clean, cleaning, dirty, total: units.length };
  }, [units, hkMap]);

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const s = hkMap[u.id]?.status || 'clean';
      if (filter === 'all') return true;
      return s === filter;
    });
  }, [units, hkMap, filter]);

  return (
    <div className="bg-surface rounded-2xl border border-divider shadow-card p-4 transition-all">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧹</span>
          <div>
            <h3 className="text-sm font-bold text-ink">
              {t('housekeeping.panelTitle')}
            </h3>
            <p className="text-xs text-text-muted">
              {t('housekeeping.panelSubtitle')}
            </p>
          </div>
        </div>

        {/* Quick summary pills */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => {
              setFilter(filter === 'dirty' ? 'all' : 'dirty');
              setIsOpen(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              filter === 'dirty'
                ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                : 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
            }`}
          >
            <span>🧹</span>
            <span>{t('housekeeping.dirty')}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/30 text-[10px]">
              {counts.dirty}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilter(filter === 'cleaning' ? 'all' : 'cleaning');
              setIsOpen(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              filter === 'cleaning'
                ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
          >
            <span>🧼</span>
            <span>{t('housekeeping.cleaning')}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/30 text-[10px]">
              {counts.cleaning}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFilter(filter === 'clean' ? 'all' : 'clean');
              setIsOpen(true);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
              filter === 'clean'
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            <span>✨</span>
            <span>{t('housekeeping.clean')}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-white/30 text-[10px]">
              {counts.clean}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="text-xs text-text-muted hover:text-ink px-2 py-1 font-semibold"
          >
            {isOpen ? '▲ ' + t('common.collapse') : '▼ ' + t('common.expand')}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="mt-4 pt-4 border-t border-divider animate-fadeIn">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 max-h-60 overflow-y-auto p-1">
            {filteredUnits.map((u) => {
              const currentStatus = hkMap[u.id]?.status || 'clean';
              return (
                <div
                  key={u.id}
                  className="p-2.5 rounded-xl border border-divider bg-surface-alt flex flex-col justify-between gap-2"
                >
                  <div className="text-xs font-bold text-ink truncate">{u.name}</div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      title={t('housekeeping.markDirty')}
                      onClick={() => setUnitHousekeepingStatus(u.id, 'dirty')}
                      className={`flex-1 py-1 text-center rounded-lg text-xs font-bold border transition-all ${
                        currentStatus === 'dirty'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-sm'
                          : 'bg-surface hover:bg-rose-50 text-slate-500 border-divider'
                      }`}
                    >
                      🧹
                    </button>
                    <button
                      type="button"
                      title={t('housekeeping.markCleaning')}
                      onClick={() => setUnitHousekeepingStatus(u.id, 'cleaning')}
                      className={`flex-1 py-1 text-center rounded-lg text-xs font-bold border transition-all ${
                        currentStatus === 'cleaning'
                          ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                          : 'bg-surface hover:bg-amber-50 text-slate-500 border-divider'
                      }`}
                    >
                      🧼
                    </button>
                    <button
                      type="button"
                      title={t('housekeeping.markClean')}
                      onClick={() => setUnitHousekeepingStatus(u.id, 'clean')}
                      className={`flex-1 py-1 text-center rounded-lg text-xs font-bold border transition-all ${
                        currentStatus === 'clean'
                          ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm'
                          : 'bg-surface hover:bg-emerald-50 text-slate-500 border-divider'
                      }`}
                    >
                      ✨
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
