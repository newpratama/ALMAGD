import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../auth/AuthProvider';
import { useI18n } from '../i18n/I18nProvider';
import {
  useBooking,
  useBookingSources,
  useUpdateBooking,
  useDeleteBooking,
  useBookingAuditLog,
  clearNeedsReview,
} from '../api/bookings';
import {
  usePayments,
  createPayment,
  updatePayment,
  deletePayment,
} from '../api/payments';
import type { Payment, PaymentInsert, PaymentUpdate } from '../api/payments';
import { useGuest } from '../api/guests';
import { BookingReceipt } from '../components/booking/BookingReceipt';
import { formatDateHuman } from '../lib/dates';
import { formatIDR } from '../lib/money';
import { friendlyError } from '../lib/errors';
import { isOtaSource } from '../lib/bookingHelpers';
import { setUnitHousekeepingStatus } from '../lib/housekeeping';
import { CancelBookingModal } from '../components/booking/CancelBookingModal';
import { ExtendStayModal } from '../components/booking/ExtendStayModal';
import { EarlyCheckoutModal } from '../components/booking/EarlyCheckoutModal';
import { TransferUnitModal } from '../components/booking/TransferUnitModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatCard } from '../components/ui/StatCard';
import { Modal } from '../components/ui/Modal';
import { Spinner } from '../components/ui/Spinner';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { StatusBadge } from '../components/booking/StatusBadge';
import { PaymentStatusBadge } from '../components/booking/PaymentStatusBadge';
import { SourceBadge } from '../components/booking/SourceBadge';
import { PaymentList } from '../components/booking/PaymentList';
import { PaymentForm } from '../components/booking/PaymentForm';
import { BookingForm } from '../components/booking/BookingForm';
import { useToast } from '../components/ui/Toast';

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

