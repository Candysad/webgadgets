export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'game' | 'tool';
  status: 'draft' | 'ready';
}

export const projects: ProjectItem[] = [
  {
    id: 'number-sequence-grid',
    title: '顺序点击数字方格',
    description: '在随机数字方格中按 1 到 n 的顺序快速点击，完成后查看用时。',
    path: '/projects/number-sequence-grid',
    category: 'game',
    status: 'ready',
  },
];
