import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Calendar } from 'lucide-react';
import { formatDateInputValue, parseDateInputToISO } from '../../lib/dates';
import { useOptionalI18n } from '../../i18n/I18nProvider';

export interface DateInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  error?: boolean;
  /** Render without outer box border/background (e.g. inline header pickers). */
  unstyled?: boolean;
  /** Hide the calendar trigger icon when parent renders its own icon. */
  hideIcon?: boolean;
  iconClassName?: string;
}

/**
 * Locale-independent numeric DD/MM/YYYY date input backed by ISO 'YYYY-MM-DD' values.
 * Always renders day on the left, month in the middle, and year at the end regardless of OS/browser locale,
 * while preserving the native calendar picker popup and standard React onChange(e) semantics.
 */
export const DateInput = React.forwardRef<HTMLInputElement, DateInputProps>(
  (
    {
      className = '',
      error = false,
      disabled = false,
      value,
      defaultValue,
      onChange,
      onBlur,
      onFocus,
      min,
      max,
      placeholder = 'dd/mm/yyyy',
      id,
      name,
      title,
      unstyled = false,
      hideIcon = false,
      iconClassName = '',
      ...restProps
    },
    forwardedRef
  ) => {
    const i18n = useOptionalI18n();
    const textInputRef = useRef<HTMLInputElement>(null);
    const pickerInputRef = useRef<HTMLInputElement>(null);
    const isFocusedRef = useRef(false);

    useImperativeHandle(forwardedRef, () => textInputRef.current as HTMLInputElement);

    const isoValue =
      typeof value === 'string'
        ? value
        : typeof defaultValue === 'string'
        ? defaultValue
        : '';

    const [displayText, setDisplayText] = useState<string>(() => formatDateInputValue(isoValue));

    useEffect(() => {
      if (value === undefined) return;
      const nextIso = typeof value === 'string' ? value : '';
      if (isFocusedRef.current && parseDateInputToISO(displayText) === nextIso) {
        return;
      }
      setDisplayText(formatDateInputValue(nextIso));
      // Intentionally only react to external value changes
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const emitISO = (
      nextISO: string,
      sourceEvent?: React.SyntheticEvent<HTMLInputElement>
    ) => {
      if (!onChange) return;
      if (pickerInputRef.current) {
        pickerInputRef.current.value = nextISO;
      }
      const targetEl =
        pickerInputRef.current ??
        ({
          value: nextISO,
          name: name ?? '',
          id: id ?? '',
          type: 'date',
        } as HTMLInputElement);

      const syntheticEvent = sourceEvent
        ? (Object.assign(Object.create(Object.getPrototypeOf(sourceEvent)), sourceEvent, {
            target: targetEl,
            currentTarget: targetEl,
          }) as React.ChangeEvent<HTMLInputElement>)
        : ({
            target: targetEl,
            currentTarget: targetEl,
          } as React.ChangeEvent<HTMLInputElement>);

      onChange(syntheticEvent);
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let nextRaw = e.target.value;
      if (nextRaw.endsWith('//')) {
        nextRaw = nextRaw.slice(0, -1);
      }
      nextRaw = nextRaw.replace(/[^\d/.\-]/g, '');

      const isAppendingAtEnd =
        nextRaw.length > displayText.length &&
        (e.target.selectionStart ?? nextRaw.length) === nextRaw.length;

      if (isAppendingAtEnd) {
        if (/^\d{2}$/.test(nextRaw)) {
          nextRaw = `${nextRaw}/`;
        } else if (/^\d{2}\/\d{2}$/.test(nextRaw)) {
          nextRaw = `${nextRaw}/`;
        }
      }

      setDisplayText(nextRaw);

      if (nextRaw.trim() === '') {
        if (isoValue !== '') emitISO('', e);
        return;
      }

      const parsedISO = parseDateInputToISO(nextRaw);
      if (parsedISO) {
        if (/^(\d{4}-\d{2}-\d{2}|\d{8})$/.test(nextRaw.trim())) {
          setDisplayText(formatDateInputValue(parsedISO));
        }
        if (parsedISO !== isoValue) {
          emitISO(parsedISO, e);
        }
      }
    };

    const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = true;
      onFocus?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      isFocusedRef.current = false;
      const trimmed = displayText.trim();
      if (!trimmed) {
        if (isoValue !== '') {
          emitISO('', e);
        }
        setDisplayText('');
      } else {
        const parsedISO = parseDateInputToISO(trimmed);
        if (parsedISO) {
          setDisplayText(formatDateInputValue(parsedISO));
          if (parsedISO !== isoValue) {
            emitISO(parsedISO, e);
          }
        } else {
          // Restore display text to the canonical valid state value on invalid incomplete blur
          setDisplayText(formatDateInputValue(isoValue));
        }
      }
      onBlur?.(e);
    };

    const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const nextISO = e.target.value;
      setDisplayText(formatDateInputValue(nextISO));
      onChange?.(e);
    };

    const openCalendarPicker = () => {
      if (disabled) return;
      const picker = pickerInputRef.current;
      if (!picker) return;
      try {
        if (typeof picker.showPicker === 'function') {
          picker.showPicker();
          return;
        }
      } catch {
        // Fallback below if showPicker throws in older engines
      }
      picker.focus();
      picker.click();
    };

    const wrapperClasses = unstyled
      ? `relative flex items-center gap-1.5 ${className}`
      : [
          'relative flex items-center gap-1.5 transition',
          /\bw-auto\b/.test(className) ? 'min-w-[9rem]' : /\bw-/.test(className) ? '' : 'w-full',
          /\brounded-/.test(className) ? '' : 'rounded-lg',
          /\bborder\b|\bborder-0/.test(className) ? '' : 'border',
          /\bbg-/.test(className) ? '' : 'bg-white',
          /\b(px-|p-)/.test(className) ? '' : 'px-3',
          /\b(py-|p-)/.test(className) ? '' : 'py-2',
          /\btext-(xs|sm|base|lg)\b/.test(className) ? '' : 'text-sm',
          /\btext-(ink|white|navy|slate|muted)/.test(className) ? '' : 'text-ink',
          /\bshadow-/.test(className) ? '' : 'shadow-sm',
          'focus-within:outline-none focus-within:ring-1',
          error
            ? 'border-danger focus-within:border-danger focus-within:ring-danger'
            : /\bborder-(slate|gold)/.test(className)
            ? 'focus-within:border-navy focus-within:ring-navy'
            : 'border-line focus-within:border-navy focus-within:ring-navy',
          disabled ? 'bg-stone/50 text-muted' : '',
          className,
        ]
          .filter(Boolean)
          .join(' ');

    return (
      <div className={wrapperClasses}>
        <input
          ref={textInputRef}
          id={id}
          name={name}
          type="text"
          inputMode="numeric"
          dir="ltr"
          maxLength={14}
          disabled={disabled}
          value={displayText}
          placeholder={placeholder}
          title={title}
          onChange={handleTextChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className="date-input-ltr w-full min-w-0 flex-1 bg-transparent border-0 p-0 text-inherit font-inherit leading-5 placeholder:text-muted/60 focus:outline-none focus:ring-0 tabular-nums disabled:text-muted"
          {...restProps}
        />

        <div className="relative flex items-center justify-center shrink-0">
          {!hideIcon && (
            <button
              type="button"
              tabIndex={-1}
              disabled={disabled}
              aria-label={title || i18n?.t('common.openCalendar') || 'Open calendar'}
              title={title}
              onClick={openCalendarPicker}
              className={`flex items-center justify-center p-0.5 text-muted hover:text-navy focus:outline-none disabled:opacity-40 cursor-pointer ${iconClassName}`}
            >
              <Calendar className="w-4 h-4" />
            </button>
          )}
          <input
            ref={pickerInputRef}
            type="date"
            tabIndex={-1}
            aria-hidden="true"
            disabled={disabled}
            value={/^\d{4}-\d{2}-\d{2}$/.test(isoValue) ? isoValue : ''}
            min={typeof min === 'string' ? min : undefined}
            max={typeof max === 'string' ? max : undefined}
            onChange={handlePickerChange}
            className="pointer-events-none absolute inset-0 w-full h-full opacity-0"
          />
        </div>
      </div>
    );
  }
);

DateInput.displayName = 'DateInput';