export const BookingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { role } = useAuth();
  const { t, lang } = useI18n();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const isManager = role === 'manager';
  const [searchParams] = useSearchParams();

  // Modals & Dialogs state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);

  useEffect(() => {
    if (searchParams.get('action') === 'pay') {
      setIsAddPaymentOpen(true);
    }
  }, [searchParams]);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [deletingPayment, setDeletingPayment] = useState<Payment | null>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [confirmCheckoutOpen, setConfirmCheckoutOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [isAuditOpen, setIsAuditOpen] = useState(false);
  const [isPreviewReceiptOpen, setIsPreviewReceiptOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelIsNoShow, setCancelIsNoShow] = useState(false);
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false);
  const [isEarlyCheckoutModalOpen, setIsEarlyCheckoutModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // Queries
  const { data: booking, isLoading: loadingBooking, error: bookingErr, refetch: refetchBooking } = useBooking(id);
  const { data: payments = [], refetch: refetchPayments } = usePayments(id);
  const { data: guest } = useGuest(booking?.guest_id || undefined);
  const { data: auditLog = [] } = useBookingAuditLog(id);
  const { data: sources = [] } = useBookingSources();

  // Mutations
  const updateBookingMutation = useUpdateBooking();
  const deleteBookingMutation = useDeleteBooking();

  if (loadingBooking) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (bookingErr || !booking) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" size="sm" onClick={() => navigate('/bookings')}>
          ← {t('common.back')}
        </Button>
        <div className="p-6 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {bookingErr ? t(friendlyError(bookingErr)) : t('errors.notFound')}
        </div>
      </div>
    );
  }

  const bookingId = booking.id || id || '';

  const handleStatusChange = async (newStatus: string) => {
    if (!bookingId) return;
    try {
      await updateBookingMutation.mutateAsync({
        id: bookingId,
        updates: { status: newStatus },
      });
      if (newStatus === 'checked_out' && booking.unit_id) {
        setUnitHousekeepingStatus(booking.unit_id, 'dirty');
      }
      showToast('success', t('common.success'));
      refetchBooking();
      queryClient.invalidateQueries({ queryKey: ['today-arrivals'] });
      queryClient.invalidateQueries({ queryKey: ['today-departures'] });
      queryClient.invalidateQueries({ queryKey: ['today-in-house'] });
      queryClient.invalidateQueries({ queryKey: ['calendar'] });
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleCheckoutClick = () => {
    if (Number(booking.balance || 0) > 0) {
      setConfirmCheckoutOpen(true);
    } else {
      handleStatusChange('checked_out');
    }
  };

  const handleClearNeedsReview = async () => {
    if (!bookingId) return;
    try {
      await clearNeedsReview(bookingId);
      showToast('success', t('common.success'));
      refetchBooking();
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleDeleteBooking = async () => {
    if (!bookingId) return;
    try {
      await deleteBookingMutation.mutateAsync(bookingId);
      showToast('success', t('common.success'));
      navigate('/bookings');
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  // Payment CRUD
  const handlePaymentSubmit = async (data: PaymentInsert | PaymentUpdate) => {
    try {
      if (editingPayment) {
        await updatePayment(editingPayment.id, data as PaymentUpdate);
        setEditingPayment(null);
      } else {
        await createPayment(data as PaymentInsert);
        setIsAddPaymentOpen(false);
      }
      showToast('success', t('common.success'));
      refetchPayments();
      refetchBooking();
      queryClient.invalidateQueries({ queryKey: ['today'] });
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const handleDeletePaymentConfirm = async () => {
    if (!deletingPayment) return;
    try {
      await deletePayment(deletingPayment.id);
      showToast('success', t('common.success'));
      setDeletingPayment(null);
      refetchPayments();
      refetchBooking();
      queryClient.invalidateQueries({ queryKey: ['today'] });
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const matchedSource = sources.find((s) => s.code === booking.source_code);
  const sourceLabel =
    (booking.source_code && t(`source.${booking.source_code}`)) ||
    matchedSource?.label ||
    booking.source_code;
  const sourceColor = matchedSource?.color || '#536275';

  return (
    <div className="text-start">
      {/* 1. Dedicated Professional Print Voucher (rendered only when printing) */}
      <div className="print-only">
        <BookingReceipt
          booking={booking}
          payments={payments}
          guest={guest}
          sourceLabel={sourceLabel}
          sourceColor={sourceColor}
        />
      </div>

      {/* 2. Interactive Screen UI (hidden on print) */}
      <div className="no-print space-y-6">
        {/* Back button & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <Button variant="secondary" size="sm" onClick={() => navigate('/bookings')}>
              ← {t('common.back')}
            </Button>
            <h1 className="text-2xl font-bold font-mono text-navy">{booking.code}</h1>
            <StatusBadge status={booking.status} />
            <PaymentStatusBadge status={booking.payment_status} />
            <SourceBadge label={sourceLabel} color={sourceColor} />
          </div>

          {/* Top Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPreviewReceiptOpen(true)}
            >
              👁️ {t('booking.previewReceipt')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              🖨️ {t('booking.printReceipt')}
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setIsEditModalOpen(true)}>
              ✏️ {t('common.edit')}
            </Button>
          {booking.status === 'confirmed' && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleStatusChange('checked_in')}
              >
                {t('booking.checkInBtn')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCancelIsNoShow(true);
                  setIsCancelModalOpen(true);
                }}
              >
                {t('booking.noShowBtn')}
              </Button>
            </>
          )}

          {/* Scenarios: Room Transfer & Extend Stay */}
          {(booking.status === 'confirmed' || booking.status === 'checked_in') && (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsTransferModalOpen(true)}
              >
                🔄 {t('scenarios.transferUnitBtn')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setIsExtendModalOpen(true)}
              >
                ⏱️ {t('scenarios.extendStayBtn')}
              </Button>
            </>
          )}

          {/* Scenario: Early Check-Out */}
          {booking.status === 'checked_in' && (
            <Button
              variant="warning"
              size="sm"
              onClick={() => setIsEarlyCheckoutModalOpen(true)}
            >
              🚪🏃‍♂️ {t('scenarios.earlyCheckoutBtn')}
            </Button>
          )}

          {/* Standard Check-Out */}
          {(booking.status === 'checked_in' || booking.status === 'confirmed') && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleCheckoutClick}
            >
              {t('booking.checkOutBtn')}
            </Button>
          )}

          {/* Smart Cancel with Penalty & Refund Reconciliation */}
          {booking.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-danger hover:bg-danger/10"
              onClick={() => {
                setCancelIsNoShow(false);
                setIsCancelModalOpen(true);
              }}
            >
              {t('booking.cancelBtn')}
            </Button>
          )}
          {isManager && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setConfirmDeleteOpen(true)}
            >
              {t('booking.deleteBtn')}
            </Button>
          )}
        </div>
      </div>

      {/* Needs Review Banner */}
      {booking.needs_review && (
        <div className="p-4 rounded-xl bg-warning/15 border border-warning/30 text-ink flex items-center justify-between gap-4 flex-wrap no-print">
          <div className="flex items-center gap-2">
            <span className="text-xl">⚠️</span>
            <span className="text-sm font-semibold text-warning-text">
              {t('booking.needsReview')}
            </span>
          </div>
          {isManager && (
            <Button variant="secondary" size="sm" onClick={handleClearNeedsReview}>
              {t('booking.clearNeedsReview')}
            </Button>
          )}
        </div>
      )}

      {/* OTA Prepaid Banner */}
      {isOtaSource(booking.source_code) && booking.status !== 'cancelled' && (
        <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex items-start gap-3">
          <span className="text-2xl">📱</span>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-navy mb-1">
              {t('booking.otaPrepaidTitle')} ({(booking.source_code || '').toUpperCase()})
            </h4>
            <p className="text-xs text-slate-700 leading-relaxed">
              {t('booking.otaPrepaidDesc', {
                source: (booking.source_code || '').toUpperCase(),
                checkIn: booking.check_in ? formatDateHuman(booking.check_in, lang) : '—',
              })}
            </p>
          </div>
        </div>
      )}

      {/* Financial Overview (Money Card) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title={t('booking.totalAmount')}
          value={formatIDR(Number(booking.total_amount || 0))}
          variant="navy"
        />
        <StatCard
          title={t('booking.paidAmount')}
          value={formatIDR(Number(booking.paid || 0))}
          variant="success"
        />
        <StatCard
          title={
            booking.status === 'cancelled' && Number(booking.paid || 0) > 0
              ? t('booking.refundDue')
              : isOtaSource(booking.source_code) && Number(booking.balance || 0) > 0
              ? t('booking.otaPayoutExpected')
              : t('booking.balanceAmount')
          }
          value={
            booking.status === 'cancelled'
              ? Number(booking.paid || 0) > 0
                ? formatIDR(Number(booking.paid))
                : '—'
              : formatIDR(Number(booking.balance || 0))
          }
          variant={
            booking.status === 'cancelled'
              ? Number(booking.paid || 0) > 0
                ? 'gold'
                : 'default'
              : isOtaSource(booking.source_code) && Number(booking.balance || 0) > 0
              ? 'navy'
              : Number(booking.balance || 0) > 0
              ? 'danger'
              : 'default'
          }
        />
      </div>

      {/* Booking Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Guest & Unit Info */}
        <Card>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">
            {t('booking.guest')} &amp; {t('booking.unit')}
          </h3>
          <dl className="divide-y divide-line text-sm">
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted">{t('booking.guest')}</dt>
              <dd className="font-semibold text-navy">
                {booking.guest_id ? (
                  <Link
                    to={`/guests/${booking.guest_id}`}
                    className="hover:underline text-navy font-bold"
                  >
                    {booking.guest_name} ➔
                  </Link>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-danger italic text-xs">
                      {t('booking.unassignedGuest')}
                    </span>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsEditModalOpen(true)}
                    >
                      {t('booking.assignGuestBtn')}
                    </Button>
                  </div>
                )}
              </dd>
            </div>
            {booking.guest_phone && (
              <div className="py-2.5 flex justify-between">
                <dt className="text-muted">{t('guest.phone')}</dt>
                <dd className="font-mono text-ink">{booking.guest_phone}</dd>
              </div>
            )}
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted">{t('booking.unit')}</dt>
              <dd className="font-semibold text-ink">{booking.unit_name}</dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted">{t('booking.source')}</dt>
              <dd>
                <SourceBadge label={sourceLabel} color={sourceColor} />
              </dd>
            </div>
            {booking.ota_reference && (
              <div className="py-2.5 flex justify-between">
                <dt className="text-muted">{t('booking.otaReference')}</dt>
                <dd className="font-mono text-ink">{booking.ota_reference}</dd>
              </div>
            )}
          </dl>
        </Card>

        {/* Dates & Stay Info */}
        <Card>
          <h3 className="text-sm font-bold text-navy uppercase tracking-wider mb-4">
            {t('booking.checkIn')} &amp; {t('booking.checkOut')}
          </h3>
          <dl className="divide-y divide-line text-sm">
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted">{t('booking.checkIn')}</dt>
              <dd className="font-semibold text-ink">
                {booking.check_in ? formatDateHuman(booking.check_in, lang) : '—'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted">{t('booking.checkOut')}</dt>
              <dd className="font-semibold text-ink">
                {booking.check_out ? formatDateHuman(booking.check_out, lang) : '—'}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted">{t('booking.nights')}</dt>
              <dd className="font-bold text-navy">
                {t('booking.nightsCount', { count: booking.nights || 0 })}
              </dd>
            </div>
            <div className="py-2.5 flex justify-between">
              <dt className="text-muted">{t('booking.adults')} / {t('booking.children')}</dt>
              <dd className="text-ink">
                {lang === 'ar'
                  ? `${booking.adults} بالغ ، ${booking.children} أطفال`
                  : `${booking.adults} ${t('booking.adults')}, ${booking.children} ${t('booking.children')}`}
              </dd>
            </div>
            {booking.due_date && (
              <div className="py-2.5 flex justify-between">
                <dt className="text-muted">{t('booking.dueDate')}</dt>
                <dd className="font-medium text-warning-text">
                  {formatDateHuman(booking.due_date, lang)}
                </dd>
              </div>
            )}
            {booking.notes && (
              <div className="py-2.5">
                <dt className="text-muted mb-1">{t('booking.notes')}</dt>
                <dd className="p-2 bg-stone/40 rounded-lg text-xs text-ink whitespace-pre-wrap">
                  {formatLocalizedNote(booking.notes, lang)}
                </dd>
              </div>
            )}
          </dl>
        </Card>
      </div>

      {/* Payments Section */}
      <Card>
        <PaymentList
          payments={payments}
          bookingCode={booking.code}
          defaultOtaRef={booking.ota_reference}
          sourceLabel={sourceLabel}
          onAddPayment={() => setIsAddPaymentOpen(true)}
          onEditPayment={(p) => setEditingPayment(p)}
          onDeletePayment={(p) => setDeletingPayment(p)}
          canManage={isManager}
        />
      </Card>

      {/* Manager Collapsible History (Audit Log) */}
      {isManager && (
        <Card className="no-print">
          <button
            type="button"
            onClick={() => setIsAuditOpen(!isAuditOpen)}
            className="w-full flex items-center justify-between text-start text-sm font-bold text-navy"
          >
            <span>📜 {t('booking.history')} ({auditLog.length})</span>
            <span>{isAuditOpen ? '▲' : '▼'}</span>
          </button>

          {isAuditOpen && (
            <div className="mt-4 space-y-2 border-t border-line pt-3">
              {auditLog.length === 0 ? (
                <p className="text-xs text-muted italic">{t('common.noData')}</p>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {auditLog.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-lg bg-stone/30 text-xs flex items-center justify-between gap-3"
                    >
                      <div>
                        <span className="font-bold text-navy uppercase tracking-wider me-2">
                          {log.action}
                        </span>
                        <span className="text-muted">{log.table_name}</span>
                      </div>
                      <span className="font-mono text-muted text-[11px]">
                        {new Date(log.at).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>
      )}
      </div>

      {/* Receipt Preview Modal */}
      <Modal
        isOpen={isPreviewReceiptOpen}
        onClose={() => setIsPreviewReceiptOpen(false)}
        title={t('booking.previewReceipt')}
        maxWidth="4xl"
      >
        <div className="space-y-4 max-h-[80vh] overflow-y-auto p-1">
          <div className="flex justify-end gap-2 pb-2 border-b border-line">
            <Button
              variant="primary"
              size="sm"
              onClick={() => window.print()}
            >
              🖨️ {t('booking.printReceipt')}
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPreviewReceiptOpen(false)}
            >
              {t('common.close')}
            </Button>
          </div>
          <BookingReceipt
            booking={booking}
            payments={payments}
            guest={guest}
            sourceLabel={sourceLabel}
            sourceColor={sourceColor}
          />
        </div>
      </Modal>

      {/* Add Payment Modal */}
      <Modal
        isOpen={isAddPaymentOpen}
        onClose={() => setIsAddPaymentOpen(false)}
        title={t('booking.addPayment')}
      >
        <PaymentForm
          bookingId={bookingId}
          bookingCode={booking.code}
          defaultOtaRef={booking.ota_reference}
          defaultPaidOn={booking.check_in}
          defaultMethod={
            booking.source_code && booking.source_code !== 'direct' && booking.source_code !== 'walk_in'
              ? 'app'
              : 'cash'
          }
          defaultAmount={Math.max(0, Number(booking.balance || 0))}
          onSubmit={handlePaymentSubmit}
          onCancel={() => setIsAddPaymentOpen(false)}
        />
      </Modal>

      {/* Edit Payment Modal */}
      <Modal
        isOpen={Boolean(editingPayment)}
        onClose={() => setEditingPayment(null)}
        title={t('common.edit')}
      >
        {editingPayment && (
          <PaymentForm
            bookingId={bookingId}
            bookingCode={booking.code}
            defaultOtaRef={booking.ota_reference}
            initialPayment={editingPayment}
            onSubmit={handlePaymentSubmit}
            onCancel={() => setEditingPayment(null)}
          />
        )}
      </Modal>

      {/* Delete Payment Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletingPayment)}
        onClose={() => setDeletingPayment(null)}
        onConfirm={handleDeletePaymentConfirm}
        title={t('booking.deletePaymentBtn')}
        message={t('booking.deletePaymentConfirm')}
      />

      {/* Edit Booking Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title={t('booking.editTitle')}
      >
        <BookingForm
          initialBooking={booking as unknown as import('../api/bookings').Booking}
          onSuccess={() => {
            setIsEditModalOpen(false);
            refetchBooking();
          }}
          onCancel={() => setIsEditModalOpen(false)}
        />
      </Modal>

      {/* Cancel Booking Confirm */}
      <ConfirmDialog
        isOpen={confirmCancelOpen}
        onClose={() => setConfirmCancelOpen(false)}
        onConfirm={() => {
          handleStatusChange('cancelled');
          setConfirmCancelOpen(false);
        }}
        title={t('booking.cancelBtn')}
        message={t('booking.cancelConfirm')}
      />

      {/* Check-out with Balance Warning Confirm */}
      <ConfirmDialog
        isOpen={confirmCheckoutOpen}
        onClose={() => setConfirmCheckoutOpen(false)}
        onConfirm={() => {
          handleStatusChange('checked_out');
          setConfirmCheckoutOpen(false);
        }}
        title={t('today.checkoutConfirmTitle')}
        message={t('today.balanceWarning', {
          balance: formatIDR(Number(booking.balance || 0)),
        })}
      />

      {/* Delete Booking Confirm (Manager) */}
      <ConfirmDialog
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDeleteBooking}
        title={t('booking.deleteBtn')}
        message={t('booking.deleteConfirm')}
      />

      {/* Scenarios Modals */}
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        booking={booking}
        isNoShow={cancelIsNoShow}
        onSuccess={() => {
          refetchBooking();
          refetchPayments();
          queryClient.invalidateQueries({ queryKey: ['today-arrivals'] });
          queryClient.invalidateQueries({ queryKey: ['today-departures'] });
          queryClient.invalidateQueries({ queryKey: ['today-in-house'] });
        }}
      />

      <ExtendStayModal
        isOpen={isExtendModalOpen}
        onClose={() => setIsExtendModalOpen(false)}
        booking={booking}
        onSuccess={() => {
          refetchBooking();
          queryClient.invalidateQueries({ queryKey: ['today-in-house'] });
          queryClient.invalidateQueries({ queryKey: ['today-departures'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
        }}
      />

      <EarlyCheckoutModal
        isOpen={isEarlyCheckoutModalOpen}
        onClose={() => setIsEarlyCheckoutModalOpen(false)}
        booking={booking}
        onSuccess={() => {
          refetchBooking();
          refetchPayments();
          queryClient.invalidateQueries({ queryKey: ['today-in-house'] });
          queryClient.invalidateQueries({ queryKey: ['today-departures'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
        }}
      />

      <TransferUnitModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
        booking={booking}
        onSuccess={() => {
          refetchBooking();
          queryClient.invalidateQueries({ queryKey: ['today-in-house'] });
          queryClient.invalidateQueries({ queryKey: ['today-arrivals'] });
          queryClient.invalidateQueries({ queryKey: ['calendar'] });
        }}
      />
    </div>
  );
};
