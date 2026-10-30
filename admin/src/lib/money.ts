export function formatIDR(n: number): string {
  const formatted = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
  // Replace non-breaking space with regular space for clean output
  return formatted.replace(/\u00a0/g, ' ');
}

/**
 * Formats a number with comma thousand separators (e.g. 360000000 -> "360,000,000")
 */
export function formatNumberWithCommas(n: number): string {
  if (isNaN(n) || !isFinite(n)) return '0';
  return new Intl.NumberFormat('en-US').format(Math.round(n));
}

/**
 * Formats IDR with commas between thousands: e.g. "Rp 360,000,000"
 */
export function formatIDRWithCommas(n: number): string {
  if (isNaN(n) || !isFinite(n)) return 'Rp 0';
  const prefix = n < 0 ? '-Rp ' : 'Rp ';
  return `${prefix}${formatNumberWithCommas(Math.abs(n))}`;
}

/**
 * Returns human-readable magnitude description in Arabic or Indonesian
 * e.g., 360000000 in ar -> "360 مليون روبية", in id -> "360 Juta Rupiah"
 */
export function formatAmountWords(n: number, locale: 'ar' | 'id' = 'ar'): string {
  const abs = Math.abs(Math.round(n));
  if (abs === 0) return locale === 'ar' ? '0 روبية' : '0 Rupiah';

  if (locale === 'ar') {
    if (abs >= 1_000_000_000) {
      const billions = (abs / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return `${billions} مليار روبية`;
    }
    if (abs >= 1_000_000) {
      const millions = (abs / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return `${millions} مليون روبية`;
    }
    if (abs >= 1_000) {
      const thousands = (abs / 1_000).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return `${thousands} ألف روبية`;
    }
    return `${abs} روبية`;
  } else {
    // Indonesian
    if (abs >= 1_000_000_000) {
      const billions = (abs / 1_000_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return `${billions} Miliar Rupiah`;
    }
    if (abs >= 1_000_000) {
      const millions = (abs / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return `${millions} Juta Rupiah`;
    }
    if (abs >= 1_000) {
      const thousands = (abs / 1_000).toLocaleString('en-US', { maximumFractionDigits: 2 });
      return `${thousands} Ribu Rupiah`;
    }
    return `${abs} Rupiah`;
  }
}

export function parseIDR(s: string): number {
  if (!s) return 0;
  const isNegative = s.trim().startsWith('-');
  const digits = s.replace(/\D/g, '');
  if (!digits) return 0;
  const val = parseInt(digits, 10);
  return isNegative ? -val : val;
}

