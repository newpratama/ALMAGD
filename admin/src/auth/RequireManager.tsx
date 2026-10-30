import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from './AuthProvider';
import { useI18n } from '../i18n/I18nProvider';

export const RequireManager: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { role, loading } = useAuth();
  const { t } = useI18n();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-mist">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-muted">{t('common.loading')}</span>
        </div>
      </div>
    );
  }

  if (role !== 'manager') {
    return (
      <div className="min-h-[60vh] flex items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow-sm border border-line p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">{t('errors.forbidden')}</h2>
          <p className="text-sm text-muted mb-6">{t('errors.forbidden')}</p>
          <Link
            to="/"
            className="inline-block bg-navy hover:bg-navy-light text-white font-medium px-4 py-2 rounded-lg text-sm transition"
          >
            {t('common.back')}
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
