import { ArrowUpRight, Gamepad2, Wrench } from 'lucide-react';
import { Link } from 'react-router-dom';
import { projects } from '../../data/projects';
import styles from './Home.module.css';

const categoryLabels = {
  game: '小游戏',
  tool: '小工具',
};

const categoryIcons = {
  game: Gamepad2,
  tool: Wrench,
};

export function Home() {
  return (
    <main className={styles.page}>
      <section className={styles.header}>
        <p className={styles.kicker}>Web Gadgets</p>
        <h1>静态网页小项目合集</h1>
        <p className={styles.summary}>把好玩的小游戏、顺手的小工具收在一个统一主题的网站里。</p>
      </section>

      <section className={styles.grid} aria-label="项目列表">
        {projects.map((project) => {
          const Icon = categoryIcons[project.category];
          const isDraft = project.status === 'draft';

          return (
            <article className={styles.card} key={project.id}>
              <div className={styles.cardTopline}>
                <span className={styles.category}>
                  <Icon aria-hidden="true" size={16} />
                  {categoryLabels[project.category]}
                </span>
                <span className={isDraft ? styles.draft : styles.ready}>
                  {isDraft ? '开发中' : '可用'}
                </span>
              </div>

              <h2>{project.title}</h2>
              <p>{project.description}</p>

              <Link className={styles.link} to={project.path} aria-disabled={isDraft}>
                打开
                <ArrowUpRight aria-hidden="true" size={16} />
              </Link>
            </article>
          );
        })}
      </section>
    </main>
  );
}
