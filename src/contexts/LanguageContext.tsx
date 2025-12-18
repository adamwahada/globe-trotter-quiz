import React, { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { translations, Language, TranslationKey } from '@/i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey, params?: Record<string, string | number>) => string;
  isRTL: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const LANGUAGE_STORAGE_KEY = 'worldquiz_language';

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    // Load from localStorage on init
    const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (saved && ['en', 'fr', 'ar'].includes(saved)) {
      return saved as Language;
    }
    return 'en';
  });

  // Persist language to localStorage
  const setLanguage = useCallback((lang: Language) => {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    setLanguageState(lang);
  }, []);

  const t = useCallback((key: TranslationKey, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || translations.en[key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, value]) => {
        text = text.replace(`{${paramKey}}`, String(value));
      });
    }
    
    return text;
  }, [language]);

  const isRTL = language === 'ar';

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL }}>
      <div dir={isRTL ? 'rtl' : 'ltr'}>
        {children}
      </div>
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
