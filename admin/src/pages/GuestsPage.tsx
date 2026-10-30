import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { useGuests, useCreateGuest } from '../api/guests';
import type { GuestListItem, GuestInsert, GuestUpdate } from '../api/guests';
import { formatDateHuman } from '../lib/dates';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Table, Thead, Tbody, Tr, Th, Td } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import { Spinner } from '../components/ui/Spinner';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { GuestForm } from '../components/guest/GuestForm';
import { useToast } from '../components/ui/Toast';
import { friendlyError } from '../lib/errors';

export const GuestsPage: React.FC = () => {
  const { t, lang } = useI18n();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: guests, isLoading, error } = useGuests(debouncedSearch);
  const createGuestMutation = useCreateGuest();

  const handleCreateSubmit = async (data: GuestInsert | GuestUpdate) => {
    try {
      const created = await createGuestMutation.mutateAsync({
        ...data,
        full_name: data.full_name || '',
      });
      showToast('success', t('guest.guestSaved'));
      setIsCreateModalOpen(false);
      navigate(`/guests/${created.id}`);
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const getGuestStats = (guest: GuestListItem) => {
    const validBookings = guest.bookings?.filter((b) => b.status !== 'cancelled') || [];
    const count = validBookings.length;
    let lastStay: string | null = null;
    if (validBookings.length > 0) {
      const sorted = [...validBookings].sort((a, b) => b.check_in.localeCompare(a.check_in));
      lastStay = sorted[0].check_in;
    }
    return { count, lastStay };
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">{t('guest.title')}</h1>
          <p className="text-sm text-muted mt-1">{t('nav.guests')}</p>
        </div>
        <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
          {t('guest.newGuest')}
        </Button>
      </div>

      {/* Search Bar */}
      <div className="max-w-md">
        <Input
          type="search"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder={t('guest.searchPlaceholder')}
        />
      </div>

      {/* Guests Table */}
      {isLoading ? (
        <div className="py-16 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-danger/10 border border-danger/20 text-danger text-sm">
          {t(friendlyError(error))}
        </div>
      ) : !guests || guests.length === 0 ? (
        <EmptyState
          title={t('common.noData')}
          description={debouncedSearch ? t('errors.notFound') : t('guest.searchPlaceholder')}
          action={
            <Button variant="primary" size="sm" onClick={() => setIsCreateModalOpen(true)}>
              {t('guest.newGuest')}
            </Button>
          }
        />
      ) : (
        <Table>
          <Thead>
            <Tr>
              <Th>{t('guest.fullName')}</Th>
              <Th>{t('guest.phone')}</Th>
              <Th>{t('guest.nationality')}</Th>
              <Th>{t('guest.staysCount')}</Th>
              <Th>{t('guest.lastStay')}</Th>
              <Th>{t('guest.tags')}</Th>
            </Tr>
          </Thead>
          <Tbody>
            {guests.map((guest) => {
              const { count, lastStay } = getGuestStats(guest);
              const isVip = guest.tags?.includes('vip');
              const isBlacklist = guest.tags?.includes('blacklist');

              return (
                <Tr
                  key={guest.id}
                  onClick={() => navigate(`/guests/${guest.id}`)}
                  className="cursor-pointer hover:bg-mist/80"
                >
                  <Td className="font-semibold text-navy">
                    {guest.full_name}
                  </Td>
                  <Td className="text-muted text-xs">
                    {guest.phone || '—'}
                  </Td>
                  <Td className="text-muted text-xs">
                    {guest.nationality || '—'}
                  </Td>
                  <Td className="text-xs">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-stone text-ink font-medium">
                      {count}
                    </span>
                  </Td>
                  <Td className="text-muted text-xs">
                    {lastStay ? formatDateHuman(lastStay, lang) : '—'}
                  </Td>
                  <Td>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {isVip && (
                        <Badge variant="gold">
                          {t('guest.vip')}
                        </Badge>
                      )}
                      {isBlacklist && (
                        <Badge variant="danger">
                          {t('guest.blacklist')}
                        </Badge>
                      )}
                      {!isVip && !isBlacklist && (
                        <span className="text-muted text-xs">—</span>
                      )}
                    </div>
                  </Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      )}

      {/* Create Guest Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={t('guest.newGuest')}
      >
        <GuestForm
          onSubmit={handleCreateSubmit}
          loading={createGuestMutation.isPending}
          onCancel={() => setIsCreateModalOpen(false)}
        />
      </Modal>
    </div>
  );
};
