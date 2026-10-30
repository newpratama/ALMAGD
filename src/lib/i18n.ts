import { getEntry } from 'astro:content';

export const LOCALES = ['id', 'en', 'ar'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'id';

export function isRTL(locale: Locale): boolean {
  return locale === 'ar';
}

export function getLocaleFromUrl(pathname: string): Locale {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length > 0) {
    if (segments[0] === 'en') return 'en';
    if (segments[0] === 'ar') return 'ar';
  }
  return DEFAULT_LOCALE;
}

export function localizePath(pathname: string, targetLocale: Locale): string {
  // strip existing locale prefix
  let cleanPath = pathname;
  if (cleanPath.startsWith('/en/')) {
    cleanPath = cleanPath.slice(3);
  } else if (cleanPath === '/en') {
    cleanPath = '/';
  } else if (cleanPath.startsWith('/ar/')) {
    cleanPath = cleanPath.slice(3);
  } else if (cleanPath === '/ar') {
    cleanPath = '/';
  }

  if (targetLocale === DEFAULT_LOCALE) {
    return cleanPath || '/';
  }

  if (cleanPath === '/' || cleanPath === '') {
    return `/${targetLocale}`;
  }

  return `/${targetLocale}${cleanPath}`;
}

export async function useTranslations(locale: Locale) {
  const entry = await getEntry('i18n', `ui.${locale}`);
  const strings = entry?.data || {};

  return function t(key: string, params: Record<string, string> = {}): string {
    let str = strings[key] || key;
    for (const [k, v] of Object.entries(params)) {
      str = str.replace(`{${k}}`, v);
    }
    return str;
  };
}
