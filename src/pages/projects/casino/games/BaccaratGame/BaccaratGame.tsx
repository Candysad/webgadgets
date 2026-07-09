import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Lightbulb } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BaccaratGame as BaccaratGameEngine, GameState, type BaccaratStatus, type Card } from 'baccarat';
import { useI18n } from '../../../../../i18n';
import { useWallet } from '../../WalletContext';
import { OddsTable } from '../../../../../components/OddsTable';
import styles from './BaccaratGame.module.css';

const CARD_BASE = `${import.meta.env.BASE_URL}assets/cards/`;

function getCardSrc(card: Card): string {
  return `${CARD_BASE}${card.rank}${card.suit}.svg`;
}

export function BaccaratGame() {
  const { t } = useI18n();
  const { wallet, hideWallet, deduct, add } = useWallet();

  const gameRef = useRef(new BaccaratGameEngine());
  const settledRef = useRef(false);

  const [status, setStatus] = useState<BaccaratStatus>(() => gameRef.current.getStatus());
  const [showRules, setShowRules] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const [betText, setBetText] = useState(String(gameRef.current.minBet));
  const [profit, setProfit] = useState(0);

  useEffect(() => {
    hideWallet();
  }, [hideWallet]);

  // ── 派生状态 ──

  const { state, playerCards, bankerCards, playerScore, bankerScore, winner } = status;

  const isWaiting = state === GameState.WAITING_FOR_DEAL;
  const isFinished = gameRef.current.isRoundFinished(status);
  const isInitial = state === GameState.NOT_STARTED;
  const isBetting = isInitial || isFinished;
  const notEnoughFunds = wallet.balance < gameRef.current.minBet;
  const canDeal = isWaiting;

  // ── 结算 ──

  useEffect(() => {
    if (!isFinished || settledRef.current) return;
    settledRef.current = true;

    const { payout } = gameRef.current.settle();
    if (payout > 0) {
      add(payout);
      setProfit(payout);
    }
  }, [isFinished, add]);

  // ── 事件处理 ──

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

  const handleDeal = () => {
    gameRef.current.deal();
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
        {/* 庄家 */}
        <div className={styles.handSection}>
          <div className={styles.handLabel}>
            {t.casino.baccarat.banker}
            <span className={styles.score}>({bankerCards.length > 0 ? bankerScore : '-'})</span>
          </div>
          <div className={styles.cardRow}>
            {bankerCards.length > 0
              ? bankerCards.map((card, i) => (
                  <img key={i} className={styles.cardImg} src={getCardSrc(card)} alt={`${card.rank}${card.suit}`} />
                ))
              : [0, 1].map((i) => <div key={i} className={styles.cardPlaceholder} />)}
          </div>
        </div>

        <div className={styles.divider} />

        {/* 闲家 */}
        <div className={styles.handSection}>
          <div className={styles.handLabel}>
            {t.casino.baccarat.player}
            <span className={styles.score}>({playerCards.length > 0 ? playerScore : '-'})</span>
          </div>
          <div className={styles.cardRow}>
            {playerCards.length > 0
              ? playerCards.map((card, i) => (
                  <img key={i} className={styles.cardImg} src={getCardSrc(card)} alt={`${card.rank}${card.suit}`} />
                ))
              : [0, 1].map((i) => <div key={i} className={styles.cardPlaceholder} />)}
          </div>
        </div>
      </div>

      {/* 控制区 */}
      <div className={styles.controls}>
        {isBetting && (
          <div className={styles.buttonColumn}>
            <button
              className={styles.startButton}
              disabled={notEnoughFunds}
              onClick={handleStart}
              type="button"
            >
              {isFinished ? t.casino.baccarat.playAgain : t.casino.baccarat.start}
            </button>
            {notEnoughFunds && <p className={styles.noFundsHint}>{t.casino.baccarat.noFunds}</p>}
          </div>
        )}
        {canDeal && (
          <button className={styles.dealButton} onClick={handleDeal} type="button">
            {t.casino.baccarat.deal}
          </button>
        )}
      </div>

      {/* 结算提示 */}
      {isFinished && winner && (
        <div className={styles.resultBar}>{resultLabel(t, winner)}</div>
      )}

      {/* 下注区 */}
      <div className={styles.bettingBar}>
        <div className={styles.bettingRow}>
          <label className={styles.bettingLabel}>{t.casino.baccarat.bet}</label>
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

      {/* 规则 & 窍门 */}
      <div className={styles.ruleTipRow}>
        <button className={styles.rulesButton} onClick={() => setShowRules((v) => !v)} type="button">
          <BookOpen aria-hidden="true" size={16} />
          <span>{t.casino.baccarat.rulesButton}</span>
        </button>
        <button className={styles.rulesButton} onClick={() => setShowTips((v) => !v)} type="button">
          <Lightbulb aria-hidden="true" size={16} />
          <span>{t.casino.baccarat.tipsButton}</span>
        </button>
      </div>

      {showRules && (
        <div className={styles.rulesPanel}>
          <h3>{t.casino.baccarat.rulesTitle}</h3>
          <ul>
            {t.casino.baccarat.rules.map((line, i) => (<li key={i}>{line}</li>))}
          </ul>
        </div>
      )}

      {showTips && (
        <div className={styles.rulesPanel}>
          <h3>{t.casino.baccarat.tipsTitle}</h3>
          <OddsTable
            rows={t.casino.baccarat.tipsOdds}
            headerLabel={t.casino.baccarat.tipsTableHeaderLabel}
            headerValue={t.casino.baccarat.tipsTableHeaderValue}
          />
          <ul>
            {t.casino.baccarat.tips.map((line, i) => (<li key={i}>{line}</li>))}
          </ul>
        </div>
      )}
    </div>
  );
}

function resultLabel(
  t: ReturnType<typeof useI18n>['t'],
  winner: 'player' | 'banker' | 'tie',
) {
  if (winner === 'player') return t.casino.baccarat.win;
  if (winner === 'banker') return t.casino.baccarat.lose;
  return t.casino.baccarat.tiePush;
}
