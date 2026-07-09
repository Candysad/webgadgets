/**
 * CasinoGame 抽象基类的类型定义。
 */

/** 一局结算结果 */
export interface Settlement {
  /** 本局下注金额 */
  bet: number;
  /** 赔付金额（输 = 0，平局 = bet * 1，赢 = bet * multiplier） */
  payout: number;
  /** 结算倍率 */
  multiplier: number;
}
