export interface ProjectItem {
  id: string;
  translationKey: 'numberSequenceGrid';
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
];
