import React, { useState, useEffect, useRef } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { formatNumberWithCommas, formatAmountWords } from '../../lib/money';

export interface MoneyInputProps {
  value: number;
  onChange: (value: number) => void;
  currencyPrefix?: string;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  className?: string;
  id?: string;
  name?: string;
  showWordsHelper?: boolean;
  quickPresets?: number[];
  fullAmountButton?: {
    amount: number;
    label?: string;
  };
  autoSelectOnFocus?: boolean;
  onBlur?: () => void;
}

export const MoneyInput: React.FC<MoneyInputProps> = ({
  value,
  onChange,
  currencyPrefix = 'Rp',
  placeholder = '0',
  error = false,
  disabled = false,
  className = '',
  id,
  name,
  showWordsHelper = true,
  quickPresets,
  fullAmountButton,
  autoSelectOnFocus = true,
  onBlur,
}) => {
  const { lang, t } = useI18n();
  const inputRef = useRef<HTMLInputElement>(null);

  // Formatted display text
  const [displayValue, setDisplayValue] = useState<string>(() =>
    value > 0 ? formatNumberWithCommas(value) : value === 0 ? '0' : ''
  );

  // Sync external value changes
  useEffect(() => {
    const formatted = value > 0 ? formatNumberWithCommas(value) : value === 0 ? '0' : '';
    setDisplayValue(formatted);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const raw = input.value;
    const digits = raw.replace(/\D/g, '');

    const cursorFromEnd = raw.length - (input.selectionEnd ?? raw.length);

    if (digits === '') {
      setDisplayValue('');
      onChange(0);
      return;
    }

    const num = parseInt(digits, 10);
    const formatted = formatNumberWithCommas(num);
    setDisplayValue(formatted);
    onChange(num);

    requestAnimationFrame(() => {
      if (inputRef.current) {
        const newPos = Math.max(0, formatted.length - cursorFromEnd);
        inputRef.current.setSelectionRange(newPos, newPos);
      }
    });
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    if (autoSelectOnFocus && value === 0) {
      e.target.select();
    }
  };

  const handlePresetClick = (amount: number) => {
    const formatted = formatNumberWithCommas(amount);
    setDisplayValue(formatted);
    onChange(amount);
  };

  return (
    <div className={`space-y-1.5 text-start ${className}`}>
      {/* Input container with currency prefix */}
      <div
        className={`flex items-center rounded-lg border bg-white shadow-sm transition overflow-hidden ${
          error
            ? 'border-danger focus-within:border-danger focus-within:ring-1 focus-within:ring-danger'
            : 'border-line focus-within:border-navy focus-within:ring-1 focus-within:ring-navy'
        } ${disabled ? 'bg-stone/50' : ''}`}
      >
        {currencyPrefix && (
          <span className="select-none bg-stone/40 text-muted font-bold px-3 py-2 text-xs border-e border-line flex items-center justify-center">
            {currencyPrefix}
          </span>
        )}
        <input
          ref={inputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          dir="ltr"
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={onBlur}
          className="w-full bg-transparent px-3 py-2 text-sm font-semibold text-ink text-start placeholder:text-muted/60 focus:outline-none disabled:text-muted tabular-nums"
        />
      </div>

      {/* Words Helper & Quick Action Pills */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pt-0.5">
        {showWordsHelper && value > 0 && (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-stone/40 text-[11px] font-medium text-navy/80">
            <span>📖</span>
            <span>{formatAmountWords(value, lang)}</span>
          </div>
        )}

        {/* Quick action buttons if available */}
        <div className="flex items-center gap-1.5 ms-auto">
          {fullAmountButton && fullAmountButton.amount > 0 && value !== fullAmountButton.amount && (
            <button
              type="button"
              onClick={() => handlePresetClick(fullAmountButton.amount)}
              className="text-[11px] px-2 py-0.5 rounded border border-navy/30 bg-navy/5 text-navy font-semibold hover:bg-navy/10 transition-colors"
            >
              {fullAmountButton.label || t('booking.fullAmount')} ({formatNumberWithCommas(fullAmountButton.amount)})
            </button>
          )}

          {quickPresets &&
            quickPresets.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                className="text-[10px] px-1.5 py-0.5 rounded border border-line bg-stone/30 text-muted hover:text-ink hover:bg-stone/60 transition-colors"
              >
                +{formatNumberWithCommas(preset)}
              </button>
            ))}
        </div>
      </div>
    </div>
  );
};
