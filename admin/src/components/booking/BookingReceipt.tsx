import React from 'react';
import type { BookingOverview } from '../../api/bookings';
import type { Payment } from '../../api/payments';
import type { Guest } from '../../api/guests';
import { useI18n } from '../../i18n/I18nProvider';
import { formatDateHuman } from '../../lib/dates';
import { formatIDR } from '../../lib/money';

export interface BookingReceiptProps {
  booking: BookingOverview;
  payments: Payment[];
  guest?: Guest | null;
  sourceLabel?: string | null;
  sourceColor?: string | null;
}

function formatLocalizedNote(note: string | null | undefined, lang: string): string {
  if (!note) return '—';
  if (lang === 'ar') {
    let res = note.replace(
      /\[?Check-out awal pada (\d{4}-\d{2}-\d{2}) setelah menginap (\d+) malam dari (\d+) malam - Total akhir: (Rp [0-9.]+)\]?/g,
      '[مغادرة مبكرة في $1 بعد قضاء $2 ليلة من أصل $3 - المبلغ النهائي: $4]'
    );
    res = res.replace(/Pengembalian dana karena check-out lebih awal/g, 'استرداد مالي بسبب المغادرة المبكرة');
    res = res.replace(/Pengembalian dana tamu \(Refund\)/g, 'استرداد مالي للنزيل');
    return res;
  }
  return note;
}

