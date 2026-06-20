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
    id: 'starter-board',
    title: '项目准备区',
    description: '用于占位的第一个入口，后续可以替换为真实小游戏或小工具。',
    path: '/',
    category: 'tool',
    status: 'draft',
  },
];
