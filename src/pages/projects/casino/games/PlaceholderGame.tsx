import { type FormEvent, useEffect, useState } from 'react';
import { ArrowLeft, Save } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../../../../i18n';
import { useWallet } from '../WalletContext';
import styles from './PlaceholderGame.module.css';

// 调试面板：直接编辑钱包上下文字段值。
export function PlaceholderGame() {
  const { t } = useI18n();
  const { wallet, hideWallet, setWallet } = useWallet();

  const [balance, setBalance] = useState(String(wallet.balance));
  const [totalLoan, setTotalLoan] = useState(String(wallet.totalLoan));
  const [totalDue, setTotalDue] = useState(String(wallet.totalDue));
  const [totalEarned, setTotalEarned] = useState(String(wallet.totalEarned));

  // 进入小游戏时自动收起钱包面板，避免遮挡游戏区域。
  useEffect(() => {
    hideWallet();
  }, [hideWallet]);

  // wallet 从外部变化时同步到本地表单。
  useEffect(() => {
    setBalance(String(wallet.balance));
    setTotalLoan(String(wallet.totalLoan));
    setTotalDue(String(wallet.totalDue));
    setTotalEarned(String(wallet.totalEarned));
  }, [wallet]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setWallet({
      balance: Number(balance) || 0,
      totalLoan: Number(totalLoan) || 0,
      totalDue: Number(totalDue) || 0,
      totalEarned: Number(totalEarned) || 0,
    });
  };

  const fields: { key: string; label: string; value: string; setter: (v: string) => void }[] = [
    { key: 'balance', label: t.casino.wallet.balance, value: balance, setter: setBalance },
    { key: 'totalLoan', label: t.casino.wallet.totalLoan, value: totalLoan, setter: setTotalLoan },
    { key: 'totalDue', label: t.casino.wallet.totalDue, value: totalDue, setter: setTotalDue },
    { key: 'totalEarned', label: t.casino.wallet.totalEarned, value: totalEarned, setter: setTotalEarned },
  ];

  return (
    <div className={styles.page}>
      <Link className={styles.backLink} to="/Casino">
        <ArrowLeft aria-hidden="true" size={18} />
        {t.casino.backToLobby}
      </Link>

      <form className={styles.panel} onSubmit={handleSubmit}>
        <h2 className={styles.panelTitle}>{t.casino.placeholderGame.title}</h2>
        <p className={styles.panelDesc}>{t.casino.placeholderGame.description}</p>

        <div className={styles.fieldList}>
          {fields.map((field) => (
            <label className={styles.fieldRow} key={field.key}>
              <span className={styles.fieldLabel}>{field.label}</span>
              <div className={styles.fieldInputWrap}>
                <span className={styles.fieldPrefix}>¥</span>
                <input
                  className={styles.fieldInput}
                  inputMode="decimal"
                  onChange={(event) => field.setter(event.target.value)}
                  type="text"
                  value={field.value}
                />
              </div>
            </label>
          ))}
        </div>

        <button className={styles.applyButton} type="submit">
          <Save aria-hidden="true" size={18} />
          <span>Apply</span>
        </button>
      </form>
    </div>
  );
}
