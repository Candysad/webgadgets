import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import styles from './HomeButton.module.css';

// 在所有小项目页面左上角提供固定位置的主页入口，保持子页面导航一致。
export function HomeButton() {
  const { t } = useI18n();

  return (
    <Link className={styles.homeButton} to="/" aria-label={t.common.backHome}>
      <Home aria-hidden="true" size={18} />
      <span>{t.common.home}</span>
    </Link>
  );
}
