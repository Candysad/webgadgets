import { type Card, type GameStatus, GameState, RANKS, SUITS } from './types';

// ── 牌堆 & 洗牌 ──

function createDeck(): Card[] {
  const deck: Card[] = [];
  for (let d = 0; d < 2; d++) {
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

function calculateScore(cards: Card[]): number {
  let score = 0;
  let aces = 0;

  for (const card of cards) {
    if (card.rank === 'A') {
      aces += 1;
      score += 11;
    } else if (card.rank === 'K' || card.rank === 'Q' || card.rank === 'J') {
      score += 10;
    } else {
      score += Number.parseInt(card.rank, 10);
    }
  }

  while (score > 21 && aces > 0) {
    score -= 10;
    aces -= 1;
  }

  return score;
}

function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && calculateScore(cards) === 21;
}

// ── 状态机 ──

export class Blackjack {
  private state: GameState;
  private deck: Card[];
  private userCards: Card[];
  private dealerCards: Card[];

  constructor() {
    this.state = GameState.NOT_STARTED;
    this.deck = [];
    this.userCards = [];
    this.dealerCards = [];
  }

  // ── 公共方法 ──

  /** 开始新一局：发初始 4 张牌并检查黑杰克。 */
  start(): void {
    if (
      this.state !== GameState.NOT_STARTED &&
      this.state !== GameState.USER_WINS &&
      this.state !== GameState.DEALER_WINS &&
      this.state !== GameState.PUSH
    ) {
      throw new Error(`Cannot start game in state: ${this.state}`);
    }

    this.userCards = [];
    this.dealerCards = [];

    // 用户初始发牌
    this.state = GameState.DEALING_TO_USER_INITIAL;
    this.ensureDeckCanDeal(2);
    this.userCards.push(this.drawCard());
    this.userCards.push(this.drawCard());

    // 庄家初始发牌
    this.state = GameState.DEALING_TO_DEALER_INITIAL;
    this.ensureDeckCanDeal(2);
    this.dealerCards.push(this.drawCard());
    this.dealerCards.push(this.drawCard());

    // 检查黑杰克
    this.state = GameState.CHECKING;
    this.checkNaturalBlackjack();
  }

  /** 用户要牌。 */
  hit(): void {
    if (this.state !== GameState.DEALING_TO_USER) {
      throw new Error(`Cannot hit in state: ${this.state}`);
    }

    this.state = GameState.DEALING_TO_USER;
    this.ensureDeckCanDeal(1);
    this.userCards.push(this.drawCard());

    if (calculateScore(this.userCards) > 21) {
      this.state = GameState.DEALER_WINS;
    }
    // 未爆牌则保持在 DEALING_TO_USER，等待用户继续 hit 或 stand
  }

  /** 用户停牌，进入庄家回合。 */
  stand(): void {
    if (this.state !== GameState.DEALING_TO_USER) {
      throw new Error(`Cannot stand in state: ${this.state}`);
    }

    this.state = GameState.DEALING_TO_DEALER;
    this.dealerPlay();
  }

  /** 获取当前游戏状态。 */
  getStatus(): GameStatus {
    const userScore = calculateScore(this.userCards);
    const dealerScore = calculateScore(this.dealerCards);
    const userIsBlackjack = isBlackjack(this.userCards);
    const dealerIsBlackjack = isBlackjack(this.dealerCards);

    let winner: GameStatus['winner'] = null;
    if (this.state === GameState.USER_WINS) winner = 'user';
    else if (this.state === GameState.DEALER_WINS) winner = 'dealer';
    else if (this.state === GameState.PUSH) winner = 'push';

    return {
      state: this.state,
      userCards: [...this.userCards],
      dealerCards: [...this.dealerCards],
      userScore,
      dealerScore,
      winner,
      userIsBlackjack,
      dealerIsBlackjack,
    };
  }

  // ── 内部方法 ──

  private drawCard(): Card {
    return this.deck.pop()!;
  }

  /** 偷看牌堆顶部一张牌，不移除。 */
  private peekCard(): Card | null {
    return this.deck.length > 0 ? this.deck[this.deck.length - 1] : null;
  }

  /** 确保牌堆有足够牌数完成本次发牌，不够则重置 104 张并洗牌。 */
  private ensureDeckCanDeal(needed: number): void {
    if (this.deck.length < needed) {
      this.deck = createDeck();
      shuffle(this.deck);
    }
  }

  /** 检查初始黑杰克，决定进入用户回合或直接结束。 */
  private checkNaturalBlackjack(): void {
    const userBJ = isBlackjack(this.userCards);
    const dealerBJ = isBlackjack(this.dealerCards);

    if (userBJ && dealerBJ) {
      this.state = GameState.PUSH;
    } else if (userBJ) {
      this.state = GameState.USER_WINS;
    } else if (dealerBJ) {
      this.state = GameState.DEALER_WINS;
    } else {
      this.state = GameState.DEALING_TO_USER;
    }
  }

  /** 庄家自动要牌：每次提前查看下一张，若不会爆则发牌，否则停牌。 */
  private dealerPlay(): void {
    // 只要有下一张牌、当前未到 17 且下一张不会爆，就继续。
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const currentScore = calculateScore(this.dealerCards);
      if (currentScore >= 17) break;

      this.ensureDeckCanDeal(1);
      const next = this.peekCard();
      if (next === null) break;

      // 模拟加入这张牌后的分数
      const wouldBe = calculateScore([...this.dealerCards, next]);
      if (wouldBe > 21) break;

      this.dealerCards.push(this.drawCard());
    }

    this.state = GameState.CHECKING;

    const dealerScore = calculateScore(this.dealerCards);
    const userScore = calculateScore(this.userCards);

    if (dealerScore > 21) {
      this.state = GameState.USER_WINS;
    } else if (userScore > dealerScore) {
      this.state = GameState.USER_WINS;
    } else if (dealerScore > userScore) {
      this.state = GameState.DEALER_WINS;
    } else {
      this.state = GameState.PUSH;
    }
  }
}
