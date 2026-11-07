import React, { useEffect, useMemo } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { useAvailableUnits, useUnits } from '../../api/units';
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

  const { data: allUnits = [] } = useUnits();

  // Check if preselected unit from URL is unavailable
  const isPreselectedTaken =
    Boolean(preselectedUnitId) &&
    isDatesValid &&
    !isLoading &&
    !availableUnits.some((u) => u.id === preselectedUnitId);

  // All parent villas
  const allVillas = useMemo(() => {
    return allUnits
      .filter((u) => u.kind === 'villa')
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [allUnits]);

  // Available whole villas map
  const availableWholeVillasMap = useMemo(() => {
    const map = new Map<number, Unit>();
    availableUnits.forEach((u) => {
      if (u.kind === 'villa') map.set(u.id, u);
    });
    return map;
  }, [availableUnits]);

  // Available child rooms grouped by villa parent_id
  const roomsByVilla = useMemo(() => {
    const map = new Map<number, Unit[]>();
    availableUnits.forEach((u) => {
      if (u.kind === 'room' && u.parent_id) {
        const list = map.get(u.parent_id) || [];
        list.push(u);
        map.set(u.parent_id, list);
      }
    });
    return map;
  }, [availableUnits]);

  // Independent rooms (Kamar Lepas without villa parent)
  const independentRooms = useMemo(() => {
    return availableUnits
      .filter((u) => u.kind === 'room' && !u.parent_id)
      .sort((a, b) => a.sort_order - b.sort_order);
  }, [availableUnits]);

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
          {allVillas.map((villa) => {
            const wholeVilla = availableWholeVillasMap.get(villa.id);
            const childRooms = roomsByVilla.get(villa.id) || [];

            // If neither the whole villa nor any child room is available, skip
            if (!wholeVilla && childRooms.length === 0) return null;

            const villaRate = wholeVilla?.default_rate
              ? ` — ${formatIDRWithCommas(Number(wholeVilla.default_rate))}`
              : '';

            return (
              <optgroup key={villa.id} label={villa.name}>
                {wholeVilla && (
                  <option value={String(wholeVilla.id)}>
                    ★ {wholeVilla.name} ({t('calendar.wholeVilla')}){villaRate}
                  </option>
                )}
                {childRooms.map((room) => {
                  const roomRate = room.default_rate
                    ? ` — ${formatIDRWithCommas(Number(room.default_rate))}`
                    : '';
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
