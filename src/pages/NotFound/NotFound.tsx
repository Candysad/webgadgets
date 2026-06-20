import { Link } from 'react-router-dom';
import { useI18n } from '../../i18n';
import styles from './NotFound.module.css';

export function NotFound() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <section className={styles.panel}>
        <p>404</p>
        <h1>{t.notFound.title}</h1>
        <Link to="/">{t.notFound.backHome}</Link>
      </section>
    </main>
  );
}
