export const SUITS = ['S', 'H', 'D', 'C'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  suit: Suit;
  rank: Rank;
}

/** 发牌阶段 */
export type DealPhase = 'initial' | 'player_third' | 'banker_third';

export enum GameState {
  /** 未开始 */
  NOT_STARTED = 'NOT_STARTED',
  /** 等待发牌（由外部调用 deal() 触发） */
  WAITING_FOR_DEAL = 'WAITING_FOR_DEAL',
  /** 发牌中 */
  DEALING = 'DEALING',
  /** 检查局面，决定进入下一轮发牌或结束 */
  CHECKING = 'CHECKING',
  /** 本局结束 */
  FINISHED = 'FINISHED',
}

export interface BaccaratStatus {
  state: GameState;
  playerCards: Card[];
  bankerCards: Card[];
  playerScore: number;
  bankerScore: number;
  /** 当前发牌阶段，仅在 WAITING_FOR_DEAL 时有意义 */
  dealPhase: DealPhase;
  winner: 'player' | 'banker' | 'tie' | null;
}
