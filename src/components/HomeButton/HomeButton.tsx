import { Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import styles from './HomeButton.module.css';

// 在所有小项目页面左上角提供固定位置的主页入口，保持子页面导航一致。
export function HomeButton() {
  return (
    <Link className={styles.homeButton} to="/" aria-label="返回主页">
      <Home aria-hidden="true" size={18} />
      <span>主页</span>
    </Link>
  );
}
