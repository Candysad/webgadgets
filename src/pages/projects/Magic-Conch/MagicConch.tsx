import { useMemo, useRef, useState } from 'react';
import { HomeButton } from '../../../components/HomeButton';
import { type Language, useI18n } from '../../../i18n';
import styles from './MagicConch.module.css';

const MAGIC_CONCH_ASSET_BASE = `${import.meta.env.BASE_URL}assets/magic-conch`;

const MAGIC_CONCH_AUDIO_FILES: Record<Language, string[]> = {
  zh: [
    'Chinese/都不行.mp3',
    'Chinese/请再问一遍.mp3',
    'Chinese/可能会有这么一天.mp3',
    'Chinese/可以.mp3',
    'Chinese/什么都不做~.mp3',
    'Chinese/什么都不做.mp3',
    'Chinese/不能.mp3',
  ],
  en: [
    'English/Yes.mp3',
    'English/TryAskAgain.mp3',
    'English/Nothing.mp3',
    'English/No.mp3',
    'English/MayBeSomeDay.mp3',
    'English/IDontThinkSo.mp3',
  ],
};

// 拼接 public 静态资源路径，并编码中文文件名，保证本地和 GitHub Pages 都能访问。
const createAssetUrl = (relativePath: string) => {
  return `${MAGIC_CONCH_ASSET_BASE}/${relativePath
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/')}`;
};

// 从当前语言音频库中随机取一个音频 URL。
const getRandomAudioUrl = (language: Language) => {
  const audioFiles = MAGIC_CONCH_AUDIO_FILES[language];
  const audioFile = audioFiles[Math.floor(Math.random() * audioFiles.length)];

  return createAssetUrl(audioFile);
};

// 魔法海螺页面：点击海螺图片按钮后按当前语言随机播放一条回答音频。
export function MagicConch() {
  const { language, t } = useI18n();
  const projectText = t.projects.magicConch;
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const conchImageUrl = useMemo(() => createAssetUrl('conch.jpeg'), []);

  // 停止上一条音频并播放当前语言随机回答。
  const askMagicConch = () => {
    if (audioRef.current !== null) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    const nextAudio = new Audio(getRandomAudioUrl(language));
    audioRef.current = nextAudio;
    setIsPlaying(true);

    nextAudio.addEventListener('ended', () => setIsPlaying(false), { once: true });
    nextAudio.addEventListener('error', () => setIsPlaying(false), { once: true });
    void nextAudio.play().catch(() => setIsPlaying(false));
  };

  return (
    <main className={styles.page} aria-label={projectText.ariaGame}>
      <HomeButton />
      <section className={styles.shell}>
        <div className={styles.header}>
          <p className={styles.kicker}>{projectText.kicker}</p>
          <h1>{projectText.title}</h1>
          <p>{projectText.description}</p>
        </div>

        <div className={styles.conchFrame}>
          <button
            aria-label={projectText.askButton}
            className={`${styles.conchButton} ${isPlaying ? styles.conchButtonActive : ''}`}
            onClick={askMagicConch}
            type="button"
          >
            <img alt={projectText.imageAlt} className={styles.conchImage} src={conchImageUrl} />
          </button>
        </div>

        <button className={styles.askButton} disabled={isPlaying} onClick={askMagicConch} type="button">
          {projectText.askButton}
        </button>
      </section>
    </main>
  );
}
