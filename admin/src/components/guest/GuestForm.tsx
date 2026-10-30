import React, { useState } from 'react';
import { useI18n } from '../../i18n/I18nProvider';
import { Field } from '../ui/Field';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { Button } from '../ui/Button';
import type { Guest, GuestInsert, GuestUpdate } from '../../api/guests';

export interface GuestFormProps {
  initialData?: Partial<Guest>;
  onSubmit: (data: GuestInsert | GuestUpdate) => Promise<void>;
  loading?: boolean;
  onCancel?: () => void;
}

export const GuestForm: React.FC<GuestFormProps> = ({
  initialData,
  onSubmit,
  loading = false,
  onCancel,
}) => {
  const { t } = useI18n();

  const [fullName, setFullName] = useState(initialData?.full_name || '');
  const [phone, setPhone] = useState(initialData?.phone || '');
  const [email, setEmail] = useState(initialData?.email || '');
  const [nationality, setNationality] = useState(initialData?.nationality || '');
  const [idType, setIdType] = useState<string>(initialData?.id_type || 'ktp');
  const [idNumber, setIdNumber] = useState(initialData?.id_number || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [isVip, setIsVip] = useState(initialData?.tags?.includes('vip') || false);
  const [isBlacklist, setIsBlacklist] = useState(initialData?.tags?.includes('blacklist') || false);

  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim()) {
      setNameError(t('common.required'));
      return;
    }
    setNameError(null);

    const tags: string[] = [];
    if (isVip) tags.push('vip');
    if (isBlacklist) tags.push('blacklist');

    const payload: GuestInsert = {
      full_name: fullName.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      nationality: nationality.trim() || null,
      id_type: (idType as 'ktp' | 'passport' | 'sim' | 'other') || null,
      id_number: idNumber.trim() || null,
      tags,
      notes: notes.trim() || null,
    };

    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-start">
      {isBlacklist && (
        <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm font-semibold flex items-center gap-2">
          <span>⚠️</span>
          <span>{t('guest.blacklistWarning')}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label={t('guest.fullName')} required error={nameError || undefined}>
          <Input
            value={fullName}
            onChange={(e) => {
              setFullName(e.target.value);
              if (nameError) setNameError(null);
            }}
            placeholder={t('guest.fullName')}
            error={Boolean(nameError)}
          />
        </Field>

        <Field label={t('guest.phone')}>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+62 812 3456 7890"
            type="tel"
          />
        </Field>

        <Field label={t('guest.email')}>
          <Input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="guest@example.com"
            type="email"
          />
        </Field>

        <Field label={t('guest.nationality')}>
          <Input
            value={nationality}
            onChange={(e) => setNationality(e.target.value)}
            placeholder="Indonesia / Saudi Arabia"
          />
        </Field>

        <Field label={t('guest.idType')}>
          <Select value={idType} onChange={(e) => setIdType(e.target.value)}>
            <option value="ktp">{t('guest.ktp')}</option>
            <option value="passport">{t('guest.passport')}</option>
            <option value="sim">{t('guest.sim')}</option>
            <option value="other">{t('guest.otherId')}</option>
          </Select>
        </Field>

        <Field label={t('guest.idNumber')}>
          <Input
            value={idNumber}
            onChange={(e) => setIdNumber(e.target.value)}
            placeholder="16-digit / Passport number"
          />
        </Field>
      </div>

      {/* Tags section */}
      <div>
        <label className="block text-sm font-medium text-ink mb-2">
          {t('guest.tags')}
        </label>
        <div className="flex items-center gap-4">
          <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isVip}
              onChange={(e) => setIsVip(e.target.checked)}
              className="rounded border-line text-gold focus:ring-gold"
            />
            <span className="font-semibold text-gold-text">⭐ {t('guest.vip')}</span>
          </label>

          <label className="inline-flex items-center gap-2 text-sm text-ink cursor-pointer">
            <input
              type="checkbox"
              checked={isBlacklist}
              onChange={(e) => setIsBlacklist(e.target.checked)}
              className="rounded border-line text-danger focus:ring-danger"
            />
            <span className="font-semibold text-danger">⛔ {t('guest.blacklist')}</span>
          </label>
        </div>
      </div>

      <Field label={t('guest.notes')}>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder={t('guest.notes')}
        />
      </Field>

      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} disabled={loading}>
            {t('common.cancel')}
          </Button>
        )}
        <Button type="submit" variant="primary" loading={loading}>
          {t('common.save')}
        </Button>
      </div>
    </form>
  );
};
