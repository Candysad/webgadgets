export interface ProjectItem {
  id: string;
  translationKey: 'numberSequenceGrid' | 'colorDifference' | 'reactionTime' | 'eatTonight';
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
];
