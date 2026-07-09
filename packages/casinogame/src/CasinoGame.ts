import type { Settlement } from './types';

/**
 * 赌场小游戏的抽象基类。
 *
 * 每个子类需要实现四个核心方法，对应一局完整生命周期：
 *   startRound → 游戏进行 → isRoundFinished → settle
 *
 * 泛型 TStatus 为各游戏自定义的状态类型。
 */
export abstract class CasinoGame<TStatus> {
  /** 当前一局的下注金额 */
  protected bet: number = 0;
  /** 最低下注金额 */
  readonly minBet: number;

  constructor(minBet: number) {
    this.minBet = minBet;
  }

  // ── 子类必须实现的抽象方法 ──

  /**
   * 开始一局新的游戏（包括再来一局）。
   * 调用时机：对应页面中用户点击"开始"/"再来一局"按钮。
   */
  abstract startRound(): void;

  /** 获取当前游戏状态快照。 */
  abstract getStatus(): TStatus;

  /**
   * 判断当前游戏局势是否已结束。
   * 返回 true 时表示应停止当前游戏并进入结算。
   */
  abstract isRoundFinished(status: TStatus): boolean;

  /**
   * 根据结算状态计算赔付倍率。
   * 返回 0 表示输（庄家赢），1 表示平局，>1 表示赢。
   */
  abstract getMultiplier(status: TStatus): number;

  // ── 下注与结算（基类统一实现） ──

  /**
   * 设置本局下注金额。
   * 自动将金额限制在 [minBet, balance] 区间内并向上取整。
   * @returns 实际生效的下注金额
   */
  placeBet(amount: number, balance: number): number {
    const clamped = Math.max(this.minBet, Math.min(balance, Math.ceil(amount)));
    this.bet = clamped;
    return clamped;
  }

  /**
   * 结算本局，返回赔付信息。
   * 调用后内部下注金额归零，需再次 placeBet 才能开始下一局。
   */
  settle(): Settlement {
    const status = this.getStatus();
    const multiplier = this.getMultiplier(status);
    const payout = Math.round(this.bet * multiplier);
    const result: Settlement = { bet: this.bet, payout, multiplier };
    this.bet = 0;
    return result;
  }
}
