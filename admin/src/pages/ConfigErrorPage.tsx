import React from 'react';
import { useI18n } from '../i18n/I18nProvider';

export const ConfigErrorPage: React.FC = () => {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center bg-mist p-4">
      <div className="bg-white rounded-xl shadow border border-line p-8 max-w-lg w-full text-center">
        <div className="w-14 h-14 bg-danger/10 text-danger rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
          !
        </div>
        <h1 className="text-xl font-bold text-ink mb-2">{t('auth.configErrorTitle')}</h1>
        <p className="text-sm text-muted mb-6 leading-relaxed">
          {t('auth.configErrorSubtitle')}
        </p>
        <div className="bg-stone/50 rounded-lg p-4 text-start font-mono text-xs text-ink/80 overflow-x-auto">
          <code>
            VITE_SUPABASE_URL=http://127.0.0.1:54321<br />
            VITE_SUPABASE_ANON_KEY=&lt;anon-key&gt;
          </code>
        </div>
      </div>
    </div>
  );
};
