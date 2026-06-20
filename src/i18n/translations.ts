export type Language = 'zh' | 'en';

export const LANGUAGE_LABELS: Record<Language, string> = {
  zh: '中文',
  en: 'English',
};

export const translations = {
  zh: {
    common: {
      appName: 'Web Gadgets',
      home: '主页',
      backHome: '返回主页',
      languageToggle: '切换语言',
    },
    home: {
      title: '静态网页小项目合集',
      summary: '把好玩的小游戏、顺手的小工具收在一个统一主题的网站里。',
      projectList: '项目列表',
      category: {
        game: '小游戏',
        tool: '小工具',
      },
      status: {
        draft: '开发中',
        ready: '可用',
      },
      open: '打开',
    },
    projects: {
      numberSequenceGrid: {
        title: '舒尔特表（Schulte Grid）',
        description: '在随机数字方格中按 1 到 n 的顺序快速点击，完成后查看用时。',
        ariaGame: '顺序点击数字游戏',
        boardLabel: '{size} 乘 {size} 数字方框',
        emptyBoard: '点击开始后生成 {size} x {size} 数字方格',
        completedTime: '完成用时：{time}',
        recentAverageEmpty: '最近 10 次平均：暂无',
        recentAverage: '最近 10 次平均：{time}',
        controlArea: '游戏控制区',
        gridSizeLabel: '方格边长 x',
        decreaseSize: '减小 x',
        increaseSize: '增大 x',
        start: '开始',
        giveUp: '放弃',
        timer: '计时器',
      },
    },
    notFound: {
      title: '这个页面暂时不存在',
      backHome: '返回主页',
    },
  },
  en: {
    common: {
      appName: 'Web Gadgets',
      home: 'Home',
      backHome: 'Back home',
      languageToggle: 'Switch language',
    },
    home: {
      title: 'Static Web Mini Projects',
      summary: 'A unified night-mode home for small browser games and handy static tools.',
      projectList: 'Project list',
      category: {
        game: 'Game',
        tool: 'Tool',
      },
      status: {
        draft: 'Draft',
        ready: 'Ready',
      },
      open: 'Open',
    },
    projects: {
      numberSequenceGrid: {
        title: 'Schulte Grid',
        description: 'Click randomized numbers from 1 to n in order as quickly as possible, then check your time.',
        ariaGame: 'Sequential number grid game',
        boardLabel: '{size} by {size} number grid',
        emptyBoard: 'Press start to generate a {size} x {size} number grid',
        completedTime: 'Finished in {time}',
        recentAverageEmpty: 'Last 10 average: none',
        recentAverage: 'Last 10 average: {time}',
        controlArea: 'Game controls',
        gridSizeLabel: 'Grid size x',
        decreaseSize: 'Decrease x',
        increaseSize: 'Increase x',
        start: 'Start',
        giveUp: 'Give up',
        timer: 'Timer',
      },
    },
    notFound: {
      title: 'This page does not exist yet',
      backHome: 'Back home',
    },
  },
} as const;

export type TranslationKey = keyof typeof translations.zh;
export type TranslationMessages = (typeof translations)[Language];
