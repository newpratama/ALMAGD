import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { useBookings, useBookingSources, fetchAllBookingsForExport } from '../api/bookings';
import type { BookingFilters } from '../api/bookings';
import { formatIDR } from '../lib/money';
import { formatDateHuman, todayISO } from '../lib/dates';
import { isOtaSource, formatLeadTime } from '../lib/bookingHelpers';
import { exportBookingsToXlsx } from '../lib/exportXlsx';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { StatusBadge } from '../components/booking/StatusBadge';
import { PaymentStatusBadge } from '../components/booking/PaymentStatusBadge';
import { SourceBadge } from '../components/booking/SourceBadge';
import { useToast } from '../components/ui/Toast';

export const BookingsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [status, setStatus] = useState('all');
  const [source, setSource] = useState('all');
  const [paymentStatus, setPaymentStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters: BookingFilters = {
    from: fromDate || undefined,
    to: toDate || undefined,
    status: status !== 'all' ? status : undefined,
    source: source !== 'all' ? source : undefined,
    payment_status: paymentStatus !== 'all' ? paymentStatus : undefined,
    search: debouncedSearch || undefined,
    page,
    pageSize: 50,
  };

  const { data, isLoading, error } = useBookings(filters);
  const { data: sources = [] } = useBookingSources();

  const bookings = data?.bookings || [];
  const totalCount = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 50));

  const sourceMap = new Map<string, { label: string; color: string }>();
  for (const s of sources) {
    sourceMap.set(s.code, { label: s.label, color: s.color });
  }

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const allBookings = await fetchAllBookingsForExport(filters);
      exportBookingsToXlsx(allBookings, `almagd-bookings-${new Date().toISOString().slice(0, 10)}.xlsx`);
      showToast('success', t('common.success'));
    } catch (err) {
      console.error('Export failed:', err);
      showToast('error', t('common.error'));
    } finally {
      setIsExporting(false);
    }
  };

  const handleResetFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setFromDate('');
    setToDate('');
    setStatus('all');
    setSource('all');
    setPaymentStatus('all');
    setPage(1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('nav.bookings')}</h1>
          <p className="text-sm text-muted mt-1">
            {t('common.totalRecords', { count: totalCount })}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button
            variant="secondary"
            onClick={handleExport}
            disabled={isExporting || totalCount === 0}
          >
            {isExporting ? t('common.loading') : `📥 ${t('report.exportExcel')}`}
          </Button>
          <Button variant="primary" onClick={() => navigate('/bookings/new')}>
            + {t('booking.createTitle')}
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-line shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Search */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              {t('common.search')}
            </label>
            <Input
              type="search"
              placeholder={t('guest.searchPlaceholder')}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              {t('common.status')}
            </label>
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t('common.all')}</option>
              <option value="confirmed">{t('status.confirmed')}</option>
              <option value="checked_in">{t('status.checked_in')}</option>
              <option value="checked_out">{t('status.checked_out')}</option>
              <option value="cancelled">{t('status.cancelled')}</option>
              <option value="no_show">{t('status.no_show')}</option>
            </Select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              {t('booking.source')}
            </label>
            <Select
              value={source}
              onChange={(e) => {
                setSource(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t('common.all')}</option>
              {sources.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              {t('booking.paymentsTitle')}
            </label>
            <Select
              value={paymentStatus}
              onChange={(e) => {
                setPaymentStatus(e.target.value);
                setPage(1);
              }}
            >
              <option value="all">{t('common.all')}</option>
              <option value="paid">{t('paymentStatus.paid')}</option>
              <option value="partial">{t('paymentStatus.partial')}</option>
              <option value="unpaid">{t('paymentStatus.unpaid')}</option>
              <option value="refund_due">{t('paymentStatus.refund_due')}</option>
            </Select>
          </div>

          {/* Check-in From */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              {t('booking.checkIn')}
            </label>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
            />
          </div>

          {/* Check-out To */}
          <div>
            <label className="block text-xs font-medium text-muted mb-1">
              {t('booking.checkOut')}
            </label>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="ghost" size="sm" onClick={handleResetFilters}>
            {t('common.reset')}
          </Button>
        </div>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="py-20 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {t('common.error')}
        </div>
      ) : bookings.length === 0 ? (
        <EmptyState
          title={t('common.noData')}
          description={t('booking.unitRequired')}
          action={
            <Button variant="primary" size="sm" onClick={() => navigate('/bookings/new')}>
              + {t('booking.createTitle')}
            </Button>
          }
        />
      ) : (
        <div className="space-y-4">
          <Table>
            <Thead>
              <Tr>
                <Th>{t('booking.code')}</Th>
                <Th>{t('booking.guest')}</Th>
                <Th>{t('booking.unit')}</Th>
                <Th>{t('booking.checkIn')}</Th>
                <Th>{t('booking.checkOut')}</Th>
                <Th>{t('booking.nights')}</Th>
                <Th>{t('booking.source')}</Th>
                <Th>{t('booking.totalAmount')}</Th>
                <Th>{t('booking.balanceAmount')}</Th>
                <Th>{t('common.status')}</Th>
              </Tr>
            </Thead>
            <Tbody>
              {bookings.map((booking) => {
                const srcCode = booking.source_code || '';
                const localizedLabel = (srcCode && t(`source.${srcCode}`)) || sourceMap.get(srcCode)?.label || srcCode;
                const srcInfo = {
                  label: localizedLabel,
                  color: sourceMap.get(srcCode)?.color || '#536275',
                };

                return (
                  <Tr
                    key={booking.id}
                    onClick={() => navigate(`/bookings/${booking.id}`)}
                    className="cursor-pointer hover:bg-mist/80"
                  >
                    <Td className="font-mono text-xs font-bold text-navy">
                      {booking.code}
                    </Td>
                    <Td className="font-semibold text-ink">
                      {booking.guest_name || (
                        <span className="text-danger italic text-xs">
                          {t('booking.guestRequired')}
                        </span>
                      )}
                    </Td>
                    <Td className="text-xs font-medium">
                      {booking.unit_name}
                    </Td>
                    <Td className="text-xs text-muted whitespace-nowrap">
                      {booking.check_in ? (
                        <div className="flex flex-col">
                          <span>{formatDateHuman(booking.check_in, lang)}</span>
                          {formatLeadTime(booking.check_in, todayISO(), lang) && (
                            <span className="text-[10px] text-blue-700 font-semibold mt-0.5">
                              ⏳ {formatLeadTime(booking.check_in, todayISO(), lang)}
                            </span>
                          )}
                        </div>
                      ) : '—'}
                    </Td>
                    <Td className="text-xs text-muted">
                      {booking.check_out ? formatDateHuman(booking.check_out, lang) : '—'}
                    </Td>
                    <Td className="text-xs">
                      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-stone text-ink font-semibold">
                        {booking.nights}
                      </span>
                    </Td>
                    <Td>
                      <SourceBadge label={srcInfo.label} color={srcInfo.color} />
                    </Td>
                    <Td className="text-xs font-bold text-ink">
                      {formatIDR(Number(booking.total_amount || 0))}
                    </Td>
                    <Td className="text-xs font-semibold whitespace-nowrap">
                      {booking.status === 'cancelled' ? (
                        Number(booking.paid || 0) > 0 ? (
                          <span className="text-amber-600 font-medium" title={t('booking.refundDue')}>
                            ↩ {formatIDR(Number(booking.paid))}
                          </span>
                        ) : (
                          <span className="text-muted font-normal">—</span>
                        )
                      ) : isOtaSource(booking.source_code) && Number(booking.balance || 0) > 0 ? (
                        <span className="text-navy font-semibold text-[11px]" title={t('booking.otaPayoutNote')}>
                          📱 {t('booking.otaPrepaidBadge')}
                        </span>
                      ) : Number(booking.balance || 0) > 0 ? (
                        <span className="text-danger">
                          {formatIDR(Number(booking.balance || 0))}
                        </span>
                      ) : (
                        <span className="text-success">0</span>
                      )}
                    </Td>
                    <Td>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <StatusBadge status={booking.status} />
                        <PaymentStatusBadge status={booking.payment_status} sourceCode={booking.source_code} />
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-line">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                ◀ {t('common.prev')}
              </Button>
              <span className="text-xs text-muted font-medium">
                {page} / {totalPages}
              </span>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                {t('common.next')} ▶
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
