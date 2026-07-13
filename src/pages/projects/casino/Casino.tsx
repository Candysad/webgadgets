import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Building2, DoorOpen, Eye, EyeOff, Minus, Plus } from 'lucide-react';
import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useI18n } from '../../../i18n';
import { BaccaratGame } from './games/BaccaratGame/BaccaratGame';
import { BlackjackGame } from './games/BlackjackGame/BlackjackGame';
import { StreetCrapsGame } from './games/StreetCrapsGame/StreetCrapsGame';
import { PlaceholderGame } from './games/PlaceholderGame';
import { useWallet, WalletProvider } from './WalletContext';
import styles from './Casino.module.css';

// 赌场内部小游戏清单，结构与主页 projects.ts 一致。
interface CasinoGame {
  id: string;
  path: string;
  translationKey: 'placeholderGame' | 'blackjack' | 'baccarat' | 'streetcraps';
}

const casinoGames: CasinoGame[] = [
  {
    id: 'blackjack',
    path: 'blackjack',
    translationKey: 'blackjack',
  },
  {
    id: 'baccarat',
    path: 'baccarat',
    translationKey: 'baccarat',
  },
  {
    id: 'streetcraps',
    path: 'streetcraps',
    translationKey: 'streetcraps',
  },
  {
    id: 'placeholder',
    path: 'placeholder',
    translationKey: 'placeholderGame',
  },
];

// 钱包信息面板，默认隐藏，通过左下角按钮切换显示。
function WalletPanel({ visible }: { visible: boolean }) {
  const { wallet } = useWallet();
  const { t } = useI18n();

  const rows: { label: string; value: string }[] = [
    { label: t.casino.wallet.balance, value: `$ ${wallet.balance.toFixed(2)}` },
    { label: t.casino.wallet.totalLoan, value: `$ ${wallet.totalLoan.toFixed(2)}` },
    { label: t.casino.wallet.totalDue, value: `$ ${wallet.totalDue.toFixed(2)}` },
    { label: t.casino.wallet.totalEarned, value: `$ ${wallet.totalEarned.toFixed(2)}` },
  ];

  return (
    <div className={`${styles.walletBox} ${visible ? styles.walletBoxVisible : ''}`}>
      <p className={styles.walletTitle}>{t.casino.wallet.title}</p>
      {rows.map((row) => (
        <div className={styles.walletRow} key={row.label}>
          <span className={styles.walletLabel}>{row.label}</span>
          <span className={styles.walletValue}>{row.value}</span>
        </div>
      ))}
    </div>
  );
}

const LOAN_MIN = 1000;
const LOAN_MAX = 10_000_000;
const LOAN_STEP = 1000;
const NET_LOAN_CAP = 20_000_000;

