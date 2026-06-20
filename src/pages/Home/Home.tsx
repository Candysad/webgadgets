import { ArrowUpRight, Gamepad2, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projects } from '../../data/projects';
import { useI18n } from '../../i18n';
import styles from './Home.module.css';

const categoryIcons = {
  game: Gamepad2,
  tool: Wrench,
};

export function Home() {
  const { t } = useI18n();

  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p className={styles.kicker}>{t.common.appName}</p>
        <h1>{t.home.title}</h1>
        <p className={styles.summary}>{t.home.summary}</p>
      </section>

      <section className={styles.grid} aria-label={t.home.projectList}>
        {projects.map((project) => {
          const Icon = categoryIcons[project.category];
          const isDraft = project.status === 'draft';
          const projectText = t.projects[project.translationKey];

          return (
            <article className={styles.card} key={project.id}>
              <div className={styles.cardTopline}>
                <span className={styles.category}>
                  <Icon aria-hidden="true" size={16} />
                  {t.home.category[project.category]}
                </span>
                <span className={isDraft ? styles.draft : styles.ready}>
                  {t.home.status[project.status]}
                </span>
              </div>

              <h2>{projectText.title}</h2>
              <p>{projectText.description}</p>

              <Link className={styles.link} to={project.path} aria-disabled={isDraft}>
                {t.home.open}
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
