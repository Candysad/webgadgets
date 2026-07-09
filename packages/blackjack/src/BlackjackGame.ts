import { CasinoGame } from 'casinogame';
import { Blackjack } from './Blackjack';
import type { GameStatus } from './types';
import { GameState } from './types';

/**
 * 21点游戏的 CasinoGame 适配器。
 *
 * 包装 Blackjack 引擎，实现 CasinoGame<GameStatus> 抽象方法，
 * 将游戏生命周期（下注 → 开局 → 判断结束 → 结算）统一到基类契约中。
 *
 * 一层薄适配层，自身的 hit/stand 直接委托给内部引擎。
 */
export class BlackjackGame extends CasinoGame<GameStatus> {
  private engine: Blackjack;

  constructor() {
    super(100); // 21点最低下注 $100
    this.engine = new Blackjack();
  }

  // ── CasinoGame 抽象方法实现 ──

  /** @inheritdoc */
  startRound(): void {
    this.engine.start();
  }

  /** @inheritdoc */
  getStatus(): GameStatus {
    return this.engine.getStatus();
  }

  /** @inheritdoc */
  isRoundFinished(status: GameStatus): boolean {
    return (
      status.state === GameState.USER_WINS ||
      status.state === GameState.DEALER_WINS ||
      status.state === GameState.PUSH
    );
  }

  /** @inheritdoc */
  getMultiplier(status: GameStatus): number {
    if (status.state === GameState.PUSH) return 1;
    if (status.state === GameState.USER_WINS) {
      return status.userIsBlackjack ? 2.5 : 2;
    }
    return 0;
  }

  // ── 游戏操作委托 ──

  /** 用户要牌 */
  hit(): void {
    this.engine.hit();
  }

  /** 用户停牌 */
  stand(): void {
    this.engine.stand();
  }
}
