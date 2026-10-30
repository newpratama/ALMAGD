import React from 'react';
import { useI18n } from '../../i18n/I18nProvider';

export const LanguageToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { lang, toggleLang } = useI18n();

  return (
    <button
      type="button"
      onClick={toggleLang}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-line bg-white hover:bg-stone text-navy transition shadow-xs ${className}`}
      aria-label="Toggle Language"
    >
      <span>🌐</span>
      <span>{lang === 'id' ? 'العربية' : 'Indonesia'}</span>
    </button>
  );
};
