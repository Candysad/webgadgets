export const COLOR_GAME_CONFIG = {
  gridSize: 4,
  totalTiles: 16,
  maxCorrectAnswers: 50,
  correctAnswersPerLevel: 5,
  maxLevel: 10,
  totalSeconds: 60,
  questionBankSizePerLevel: 10,
} as const;

export const COLOR_GAME_TIMING = {
  timerTickMs: 200,
  mistakeFlashMs: 280,
} as const;

export const COLOR_GAME_LEVELS = [
  16,
  13,
  10,
  8,
  6,
  4,
  3,
  2,
  1.5,
  1,
] as const;

export const COLOR_GAME_COLORS = {
  boardBackground: '#111827',
  boardBorder: '#334155',
  controlBackground: '#0f172a',
  controlBorder: '#334155',
  primaryButton: '#38bdf8',
  primaryButtonHover: '#0ea5e9',
  dangerButton: '#f97316',
  dangerButtonHover: '#ea580c',
  actionButtonText: '#03111a',
  mutedText: '#94a3b8',
  resultText: '#a7f3d0',
  mistakeFlash: '#f8fafc',
} as const;

export const COLOR_GAME_FONT_SIZES = {
  result: '1.125rem',
  meta: '0.9375rem',
  timer: '1.125rem',
  button: '0.9375rem',
} as const;
