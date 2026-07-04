/**
 * 赌场通用下注工具函数。
 * 不依赖 React，可在任意小游戏的普通事件处理器中直接使用。
 */

const MIN_BET = 100;

/** 将原始数值约束在 [minBet, maxBalance] 区间，向上取整 */
export function clampBet(raw: number, balance: number, minBet = MIN_BET): number {
  return Math.max(minBet, Math.min(balance, Math.ceil(raw)));
}

/** 按持有金额的比例计算下注，返回 [minBet, maxBalance] 区间内向上取整的值 */
export function fractionBet(num: number, den: number, balance: number, minBet = MIN_BET): number {
  return clampBet(Math.ceil((balance * num) / den), balance, minBet);
}
