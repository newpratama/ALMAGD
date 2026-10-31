import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { useGuest, useGuestHistory, useUpdateGuest } from '../api/guests';
import type { GuestUpdate } from '../api/guests';
import { formatIDR } from '../lib/money';
import { formatDateHuman } from '../lib/dates';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { StatCard } from '../components/ui/StatCard';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { GuestForm } from '../components/guest/GuestForm';
import { IdPhotoUpload } from '../components/guest/IdPhotoUpload';
import { useToast } from '../components/ui/Toast';
import { friendlyError } from '../lib/errors';

export const GuestDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const { data: guest, isLoading: loadingGuest, error: guestError, refetch: refetchGuest } = useGuest(id);
  const { data: history = [], isLoading: loadingHistory } = useGuestHistory(id);
  const updateGuestMutation = useUpdateGuest();

  if (loadingGuest) {
    return (
      <div className="py-24 flex justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (guestError || !guest) {
    return (
      <div className="space-y-4">
        <Button variant="secondary" size="sm" onClick={() => navigate('/guests')}>
          ← {t('common.back')}
        </Button>
        <div className="p-6 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {guestError ? t(friendlyError(guestError)) : t('errors.notFound')}
        </div>
      </div>
    );
  }

  const isVip = guest.tags?.includes('vip');
  const isBlacklist = guest.tags?.includes('blacklist');

  const totalSpent = history.reduce((sum, item) => sum + Number(item.paid || 0), 0);
  const staysCount = history.filter((item) => item.status !== 'cancelled').length;

  const handleUpdate = async (data: GuestUpdate) => {
    try {
      await updateGuestMutation.mutateAsync({
        id: guest.id,
        updates: data,
      });
      showToast('success', t('guest.guestSaved'));
      refetchGuest();
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  return (
    <div className="space-y-6">
      {/* Back button & Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Button variant="secondary" size="sm" onClick={() => navigate('/guests')}>
            ← {t('common.back')}
          </Button>
          <h1 className="text-2xl font-bold text-navy">{guest.full_name}</h1>
          {isVip && <Badge variant="gold">{t('guest.vip')}</Badge>}
          {isBlacklist && <Badge variant="danger">{t('guest.blacklist')}</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate(`/bookings/new?guest=${guest.id}`)}
            className="gap-2 shadow-xs"
          >
            <span>➕</span>
            <span>{t('guest.addBookingForGuest')}</span>
          </Button>
        </div>
      </div>

      {/* Blacklist Alert Banner */}
      {isBlacklist && (
        <div className="p-4 rounded-xl bg-danger/15 border border-danger/30 text-danger font-semibold text-sm flex items-center gap-3">
          <span className="text-xl">⚠️</span>
          <span>{t('guest.blacklistWarning')}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <StatCard
          title={t('guest.staysCount')}
          value={staysCount}
        />
        <StatCard
          title={t('guest.totalSpent')}
          value={formatIDR(totalSpent)}
        />
      </div>

      {/* Main Grid: Form + Photo / History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Editable Form and ID Photo */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <h2 className="text-base font-bold text-navy mb-4">{t('guest.title')}</h2>
            <GuestForm
              initialData={guest}
              onSubmit={handleUpdate}
              loading={updateGuestMutation.isPending}
            />
          </Card>

          <IdPhotoUpload
            guestId={guest.id}
            photoPath={guest.id_photo_path}
            onPhotoChange={() => refetchGuest()}
          />
        </div>

        {/* Right Column: Stays History */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h2 className="text-base font-bold text-navy">
                {t('guest.staysHistory')} ({history.length})
              </h2>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`/bookings/new?guest=${guest.id}`)}
                className="gap-1.5 text-xs"
              >
                <span>➕</span>
                <span>{t('guest.addBookingForGuest')}</span>
              </Button>
            </div>

            {loadingHistory ? (
              <div className="py-12 flex justify-center">
                <Spinner size="md" />
              </div>
            ) : history.length === 0 ? (
              <EmptyState
                title={t('common.noData')}
                description={t('guest.noStaysRecorded')}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => navigate(`/bookings/new?guest=${guest.id}`)}
                    className="gap-2 mt-2"
                  >
                    <span>➕</span>
                    <span>{t('guest.addBookingForGuest')}</span>
                  </Button>
                }
              />
            ) : (
              <Table>
                <Thead>
                  <Tr>
                    <Th>{t('booking.code')}</Th>
                    <Th>{t('booking.unit')}</Th>
                    <Th>{t('booking.checkIn')}</Th>
                    <Th>{t('booking.checkOut')}</Th>
                    <Th>{t('common.status')}</Th>
                    <Th>{t('booking.totalAmount')}</Th>
                    <Th>{t('booking.paidAmount')}</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {history.map((booking) => (
                    <Tr
                      key={booking.id}
                      onClick={() => navigate(`/bookings/${booking.id}`)}
                      className="cursor-pointer hover:bg-mist/80"
                    >
                      <Td className="font-mono text-xs font-semibold text-navy">
                        {booking.code}
                      </Td>
                      <Td className="text-xs font-medium">
                        {booking.unit_name}
                      </Td>
                      <Td className="text-xs text-muted">
                        {booking.check_in ? formatDateHuman(booking.check_in, lang) : '—'}
                      </Td>
                      <Td className="text-xs text-muted">
                        {booking.check_out ? formatDateHuman(booking.check_out, lang) : '—'}
                      </Td>
                      <Td className="text-xs">
                        <Badge
                          variant={
                            booking.status === 'confirmed'
                              ? 'success'
                              : booking.status === 'checked_in'
                              ? 'navy'
                              : booking.status === 'cancelled'
                              ? 'danger'
                              : 'default'
                          }
                        >
                          {t(`status.${booking.status}`)}
                        </Badge>
                      </Td>
                      <Td className="text-xs font-semibold text-ink">
                        {formatIDR(Number(booking.total_amount || 0))}
                      </Td>
                      <Td className="text-xs font-medium text-success">
                        {formatIDR(Number(booking.paid || 0))}
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </Table>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
