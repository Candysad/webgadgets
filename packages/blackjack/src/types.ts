export const SUITS = ['S', 'H', 'D', 'C'] as const;
export type Suit = (typeof SUITS)[number];

export const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'] as const;
export type Rank = (typeof RANKS)[number];

export interface Card {
  suit: Suit;
  rank: Rank;
}

export enum GameState {
  /** 未开始 */
  NOT_STARTED = 'NOT_STARTED',
  /** 用户初始发牌（发 2 张） */
  DEALING_TO_USER_INITIAL = 'DEALING_TO_USER_INITIAL',
  /** 庄家初始发牌（发 2 张） */
  DEALING_TO_DEALER_INITIAL = 'DEALING_TO_DEALER_INITIAL',
  /** 用户回合发牌（Hit） */
  DEALING_TO_USER = 'DEALING_TO_USER',
  /** 庄家回合发牌（自动补至 ≥17） */
  DEALING_TO_DEALER = 'DEALING_TO_DEALER',
  /** 检查场上局面 */
  CHECKING = 'CHECKING',
  /** 用户胜利 */
  USER_WINS = 'USER_WINS',
  /** 庄家胜利 */
  DEALER_WINS = 'DEALER_WINS',
  /** 平局 */
  PUSH = 'PUSH',
}

export interface GameStatus {
  state: GameState;
  userCards: Card[];
  dealerCards: Card[];
  userScore: number;
  dealerScore: number;
  winner: 'user' | 'dealer' | 'push' | null;
  userIsBlackjack: boolean;
  dealerIsBlackjack: boolean;
}
