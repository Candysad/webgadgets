import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { type Language, type TranslationMessages, translations } from './translations';

interface I18nContextValue {
  language: Language;
  switchLanguage: () => void;
  t: TranslationMessages;
}

const I18nContext = createContext<I18nContextValue | null>(null);

// 为整个应用提供当前语言、切换方法和翻译文本，暂时只支持中英文两种语言。
export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');

  // 在中文和英文之间切换，所有使用 t 的组件会随 context 更新自动刷新文本。
  const switchLanguage = useCallback(() => {
    setLanguage((currentLanguage) => (currentLanguage === 'zh' ? 'en' : 'zh'));
  }, []);

  const value = useMemo(
    () => ({
      language,
      switchLanguage,
      t: translations[language],
    }),
    [language, switchLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// 读取 i18n 上下文；如果组件没有包在 Provider 内，直接抛错暴露接入问题。
export function useI18n() {
  const context = useContext(I18nContext);

  if (context === null) {
    throw new Error('useI18n must be used within I18nProvider');
  }

  return context;
}
