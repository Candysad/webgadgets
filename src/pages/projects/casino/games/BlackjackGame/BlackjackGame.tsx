import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Blackjack, GameState, type Card, type GameStatus } from 'blackjack';
import { useI18n } from '../../../../../i18n';
import { useWallet } from '../../WalletContext';
import styles from './BlackjackGame.module.css';

const CARD_BASE = `${import.meta.env.BASE_URL}assets/cards/`;
const MIN_BET = 100;

function getCardSrc(card: Card): string {
  return `${CARD_BASE}${card.rank}${card.suit}.svg`;
}

function clampBet(raw: number, balance: number): number {
  return Math.max(MIN_BET, Math.min(balance, Math.ceil(raw)));
}

export function BlackjackGame() {
  const { t } = useI18n();
  const { wallet, hideWallet, deduct, add } = useWallet();

  const gameRef = useRef(new Blackjack());
  const settledRef = useRef(false);
  const betRef = useRef(MIN_BET);

  const [status, setStatus] = useState<GameStatus>(() => gameRef.current.getStatus());
  const [showRules, setShowRules] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [betText, setBetText] = useState(String(MIN_BET));
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    hideWallet();
  }, [hideWallet]);

  // ── 结算 ──

  const { state, userCards, dealerCards, userScore, dealerScore, winner, userIsBlackjack } = status;

  const isPlaying = state === GameState.DEALING_TO_USER;
  const isFinished = state === GameState.USER_WINS || state === GameState.DEALER_WINS || state === GameState.PUSH;
  const isInitial = state === GameState.NOT_STARTED;
  const isBetting = isInitial || isFinished;
  const notEnoughFunds = wallet.balance < MIN_BET;

  useEffect(() => {
    if (!isFinished || settledRef.current) return;
    settledRef.current = true;

    const finalBet = betRef.current;
    let multiplier = 0;
    if (state === GameState.PUSH) {
      multiplier = 1;
    } else if (state === GameState.USER_WINS) {
      multiplier = userIsBlackjack ? 2.5 : 2;
    }

    const payout = Math.round(finalBet * multiplier);
    if (payout > 0) {
      add(payout);
      setProfit(payout);
    }
  }, [isFinished, state, userIsBlackjack, add]);

  // ── 事件处理（普通函数，每次渲染都重新创建）──

  const syncBet = (text: string) => {
    const n = clampBet(Number(text.replace(/,/g, '')) || 0, wallet.balance);
    setBetText(String(n));
  };

  const handleBetChange = (text: string) => {
    setBetText(text);
  };

  const handleBetBlur = () => {
    syncBet(betText);
  };

  const handleFraction = (num: number, den: number) => {
    const val = clampBet(Math.ceil((wallet.balance * num) / den), wallet.balance);
    setBetText(String(val));
  };

  const handleStart = () => {
    const currentBet = clampBet(Number(betText.replace(/,/g, '')) || 0, wallet.balance);
    setBetText(String(currentBet));
    setProfit(0);
    betRef.current = currentBet;

    if (currentBet > wallet.balance || currentBet < MIN_BET) return;

    deduct(currentBet);
    settledRef.current = false;
    gameRef.current.start();
    setStatus(gameRef.current.getStatus());
  };

  const handleHit = () => {
    gameRef.current.hit();
    setStatus(gameRef.current.getStatus());
  };

  const handleStand = () => {
    gameRef.current.stand();
    setStatus(gameRef.current.getStatus());
  };

  // ── 渲染 ──

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/Casino">
        <ArrowLeft aria-hidden="true" size={18} />
        {t.casino.backToLobby}
      </Link>

      {/* 牌桌 */}
      <div className={styles.table}>
        <div className={styles.handSection}>
          <div className={styles.handLabel}>
            {t.casino.blackjack.dealer}
            <span className={styles.score}>({dealerCards.length > 0 ? dealerScore : '-'})</span>
            {status.dealerIsBlackjack ? <span className={styles.bjBadge}>BJ</span> : null}
          </div>
          <div className={styles.cardRow}>
            {dealerCards.map((card, i) => (
              <img key={i} className={styles.cardImg} src={getCardSrc(card)} alt={`${card.rank}${card.suit}`} />
            ))}
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.handSection}>
          <div className={styles.handLabel}>
            {t.casino.blackjack.user}
            <span className={styles.score}>({userCards.length > 0 ? userScore : '-'})</span>
            {userIsBlackjack ? <span className={styles.bjBadge}>BJ</span> : null}
          </div>
          <div className={styles.cardRow}>
            {userCards.map((card, i) => (
              <img key={i} className={styles.cardImg} src={getCardSrc(card)} alt={`${card.rank}${card.suit}`} />
            ))}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        {isBetting && (
          <div className={styles.buttonColumn}>
            <button className={styles.startButton} disabled={notEnoughFunds} onClick={handleStart} type="button">
              {isFinished ? t.casino.blackjack.playAgain : t.casino.blackjack.start}
            </button>
            {notEnoughFunds && <p className={styles.noFundsHint}>{t.casino.blackjack.noFunds}</p>}
          </div>
        )}
        {isPlaying && (
          <>
            <button className={styles.hitButton} onClick={handleHit} type="button">{t.casino.blackjack.hit}</button>
            <button className={styles.standButton} onClick={handleStand} type="button">{t.casino.blackjack.stand}</button>
          </>
        )}
      </div>

      {isFinished && winner && (
        <div className={styles.resultBar}>{resultLabel(t, winner)}</div>
      )}

      {/* 下注区 —— 始终显示，游戏中不可编辑 */}
      <div className={styles.bettingBar}>
        <div className={styles.bettingRow}>
          <label className={styles.bettingLabel}>{t.casino.blackjack.bet}</label>
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
          <span>{t.casino.blackjack.rulesButton}</span>
        </button>
        <button className={styles.rulesButton} onClick={() => setShowTips((v) => !v)} type="button">
          <Lightbulb aria-hidden="true" size={16} />
          <span>{t.casino.blackjack.tipsButton}</span>
        </button>
      </div>

      {showRules && (
        <div className={styles.rulesPanel}>
          <h3>{t.casino.blackjack.rulesTitle}</h3>
          <ul>
            {t.casino.blackjack.rules.map((line, i) => (<li key={i}>{line}</li>))}
          </ul>
        </div>
      )}

      {showTips && (
        <div className={styles.rulesPanel}>
          <h3>{t.casino.blackjack.tipsTitle}</h3>
          <ul>
            {t.casino.blackjack.tips.map((line, i) => (<li key={i}>{line}</li>))}
          </ul>
        </div>
      )}
    </div>
  );
}

function resultLabel(t: ReturnType<typeof useI18n>['t'], winner: 'user' | 'dealer' | 'push') {
  if (winner === 'user') return t.casino.blackjack.userWins;
  if (winner === 'dealer') return t.casino.blackjack.dealerWins;
  return t.casino.blackjack.push;
}
