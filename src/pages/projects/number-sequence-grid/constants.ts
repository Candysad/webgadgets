export const GRID_SIZE_LIMITS = {
  min: 2,
  max: 5,
} as const;

export const GAME_TIMING = {
  feedbackMs: 200,
  timerTickMs: 50,
} as const;

export const GAME_STATS = {
  recentLimit: 10,
} as const;

export const GAME_COLORS = {
  boardBackground: '#111827',
  boardBorder: '#334155',
  tileBackground: '#1f2937',
  tileBorder: '#475569',
  tileText: '#f8fafc',
  correctFeedback: '#22c55e',
  correctFeedbackText: '#04130a',
  wrongFeedback: '#ef4444',
  wrongFeedbackText: '#1f0505',
  primaryButton: '#38bdf8',
  primaryButtonHover: '#0ea5e9',
  dangerButton: '#f97316',
  dangerButtonHover: '#ea580c',
  actionButtonText: '#03111a',
  controlBackground: '#0f172a',
  controlBorder: '#334155',
  mutedText: '#94a3b8',
  resultText: '#a7f3d0',
  averageText: '#facc15',
} as const;

export const GAME_FONT_SIZES = {
  result: '1.125rem',
  average: '0.9375rem',
  timer: '1.125rem',
  controlLabel: '0.875rem',
  gridValue: '1.5rem',
  tile: '1.25rem',
  button: '0.9375rem',
} as const;
