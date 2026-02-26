import { enUS } from './en-US';
import { jaJP } from './ja-JP';
import { zhCN, type TranslationKey } from './zh-CN';

export type Locale = 'zh-CN' | 'en-US' | 'ja-JP';

export const availableLocales: readonly Locale[] = ['zh-CN', 'en-US', 'ja-JP'];

const STORAGE_KEY = 'planet-walk-lang';
const DEFAULT_LOCALE: Locale = 'en-US';
const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  'zh-CN': zhCN,
  'en-US': enUS,
  'ja-JP': jaJP,
};

type LocaleChangeListener = (locale: Locale) => void;
const localeListeners = new Set<LocaleChangeListener>();

let currentLocale: Locale = detectInitialLocale();

function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) {
    return null;
  }

  const normalized = value.toLowerCase();
  if (normalized === 'zh-cn' || normalized.startsWith('zh')) {
    return 'zh-CN';
  }
  if (normalized === 'en-us' || normalized.startsWith('en')) {
    return 'en-US';
  }
  if (normalized === 'ja-jp' || normalized.startsWith('ja')) {
    return 'ja-JP';
  }
  return null;
}

function readStoredLocale(): Locale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return normalizeLocale(stored);
  } catch {
    return null;
  }
}

function writeStoredLocale(locale: Locale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    // ignore storage failures
  }
}

function detectInitialLocale(): Locale {
  const stored = readStoredLocale();
  if (stored) {
    return stored;
  }

  const detected = normalizeLocale(navigator.language) ?? DEFAULT_LOCALE;
  writeStoredLocale(detected);
  return detected;
}

function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key];
    return value === undefined ? `{${key}}` : String(value);
  });
}

export function t(
  key: TranslationKey | string,
  params?: Record<string, string | number>,
): string {
  const localDict = dictionaries[currentLocale] as Record<string, string>;
  const fallbackDict = dictionaries[DEFAULT_LOCALE] as Record<string, string>;
  const template = localDict[key] ?? fallbackDict[key] ?? key;
  return interpolate(template, params);
}

export function setLocale(locale: Locale): void {
  if (currentLocale === locale) {
    return;
  }

  currentLocale = locale;
  writeStoredLocale(locale);
  for (const listener of localeListeners) {
    listener(locale);
  }
}

export function getLocale(): Locale {
  return currentLocale;
}

export function onLocaleChange(listener: LocaleChangeListener): () => void {
  localeListeners.add(listener);
  return (): void => {
    localeListeners.delete(listener);
  };
}
