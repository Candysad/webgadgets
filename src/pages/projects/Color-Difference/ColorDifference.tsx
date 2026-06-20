import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HomeButton } from '../../../components/HomeButton';
import { useI18n } from '../../../i18n';
import {
  COLOR_GAME_COLORS,
  COLOR_GAME_CONFIG,
  COLOR_GAME_FONT_SIZES,
  COLOR_GAME_LEVELS,
  COLOR_GAME_TIMING,
} from './constants';
import styles from './ColorDifference.module.css';

type GameStatus = 'idle' | 'playing' | 'finished';

type GameStyleProperties = CSSProperties & Record<`--${string}`, string>;

interface ColorQuestion {
  baseColor: string;
  targetColor: string;
  targetIndex: number;
  level: number;
  difference: number;
}

interface ColorQuestionSeed {
  hue: number;
  saturation: number;
  lightness: number;
  differenceDirection: 1 | -1;
}

// 将秒数格式化为 mm:ss，供倒计时和结算耗时复用。
const formatSeconds = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.ceil(seconds));
  const minutes = Math.floor(safeSeconds / 60);
  const remainingSeconds = safeSeconds % 60;

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// 用简单占位符替换完成动态文案拼接，保持翻译文本集中在 i18n 表中。
const replaceTextParams = (template: string, params: Record<string, string | number>) => {
  return Object.entries(params).reduce(
    (text, [key, value]) => text.replaceAll(`{${key}}`, String(value)),
    template,
  );
};

// 在指定范围内取随机整数，颜色题库、目标下标和题目选择都使用同一工具。
const getRandomInt = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 限制亮度范围，避免目标颜色因为过亮或过暗导致差异不可感知。
const clampLightness = (lightness: number) => {
  return Math.min(78, Math.max(22, lightness));
};

// 生成单个颜色种子；HSL 比直接 RGB 更容易控制“相近但略有差异”的视觉难度。
const createQuestionSeed = (): ColorQuestionSeed => {
  const lightness = getRandomInt(34, 66);
  const differenceDirection = lightness > 50 ? -1 : 1;

  return {
    hue: getRandomInt(0, 359),
    saturation: getRandomInt(48, 82),
    lightness,
    differenceDirection,
  };
};

// 根据等级和种子生成题目，等级越高 lightness 差值越小，视觉上越难分辨。
const createQuestionFromSeed = (
  seed: ColorQuestionSeed,
  level: number,
  targetIndex: number,
): ColorQuestion => {
  const difference = COLOR_GAME_LEVELS[level - 1];
  const targetLightness = clampLightness(seed.lightness + difference * seed.differenceDirection);

  return {
    baseColor: `hsl(${seed.hue} ${seed.saturation}% ${seed.lightness}%)`,
    targetColor: `hsl(${seed.hue} ${seed.saturation}% ${targetLightness}%)`,
    targetIndex,
    level,
    difference,
  };
};

// 预先为 10 个等级各生成 10 个颜色种子，形成稳定题库；每次出题再随机目标位置。
const createQuestionBank = () => {
  return COLOR_GAME_LEVELS.map(() =>
    Array.from({ length: COLOR_GAME_CONFIG.questionBankSizePerLevel }, () => createQuestionSeed()),
  );
};

// 按当前正确数计算等级：每答对 5 题进入下一等级，最多 10 级。
const getCurrentLevel = (correctCount: number) => {
  const nextLevel = Math.floor(correctCount / COLOR_GAME_CONFIG.correctAnswersPerLevel) + 1;

  return Math.min(COLOR_GAME_CONFIG.maxLevel, nextLevel);
};

// 从当前等级题库中抽取一道题，并随机指定 16 个格子中的目标格。
const createNextQuestion = (questionBank: ColorQuestionSeed[][], correctCount: number) => {
  const level = getCurrentLevel(correctCount);
  const levelQuestions = questionBank[level - 1];
  const seed = levelQuestions[getRandomInt(0, levelQuestions.length - 1)];

  return createQuestionFromSeed(seed, level, getRandomInt(0, COLOR_GAME_CONFIG.totalTiles - 1));
};

