// 快速验证 Blackjack 状态机逻辑。
// 运行方式：npx tsx scripts/test-blackjack.ts
import { Blackjack, GameState } from 'blackjack';

function logStatus(game: Blackjack) {
  const s = game.getStatus();
  console.log(`\n状态: ${s.state}`);
  console.log(`用户: [${s.userCards.map((c) => c.rank + c.suit).join(', ')}] → ${s.userScore}  ${s.userIsBlackjack ? 'BLACKJACK' : ''}`);
  console.log(`庄家: [${s.dealerCards.map((c) => c.rank + c.suit).join(', ')}] → ${s.dealerScore}  ${s.dealerIsBlackjack ? 'BLACKJACK' : ''}`);
  if (s.winner) console.log(`胜者: ${s.winner}`);
  return s;
}

// ── 测试 1: 基础流程 ──
console.log('══════════ 测试 1: 用户 Hit → Stand → 比大小 ══════════');
const g1 = new Blackjack();
g1.start();
const s1 = logStatus(g1);

if (s1.state === GameState.DEALING_TO_USER) {
  while (g1.getStatus().state === GameState.DEALING_TO_USER && g1.getStatus().userScore < 17) {
    g1.hit();
    logStatus(g1);
  }
  if (g1.getStatus().state === GameState.DEALING_TO_USER) {
    g1.stand();
    logStatus(g1);
  }
}

// ── 测试 2: 用户爆牌 ──
console.log('\n══════════ 测试 2: 用户持续 Hit 直到爆牌 ══════════');
const g2 = new Blackjack();
g2.start();
logStatus(g2);
while (g2.getStatus().state === GameState.DEALING_TO_USER) {
  g2.hit();
  logStatus(g2);
}

// ── 测试 3: 连续多局洗牌 ──
console.log('\n══════════ 测试 3: 连续 5 局不报错 ══════════');
const g3 = new Blackjack();
for (let i = 0; i < 5; i++) {
  g3.start();
  logStatus(g3);
  // 直接停牌
  if (g3.getStatus().state === GameState.DEALING_TO_USER) {
    g3.stand();
    logStatus(g3);
  }
}

console.log('\n✅ 所有测试完成');
