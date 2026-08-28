import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { translations, TranslationKey, AppLanguage } from '@/constants/translations';

export type { AppLanguage };

const LANG_KEY = 'app_language';

export const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  lo: 'ລາວ',
  th: 'ไทย',
  en: 'English',
  vi: 'Tiếng Việt',
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  languageLabel: string;
  t: (key: TranslationKey) => string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'lo',
  setLanguage: () => {},
  languageLabel: 'ລາວ',
  t: (key) => translations[key].lo,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('lo');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === 'lo' || val === 'th' || val === 'en' || val === 'vi') {
        setLanguageState(val);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => {
    return translations[key][language] ?? translations[key].lo;
  }, [language]);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      languageLabel: LANGUAGE_LABELS[language],
      t,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

// shortcut hook — ใช้ในทุก component
export function useT() {
  return useContext(LanguageContext).t;
}
