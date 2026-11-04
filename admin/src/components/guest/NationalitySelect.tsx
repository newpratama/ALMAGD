import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import {
  NATIONALITIES,
  FREQUENT_NATIONALITIES,
  findNationalityOption,
  type NationalityOption,
} from '../../lib/nationalities';

export interface NationalitySelectProps {
  value: string;
  onChange: (value: string, option?: NationalityOption) => void;
}

export const NationalitySelect: React.FC<NationalitySelectProps> = ({
  value,
  onChange,
}) => {
  const { lang } = useI18n();
  const isAr = lang === 'ar';

  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = useMemo(() => findNationalityOption(value), [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => searchInputRef.current?.focus(), 30);
    } else {
      setSearch('');
    }
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return NATIONALITIES;
    return NATIONALITIES.filter(
      (item) =>
        item.labelAr.toLowerCase().includes(q) ||
        item.labelId.toLowerCase().includes(q) ||
        item.labelEn.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.aliases.some((a) => a.includes(q))
    );
  }, [search]);

  const groupedOptions = useMemo(() => {
    return {
      frequent: filteredOptions.filter((o) => o.group === 'frequent'),
      arab: filteredOptions.filter((o) => o.group === 'arab'),
      international: filteredOptions.filter((o) => o.group === 'international'),
    };
  }, [filteredOptions]);

  const handleSelect = (option: NationalityOption) => {
    onChange(option.value, option);
    setIsOpen(false);
  };

  const renderOptionRow = (option: NationalityOption) => {
    const isSelected = selectedOption?.code === option.code;
    const primaryLabel = isAr ? option.labelAr : option.labelId;
    const secondaryLabel = option.labelEn;

    return (
      <button
        key={option.code}
        type="button"
        onClick={() => handleSelect(option)}
        className={`w-full px-3 py-2 text-start text-sm flex items-center justify-between gap-2 transition-colors ${
          isSelected
            ? 'bg-gold/15 text-navy font-bold'
            : 'hover:bg-mist text-ink'
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg leading-none shrink-0">{option.flag}</span>
          <span className="truncate">{primaryLabel}</span>
          {primaryLabel !== secondaryLabel && (
            <span className="text-[11px] text-muted truncate">
              ({secondaryLabel})
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {option.dialCode && (
            <span className="text-[10px] font-mono text-muted bg-stone/70 px-1.5 py-0.5 rounded">
              {option.dialCode}
            </span>
          )}
          {isSelected && <span className="text-gold-text text-xs">✓</span>}
        </div>
      </button>
    );
  };

  return (
    <div ref={containerRef} className="space-y-2">
      {/* Main Selector Trigger */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="w-full rounded-lg border border-line bg-white px-3 py-2 text-sm text-ink transition-colors focus:outline-none focus:ring-2 focus:ring-gold focus:border-gold flex items-center justify-between gap-2"
        >
          {selectedOption ? (
            <span className="flex items-center gap-2 truncate font-medium text-navy">
              <span className="text-base leading-none">{selectedOption.flag}</span>
              <span>{isAr ? selectedOption.labelAr : selectedOption.labelId}</span>
              <span className="text-xs text-muted font-normal">
                ({selectedOption.labelEn})
              </span>
            </span>
          ) : value ? (
            <span className="flex items-center gap-2 truncate font-medium text-navy">
              <span>🌍</span>
              <span>{value}</span>
            </span>
          ) : (
            <span className="text-muted/70">
              {isAr ? 'اختر الجنسية من القائمة...' : 'Pilih kewarganegaraan...'}
            </span>
          )}

          <div className="flex items-center gap-1.5 shrink-0">
            {value && (
              <span
                role="button"
                tabIndex={0}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.stopPropagation();
                    onChange('');
                  }
                }}
                className="text-muted hover:text-danger px-1 rounded text-xs"
                title={isAr ? 'مسح' : 'Hapus'}
              >
                ✕
              </span>
            )}
            <span className="text-muted text-xs">▾</span>
          </div>
        </button>

        {/* Searchable Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-30 mt-1 w-full rounded-xl border border-line bg-white shadow-xl overflow-hidden">
            {/* Search Input */}
            <div className="p-2 border-b border-line bg-mist/50">
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isAr
                    ? 'ابحث عن الدولة (مثال: السعودية، اليمن، إندونيسيا...)'
                    : 'Cari negara (cth: Arab Saudi, Indonesia, Yaman...)'
                }
                className="w-full rounded-lg border border-line bg-white px-3 py-1.5 text-xs text-ink placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-gold"
              />
            </div>

            {/* Options List */}
            <div className="max-h-60 overflow-y-auto divide-y divide-line/40">
              {filteredOptions.length === 0 ? (
                <div className="p-3 text-center space-y-2">
                  <p className="text-xs text-muted">
                    {isAr ? 'لا توجد دولة مطابقة في القائمة' : 'Negara tidak ditemukan'}
                  </p>
                  {search.trim() && (
                    <button
                      type="button"
                      onClick={() => {
                        onChange(search.trim());
                        setIsOpen(false);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy text-white text-xs font-semibold hover:bg-navy/90"
                    >
                      <span>🌍</span>
                      <span>
                        {isAr
                          ? `استخدام "${search.trim()}" كجنسية`
                          : `Gunakan "${search.trim()}"`}
                      </span>
                    </button>
                  )}
                </div>
              ) : (
                <>
                  {groupedOptions.frequent.length > 0 && (
                    <div>
                      <div className="px-3 py-1 bg-stone/60 text-[10px] font-bold uppercase tracking-wider text-muted">
                        {isAr ? '⭐ الأكثر استخداماً' : '⭐ Paling Sering'}
                      </div>
                      {groupedOptions.frequent.map(renderOptionRow)}
                    </div>
                  )}

                  {groupedOptions.arab.length > 0 && (
                    <div>
                      <div className="px-3 py-1 bg-stone/60 text-[10px] font-bold uppercase tracking-wider text-muted">
                        {isAr ? '🌍 الدول العربية' : '🌍 Negara Arab'}
                      </div>
                      {groupedOptions.arab.map(renderOptionRow)}
                    </div>
                  )}

                  {groupedOptions.international.length > 0 && (
                    <div>
                      <div className="px-3 py-1 bg-stone/60 text-[10px] font-bold uppercase tracking-wider text-muted">
                        {isAr ? '🌐 دول آسيا والعالم' : '🌐 Asia & Internasional'}
                      </div>
                      {groupedOptions.international.map(renderOptionRow)}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quick 1-Click Chips for Top Nationalities */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {FREQUENT_NATIONALITIES.slice(0, 6).map((item) => {
          const isSelected = selectedOption?.code === item.code;
          return (
            <button
              key={item.code}
              type="button"
              onClick={() => handleSelect(item)}
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium transition-all border ${
                isSelected
                  ? 'bg-navy text-white border-navy shadow-2xs'
                  : 'bg-stone/50 text-ink border-line hover:bg-gold/15 hover:border-gold/50'
              }`}
            >
              <span>{item.flag}</span>
              <span>{isAr ? item.labelAr : item.labelId}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
