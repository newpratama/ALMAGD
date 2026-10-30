import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { id } from './id';
import { ar } from './ar';

export type Language = 'id' | 'ar';

interface I18nContextValue {
  lang: Language;
  dir: 'ltr' | 'rtl';
  setLang: (lang: Language) => void;
  toggleLang: () => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

const STORAGE_KEY = 'almagd.lang';

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved === 'ar' || saved === 'id' ? saved : 'id';
  });

  const dir: 'ltr' | 'rtl' = lang === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (nextLang: Language) => {
    setLangState(nextLang);
  };

  const toggleLang = () => {
    setLangState((prev) => (prev === 'id' ? 'ar' : 'id'));
  };

  const currentDict = lang === 'ar' ? ar : id;

  const t = useMemo(() => {
    return (key: string, vars?: Record<string, string | number>): string => {
      const parts = key.split('.');
      let current: unknown = currentDict;

      for (const part of parts) {
        if (current && typeof current === 'object' && part in current) {
          current = (current as Record<string, unknown>)[part];
        } else {
          current = undefined;
          break;
        }
      }

      if (typeof current !== 'string') {
        // Fallback to id dictionary if not found in current dict
        let fallback: unknown = id;
        for (const part of parts) {
          if (fallback && typeof fallback === 'object' && part in fallback) {
            fallback = (fallback as Record<string, unknown>)[part];
          } else {
            fallback = undefined;
            break;
          }
        }
        current = typeof fallback === 'string' ? fallback : key;
      }

      let text = String(current);
      if (vars) {
        for (const [varName, val] of Object.entries(vars)) {
          text = text.split(`{${varName}}`).join(String(val));
        }
      }
      return text;
    };
  }, [currentDict]);

  const value = useMemo(
    () => ({
      lang,
      dir,
      setLang,
      toggleLang,
      t,
    }),
    [lang, dir, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return ctx;
}
