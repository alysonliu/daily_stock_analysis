import type React from 'react';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as OpenCC from 'opencc-js';
import {
  formatUiText,
  UI_TEXT,
  type UiLanguage,
  type UiLocale,
  type UiTextKey,
  type UiTextParams,
} from '../i18n/uiText';
import { getRuntimeInitialLanguage, getUiLanguageStorage, persistUiLanguage } from '../utils/uiLanguage';

type UiLanguageContextValue = {
  language: UiLanguage;
  locale: UiLocale;
  setLanguage: (language: UiLocale) => void;
  t: (key: UiTextKey, params?: UiTextParams) => string;
};

const fallbackContext: UiLanguageContextValue = {
  language: 'zh',
  locale: 'zh',
  setLanguage: () => undefined,
  t: (key, params) => formatUiText(UI_TEXT.zh[key], params),
};

const UiLanguageContext = createContext<UiLanguageContextValue | null>(null);

export const UiLanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locale, setLanguageState] = useState<UiLocale>(getRuntimeInitialLanguage);
  const language: UiLanguage = locale === 'en' ? 'en' : 'zh';

  const setLanguage = useCallback((nextLanguage: UiLocale) => {
    setLanguageState(nextLanguage);
    persistUiLanguage(getUiLanguageStorage(), nextLanguage);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = locale === 'en'
        ? 'en'
        : locale === 'zh-Hant'
          ? 'zh-Hant'
          : 'zh-CN';
    }
  }, [locale]);

  useEffect(() => {
    if (typeof document === 'undefined') {
      return;
    }

    const converter = locale === 'zh-Hant'
      ? OpenCC.Converter({ from: 'cn', to: 'hk' })
      : locale === 'zh'
        ? OpenCC.Converter({ from: 'hk', to: 'cn' })
        : null;

    if (!converter) {
      return;
    }

    const convertNode = (node: Node) => {
      if (node.nodeType === Node.TEXT_NODE && node.textContent) {
        const converted = converter(node.textContent);
        if (converted !== node.textContent) {
          node.textContent = converted;
        }
        return;
      }
      if (!(node instanceof HTMLElement)) {
        return;
      }
      for (const attribute of ['aria-label', 'placeholder', 'title']) {
        const value = node.getAttribute(attribute);
        if (value) {
          const converted = converter(value);
          if (converted !== value) {
            node.setAttribute(attribute, converted);
          }
        }
      }
      node.childNodes.forEach(convertNode);
    };

    convertNode(document.body);
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        mutation.addedNodes.forEach(convertNode);
        if (mutation.type === 'characterData') {
          convertNode(mutation.target);
        }
      }
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  }, [locale]);

  const value = useMemo<UiLanguageContextValue>(() => ({
    language,
    locale,
    setLanguage,
    t: (key, params) => formatUiText(UI_TEXT[locale][key], params),
  }), [language, locale, setLanguage]);

  return (
    <UiLanguageContext.Provider value={value}>
      {children}
    </UiLanguageContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components -- useUiLanguage is a hook, co-located for context access
export function useUiLanguage(): UiLanguageContextValue {
  return useContext(UiLanguageContext) ?? fallbackContext;
}
