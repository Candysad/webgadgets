export interface ProjectItem {
  id: string;
  translationKey: 'numberSequenceGrid';
  path: string;
  category: 'game' | 'tool';
  status: 'draft' | 'ready';
}

export const projects: ProjectItem[] = [
  {
    id: 'number-sequence-grid',
    translationKey: 'numberSequenceGrid',
    path: '/projects/number-sequence-grid',
    category: 'game',
    status: 'ready',
  },
];
