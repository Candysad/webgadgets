import { ArrowLeft, ArrowRight } from 'lucide-react';
import type { CSSProperties } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HomeButton } from '../../../components/HomeButton';
import {
  GAME_COLORS,
  GAME_FONT_SIZES,
  GAME_STATS,
  GAME_TIMING,
  GRID_SIZE_LIMITS,
} from './constants';
import styles from './NumberSequenceGrid.module.css';

type TileFeedback = 'correct' | 'wrong' | null;

type GameStyleProperties = CSSProperties & Record<`--${string}`, string>;

interface TileItem {
  id: number;
  value: number;
  feedback: TileFeedback;
  cleared: boolean;
}

// 将毫秒计时统一格式化为秒，保留两位小数，供计时器和完成结果复用。
const formatElapsedSeconds = (elapsedMs: number) => `${(elapsedMs / 1000).toFixed(2)} s`;

// 计算最近若干次完成耗时的平均值；没有成绩时返回 null，方便界面展示占位文案。
const calculateAverageElapsedMs = (results: number[]) => {
  if (results.length === 0) {
    return null;
  }

  const totalElapsedMs = results.reduce((sum, resultMs) => sum + resultMs, 0);

  return totalElapsedMs / results.length;
};

// 根据当前方格边长生成从 1 到 x*x 的目标数字序列。
const createOrderedValues = (gridSize: number) => {
  const totalTiles = gridSize * gridSize;

  return Array.from({ length: totalTiles }, (_, index) => index + 1);
};

// 打乱数字序列，让每一局开始时数字都随机分布在方框中。
const shuffleValues = (values: number[]) => {
  return [...values].sort(() => Math.random() - 0.5);
};

// 把随机数字序列转换为渲染用的方格模型，并初始化反馈状态与点击完成状态。
const createTiles = (gridSize: number): TileItem[] => {
  return shuffleValues(createOrderedValues(gridSize)).map((value, index) => ({
    id: index,
    value,
    feedback: null,
    cleared: false,
  }));
};

// 将 x 限制在题目要求的 2 至 5 之间，键盘和按钮都复用这套边界逻辑。
const clampGridSize = (nextGridSize: number) => {
  return Math.min(GRID_SIZE_LIMITS.max, Math.max(GRID_SIZE_LIMITS.min, nextGridSize));
};

