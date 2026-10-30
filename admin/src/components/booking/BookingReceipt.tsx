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

  const issueDate = new Date().toLocaleDateString(lang === 'ar' ? 'ar-SA' : 'id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="w-full max-w-4xl mx-auto bg-white p-6 sm:p-8 text-ink text-start font-sans border border-line rounded-xl shadow-xs print:border-none print:shadow-none print:p-0 print:m-0">
      {/* 1. Header with Logo & Brand */}
      <div className="flex items-start justify-between border-b-2 border-navy pb-5 mb-6 gap-4">
        <div className="flex items-center gap-3">
          <img
            src={`${import.meta.env.BASE_URL}logo-almagd.png`}
            alt="ALMAGD"
            className="h-16 w-auto object-contain"
          />
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-navy tracking-tight">
              ALMAGD <span className="text-gold font-normal">| New Pratama</span>
            </h1>
            <p className="text-xs text-muted font-medium mt-0.5">
              {t('booking.receiptSub')}
            </p>
            <p className="text-[11px] text-muted">
              Cisarua, Puncak, Bogor, Jawa Barat — Indonesia
            </p>
          </div>
        </div>

        {/* Voucher Title & Number */}
        <div className="text-end">
          <span className="inline-block bg-navy text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded">
            {t('booking.receiptTitle')}
          </span>
          <div className="mt-1 font-mono text-xl sm:text-2xl font-bold text-navy">
            {booking.code}
          </div>
          <div className="text-[11px] text-muted mt-0.5">
            {t('booking.receiptIssueDate')}: <span className="font-semibold text-ink">{issueDate}</span>
          </div>
        </div>
      </div>

      {/* 2. Guest & Reservation Information (2-Column Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {/* Guest Details */}
        <div className="p-4 rounded-lg bg-stone/30 border border-line text-xs space-y-2">
          <h2 className="font-bold text-navy uppercase text-[11px] tracking-wider border-b border-line pb-1.5 flex items-center justify-between">
            <span>👤 {t('booking.guest')}</span>
            {guest?.tags?.includes('vip') && (
              <span className="bg-gold/20 text-gold-text px-1.5 py-0.5 rounded text-[10px]">VIP</span>
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
        <div className="p-4 rounded-lg bg-stone/30 border border-line text-xs space-y-2">
          <h2 className="font-bold text-navy uppercase text-[11px] tracking-wider border-b border-line pb-1.5 flex items-center justify-between">
            <span>🏛️ {t('booking.unit')} &amp; {t('nav.calendar')}</span>
            <span className="font-mono text-xs font-bold text-navy">{booking.unit_name}</span>
          </h2>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.checkIn')}:</span>
            <span className="col-span-2 font-semibold text-ink">
              {booking.check_in ? formatDateHuman(booking.check_in, lang) : '—'}
              <span className="text-[10px] text-muted ms-1">({t('booking.receiptCheckInTime')})</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.checkOut')}:</span>
            <span className="col-span-2 font-semibold text-ink">
              {booking.check_out ? formatDateHuman(booking.check_out, lang) : '—'}
              <span className="text-[10px] text-muted ms-1">({t('booking.receiptCheckOutTime')})</span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.nights')}:</span>
            <span className="col-span-2 font-bold text-navy">
              {t('booking.nightsCount', { count: booking.nights || 0 })}
              <span className="text-muted font-normal ms-2">
                ({booking.adults} {t('booking.adults')}{booking.children ? `, ${booking.children} ${t('booking.children')}` : ''})
              </span>
            </span>
          </div>
          <div className="grid grid-cols-3 gap-1">
            <span className="text-muted">{t('booking.source')}:</span>
            <span className="col-span-2 font-semibold text-ink">
              {sourceLabel || booking.source_code}
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
      <div className="mb-6 border border-line rounded-lg overflow-hidden">
        <table className="w-full text-xs text-start border-collapse">
          <thead>
            <tr className="bg-navy text-white">
              <th className="py-2.5 px-3 text-start font-semibold">#</th>
              <th className="py-2.5 px-3 text-start font-semibold">{t('common.details')}</th>
              <th className="py-2.5 px-3 text-start font-semibold">{t('booking.method')}</th>
              <th className="py-2.5 px-3 text-start font-semibold">{t('booking.dueDate')}</th>
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
              <td className="py-2.5 px-3 text-muted">{sourceLabel || booking.source_code}</td>
              <td className="py-2.5 px-3 text-muted">{booking.check_in}</td>
              <td className="py-2.5 px-3 font-mono text-muted">{booking.code}</td>
              <td className="py-2.5 px-3 text-end font-bold text-ink">
                {formatIDR(totalAmount)}
              </td>
            </tr>

            {/* Recorded Payments */}
            {payments.map((p, idx) => (
              <tr key={p.id} className="bg-mist/30">
                <td className="py-2 px-3 font-mono text-muted">{idx + 2}</td>
                <td className="py-2 px-3 text-ink font-medium">
                  {Number(p.amount) < 0 ? '⚠️ ' + t('booking.refundToggle') : '✓ ' + t('booking.addPayment')}
                  {p.notes && <span className="text-[10px] text-muted ms-1">({p.notes})</span>}
                </td>
                <td className="py-2 px-3 font-medium capitalize text-ink">
                  {t(`paymentMethod.${p.method}`)}
                </td>
                <td className="py-2 px-3 text-muted">{p.paid_on}</td>
                <td className="py-2 px-3 font-mono text-muted">{p.reference || '—'}</td>
                <td className={`py-2 px-3 text-end font-bold ${Number(p.amount) < 0 ? 'text-danger' : 'text-success'}`}>
                  {Number(p.amount) < 0 ? `- ${formatIDR(Math.abs(Number(p.amount)))}` : `+ ${formatIDR(Number(p.amount))}`}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Financial Summary Footer */}
        <div className="bg-stone/30 border-t-2 border-line p-3 flex flex-col sm:flex-row items-end sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-navy">{t('common.status')}:</span>
            {isPaidInFull ? (
              <span className="bg-success text-white px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px]">
                ✓ {t('booking.receiptPaidInFull')}
              </span>
            ) : balance > 0 ? (
              <span className="bg-warning text-warning-text px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px]">
                ⚠️ {t('booking.receiptBalanceDue')}
              </span>
            ) : (
              <span className="bg-navy text-white px-2.5 py-0.5 rounded font-bold uppercase tracking-wider text-[11px]">
                {t(`status.${booking.status}`)}
              </span>
            )}
          </div>

          <div className="space-y-1 text-end min-w-[200px]">
            <div className="flex justify-between gap-4 text-muted">
              <span>{t('booking.totalAmount')}:</span>
              <span className="font-bold text-ink">{formatIDR(totalAmount)}</span>
            </div>
            <div className="flex justify-between gap-4 text-success">
              <span>{t('booking.paidAmount')}:</span>
              <span className="font-bold">{formatIDR(paidAmount)}</span>
            </div>
            <div className="flex justify-between gap-4 text-sm font-black pt-1 border-t border-line text-navy">
              <span>{t('booking.balanceAmount')}:</span>
              <span className={balance > 0 ? 'text-danger' : 'text-success'}>
                {formatIDR(balance)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Terms and House Rules */}
      <div className="p-3 rounded-lg border border-line bg-stone/20 text-[11px] text-muted space-y-1 mb-8">
        <h3 className="font-bold text-navy uppercase text-[10px] tracking-wider">
          📋 {t('booking.receiptTerms')}:
        </h3>
        <p>1. {t('booking.receiptTerm1')}</p>
        <p>2. {t('booking.receiptTerm2')}</p>
        <p>3. {t('booking.receiptTerm3')}</p>
      </div>

      {/* 5. Signatures & Stamp Section */}
      <div className="grid grid-cols-2 gap-8 text-center text-xs pt-4 mb-6">
        <div>
          <p className="font-semibold text-muted mb-16">{t('booking.receiptGuestSign')}</p>
          <div className="border-t border-ink/40 w-48 mx-auto pt-1 font-bold text-ink">
            {booking.guest_name || '...........................................'}
          </div>
        </div>
        <div>
          <p className="font-semibold text-muted mb-16">{t('booking.receiptStaffSign')}</p>
          <div className="border-t border-ink/40 w-48 mx-auto pt-1 font-bold text-navy">
            ALMAGD — New Pratama
          </div>
        </div>
      </div>

      {/* 6. Official Footer */}
      <div className="pt-4 border-t border-line text-center text-[10px] text-muted">
        <p className="font-semibold text-navy">{t('booking.receiptFooter')}</p>
        <p className="mt-0.5">Sistem Resmi Manajemen ALMAGD New Pratama v1.0 • Dicetak secara digital</p>
      </div>
    </div>
  );
};
