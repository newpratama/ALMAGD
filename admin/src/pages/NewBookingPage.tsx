import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';
import { BookingForm } from '../components/booking/BookingForm';
import { Button } from '../components/ui/Button';

export const NewBookingPage: React.FC = () => {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const unitParam = searchParams.get('unit');
  const fromParam = searchParams.get('from');
  const guestParam = searchParams.get('guest');

  const preselectedUnitId = unitParam ? parseInt(unitParam, 10) || null : null;
  const preselectedFrom = fromParam || null;
  const preselectedGuestId = guestParam || null;

  const handleBack = () => {
    if (preselectedGuestId) {
      navigate(`/guests/${preselectedGuestId}`);
    } else {
      navigate('/bookings');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={handleBack}>
            ← {t('common.back')}
          </Button>
          <h1 className="text-2xl font-bold text-navy">{t('booking.createTitle')}</h1>
        </div>
      </div>

      <BookingForm
        preselectedUnitId={preselectedUnitId}
        preselectedFrom={preselectedFrom}
        preselectedGuestId={preselectedGuestId}
        onSuccess={(id) => navigate(`/bookings/${id}`)}
        onCancel={handleBack}
      />
    </div>
  );
};