// 渲染顺序点击数字方格小游戏，并管理 x 调整、随机填数、点击反馈和计时流程。
export function NumberSequenceGrid() {
  const [gridSize, setGridSize] = useState(3);
  const [tiles, setTiles] = useState<TileItem[]>([]);
  const [nextExpectedValue, setNextExpectedValue] = useState(1);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [bestResultMs, setBestResultMs] = useState<number | null>(null);
  const [recentResultsMs, setRecentResultsMs] = useState<number[]>([]);
  const feedbackTimersRef = useRef<number[]>([]);

  const isPlaying = startedAt !== null;
  const totalTiles = gridSize * gridSize;
  const averageElapsedMs = useMemo(
    () => calculateAverageElapsedMs(recentResultsMs),
    [recentResultsMs],
  );

  const boardStyle = useMemo(
    (): GameStyleProperties => ({
      gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
      gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
      '--game-board-background': GAME_COLORS.boardBackground,
      '--game-board-border': GAME_COLORS.boardBorder,
      '--game-tile-background': GAME_COLORS.tileBackground,
      '--game-tile-border': GAME_COLORS.tileBorder,
      '--game-tile-text': GAME_COLORS.tileText,
      '--game-correct-feedback': GAME_COLORS.correctFeedback,
      '--game-correct-feedback-text': GAME_COLORS.correctFeedbackText,
      '--game-wrong-feedback': GAME_COLORS.wrongFeedback,
      '--game-wrong-feedback-text': GAME_COLORS.wrongFeedbackText,
      '--game-muted-text': GAME_COLORS.mutedText,
      '--game-font-tile': GAME_FONT_SIZES.tile,
      '--game-font-control-label': GAME_FONT_SIZES.controlLabel,
    }),
    [gridSize],
  );

  const controlStyle = useMemo(
    (): GameStyleProperties => ({
      '--game-control-background': GAME_COLORS.controlBackground,
      '--game-control-border': GAME_COLORS.controlBorder,
      '--game-primary-button': GAME_COLORS.primaryButton,
      '--game-primary-button-hover': GAME_COLORS.primaryButtonHover,
      '--game-danger-button': GAME_COLORS.dangerButton,
      '--game-danger-button-hover': GAME_COLORS.dangerButtonHover,
      '--game-action-button-text': GAME_COLORS.actionButtonText,
      '--game-muted-text': GAME_COLORS.mutedText,
      '--game-font-timer': GAME_FONT_SIZES.timer,
      '--game-font-control-label': GAME_FONT_SIZES.controlLabel,
      '--game-font-grid-value': GAME_FONT_SIZES.gridValue,
      '--game-font-button': GAME_FONT_SIZES.button,
    }),
    [],
  );

  const resultStyle = useMemo(
    (): GameStyleProperties => ({
      '--game-result-text': GAME_COLORS.resultText,
      '--game-average-text': GAME_COLORS.averageText,
      '--game-font-result': GAME_FONT_SIZES.result,
      '--game-font-average': GAME_FONT_SIZES.average,
    }),
    [],
  );

  // 清除所有短暂反馈计时器，避免用户停止或重新开始后旧计时器继续修改格子状态。
  const clearFeedbackTimers = useCallback(() => {
    feedbackTimersRef.current.forEach((timerId) => window.clearTimeout(timerId));
    feedbackTimersRef.current = [];
  }, []);

  // 重置当前局的棋盘状态；放弃和调整 x 都需要先清空旧方格、停止计时并移除完成结果。
  const resetGameState = useCallback(() => {
    clearFeedbackTimers();
    setTiles([]);
    setNextExpectedValue(1);
    setStartedAt(null);
    setElapsedMs(0);
    setBestResultMs(null);
  }, [clearFeedbackTimers]);

  // 修改方格边长，范围固定在 2 至 5；变更前先清空当前局，避免旧方格套进新的 x*x 布局。
  const updateGridSize = useCallback(
    (offset: number) => {
      resetGameState();
      setRecentResultsMs([]);
      setGridSize((currentGridSize) => clampGridSize(currentGridSize + offset));
    },
    [resetGameState],
  );

  // 开始新一局：生成随机数字方格，清空上次结果，并记录计时起点。
  const startGame = useCallback(() => {
    clearFeedbackTimers();
    setTiles(createTiles(gridSize));
    setNextExpectedValue(1);
    setElapsedMs(0);
    setBestResultMs(null);
    setStartedAt(Date.now());
  }, [clearFeedbackTimers, gridSize]);

  // 放弃当前局：清空方框内的格子、重置计时器，并移除所有临时反馈状态。
  const stopGame = useCallback(() => {
    resetGameState();
  }, [resetGameState]);

  // 给指定方格添加 0.2 秒的正确或错误颜色反馈，时间结束后恢复默认颜色。
  const flashTile = useCallback((tileId: number, feedback: Exclude<TileFeedback, null>) => {
    setTiles((currentTiles) =>
      currentTiles.map((tile) => (tile.id === tileId ? { ...tile, feedback } : tile)),
    );

    const timerId = window.setTimeout(() => {
      setTiles((currentTiles) =>
        currentTiles.map((tile) => (tile.id === tileId ? { ...tile, feedback: null } : tile)),
      );
    }, GAME_TIMING.feedbackMs);

    feedbackTimersRef.current.push(timerId);
  }, []);

  // 完成最后一个数字时停止计时，并将本局总耗时展示到方框正上方。
  const finishGame = useCallback(
    (finishedAt: number) => {
      const finalElapsedMs = startedAt === null ? elapsedMs : finishedAt - startedAt;

      setElapsedMs(finalElapsedMs);
      setBestResultMs(finalElapsedMs);
      setRecentResultsMs((currentResults) =>
        [...currentResults, finalElapsedMs].slice(-GAME_STATS.recentLimit),
      );
      setStartedAt(null);
    },
    [elapsedMs, startedAt],
  );

  // 处理用户点击方格：只有点击当前期望数字才推进序列，否则只展示错误反馈。
  const handleTileClick = useCallback(
    (tileId: number, tileValue: number) => {
      if (!isPlaying) {
        return;
      }

      if (tileValue !== nextExpectedValue) {
        flashTile(tileId, 'wrong');
        return;
      }

      flashTile(tileId, 'correct');
      setTiles((currentTiles) =>
        currentTiles.map((tile) => (tile.id === tileId ? { ...tile, cleared: true } : tile)),
      );

      if (nextExpectedValue === totalTiles) {
        finishGame(Date.now());
        return;
      }

      setNextExpectedValue((currentValue) => currentValue + 1);
    },
    [finishGame, flashTile, isPlaying, nextExpectedValue, totalTiles],
  );

  // 每 50ms 刷新一次计时器显示；计时起点不存在时不启动 interval。
  useEffect(() => {
    if (startedAt === null) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, GAME_TIMING.timerTickMs);

    return () => window.clearInterval(intervalId);
  }, [startedAt]);

  // 支持键盘左右方向键调节 x，和界面上的左右按钮保持同一套边界逻辑。
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isPlaying) {
        return;
      }

      if (event.key === 'ArrowLeft') {
        updateGridSize(-1);
      }

      if (event.key === 'ArrowRight') {
        updateGridSize(1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, updateGridSize]);

  // 页面卸载时清理反馈计时器，避免组件销毁后仍触发状态更新。
  useEffect(() => {
    return () => clearFeedbackTimers();
  }, [clearFeedbackTimers]);

  return (
    <main className={styles.page}>
      <HomeButton />
      <section className={styles.shell} aria-label="顺序点击数字游戏">
        <div className={styles.playArea}>
          <div className={styles.resultPanel} style={resultStyle}>
            <p className={styles.result}>
              {bestResultMs === null ? ' ' : `完成用时：${formatElapsedSeconds(bestResultMs)}`}
            </p>
            <p className={styles.averageResult}>
              {averageElapsedMs === null
                ? '最近 10 次平均：暂无'
                : `最近 10 次平均：${formatElapsedSeconds(averageElapsedMs)}`}
            </p>
          </div>

          <div className={styles.board} style={boardStyle} aria-label={`${gridSize} 乘 ${gridSize} 数字方框`}>
            {tiles.length === 0 ? (
              <div className={styles.emptyBoard}>点击开始后生成 {gridSize} x {gridSize} 数字方格</div>
            ) : (
              tiles.map((tile) => (
                <button
                  className={`${styles.tile} ${tile.feedback === 'correct' ? styles.correct : ''} ${
                    tile.feedback === 'wrong' ? styles.wrong : ''
                  }`}
                  disabled={tile.cleared}
                  key={tile.id}
                  onClick={() => handleTileClick(tile.id, tile.value)}
                  type="button"
                >
                  {tile.value}
                </button>
              ))
            )}
          </div>
        </div>

        <aside className={styles.controls} style={controlStyle} aria-label="游戏控制区">
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>方格边长 x</span>
            <div className={styles.sizePicker}>
              <button
                aria-label="减小 x"
                className={styles.iconButton}
                disabled={isPlaying || gridSize === GRID_SIZE_LIMITS.min}
                onClick={() => updateGridSize(-1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={18} />
              </button>
              <strong className={styles.gridValue}>{gridSize}</strong>
              <button
                aria-label="增大 x"
                className={styles.iconButton}
                disabled={isPlaying || gridSize === GRID_SIZE_LIMITS.max}
                onClick={() => updateGridSize(1)}
                type="button"
              >
                <ArrowRight aria-hidden="true" size={18} />
              </button>
            </div>
          </div>

          <button
            className={`${styles.actionButton} ${styles.primaryAction}`}
            disabled={isPlaying}
            onClick={startGame}
            type="button"
          >
            开始
          </button>

          <button
            className={`${styles.actionButton} ${styles.dangerAction}`}
            disabled={!isPlaying && tiles.length === 0}
            onClick={stopGame}
            type="button"
          >
            放弃
          </button>

          <div className={styles.timer} aria-live="polite">
            <span>计时器</span>
            <span>{formatElapsedSeconds(elapsedMs)}</span>
          </div>
          <p className={styles.timerAverage} aria-live="polite">
            {averageElapsedMs === null
              ? '最近 10 次平均：暂无'
              : `最近 10 次平均：${formatElapsedSeconds(averageElapsedMs)}`}
          </p>
        </aside>
      </section>
    </main>
  );
}
