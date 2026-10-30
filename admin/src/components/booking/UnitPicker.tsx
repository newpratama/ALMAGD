import React, { useEffect } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useAvailableUnits } from '../../api/units';
import type { Unit } from '../../api/units';
import { Select } from '../ui/Select';
import { Spinner } from '../ui/Spinner';
import { formatIDRWithCommas } from '../../lib/money';

export interface UnitPickerProps {
  checkIn: string;
  checkOut: string;
  selectedUnitId: number | null;
  onSelectUnit: (unitId: number | null, unit: Unit | null) => void;
  preselectedUnitId?: number | null;
  excludeBookingId?: string;
  error?: string;
}

export const UnitPicker: React.FC<UnitPickerProps> = ({
  checkIn,
  checkOut,
  selectedUnitId,
  onSelectUnit,
  preselectedUnitId,
  excludeBookingId,
  error,
}) => {
  const { t } = useI18n();

  const isDatesValid = Boolean(checkIn && checkOut && checkOut > checkIn);

  const {
    data: availableUnits = [],
    isLoading,
    refetch,
  } = useAvailableUnits(
    isDatesValid ? checkIn : '',
    isDatesValid ? checkOut : '',
    excludeBookingId
  );

  // Check if preselected unit from URL is unavailable
  const isPreselectedTaken =
    Boolean(preselectedUnitId) &&
    isDatesValid &&
    !isLoading &&
    !availableUnits.some((u) => u.id === preselectedUnitId);

  // Group units by Villa and Kamar Lepas
  const villas = availableUnits.filter((u) => u.kind === 'villa');
  const rooms = availableUnits.filter((u) => u.kind === 'room');

  const roomsByVilla = new Map<number, Unit[]>();
  const independentRooms: Unit[] = [];

  for (const r of rooms) {
    if (r.parent_id) {
      const list = roomsByVilla.get(r.parent_id) || [];
      list.push(r);
      roomsByVilla.set(r.parent_id, list);
    } else {
      independentRooms.push(r);
    }
  }

  // Refetch when dates change
  useEffect(() => {
    if (isDatesValid) {
      refetch();
    }
  }, [checkIn, checkOut, isDatesValid, refetch]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value ? Number(e.target.value) : null;
    const found = availableUnits.find((u) => u.id === val) || null;
    onSelectUnit(val, found);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-semibold text-ink">
          {t('booking.unit')} <span className="text-danger">*</span>
        </label>
        {isDatesValid && !isLoading && (
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-success/15 text-success">
            {availableUnits.length} {t('unitStatus.available')}
          </span>
        )}
      </div>

      {isPreselectedTaken && (
        <div className="p-3 rounded-lg bg-warning/15 border border-warning/30 text-warning text-xs font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{t('booking.unitTaken')}</span>
        </div>
      )}

      {!isDatesValid ? (
        <p className="text-xs text-muted italic p-2 bg-stone/40 rounded-lg">
          {t('booking.invalidDates')}
        </p>
      ) : isLoading ? (
        <div className="p-4 flex items-center justify-center gap-2 text-xs text-muted bg-stone/20 rounded-lg">
          <Spinner size="sm" />
          <span>{t('common.loading')}</span>
        </div>
      ) : (
        <Select
          value={selectedUnitId ? String(selectedUnitId) : ''}
          onChange={handleChange}
        >
          <option value="">-- {t('booking.unitRequired')} --</option>

          {/* Villas & Child Rooms */}
          {villas.map((villa) => {
            const childRooms = roomsByVilla.get(villa.id) || [];
            const villaRate = villa.default_rate ? ` — ${formatIDRWithCommas(Number(villa.default_rate))}` : '';
            return (
              <optgroup key={villa.id} label={villa.name}>
                <option value={String(villa.id)}>
                  ★ {villa.name} ({t('calendar.wholeVilla')}){villaRate}
                </option>
                {childRooms.map((room) => {
                  const roomRate = room.default_rate ? ` — ${formatIDRWithCommas(Number(room.default_rate))}` : '';
                  return (
                    <option key={room.id} value={String(room.id)}>
                      &nbsp;&nbsp;↳ {room.name}{roomRate}
                    </option>
                  );
                })}
              </optgroup>
            );
          })}

          {/* Independent rooms without villa parent */}
          {independentRooms.length > 0 && (
            <optgroup label="Kamar Lepas">
              {independentRooms.map((room) => {
                const roomRate = room.default_rate ? ` — ${formatIDRWithCommas(Number(room.default_rate))}` : '';
                return (
                  <option key={room.id} value={String(room.id)}>
                    {room.name}{roomRate}
                  </option>
                );
              })}
            </optgroup>
          )}
        </Select>
      )}

      {error && <p className="text-xs text-danger font-medium">{error}</p>}
    </div>
  );
};
