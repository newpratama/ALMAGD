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

/**
 * Calculates OTA net payout using the standard 17.871% safe deduction tier
 * (15% commission + 2.35% payment processing fee + 11% VAT on fees).
 * Returns the exact net payout reaching the bank account.
 */
export function calcOtaNetPayout(commissionableAmount: number): {
  gross: number;
  commission: number;
  paymentFee: number;
  vat: number;
  totalDeductions: number;
  deductionRatePct: number;
  netPayout: number;
} {
  const x = Math.max(0, Math.round(commissionableAmount));
  const gross = Math.round((x * 12) / 11);
  const commission = Math.round(x * 0.15);
  const paymentFee = Math.round(gross * 0.0235);
  const vat = Math.round(commission * 0.11) + Math.round(paymentFee * 0.11);
  const totalDeductions = commission + paymentFee + vat;
  const netPayout = gross - totalDeductions;
  const deductionRatePct = gross > 0 ? Number(((totalDeductions / gross) * 100).toFixed(3)) : 17.871;

  return {
    gross,
    commission,
    paymentFee,
    vat,
    totalDeductions,
    deductionRatePct,
    netPayout,
  };
}

/**
 * Finds the commissionable voucher amount that yields the given net bank payout
 * under `calcOtaNetPayout`. Used when switching modes in edit view so an already-net
 * amount is never double-deducted.
 */
export function invertOtaNetPayout(netAmount: number): number {
  const target = Math.max(0, Math.round(netAmount));
  if (target === 0) return 0;

  let low = 0;
  let high = Math.ceil(target * 1.3) + 100;
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (calcOtaNetPayout(mid).netPayout < target) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  let best = low;
  let bestDiff = Math.abs(calcOtaNetPayout(best).netPayout - target);
  for (let cand = Math.max(0, low - 3); cand <= low + 3; cand++) {
    const diff = Math.abs(calcOtaNetPayout(cand).netPayout - target);
    if (diff < bestDiff) {
      best = cand;
      bestDiff = diff;
    }
  }
  return best;
}

/**
 * Extracts the most recent valid OTA nominal voucher amount from booking notes
 * (e.g. `[سند Agoda: المبلغ الاسمي Rp 1,452,500 | الصافي للبنك Rp 1,301,371]`),
 * ensuring it matches `expectedNetAmount` and `calcOtaNetPayout`.
 */
export function extractOtaVoucherFromNotes(
  notes: string | null | undefined,
  expectedNetAmount?: number
): number | null {
  if (!notes) return null;
  const lines = notes.split(/\r?\n/);
  const pattern =
    /المبلغ الاسمي(?:\s+بالسند)?\s+Rp\s+([\d.,]+)\s*\|\s*الصافي للبنك\s+Rp\s+([\d.,]+)/;

  for (let i = lines.length - 1; i >= 0; i--) {
    const match = lines[i].match(pattern);
    if (!match) continue;

    const voucher = parseIDR(match[1]);
    const recordedNet = parseIDR(match[2]);
    if (voucher <= 0 || recordedNet <= 0) continue;

    if (
      expectedNetAmount !== undefined &&
      Math.abs(recordedNet - Math.round(expectedNetAmount)) > 1
    ) {
      continue;
    }

    if (Math.abs(calcOtaNetPayout(voucher).netPayout - recordedNet) > 1) {
      continue;
    }

    return voucher;
  }

  return null;
}

