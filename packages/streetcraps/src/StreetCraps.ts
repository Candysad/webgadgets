import { CasinoGame } from 'casinogame';
import { GameState, type StreetCrapsStatus } from './types';

function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

function rollDicePair(): [number, number] {
  return [rollDice(), rollDice()];
}

export class StreetCrapsGame extends CasinoGame<StreetCrapsStatus> {
  private state: GameState;
  private point: number | null;
  private lastRoll: number | null;
  private lastDice: [number, number] | null;
  private winner: 'user' | 'dealer' | null;

  constructor() {
    super(100);
    this.state = GameState.NOT_STARTED;
    this.point = null;
    this.lastRoll = null;
    this.lastDice = null;
    this.winner = null;
  }

  startRound(): void {
    this.state = GameState.COME_OUT_ROLL;
    this.point = null;
    this.lastRoll = null;
    this.lastDice = null;
    this.winner = null;
  }

  getStatus(): StreetCrapsStatus {
    return {
      state: this.state,
      point: this.point,
      lastRoll: this.lastRoll,
      lastDice: this.lastDice,
      winner: this.winner,
    };
  }

  isRoundFinished(status: StreetCrapsStatus): boolean {
    return status.state === GameState.FINISHED;
  }

  getMultiplier(status: StreetCrapsStatus): number {
    if (status.winner === 'user') return 2;
    return 0;
  }

  roll(): void {
    if (this.state !== GameState.COME_OUT_ROLL && this.state !== GameState.POINT) {
      throw new Error(`Cannot roll in state: ${this.state}`);
    }

    const dice = rollDicePair();
    const total = dice[0] + dice[1];
    this.lastRoll = total;
    this.lastDice = dice;

    if (this.state === GameState.COME_OUT_ROLL) {
      if (total === 7 || total === 11) {
        this.winner = 'user';
        this.state = GameState.FINISHED;
        return;
      }

      if (total === 2 || total === 3 || total === 12) {
        this.winner = 'dealer';
        this.state = GameState.FINISHED;
        return;
      }

      this.point = total;
      this.state = GameState.POINT;
      return;
    }

    if (total === this.point) {
      this.winner = 'user';
      this.state = GameState.FINISHED;
      return;
    }

    if (total === 7) {
      this.winner = 'dealer';
      this.state = GameState.FINISHED;
      return;
    }
  }
}
