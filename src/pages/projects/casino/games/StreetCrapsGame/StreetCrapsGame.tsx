import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import MarkdownIt from 'markdown-it';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { GameState, StreetCrapsGame as StreetCrapsGameEngine, type StreetCrapsStatus } from '../../../../../../packages/streetcraps/src';
import tipsMarkdown from '../../../../../../packages/streetcraps/Expected-Value-of-Dice.zh.md?raw';
import { useI18n } from '../../../../../i18n';
import { useWallet } from '../../WalletContext';
import styles from './StreetCrapsGame.module.css';

const DICE_BASE = `${import.meta.env.BASE_URL}assets/dice/`;

function getDiceSrc(value: number): string {
  return `${DICE_BASE}${value}.svg`;
}

/**
 * 渲染混合 Markdown + KaTeX 的文本。
 * 先用 KaTeX 渲染所有 $...$ 和 $$...$$ 数学块，
 * 将其替换为占位符，再交由 markdown-it 处理其余 Markdown，
 * 最后把占位符替换回 KaTeX HTML。
 */
function renderMarkdownWithKatex(md: ReturnType<typeof MarkdownIt>, text: string): string {
  const protectedBlocks: string[] = [];
  const MARK = 'KATEXBLOCK';

  // 1. 保护 $$...$$ 显示公式
  let processed = text.replace(/\$\$([\s\S]*?)\$\$/g, (_full: string, math: string) => {
    const html = katex.renderToString(math.trim(), {
      displayMode: true,
      throwOnError: false,
      strict: false,
    });
    const idx = protectedBlocks.length;
    protectedBlocks.push(html);
    return `${MARK}${idx}${MARK}`;
  });

  // 2. 保护 $...$ 内联公式
  processed = processed.replace(/\$(.+?)\$/g, (_full: string, math: string) => {
    const html = katex.renderToString(math.trim(), {
      displayMode: false,
      throwOnError: false,
      strict: false,
    });
    const idx = protectedBlocks.length;
    protectedBlocks.push(html);
    return `${MARK}${idx}${MARK}`;
  });

  // 3. 用 markdown-it 渲染其余部分
  let html = md.render(processed);

  // 4. 还原 KaTeX HTML
  const placeholderRe = new RegExp(`${MARK}(\\d+)${MARK}`, 'g');
  html = html.replace(placeholderRe, (_full: string, idx: string) => {
    return protectedBlocks[Number(idx)];
  });

  return html;
}