export const BookingReceipt: React.FC<BookingReceiptProps> = ({
  booking,
  payments,
  guest,
  sourceLabel,
}) => {
  const { t, lang } = useI18n();

  const totalAmount = Number(booking.total_amount || 0);
  const paidAmount = Number(booking.paid || 0);
  const balance = Number(booking.balance || 0);
  const isPaidInFull = balance <= 0 && paidAmount > 0;
  const isRefundDue = balance < 0 || (booking.status === 'cancelled' && paidAmount > 0);

  const issueDate = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const localizedSource =
    (booking.source_code && t(`source.${booking.source_code}`)) ||
    sourceLabel ||
    booking.source_code;

  return (
    <div className="relative w-full max-w-4xl mx-auto bg-white p-6 sm:p-8 text-ink text-start font-sans border border-line rounded-xl shadow-xs print:border-none print:shadow-none print:p-0 print:m-0 overflow-hidden">
      {/* Subtle Luxury Background Watermark (Pratama Emblem) */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03] print:opacity-[0.04]"
        aria-hidden="true"
      >
        <img
          src={`${import.meta.env.BASE_URL}a_clean_isolated_logo_graphic_on_a_transparent_bac.png`}
          alt=""
          className="w-96 h-96 object-contain"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}logo-new-pratama.png`;
          }}
        />
      </div>

      {/* 1. Header with Dual Logos & Brand Identity */}
      <div className="relative flex items-start justify-between border-b-2 border-navy/90 pb-5 mb-6 gap-4">
        <div className="flex items-center gap-3.5">
          {/* 1. Primary Company Logo (ALMAGD) */}
          <img
            src={`${import.meta.env.BASE_URL}logo-almagd.png`}
            alt="ALMAGD"
            className="h-16 w-auto object-contain drop-shadow-xs"
          />

          {/* Elegant Divider */}
          <div className="h-12 w-px bg-gradient-to-b from-transparent via-gold/60 to-transparent" aria-hidden="true" />

          {/* 2. New Pratama Emblem Logo (Without Name/Text, as requested) */}
          <div
            className="h-14 w-14 rounded-full bg-white p-1 ring-2 ring-gold/70 shadow-sm flex items-center justify-center flex-shrink-0"
            title="New Pratama"
          >
            <img
              src={`${import.meta.env.BASE_URL}a_clean_isolated_logo_graphic_on_a_transparent_bac.png`}
              alt="New Pratama"
              className="w-full h-full object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}logo-new-pratama.png`;
              }}
            />
          </div>

          {/* Hotel Name & Location */}
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight leading-tight">
              ALMAGD <span className="text-gold font-bold">| New Pratama</span>
            </h1>
            <p className="text-xs text-muted font-medium mt-0.5">
              {t('booking.receiptSub')}
            </p>
            <p className="text-[11px] text-slate-500">
              Cisarua, Puncak, Bogor, Jawa Barat — Indonesia
            </p>
          </div>
        </div>

        {/* Voucher Title & Number */}
        <div className="text-end flex flex-col items-end">
          <div className="inline-flex items-center gap-1.5 bg-navy text-white text-[10.5px] font-bold uppercase tracking-wider px-3 py-1 rounded-md shadow-xs">
            <span>🏛️</span>
            <span>{t('booking.receiptTitle')}</span>
          </div>
          <div className="mt-1.5 font-mono text-2xl font-black text-navy tracking-wider">
            {booking.code}
          </div>
          {booking.ota_reference && (
            <div className="mt-1 text-xs font-mono font-bold text-navy bg-gold/15 border border-gold/40 px-2.5 py-0.5 rounded-md inline-block">
              {localizedSource || 'سند التطبيق'}: {booking.ota_reference}
            </div>
          )}
          <div className="text-[11px] text-muted mt-1">
            {t('booking.receiptIssueDate')}: <span className="font-semibold text-ink">{issueDate}</span>
          </div>
        </div>
      </div>

      {/* 2. Guest & Reservation Information (2-Column Grid) */}
      <div className="relative grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Guest Details */}
        <div className="p-4 rounded-xl bg-stone/25 border border-line text-xs space-y-2.5">
          <h2 className="font-bold text-navy uppercase text-[11px] tracking-wider border-b border-line pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>👤</span>
              <span>{t('booking.guest')}</span>
            </span>
            {guest?.tags?.includes('vip') && (
              <span className="bg-gold/20 text-gold-text font-bold px-2 py-0.5 rounded text-[10px]">VIP</span>
            )}
          </h2>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('guest.fullName')}:</span>
            <span className="col-span-2 font-bold text-ink">
              {booking.guest_name || t('booking.unassignedGuest')}
            </span>
          </div>
          {(booking.guest_phone || guest?.phone) && (
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted">{t('guest.phone')}:</span>
              <span className="col-span-2 font-mono text-ink">
                {booking.guest_phone || guest?.phone}
              </span>
            </div>
          )}
          {guest?.id_number && (
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted">{t('guest.idNumber')}:</span>
              <span className="col-span-2 font-mono text-ink">{guest.id_number}</span>
            </div>
          )}
          {guest?.nationality && (
            <div className="grid grid-cols-3 gap-1">
              <span className="text-muted">{t('guest.nationality')}:</span>
              <span className="col-span-2 text-ink">{guest.nationality}</span>
            </div>
          )}
        </div>

        {/* Reservation Details */}
        <div className="p-4 rounded-xl bg-stone/25 border border-line text-xs space-y-2.5">
          <h2 className="font-bold text-navy uppercase text-[11px] tracking-wider border-b border-line pb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>🏛️</span>
              <span>{t('booking.unit')} &amp; {t('nav.calendar')}</span>
            </span>
            <span className="font-mono text-xs font-bold text-navy bg-navy/10 px-2 py-0.5 rounded">
              {booking.unit_name}
            </span>
          </h2>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.checkIn')}:</span>
            <span className="col-span-2 font-semibold text-ink">
              {booking.check_in ? formatDateHuman(booking.check_in, lang) : '—'}
              <span className="text-[10px] text-muted ms-1 font-normal">({t('booking.receiptCheckInTime')})</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.checkOut')}:</span>
            <span className="col-span-2 font-semibold text-ink">
              {booking.check_out ? formatDateHuman(booking.check_out, lang) : '—'}
              <span className="text-[10px] text-muted ms-1 font-normal">({t('booking.receiptCheckOutTime')})</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.nights')}:</span>
            <span className="col-span-2 font-bold text-navy">
              {t('booking.nightsCount', { count: booking.nights || 0 })}
              <span className="text-muted font-normal ms-2 text-[11px]">
                ({lang === 'ar'
                  ? `${booking.adults} بالغ ، ${booking.children} أطفال`
                  : `${booking.adults} ${t('booking.adults')}${booking.children ? `, ${booking.children} ${t('booking.children')}` : ''}`})
              </span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.source')}:</span>
            <span className="col-span-2 font-semibold text-ink">
              {localizedSource}
              {booking.ota_reference && (
                <span className="font-mono text-[11px] text-muted ms-1">
                  (Ref: {booking.ota_reference})
                </span>
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Itemized Financial Table */}
      <div className="relative mb-6 border border-line rounded-xl overflow-hidden shadow-xs">
        <table className="w-full text-xs text-start border-collapse">
          <thead>
            <tr className="bg-navy text-white">
              <th className="py-2.5 px-3 text-start font-semibold">#</th>
              <th className="py-2.5 px-3 text-start font-semibold">{t('common.details')}</th>
              <th className="py-2.5 px-3 text-start font-semibold">{t('booking.method')}</th>
              <th className="py-2.5 px-3 text-start font-semibold">{t('booking.paymentDate')}</th>
              <th className="py-2.5 px-3 text-start font-semibold">{t('booking.reference')}</th>
              <th className="py-2.5 px-3 text-end font-semibold">{t('booking.amount')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {/* Base Booking Package */}
            <tr className="bg-white">
              <td className="py-2.5 px-3 font-mono text-muted">1</td>
              <td className="py-2.5 px-3 font-semibold text-ink">
                {booking.unit_name} — {t('booking.nightsCount', { count: booking.nights || 0 })}
              </td>
              <td className="py-2.5 px-3 text-muted">{localizedSource}</td>
              <td className="py-2.5 px-3 text-muted">{booking.check_in}</td>
              <td className="py-2.5 px-3 font-mono text-muted">{booking.code}</td>
              <td className="py-2.5 px-3 text-end font-bold text-ink font-mono">
                {formatIDR(totalAmount)}
              </td>
            </tr>

            {/* Recorded Payments */}
            {payments.map((p, idx) => {
              const numAmount = Number(p.amount);
              const isRefund = numAmount < 0;

              const displayRef =
                p.reference?.trim() ||
                (p.method === 'app'
                  ? booking.ota_reference || `APP-${booking.code}`
                  : p.method === 'transfer'
                  ? `TRF-${booking.code}`
                  : p.method === 'cash'
                  ? `CSH-${booking.code}-${String(idx + 1).padStart(2, '0')}`
                  : `REF-${booking.code}-${idx + 1}`);

              const methodSubtitle =
                p.method === 'app'
                  ? (localizedSource ? `سند المنصة (${localizedSource})` : 'سند التطبيق')
                  : p.method === 'transfer'
                  ? 'إشعار تحويل بنكي'
                  : p.method === 'cash'
                  ? 'سند قبض نقدي'
                  : '';

              return (
                <tr key={p.id} className="bg-mist/30">
                  <td className="py-2.5 px-3 font-mono text-muted">{idx + 2}</td>
                  <td className="py-2.5 px-3 text-ink font-medium">
                    {isRefund ? (
                      <span className="text-danger font-bold">⚠️ {t('booking.refundToggle')}</span>
                    ) : (
                      <span className="text-navy font-bold">✓ {t('booking.addPayment')}</span>
                    )}
                    {p.notes && (
                      <span className="text-[10.5px] text-muted ms-1 block">
                        {formatLocalizedNote(p.notes, lang)}
                      </span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 font-medium capitalize text-ink">
                    {t(`paymentMethod.${p.method}`)}
                  </td>
                  <td className="py-2.5 px-3 text-muted font-mono">{p.paid_on}</td>
                  <td className="py-2.5 px-3 font-mono">
                    <span className="font-bold text-navy text-xs block">{displayRef}</span>
                    {methodSubtitle && (
                      <span className="text-[10px] text-muted font-sans block">{methodSubtitle}</span>
                    )}
                  </td>
                  <td className={`py-2.5 px-3 text-end font-mono font-bold ${isRefund ? 'text-danger' : 'text-emerald-700'}`}>
                    {isRefund
                      ? `- ${formatIDR(Math.abs(numAmount))} (${t('booking.refund')})`
                      : `+ ${formatIDR(numAmount)}`}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Financial Summary Footer */}
        <div className="bg-stone/30 border-t-2 border-line p-4 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy">{t('common.status')}:</span>
            {isPaidInFull ? (
              <span className="bg-emerald-600 text-white px-3 py-1 rounded-md font-bold uppercase tracking-wider text-[11px] shadow-xs">
                ✓ {t('booking.receiptPaidInFull')}
              </span>
            ) : balance > 0 ? (
              <span className="bg-amber-600 text-white px-3 py-1 rounded-md font-bold uppercase tracking-wider text-[11px] shadow-xs">
                ⚠️ {t('booking.receiptBalanceDue')}
              </span>
            ) : isRefundDue ? (
              <span className="bg-gold-dark text-white px-3 py-1 rounded-md font-bold uppercase tracking-wider text-[11px] shadow-xs">
                ↩ {t('booking.refundDue')}
              </span>
            ) : (
              <span className="bg-navy text-white px-3 py-1 rounded-md font-bold uppercase tracking-wider text-[11px] shadow-xs">
                {t(`status.${booking.status}`)}
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-end min-w-[220px]">
            <div className="flex justify-between gap-4 text-muted">
              <span>{t('booking.totalAmount')}:</span>
              <span className="font-bold text-ink font-mono">{formatIDR(totalAmount)}</span>
            </div>
            <div className="flex justify-between gap-4 text-emerald-700 font-medium">
              <span>{t('booking.paidAmount')}:</span>
              <span className="font-bold font-mono">{formatIDR(paidAmount)}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm font-black pt-1.5 border-t border-line text-navy">
              <span>{t('booking.balanceAmount')}:</span>
              <span className={`font-mono ${balance > 0 ? 'text-danger' : 'text-emerald-700'}`}>
                {formatIDR(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Terms and House Rules */}
      <div className="relative p-3.5 rounded-xl border border-line bg-stone/20 text-[11px] text-muted space-y-1 mb-8">
        <h3 className="font-bold text-navy uppercase text-[10px] tracking-wider flex items-center gap-1.5">
          <span>📋</span>
          <span>{t('booking.receiptTerms')}:</span>
        </h3>
        <p>1. {t('booking.receiptTerm1')}</p>
        <p>2. {t('booking.receiptTerm2')}</p>
        <p>3. {t('booking.receiptTerm3')}</p>
      </div>

      {/* 5. Signatures & Official Stamp Section */}
      <div className="relative grid grid-cols-2 gap-8 text-center text-xs pt-4 mb-6">
        <div>
          <p className="font-semibold text-muted mb-16">{t('booking.receiptGuestSign')}</p>
          <div className="border-t border-ink/40 w-48 mx-auto pt-1 font-bold text-ink">
            {booking.guest_name || '...........................................'}
          </div>
        </div>

        {/* Staff & Official Hotel Stamp */}
        <div className="relative">
          <p className="font-semibold text-muted mb-4">{t('booking.receiptStaffSign')}</p>

          {/* Official Stamp graphic positioned over signature */}
          <div className="relative inline-flex flex-col items-center justify-center my-1">
            <div className="w-24 h-24 rounded-full border-2 border-dashed border-navy/60 p-1 flex items-center justify-center rotate-[-6deg] bg-navy/[0.02]">
              <div className="w-full h-full rounded-full border border-gold/70 flex flex-col items-center justify-center text-center p-1">
                <img
                  src={`${import.meta.env.BASE_URL}a_clean_isolated_logo_graphic_on_a_transparent_bac.png`}
                  alt=""
                  className="w-7 h-7 object-contain opacity-80"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = `${import.meta.env.BASE_URL}logo-new-pratama.png`;
                  }}
                />
                <span className="text-[7px] font-black text-navy uppercase tracking-tighter mt-0.5">
                  ALMAGD PMS
                </span>
                <span className="text-[6.5px] font-bold text-gold uppercase tracking-tighter">
                  OFFICIAL SEAL
                </span>
              </div>
            </div>
          </div>

          <div className="border-t border-ink/40 w-48 mx-auto pt-1 font-bold text-navy">
            ALMAGD — New Pratama
          </div>
        </div>
      </div>

      {/* 6. Official Footer */}
      <div className="relative pt-4 border-t border-line text-center text-[10px] text-muted">
        <p className="font-semibold text-navy">{t('booking.receiptFooter')}</p>
        <p className="mt-0.5">
          Sistem Resmi Manajemen ALMAGD New Pratama v1.0 • Dicetak secara digital • Dokumen Sah &amp; معتمد
        </p>
      </div>
    </div>
  );
};
