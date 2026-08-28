import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLanguage = 'lo' | 'th' | 'en';

const LANG_KEY = 'app_language';

const LANGUAGE_LABELS: Record<AppLanguage, string> = {
  lo: 'ລາວ',
  th: 'ไทย',
  en: 'English',
};

type LanguageContextType = {
  language: AppLanguage;
  setLanguage: (lang: AppLanguage) => void;
  languageLabel: string;
};

const LanguageContext = createContext<LanguageContextType>({
  language: 'lo',
  setLanguage: () => {},
  languageLabel: 'ລາວ',
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<AppLanguage>('lo');

  useEffect(() => {
    AsyncStorage.getItem(LANG_KEY).then((val) => {
      if (val === 'lo' || val === 'th' || val === 'en') {
        setLanguageState(val);
      }
    });
  }, []);

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang);
    AsyncStorage.setItem(LANG_KEY, lang);
  }, []);

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      languageLabel: LANGUAGE_LABELS[language],
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

export { LANGUAGE_LABELS };
