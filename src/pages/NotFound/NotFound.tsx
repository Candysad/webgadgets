import { Link } from 'react-router-dom';
import styles from './NotFound.module.css';

export function NotFound() {
  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p>404</p>
        <h1>这个页面暂时不存在</h1>
        <Link to="/">返回主页</Link>
      </section>
    </main>
  );
}
