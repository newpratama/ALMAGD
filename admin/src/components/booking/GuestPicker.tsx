import React, { useState, useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useGuests, useCreateGuest, useGuest } from '../../api/guests';
import type { Guest, GuestInsert, GuestUpdate, GuestListItem } from '../../api/guests';
import { formatDateHuman } from '../../lib/dates';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { Spinner } from '../ui/Spinner';
import { GuestForm } from '../guest/GuestForm';
import { useToast } from '../ui/Toast';
import { friendlyError } from '../../lib/errors';

export interface GuestPickerProps {
  selectedGuestId: string | null;
  onSelectGuest: (guest: Guest | null) => void;
  error?: string;
}

export const GuestPicker: React.FC<GuestPickerProps> = ({
  selectedGuestId,
  onSelectGuest,
  error,
}) => {
  const { t, lang } = useI18n();
  const { showToast } = useToast();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch selected guest details if we only have an ID
  const { data: selectedGuest } = useGuest(selectedGuestId || undefined);

  // Search results
  const { data: searchResults = [], isLoading: isSearching } = useGuests(debouncedSearch);

  // Create guest mutation
  const createGuestMutation = useCreateGuest();

  const handleCreateSubmit = async (data: GuestInsert | GuestUpdate) => {
    try {
      const created = await createGuestMutation.mutateAsync({
        ...data,
        full_name: data.full_name || '',
      });
      showToast('success', t('guest.guestSaved'));
      onSelectGuest(created);
      setIsCreatingNew(false);
      setSearchInput('');
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    }
  };

  const isVip = selectedGuest?.tags?.includes('vip');
  const isBlacklist = selectedGuest?.tags?.includes('blacklist');

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-ink">
          {t('booking.guest')} <span className="text-danger">*</span>
        </label>
        {!selectedGuestId && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setIsCreatingNew(!isCreatingNew);
              setIsDropdownOpen(false);
            }}
          >
            {isCreatingNew ? t('common.cancel') : t('guest.newGuest')}
          </Button>
        )}
      </div>

      {/* Selected Guest Card */}
      {selectedGuestId && selectedGuest ? (
        <div className="p-4 rounded-xl border border-line bg-stone/30 space-y-2 text-start">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-navy text-base">
                {selectedGuest.full_name}
              </span>
              {isVip && <Badge variant="gold">{t('guest.vip')}</Badge>}
              {isBlacklist && <Badge variant="danger">{t('guest.blacklist')}</Badge>}
            </div>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => onSelectGuest(null)}
            >
              {t('common.change')}
            </Button>
          </div>

          <div className="text-xs text-muted flex items-center gap-4 flex-wrap">
            {selectedGuest.phone && <span>📞 {selectedGuest.phone}</span>}
            {selectedGuest.id_number && <span>🪪 {selectedGuest.id_number}</span>}
            {selectedGuest.nationality && <span>🌍 {selectedGuest.nationality}</span>}
          </div>

          {isBlacklist && (
            <div className="mt-2 p-2.5 rounded-lg bg-danger/15 border border-danger/30 text-danger text-xs font-bold flex items-center gap-2">
              <span>⚠️</span>
              <span>{t('guest.blacklistWarning')}</span>
            </div>
          )}
        </div>
      ) : isCreatingNew ? (
        /* Inline New Guest Form */
        <div className="p-4 rounded-xl border border-line bg-mist/40 space-y-3 text-start">
          <h4 className="text-xs font-bold uppercase text-navy tracking-wider">
            {t('guest.newGuest')}
          </h4>
          <GuestForm
            onSubmit={handleCreateSubmit}
            loading={createGuestMutation.isPending}
            onCancel={() => setIsCreatingNew(false)}
          />
        </div>
      ) : (
        /* Search Box and Dropdown */
        <div className="relative">
          <Input
            type="search"
            value={searchInput}
            placeholder={t('guest.searchPlaceholder')}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => setIsDropdownOpen(true)}
          />

          {isDropdownOpen && (
            <div className="absolute z-20 w-full mt-1.5 bg-white border border-line rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-line">
              {isSearching ? (
                <div className="p-4 flex justify-center">
                  <Spinner size="sm" />
                </div>
              ) : searchResults.length === 0 ? (
                <div className="p-4 text-center text-xs text-muted">
                  <p>{t('common.noData')}</p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={() => {
                      setIsCreatingNew(true);
                      setIsDropdownOpen(false);
                    }}
                  >
                    + {t('guest.newGuest')}
                  </Button>
                </div>
              ) : (
                searchResults.map((guest: GuestListItem) => {
                  const guestVip = guest.tags?.includes('vip');
                  const guestBlacklist = guest.tags?.includes('blacklist');
                  const validBookings = guest.bookings?.filter((b) => b.status !== 'cancelled') || [];
                  let lastStay: string | null = null;
                  if (validBookings.length > 0) {
                    const sorted = [...validBookings].sort((a, b) => b.check_in.localeCompare(a.check_in));
                    lastStay = sorted[0].check_in;
                  }

                  return (
                    <button
                      key={guest.id}
                      type="button"
                      onClick={() => {
                        onSelectGuest(guest);
                        setIsDropdownOpen(false);
                        setSearchInput('');
                      }}
                      className="w-full p-3 text-start hover:bg-mist/80 transition-colors flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-sm text-navy">
                            {guest.full_name}
                          </span>
                          {guestVip && <Badge variant="gold">{t('guest.vip')}</Badge>}
                          {guestBlacklist && <Badge variant="danger">{t('guest.blacklist')}</Badge>}
                        </div>
                        <div className="text-xs text-muted mt-0.5 flex items-center gap-3">
                          {guest.phone && <span>{guest.phone}</span>}
                          {lastStay && (
                            <span>{t('guest.lastStay')}: {formatDateHuman(lastStay, lang)}</span>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted">➔</span>
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
};