// 银行借款弹窗：控制借款金额，校验范围后确认借款。
function BankModal({ onClose }: { onClose: () => void }) {
  const { t } = useI18n();
  const { wallet, borrow } = useWallet();
  const [amount, setAmount] = useState(LOAN_MIN);
  const inputRef = useRef<HTMLInputElement>(null);

  const isTooRich = wallet.totalDue - wallet.balance > NET_LOAN_CAP;
  const isOverLimit = amount > LOAN_MAX || isTooRich;

  // 打开弹窗时聚焦输入框。
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // 规范化金额为 1000 的倍数，并在范围内取值。
  const clamp = (value: number) => {
    return Math.min(LOAN_MAX, Math.max(LOAN_MIN, Math.round(value / LOAN_STEP) * LOAN_STEP));
  };

  const handleStep = (delta: number) => {
    setAmount((prev) => clamp(prev + delta * LOAN_STEP));
  };

  const handleInputChange = (raw: string) => {
    const parsed = Number.parseFloat(raw);
    // 允许清空输入框（用户正在删除）
    if (raw === '') {
      setAmount(0);
      return;
    }
    if (Number.isNaN(parsed)) {
      return;
    }
    setAmount(parsed);
  };

  const handleInputBlur = () => {
    setAmount((prev) => clamp(prev || LOAN_MIN));
  };

  const handleConfirm = () => {
    const finalAmount = clamp(amount);
    borrow(finalAmount);
    onClose();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      handleStep(1);
    } else if (event.key === 'ArrowDown') {
      event.preventDefault();
      handleStep(-1);
    }
  };

  return (
    <div className={styles.overlay} role="presentation">
      <div className={styles.bankCard} aria-modal="true" role="dialog">
        <h2>{t.casino.bank.title}</h2>

        <div className={styles.loanBar}>
          <span className={styles.loanBarLabel}>{t.casino.bank.loan}</span>
          <button
            aria-label={`-${LOAN_STEP}`}
            className={styles.stepButton}
            disabled={amount <= LOAN_MIN}
            onClick={() => handleStep(-1)}
            type="button"
          >
            <Minus aria-hidden="true" size={18} />
          </button>
          <div className={styles.loanInputWrap}>
            <input
              aria-label={t.casino.bank.loan}
              className={`${styles.loanInput} ${isOverLimit ? styles.loanInputDanger : ''}`}
              inputMode="numeric"
              max={LOAN_MAX}
              min={LOAN_MIN}
              onBlur={handleInputBlur}
              onChange={(event) => handleInputChange(event.target.value)}
              onKeyDown={handleKeyDown}
              ref={inputRef}
              step={LOAN_STEP}
              type="number"
              value={amount || ''}
            />
          </div>
          <button
            aria-label={`+${LOAN_STEP}`}
            className={styles.stepButton}
            disabled={amount >= LOAN_MAX}
            onClick={() => handleStep(1)}
            type="button"
          >
            <Plus aria-hidden="true" size={18} />
          </button>
        </div>

        <p className={styles.interestHint}>{t.casino.bank.interest}</p>

        {isOverLimit ? (
          <p className={styles.riskWarning}>{t.casino.bank.riskWarning}</p>
        ) : null}

        <div className={styles.confirmActions}>
          <button className={styles.confirmCancel} onClick={onClose} type="button">
            {t.casino.bank.cancel}
          </button>
          <button className={styles.confirmOk} disabled={isOverLimit || amount < LOAN_MIN} onClick={handleConfirm} type="button">
            {t.casino.bank.confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
function CasinoHome() {
  const { t } = useI18n();

  return (
    <>
      <section className={styles.header}>
        <p className={styles.kicker}>Casino</p>
        <h1>{t.casino.title}</h1>
      </section>

      <section className={styles.grid}>
        {casinoGames.map((game) => {
          const gameText = t.casino[game.translationKey];

          return (
            <Link className={styles.card} key={game.id} to={game.path}>
              <h2>{gameText.title}</h2>
              <p>{gameText.description}</p>
              <span className={styles.cardFooter}>
                {t.home.open}
                <ArrowUpRight aria-hidden="true" size={16} />
              </span>
            </Link>
          );
        })}
      </section>
    </>
  );
}

// 赌场整体布局：浮动钱包方框（默认隐藏）+ 全宽游戏区域 + 离开确认弹窗，支持内部嵌套路由。
function CasinoLayout({ walletVisible, setWalletVisible }: { walletVisible: boolean; setWalletVisible: (v: boolean) => void }) {
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  const [showBank, setShowBank] = useState(false);
  const { wallet } = useWallet();
  const { t } = useI18n();
  const navigate = useNavigate();

  const isModalOpen = showLeaveConfirm || showBank;
  const isTooRich = wallet.totalDue - wallet.balance > NET_LOAN_CAP;
  const walletLabel = walletVisible ? t.casino.wallet.hide : t.casino.wallet.show;
  const WalletIcon = walletVisible ? EyeOff : Eye;

  const handleLeave = () => {
    setShowLeaveConfirm(false);
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      <div className={`${styles.surface} ${isModalOpen ? styles.blurred : ''}`}>
        <WalletPanel visible={walletVisible} />
        <button
          aria-label={walletLabel}
          className={styles.walletToggle}
          onClick={() => setWalletVisible(!walletVisible)}
          type="button"
        >
          <WalletIcon aria-hidden="true" size={18} />
          <span>{walletLabel}</span>
        </button>
        <div className={styles.bottomActions}>
          <button
            aria-label={t.casino.bank.label}
            className={styles.bankButton}
            onClick={() => setShowBank(true)}
            type="button"
          >
            <Building2 aria-hidden="true" size={18} />
            <span>{t.casino.bank.label}</span>
          </button>
          <button
            aria-label={t.casino.leaveCasino}
            className={`${styles.leaveButton} ${isTooRich ? styles.leaveButtonDanger : ''}`}
            onClick={() => setShowLeaveConfirm(true)}
            type="button"
          >
            <DoorOpen aria-hidden="true" size={18} />
            <span>{t.casino.leaveCasino}</span>
          </button>
        </div>
        <main className={styles.main}>
          <Routes>
            <Route index element={<CasinoHome />} />
            <Route path="blackjack" element={<BlackjackGame />} />
            <Route path="baccarat" element={<BaccaratGame />} />
            <Route path="streetcraps" element={<StreetCrapsGame />} />
            <Route path="placeholder" element={<PlaceholderGame />} />
          </Routes>
        </main>
      </div>

      {showLeaveConfirm ? (
        <div className={styles.overlay} role="presentation">
          <div className={styles.confirmCard} aria-modal="true" role="dialog">
            <h2>{t.casino.leaveConfirm.title}</h2>
            <p>{t.casino.leaveConfirm.message}</p>
            <div className={styles.confirmActions}>
              <button className={styles.confirmCancel} onClick={() => setShowLeaveConfirm(false)} type="button">
                {t.casino.leaveConfirm.cancel}
              </button>
              <button className={styles.confirmOk} onClick={handleLeave} type="button">
                {t.casino.leaveConfirm.confirm}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showBank ? <BankModal onClose={() => setShowBank(false)} /> : null}
    </div>
  );
}

// 赌场入口组件，包裹 WalletProvider 提供钱包上下文，并将钱包可见状态提升至此层以便 hideWallet 注入。
export function Casino() {
  const [walletVisible, setWalletVisible] = useState(false);
  const hideWallet = useCallback(() => setWalletVisible(false), []);

  return (
    <WalletProvider hideWallet={hideWallet}>
      <CasinoLayout walletVisible={walletVisible} setWalletVisible={setWalletVisible} />
    </WalletProvider>
  );
}
