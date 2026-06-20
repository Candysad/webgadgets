import { Languages } from 'lucide-react';
import { LANGUAGE_LABELS, useI18n } from '../../i18n';
import styles from './LanguageSwitcher.module.css';

// 在整个站点右上角提供中英文切换入口，所有页面共享同一个语言状态。
export function LanguageSwitcher() {
  const { language, switchLanguage, t } = useI18n();
  const nextLanguage = language === 'zh' ? 'en' : 'zh';

  return (
    <button
      aria-label={t.common.languageToggle}
      className={styles.switcher}
      onClick={switchLanguage}
      type="button"
    >
      <Languages aria-hidden="true" size={18} />
      <span>{LANGUAGE_LABELS[nextLanguage]}</span>
    </button>
  );
}
