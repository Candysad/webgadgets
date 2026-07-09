import { CasinoGame } from 'casinogame';
import { type BaccaratStatus, type Card, type DealPhase, type Rank, GameState, RANKS, SUITS } from './types';

// ── 牌堆 & 洗牌 ──

/** 8 副牌 = 416 张 */
function createShoe(): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < 8; d++) {
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({ suit, rank });
      }
    }
  }
  return deck;
}

function shuffle(deck: Card[]): void {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

// ── 计分 ──

/** 百家乐点数：A=1, 2~9=面值, 10/J/Q/K=0, 取个位 */
function cardValue(rank: Rank): number {
  if (rank === 'A') return 1;
  if (rank === 'K' || rank === 'Q' || rank === 'J' || rank === '10') return 0;
  return Number.parseInt(rank, 10);
}

function handScore(cards: Card[]): number {
  const sum = cards.reduce((acc, c) => acc + cardValue(c.rank), 0);
  return sum % 10;
}

/** 是否自然牌（前两张 8 或 9） */
function isNatural(cards: Card[]): boolean {
  return cards.length === 2 && handScore(cards) >= 8;
}

// ── 补牌规则 ──

/** 闲家是否需要补第三张 */
function playerShouldDraw(cards: Card[]): boolean {
  return handScore(cards) <= 5;
}

/**
 * 庄家是否需要补第三张。
 * 入参 playerThird 为闲家第三张牌；若闲家未补牌则传 null。
 */
function bankerShouldDraw(bankerCards: Card[], playerThird: Card | null): boolean {
  const score = handScore(bankerCards);

  // 7 及以上不补
  if (score >= 7) return false;
  // 0-2 必补
  if (score <= 2) return true;

  // 闲家未补牌（6-7 停牌），庄家 0-5 补
  if (playerThird === null) return score <= 5;

  const pv = cardValue(playerThird.rank);

  switch (score) {
    case 3: return pv !== 8;
    case 4: return pv >= 2 && pv <= 7;
    case 5: return pv >= 4 && pv <= 7;
    case 6: return pv === 6 || pv === 7;
    default: return false;
  }
}

// ── 游戏引擎 ──

export class BaccaratGame extends CasinoGame<BaccaratStatus> {
  private state: GameState;
  private deck: Card[];
  private playerCards: Card[];
  private bankerCards: Card[];
  private dealPhase: DealPhase;

  constructor() {
    super(100); // 百家乐最低下注 $100
    this.state = GameState.NOT_STARTED;
    this.deck = [];
    this.playerCards = [];
    this.bankerCards = [];
    this.dealPhase = 'initial';
  }

  // ── CasinoGame 抽象方法 ──

  /** @inheritdoc */
  startRound(): void {
    this.playerCards = [];
    this.bankerCards = [];
    this.dealPhase = 'initial';
    this.state = GameState.WAITING_FOR_DEAL;
    this.ensureDeckCanDeal(4);
  }

  /** @inheritdoc */
  getStatus(): BaccaratStatus {
    const playerScore = handScore(this.playerCards);
    const bankerScore = handScore(this.bankerCards);

    let winner: BaccaratStatus['winner'] = null;
    if (this.state === GameState.FINISHED) {
      if (playerScore > bankerScore) winner = 'player';
      else if (bankerScore > playerScore) winner = 'banker';
      else winner = 'tie';
    }

    return {
      state: this.state,
      playerCards: [...this.playerCards],
      bankerCards: [...this.bankerCards],
      playerScore: this.playerCards.length > 0 ? playerScore : 0,
      bankerScore: this.bankerCards.length > 0 ? bankerScore : 0,
      dealPhase: this.dealPhase,
      winner,
    };
  }

  /** @inheritdoc */
  isRoundFinished(status: BaccaratStatus): boolean {
    return status.state === GameState.FINISHED;
  }

  /**
   * 玩家固定押闲家：
   *   - 闲家赢 → 2x（赢回本金 + 等额奖金）
   *   - 和局   → 1x（退还本金）
   *   - 庄家赢 → 0（全输）
   */
  getMultiplier(status: BaccaratStatus): number {
    if (status.winner === 'player') return 2;
    if (status.winner === 'tie') return 1;
    return 0;
  }

  // ── 发牌操作 ──

  /**
   * 执行一次发牌操作。
   * 根据当前 dealPhase 发出对应数量的牌，然后进入 CHECKING 判断下一步。
   * 只有在 WAITING_FOR_DEAL 状态下才可调用。
   */
  deal(): void {
    if (this.state !== GameState.WAITING_FOR_DEAL) {
      throw new Error(`Cannot deal in state: ${this.state}`);
    }

    this.state = GameState.DEALING;

    switch (this.dealPhase) {
      case 'initial': {
        // 闲家 2 张，庄家 2 张
        this.ensureDeckCanDeal(4);
        this.playerCards.push(this.drawCard(), this.drawCard());
        this.bankerCards.push(this.drawCard(), this.drawCard());
        break;
      }
      case 'player_third': {
        this.ensureDeckCanDeal(1);
        this.playerCards.push(this.drawCard());
        break;
      }
      case 'banker_third': {
        this.ensureDeckCanDeal(1);
        this.bankerCards.push(this.drawCard());
        break;
      }
    }

    this.state = GameState.CHECKING;
    this.evaluateNext();
  }

  // ── 内部方法 ──

  private drawCard(): Card {
    return this.deck.pop()!;
  }

  private ensureDeckCanDeal(needed: number): void {
    if (this.deck.length < needed) {
      this.deck = createShoe();
      shuffle(this.deck);
    }
  }

  /** 检查局面，决定进入 WAITING_FOR_DEAL（继续发牌）还是 FINISHED */
  private evaluateNext(): void {
    // 出现自然牌，直接结束
    if (isNatural(this.playerCards) || isNatural(this.bankerCards)) {
      this.state = GameState.FINISHED;
      return;
    }

    switch (this.dealPhase) {
      case 'initial': {
        // 闲家需要补第三张
        if (playerShouldDraw(this.playerCards)) {
          this.dealPhase = 'player_third';
          this.state = GameState.WAITING_FOR_DEAL;
          return;
        }

        // 闲家停牌，庄家是否需要补
        if (bankerShouldDraw(this.bankerCards, null)) {
          this.dealPhase = 'banker_third';
          this.state = GameState.WAITING_FOR_DEAL;
          return;
        }

        this.state = GameState.FINISHED;
        return;
      }
      case 'player_third': {
        const playerThird = this.playerCards[this.playerCards.length - 1];

        if (bankerShouldDraw(this.bankerCards, playerThird)) {
          this.dealPhase = 'banker_third';
          this.state = GameState.WAITING_FOR_DEAL;
          return;
        }

        this.state = GameState.FINISHED;
        return;
      }
      case 'banker_third': {
        this.state = GameState.FINISHED;
        return;
      }
    }
  }
}
