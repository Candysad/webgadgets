import type { MouseEvent } from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { HomeButton } from '../../../components/HomeButton';
import { useI18n } from '../../../i18n';
import styles from './ReactionTime.module.css';

type ReactionStatus = 'idle' | 'waiting' | 'ready' | 'result';

const MIN_WAIT_SECONDS = 3;
const MAX_WAIT_SECONDS = 5;

// 在指定秒数范围内随机取整，用于生成每轮等待时长。
const getRandomSeconds = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// 根据当前游戏状态返回页面背景样式，确保交互反馈覆盖整个画面。
const getPageClassName = (status: ReactionStatus) => {
  if (status === 'waiting') {
    return `${styles.page} ${styles.waiting}`;
  }

  if (status === 'ready') {
    return `${styles.page} ${styles.ready}`;
  }

  return `${styles.page} ${styles.idle}`;
};

// 将提示行稳定渲染为多行，避免浏览器在非预期位置自动换行。
const renderPromptLines = (lines: readonly string[]) => {
  return lines.map((line) => (
    <span className={styles.promptLine} key={line}>
      {line}
    </span>
  ));
};

// 反应时间测试页面：等待随机 3-7 秒后变色，并记录变色到点击之间的毫秒差。
export function ReactionTime() {
  const { t } = useI18n();
  const projectText = t.projects.reactionTime;
  const [status, setStatus] = useState<ReactionStatus>('idle');
  const [reactionMs, setReactionMs] = useState<number | null>(null);
  const readyAtRef = useRef<number | null>(null);
  const waitTimerRef = useRef<number | null>(null);

  // 清理等待变色计时器，避免重新开始或离开页面后仍触发状态变化。
  const clearWaitTimer = useCallback(() => {
    if (waitTimerRef.current !== null) {
      window.clearTimeout(waitTimerRef.current);
      waitTimerRef.current = null;
    }
  }, []);

  // 开始新一轮测试：进入水蓝色等待态，并在随机 3-7 秒后切换到红色点击态。
  const startRound = useCallback(() => {
    clearWaitTimer();
    setStatus('waiting');
    setReactionMs(null);
    readyAtRef.current = null;

    const waitSeconds = getRandomSeconds(MIN_WAIT_SECONDS, MAX_WAIT_SECONDS);
    waitTimerRef.current = window.setTimeout(() => {
      readyAtRef.current = performance.now();
      waitTimerRef.current = null;
      setStatus('ready');
    }, waitSeconds * 1000);
  }, [clearWaitTimer]);

  // 处理整屏点击：空闲/结果态开始新一轮，红色点击态计算反应时间。
  const handleScreenClick = useCallback(() => {
    if (status === 'idle' || status === 'result') {
      startRound();
      return;
    }

    if (status !== 'ready' || readyAtRef.current === null) {
      return;
    }

    const nextReactionMs = Math.round(performance.now() - readyAtRef.current);
    readyAtRef.current = null;
    setReactionMs(nextReactionMs);
    setStatus('result');
  }, [startRound, status]);

  // 忽略页面内导航控件点击，避免返回主页时同时触发测试状态变化。
  const handlePageClick = useCallback(
    (event: MouseEvent<HTMLElement>) => {
      if (event.target instanceof HTMLElement && event.target.closest('a, button')) {
        return;
      }

      handleScreenClick();
    },
    [handleScreenClick],
  );

  // 页面卸载时清理等待计时器，避免组件销毁后继续更新状态。
  useEffect(() => {
    return () => clearWaitTimer();
  }, [clearWaitTimer]);

  return (
    <main
      className={getPageClassName(status)}
      aria-label={projectText.ariaGame}
      onClick={handlePageClick}
    >
      <HomeButton />
      <section className={styles.content} aria-live="polite">
        {status === 'result' && reactionMs !== null ? (
          <>
            <p className={styles.result}>{projectText.result.replace('{time}', String(reactionMs))}</p>
            <p className={styles.prompt}>{renderPromptLines(projectText.idlePrompt)}</p>
          </>
        ) : (
          <p className={styles.prompt}>
            {status === 'waiting'
              ? projectText.waitingPrompt
              : status === 'ready'
                ? projectText.readyPrompt
                : renderPromptLines(projectText.idlePrompt)}
          </p>
        )}
      </section>
    </main>
  );
}