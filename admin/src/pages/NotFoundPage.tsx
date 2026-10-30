import React from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n/I18nProvider';

export const NotFoundPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6 text-center">
      <div className="bg-white rounded-xl shadow-sm border border-line p-8 max-w-md w-full">
        <h1 className="text-4xl font-extrabold text-navy mb-2">404</h1>
        <p className="text-muted text-sm mb-6">{t('common.noData')}</p>
        <Link
          to="/"
          className="inline-block bg-navy hover:bg-navy-light text-white font-medium px-4 py-2 rounded-lg text-sm transition"
        >
          {t('common.back')}
        </Link>
      </div>
    </div>
  );
};
