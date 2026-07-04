export interface ProjectItem {
  id: string;
  translationKey: 'numberSequenceGrid' | 'colorDifference' | 'reactionTime' | 'eatTonight' | 'magicConch' | 'jpExchange' | 'casino';
  path: string;
  category: 'game' | 'tool';
  status: 'draft' | 'ready';
}

export const projects: ProjectItem[] = [
  {
    id: 'Schulte-Grid',
    translationKey: 'numberSequenceGrid',
    path: '/Schulte-Grid',
    category: 'game',
    status: 'ready',
  },
  {
    id: 'Color-Difference',
    translationKey: 'colorDifference',
    path: '/Color-Difference',
    category: 'game',
    status: 'ready',
  },
  {
    id: 'Reaction-Time',
    translationKey: 'reactionTime',
    path: '/Reaction-Time',
    category: 'game',
    status: 'ready',
  },
  {
    id: 'Eat-Tonight',
    translationKey: 'eatTonight',
    path: '/Eat-Tonight',
    category: 'tool',
    status: 'ready',
  },
  {
    id: 'Magic-Conch',
    translationKey: 'magicConch',
    path: '/Magic-Conch',
    category: 'game',
    status: 'ready',
  },
  {
    id: 'jp-exchange',
    translationKey: 'jpExchange',
    path: '/jp-exchange',
    category: 'tool',
    status: 'ready',
  },
  {
    id: 'Casino',
    translationKey: 'casino',
    path: '/Casino',
    category: 'game',
    status: 'ready',
  },
];
