export enum GameState {
  /** 未开始 */
  NOT_STARTED = 'NOT_STARTED',
  /** 开局掷骰 */
  COME_OUT_ROLL = 'COME_OUT_ROLL',
  /** 进入点数阶段 */
  POINT = 'POINT',
  /** 本局结束 */
  FINISHED = 'FINISHED',
}

export interface StreetCrapsStatus {
  state: GameState;
  point: number | null;
  lastRoll: number | null;
  lastDice: [number, number] | null;
  winner: 'user' | 'dealer' | null;
}
