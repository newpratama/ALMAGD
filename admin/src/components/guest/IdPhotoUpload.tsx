import React, { useState, useEffect } from 'react';
import { useAuth } from '../../auth/AuthProvider';
import { useI18n } from '../../i18n/I18nProvider';
import { useToast } from '../ui/Toast';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import {
  uploadGuestIdPhoto,
  getGuestIdPhotoUrl,
  deleteGuestIdPhoto,
} from '../../api/guests';
import { friendlyError } from '../../lib/errors';

export interface IdPhotoUploadProps {
  guestId: string;
  photoPath: string | null | undefined;
  onPhotoChange: () => void;
}

export const IdPhotoUpload: React.FC<IdPhotoUploadProps> = ({
  guestId,
  photoPath,
  onPhotoChange,
}) => {
  const { role } = useAuth();
  const { t } = useI18n();
  const { showToast } = useToast();

  const isManager = role === 'manager';

  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    let active = true;

    if (photoPath && isManager) {
      setLoadingUrl(true);
      getGuestIdPhotoUrl(photoPath)
        .then((url) => {
          if (active) setSignedUrl(url);
        })
        .catch((err) => {
          console.error('Failed to load signed ID photo URL:', err);
        })
        .finally(() => {
          if (active) setLoadingUrl(false);
        });
    } else {
      setSignedUrl(null);
    }

    return () => {
      active = false;
    };
  }, [photoPath, isManager]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('error', t('errors.invalidData'));
      return;
    }

    setUploading(true);
    try {
      await uploadGuestIdPhoto(guestId, file);
      showToast('success', t('common.success'));
      onPhotoChange();
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!photoPath) return;
    setDeleting(true);
    try {
      await deleteGuestIdPhoto(guestId, photoPath);
      showToast('success', t('common.success'));
      setShowConfirmDelete(false);
      onPhotoChange();
    } catch (err) {
      showToast('error', t(friendlyError(err)));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="bg-white border border-line rounded-xl p-5 text-start space-y-4">
      <h3 className="text-sm font-semibold text-ink">{t('guest.idPhoto')}</h3>

      {photoPath ? (
        <div className="space-y-3">
          {isManager ? (
            <div>
              {loadingUrl ? (
                <div className="h-44 w-full bg-stone/40 animate-pulse rounded-lg flex items-center justify-center text-xs text-muted">
                  {t('common.loading')}
                </div>
              ) : signedUrl ? (
                <div className="relative group">
                  <img
                    src={signedUrl}
                    alt={t('guest.idPhoto')}
                    className="h-48 w-full object-contain bg-stone/20 rounded-lg border border-line"
                  />
                  <div className="mt-3 flex justify-end">
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowConfirmDelete(true)}
                    >
                      {t('guest.deletePhoto')}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-stone rounded-lg text-xs text-muted">
                  {t('common.photoOnFile')}
                </div>
              )}
            </div>
          ) : (
            /* Reception view: cannot see photo, sees badge */
            <div className="p-4 bg-success/10 border border-success/20 rounded-lg text-success text-sm font-semibold flex items-center gap-2">
              <span>✓</span>
              <span>{t('common.photoOnFile')}</span>
            </div>
          )}
        </div>
      ) : (
        /* No photo uploaded yet: both manager and reception can upload */
        <div>
          <label className="block">
            <span className="sr-only">{t('guest.uploadPhoto')}</span>
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              onChange={handleFileChange}
              disabled={uploading}
              className="block w-full text-xs text-muted file:me-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-navy file:text-white hover:file:bg-navy-light cursor-pointer"
            />
          </label>
          <p className="text-[11px] text-muted mt-1.5">JPG, PNG, WEBP (max 5 MB)</p>
          {uploading && (
            <p className="text-xs text-navy font-medium mt-2">{t('common.loading')}</p>
          )}
        </div>
      )}

      {/* Manager delete confirmation */}
      <ConfirmDialog
        isOpen={showConfirmDelete}
        onClose={() => setShowConfirmDelete(false)}
        onConfirm={handleDelete}
        title={t('guest.deletePhoto')}
        message={t('guest.confirmDeletePhoto')}
        loading={deleting}
      />
    </div>
  );
};
