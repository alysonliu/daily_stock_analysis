import type { UiLocale } from '../i18n/uiText';

export const UI_LANGUAGE_STORAGE_KEY = 'dsa.uiLanguage';

export function normalizeUiLanguage(value?: string | null): UiLocale | null {
  if (value === 'zh' || value === 'zh-Hant' || value === 'en') {
    return value;
  }
  if (value && ['zh-tw', 'zh-hk', 'zh-hant'].includes(value.toLowerCase())) {
    return 'zh-Hant';
  }
  return null;
}

function getStoredUiLanguage(storage?: Storage | null): UiLocale | null {
  if (!storage) {
    return null;
  }

  try {
    return normalizeUiLanguage(storage.getItem(UI_LANGUAGE_STORAGE_KEY));
  } catch {
    return null;
  }
}

export function getUiLanguageStorage(): Storage | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function persistUiLanguage(storage: Storage | null, language: UiLocale): void {
  if (!storage) {
    return;
  }

  try {
    storage.setItem(UI_LANGUAGE_STORAGE_KEY, language);
  } catch {
    // Ignore storage failures; in-memory language still updates.
  }
}

function getBrowserUiLanguage(navigatorLike?: Pick<Navigator, 'language' | 'languages'> | null): UiLocale {
  const languageCandidates = [
    ...(Array.isArray(navigatorLike?.languages) ? navigatorLike?.languages ?? [] : []),
    navigatorLike?.language,
  ].filter((language): language is string => Boolean(language));

  for (const candidate of languageCandidates) {
    const normalized = candidate.toLowerCase();
    if (
      normalized.startsWith('zh-hant')
      || normalized.startsWith('zh-tw')
      || normalized.startsWith('zh-hk')
      || normalized.startsWith('zh-mo')
    ) {
      return 'zh-Hant';
    }
    if (normalized.startsWith('zh')) {
      return 'zh';
    }
    if (normalized.startsWith('en')) {
      return 'en';
    }
  }

  return 'zh';
}

export function resolveInitialUiLanguage({
  storage,
  navigatorLike,
}: {
  storage?: Storage | null;
  navigatorLike?: Pick<Navigator, 'language' | 'languages'> | null;
} = {}): UiLocale {
  const stored = getStoredUiLanguage(storage);
  if (stored) {
    return stored;
  }

  return getBrowserUiLanguage(navigatorLike);
}

export function getRuntimeInitialLanguage(): UiLocale {
  if (typeof window === 'undefined') {
    return 'zh';
  }

  return resolveInitialUiLanguage({
    storage: getUiLanguageStorage(),
    navigatorLike: window.navigator,
  });
}