export function StreetCrapsGame() {
  const { t } = useI18n();
  const { wallet, hideWallet, deduct, add } = useWallet();

  const markdownParser = useMemo(
    () => new MarkdownIt({ html: true, linkify: true, typographer: true }),
    [],
  );

  const tipsHtml = useMemo(
    () => renderMarkdownWithKatex(markdownParser, tipsMarkdown),
    [markdownParser],
  );

  const gameRef = useRef(new StreetCrapsGameEngine());
  const settledRef = useRef(false);

  const [status, setStatus] = useState<StreetCrapsStatus>(() => gameRef.current.getStatus());
  const [showRules, setShowRules] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [betText, setBetText] = useState(String(gameRef.current.minBet));
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    hideWallet();
  }, [hideWallet]);

  const { state, point, lastRoll, lastDice, winner } = status;
  const isFinished = gameRef.current.isRoundFinished(status);
  const isBetting = state === GameState.NOT_STARTED || isFinished;
  const isRolling = state === GameState.COME_OUT_ROLL || state === GameState.POINT;
  const notEnoughFunds = wallet.balance < gameRef.current.minBet;

  useEffect(() => {
    if (!isFinished || settledRef.current) return;
    settledRef.current = true;

    const { payout } = gameRef.current.settle();
    if (payout > 0) {
      add(payout);
      setProfit(payout);
    }
  }, [add, isFinished]);

  const syncBet = (text: string) => {
    const min = gameRef.current.minBet;
    const n = Math.max(min, Math.min(wallet.balance, Math.ceil(Number(text.replace(/,/g, '')) || 0)));
    setBetText(String(n));
  };

  const handleBetChange = (text: string) => {
    setBetText(text);
  };

  const handleBetBlur = () => {
    syncBet(betText);
  };

  const handleFraction = (num: number, den: number) => {
    const min = gameRef.current.minBet;
    const val = Math.max(min, Math.min(wallet.balance, Math.ceil((wallet.balance * num) / den)));
    setBetText(String(val));
  };

  const handleStart = () => {
    const currentBet = gameRef.current.placeBet(
      Number(betText.replace(/,/g, '')) || 0,
      wallet.balance,
    );
    setBetText(String(currentBet));
    setProfit(0);

    if (currentBet < gameRef.current.minBet) return;

    deduct(currentBet);
    settledRef.current = false;
    gameRef.current.startRound();
    setStatus(gameRef.current.getStatus());
  };

  const handleRoll = () => {
    gameRef.current.roll();
    setStatus(gameRef.current.getStatus());
  };

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/Casino">
        <ArrowLeft aria-hidden="true" size={18} />
        {t.casino.backToLobby}
      </Link>

      <div className={styles.table}>
        <div className={styles.diceRow}>
          {lastDice ? (
            <>
              <div className={styles.die} aria-label={`${t.casino.streetcraps.dieLabel} 1`}>
                <img className={styles.dieImage} src={getDiceSrc(lastDice[0])} alt={`${t.casino.streetcraps.dieLabel} ${lastDice[0]}`} />
              </div>
              <div className={styles.die} aria-label={`${t.casino.streetcraps.dieLabel} 2`}>
                <img className={styles.dieImage} src={getDiceSrc(lastDice[1])} alt={`${t.casino.streetcraps.dieLabel} ${lastDice[1]}`} />
              </div>
            </>
          ) : (
            <>
              <div className={styles.diePlaceholder} />
              <div className={styles.diePlaceholder} />
            </>
          )}
        </div>

        <div className={styles.statusCard}>
          <p className={styles.statusTitle}>{statusLabel(t, state, point)}</p>
          <p className={styles.statusDetail}>{detailLabel(t, state, point, lastRoll)}</p>
        </div>
      </div>

      <div className={styles.controls}>
        {isBetting && (
          <div className={styles.buttonColumn}>
            <button className={styles.startButton} disabled={notEnoughFunds} onClick={handleStart} type="button">
              {isFinished ? t.casino.streetcraps.playAgain : t.casino.streetcraps.start}
            </button>
            {notEnoughFunds && <p className={styles.noFundsHint}>{t.casino.streetcraps.noFunds}</p>}
          </div>
        )}
        {isRolling && (
          <button className={styles.rollButton} onClick={handleRoll} type="button">
            {t.casino.streetcraps.roll}
          </button>
        )}
      </div>

      {isFinished && winner && (
        <div className={styles.resultBar}>{resultLabel(t, winner)}</div>
      )}

      <div className={styles.bettingBar}>
        <div className={styles.bettingRow}>
          <label className={styles.bettingLabel}>{t.casino.streetcraps.bet}</label>
          <div className={styles.bettingInputWrap}>
            <span className={styles.bettingPrefix}>$</span>
            <input
              className={styles.bettingInput}
              disabled={!isBetting}
              inputMode="numeric"
              onChange={(e) => handleBetChange(e.target.value)}
              onBlur={handleBetBlur}
              type="text"
              value={betText}
            />
          </div>
          {profit > 0 && <span className={styles.profit}>+{profit}</span>}
        </div>
        {isBetting && (
          <div className={styles.fractionRow}>
            <button className={styles.fractionBtn} onClick={() => handleFraction(1, 4)} type="button">¼</button>
            <button className={styles.fractionBtn} onClick={() => handleFraction(1, 2)} type="button">½</button>
            <button className={styles.fractionBtn} onClick={() => handleFraction(1, 1)} type="button">All In</button>
          </div>
        )}
      </div>

      <div className={styles.ruleTipRow}>
        <button className={styles.rulesButton} onClick={() => setShowRules((v) => !v)} type="button">
          <BookOpen aria-hidden="true" size={16} />
          <span>{t.casino.streetcraps.rulesButton}</span>
        </button>
        <button className={styles.rulesButton} onClick={() => setShowTips((v) => !v)} type="button">
          <Lightbulb aria-hidden="true" size={16} />
          <span>{t.casino.streetcraps.tipsButton}</span>
        </button>
      </div>

      {showRules && (
        <div className={styles.rulesPanel}>
          <h3>{t.casino.streetcraps.rulesTitle}</h3>
          <ul>
            {t.casino.streetcraps.rules.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      {showTips && (
        <div className={styles.rulesPanel}>
          <h3>{t.casino.streetcraps.tipsTitle}</h3>
          <div
            className={styles.tipsMarkdown}
            dangerouslySetInnerHTML={{ __html: tipsHtml }}
          />
        </div>
      )}
    </div>
  );
}

function statusLabel(t: ReturnType<typeof useI18n>['t'], state: GameState, point: number | null) {
  if (state === GameState.NOT_STARTED) return t.casino.streetcraps.readyText;
  if (state === GameState.COME_OUT_ROLL) return t.casino.streetcraps.comeOutText;
  if (state === GameState.POINT) return `${t.casino.streetcraps.targetLabel}: ${point ?? '-'}`;
  return t.casino.streetcraps.roundOverText;
}

function detailLabel(t: ReturnType<typeof useI18n>['t'], state: GameState, _point: number | null, lastRoll: number | null) {
  if (state === GameState.COME_OUT_ROLL) return t.casino.streetcraps.comeOutHint;
  if (state === GameState.POINT) {
    return `${t.casino.streetcraps.currentRollLabel}: ${lastRoll ?? '-'}`;
  }
  if (lastRoll !== null) {
    return `${t.casino.streetcraps.lastRollLabel}: ${lastRoll}`;
  }
  return t.casino.streetcraps.readyDetail;
}

function resultLabel(t: ReturnType<typeof useI18n>['t'], winner: 'user' | 'dealer') {
  return winner === 'user' ? t.casino.streetcraps.win : t.casino.streetcraps.lose;
}
