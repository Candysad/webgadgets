import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

export interface WalletState {
  /** 当前持有金额 */
  balance: number;
  /** 总计贷款欠额 */
  totalLoan: number;
  /** 总计赚到的金额（含已偿还贷款的利息成本） */
  totalEarned: number;
  /** 尚需还款（本金 + 5% 利息） */
  totalDue: number;
}

interface WalletContextValue {
  wallet: WalletState;
  /** 供子游戏页面在进入时收起钱包面板 */
  hideWallet: () => void;
  /** 向银行贷款，计入 balance / totalLoan / totalDue */
  borrow: (amount: number) => void;
  /** 调试用：直接覆写钱包全部字段 */
  setWallet: (patch: Partial<WalletState>) => void;
  /** 从持有金额中扣除 */
  deduct: (amount: number) => void;
  /** 向持有金额中增加 */
  add: (amount: number) => void;
}

const INTEREST_RATE = 0.05;

const WalletContext = createContext<WalletContextValue | null>(null);

// 为整个赌场页面提供钱包状态上下文，后续可在此扩展存取款、借贷、结算等操作。
export function WalletProvider({ children, hideWallet }: { children: ReactNode; hideWallet: () => void }) {
  const [wallet, setWallet] = useState<WalletState>({
    balance: 0,
    totalLoan: 0,
    totalEarned: 0,
    totalDue: 0,
  });

  const borrow = useCallback((amount: number) => {
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      totalLoan: prev.totalLoan + amount,
      totalDue: prev.totalDue + amount * (1 + INTEREST_RATE),
    }));
  }, []);

  const setWalletValue = useCallback((patch: Partial<WalletState>) => {
    setWallet((prev) => ({ ...prev, ...patch }));
  }, []);

  const deduct = useCallback((amount: number) => {
    setWallet((prev) => ({ ...prev, balance: prev.balance - amount }));
  }, []);

  const add = useCallback((amount: number) => {
    setWallet((prev) => ({
      ...prev,
      balance: prev.balance + amount,
      totalEarned: prev.totalEarned + amount,
    }));
  }, []);

  const value = useMemo(
    () => ({ wallet, hideWallet, borrow, setWallet: setWalletValue, deduct, add }),
    [wallet, hideWallet, borrow, setWalletValue, deduct, add],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

// 读取钱包上下文；如果组件未包在 WalletProvider 内则抛错暴露接入问题。
export function useWallet() {
  const context = useContext(WalletContext);

  if (context === null) {
    throw new Error('useWallet must be used within WalletProvider');
  }

  return context;
}