// 色差识别检测页面：管理一分钟倒计时、颜色题目、错误标记和完成统计。
export function ColorDifference() {
  const { t } = useI18n();
  const projectText = t.projects.colorDifference;
  const [questionBank, setQuestionBank] = useState<ColorQuestionSeed[][]>(() => createQuestionBank());
  const [currentQuestion, setCurrentQuestion] = useState<ColorQuestion | null>(null);
  const [status, setStatus] = useState<GameStatus>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [mistakeIndexes, setMistakeIndexes] = useState<number[]>([]);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [finalElapsedSeconds, setFinalElapsedSeconds] = useState<number | null>(null);
  const mistakeTimersRef = useRef<number[]>([]);

  const remainingSeconds = Math.max(0, COLOR_GAME_CONFIG.totalSeconds - elapsedSeconds);
  const didCompleteAll = correctCount >= COLOR_GAME_CONFIG.maxCorrectAnswers;

  const gameStyle = useMemo(
    (): GameStyleProperties => ({
      '--color-difference-board-background': COLOR_GAME_COLORS.boardBackground,
      '--color-difference-board-border': COLOR_GAME_COLORS.boardBorder,
      '--color-difference-control-background': COLOR_GAME_COLORS.controlBackground,
      '--color-difference-control-border': COLOR_GAME_COLORS.controlBorder,
      '--color-difference-primary-button': COLOR_GAME_COLORS.primaryButton,
      '--color-difference-primary-button-hover': COLOR_GAME_COLORS.primaryButtonHover,
      '--color-difference-danger-button': COLOR_GAME_COLORS.dangerButton,
      '--color-difference-danger-button-hover': COLOR_GAME_COLORS.dangerButtonHover,
      '--color-difference-action-button-text': COLOR_GAME_COLORS.actionButtonText,
      '--color-difference-muted-text': COLOR_GAME_COLORS.mutedText,
      '--color-difference-result-text': COLOR_GAME_COLORS.resultText,
      '--color-difference-mistake-flash': COLOR_GAME_COLORS.mistakeFlash,
      '--color-difference-font-result': COLOR_GAME_FONT_SIZES.result,
      '--color-difference-font-meta': COLOR_GAME_FONT_SIZES.meta,
      '--color-difference-font-timer': COLOR_GAME_FONT_SIZES.timer,
      '--color-difference-font-button': COLOR_GAME_FONT_SIZES.button,
    }),
    [],
  );

  // 清理所有错误闪烁计时器，避免结束或重新开始后旧计时器继续修改状态。
  const clearMistakeTimers = useCallback(() => {
    mistakeTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    mistakeTimersRef.current = [];
  }, []);

  // 结束当前局：停止倒计时并保留答对数量；全部完成时额外记录耗时。
  const finishGame = useCallback(
    (shouldRecordElapsed: boolean) => {
      clearMistakeTimers();
      setStatus('finished');
      setCurrentQuestion(null);
      setStartedAt(null);
      setMistakeIndexes([]);
      setFinalElapsedSeconds(shouldRecordElapsed ? elapsedSeconds : null);
    },
    [clearMistakeTimers, elapsedSeconds],
  );

  // 开始新一局：刷新题库、清空统计、生成第一题，并从 60 秒开始倒计时。
  const startGame = useCallback(() => {
    const nextQuestionBank = createQuestionBank();

    clearMistakeTimers();
    setQuestionBank(nextQuestionBank);
    setCorrectCount(0);
    setMistakeIndexes([]);
    setElapsedSeconds(0);
    setFinalElapsedSeconds(null);
    setStartedAt(Date.now());
    setStatus('playing');
    setCurrentQuestion(createNextQuestion(nextQuestionBank, 0));
  }, [clearMistakeTimers]);

  // 放弃当前局：按结束态展示答对数量，但不记录全部完成耗时。
  const giveUpGame = useCallback(() => {
    finishGame(false);
  }, [finishGame]);

  // 用户点击格子后判断是否为目标格：错误时短暂闪烁，正确时进入下一题或结束游戏。
  const handleTileClick = useCallback(
    (tileIndex: number) => {
      if (status !== 'playing' || currentQuestion === null) {
        return;
      }

      if (tileIndex !== currentQuestion.targetIndex) {
        setMistakeIndexes((currentIndexes) =>
          currentIndexes.includes(tileIndex) ? currentIndexes : [...currentIndexes, tileIndex],
        );

        const timerId = window.setTimeout(() => {
          setMistakeIndexes((currentIndexes) => currentIndexes.filter((index) => index !== tileIndex));
        }, COLOR_GAME_TIMING.mistakeFlashMs);

        mistakeTimersRef.current.push(timerId);
        return;
      }

      const nextCorrectCount = correctCount + 1;
      setCorrectCount(nextCorrectCount);
      setMistakeIndexes([]);

      if (nextCorrectCount >= COLOR_GAME_CONFIG.maxCorrectAnswers) {
        finishGame(true);
        return;
      }

      setCurrentQuestion(createNextQuestion(questionBank, nextCorrectCount));
    },
    [correctCount, currentQuestion, finishGame, questionBank, status],
  );

  // 游戏进行中按固定频率刷新已用时间；倒计时归零时自动结束。
  useEffect(() => {
    if (status !== 'playing' || startedAt === null) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const nextElapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
      setElapsedSeconds(nextElapsedSeconds);

      if (nextElapsedSeconds >= COLOR_GAME_CONFIG.totalSeconds) {
        finishGame(false);
      }
    }, COLOR_GAME_TIMING.timerTickMs);

    return () => window.clearInterval(intervalId);
  }, [finishGame, startedAt, status]);

  // 页面卸载时清理错误闪烁计时器，避免组件销毁后继续触发状态更新。
  useEffect(() => {
    return () => clearMistakeTimers();
  }, [clearMistakeTimers]);

  return (
    <main className={styles.page} style={gameStyle}>
      <HomeButton />
      <section className={styles.shell} aria-label={projectText.ariaGame}>
        <div className={styles.playArea}>
          <div className={styles.resultPanel}>
            <p className={styles.meta}>
              {replaceTextParams(projectText.levelHint, {
                level: currentQuestion?.level ?? getCurrentLevel(correctCount),
                difference: currentQuestion?.difference ?? COLOR_GAME_LEVELS[getCurrentLevel(correctCount) - 1],
              })}
            </p>
          </div>

          <div className={styles.board} aria-label={projectText.boardLabel}>
            {status === 'finished' ? (
              <div className={styles.resultBoard}>
                <p className={styles.result}>
                  {replaceTextParams(projectText.correctResult, { count: correctCount })}
                </p>
                {didCompleteAll && finalElapsedSeconds !== null ? (
                  <p className={styles.meta}>
                    {replaceTextParams(projectText.completedTime, {
                      time: formatSeconds(finalElapsedSeconds),
                    })}
                  </p>
                ) : null}
              </div>
            ) : currentQuestion === null ? (
              <div className={styles.emptyBoard}>{projectText.emptyBoard}</div>
            ) : (
              Array.from({ length: COLOR_GAME_CONFIG.totalTiles }, (_, tileIndex) => {
                const isTarget = tileIndex === currentQuestion.targetIndex;
                const isMistake = mistakeIndexes.includes(tileIndex);

                return (
                  <button
                    aria-label={replaceTextParams(projectText.tileLabel, { index: tileIndex + 1 })}
                    className={`${styles.tile} ${isMistake ? styles.mistake : ''}`}
                    key={tileIndex}
                    onClick={() => handleTileClick(tileIndex)}
                    style={{
                      backgroundColor: isTarget
                        ? currentQuestion.targetColor
                        : currentQuestion.baseColor,
                    }}
                    type="button"
                  />
                );
              })
            )}
          </div>
        </div>

        <aside className={styles.controls} aria-label={projectText.controlArea}>
          <button
            className={`${styles.actionButton} ${styles.primaryAction}`}
            disabled={status === 'playing'}
            onClick={startGame}
            type="button"
          >
            {status === 'finished' ? projectText.restart : projectText.start}
          </button>

          <button
            className={`${styles.actionButton} ${styles.dangerAction}`}
            disabled={status !== 'playing'}
            onClick={giveUpGame}
            type="button"
          >
            {projectText.giveUp}
          </button>

          <div className={styles.stats}>
            <div className={styles.statRow} aria-live="polite">
              <span>{projectText.timer}</span>
              <span>{formatSeconds(remainingSeconds)}</span>
            </div>
            <div className={styles.statRow}>
              <span>{projectText.correctCount}</span>
              <span>{correctCount}</span>
            </div>
            <div className={styles.statRow}>
              <span>{projectText.level}</span>
              <span>{currentQuestion?.level ?? getCurrentLevel(correctCount)}</span>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
