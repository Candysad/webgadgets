# 开发约定与规范

本文档定义 Web Gadgets 的项目结构、编码风格、主题规范和新增小项目流程。

## 技术栈约定

- 构建工具：Vite。
- 前端框架：React。
- 开发语言：TypeScript。
- 样式方案：CSS Modules 或普通 CSS，优先使用全局主题变量统一颜色和尺寸。
- 路由方案：React Router，路由路径需要兼容静态站部署。
- 图标方案：优先使用 `lucide-react`。
- Node 和 npm 版本通过 Volta 管理，以 `package.json` 中的 `volta` 字段为准。

## 推荐目录结构

```text
.
├── public/
│   └── assets/                # 静态资源，适合放置不会被构建处理的文件
├── src/
│   ├── app/                   # 应用入口、路由、全局布局
│   ├── components/            # 全站通用组件
│   ├── data/                  # 项目清单、导航配置等静态数据
│   ├── pages/
│   │   ├── Home/              # 主页项目列表
│   │   └── projects/          # 每个小游戏或小工具一个目录
│   ├── styles/                # 全局样式、主题变量、重置样式
│   ├── types/                 # 共享类型定义
│   └── utils/                 # 通用工具函数
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## 小项目目录规范

每个小游戏或小工具放在 `src/pages/projects/<project-name>/` 下，目录名使用小写短横线命名。

推荐结构：

```text
src/pages/projects/click-counter/
├── index.tsx                  # 页面入口组件
├── style.module.css           # 页面局部样式
├── config.ts                  # 项目元信息，可选
└── logic.ts                   # 独立业务逻辑，可选
```

约定：

- 页面组件默认导出 React 组件。
- 小项目内部状态优先封装在当前目录，不向全局泄漏。
- 如果项目需要被主页展示，应在统一项目清单中登记名称、路径、描述、分类和状态。
- 小项目可以有自己的局部样式，但颜色、圆角、阴影、字体、间距优先使用全局 CSS 变量。

## 项目清单规范

主页列表数据建议集中维护在 `src/data/projects.ts`。

推荐字段：

```ts
export interface ProjectItem {
  id: string;
  title: string;
  description: string;
  path: string;
  category: 'game' | 'tool';
  status: 'draft' | 'ready';
}
```

要求：

- `id` 使用小写短横线命名，例如 `click-counter`。
- `path` 与路由保持一致，例如 `/projects/click-counter`。
- `title` 用于主页展示，应简短清楚。
- `description` 说明核心玩法或用途，不写营销式长文案。
- 未完成项目标记为 `draft`，主页可以展示禁用态或开发中状态。

## 路由规范

- 主页路径：`/`。
- 小项目路径：`/projects/<project-name>`。
- 路由配置集中放在 `src/app/router.tsx` 或同等位置。
- 新增小项目时，需要同步更新路由配置和项目清单。
- 部署到静态站点时，需要在 Vite 中设置正确的 `base`。

## 主题与样式规范

全站主题变量统一放在 `src/styles/` 下，并在应用入口引入。

推荐变量：

```css
:root {
  --color-bg: #f7f7f2;
  --color-surface: #ffffff;
  --color-text: #1f2933;
  --color-muted: #687385;
  --color-primary: #2563eb;
  --color-primary-hover: #1d4ed8;
  --color-border: #d9dee7;
  --color-danger: #dc2626;
  --radius-sm: 4px;
  --radius-md: 8px;
  --shadow-sm: 0 1px 2px rgb(15 23 42 / 8%);
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}
```

样式要求：

- 页面背景、文本、边框、按钮、卡片统一使用 CSS 变量。
- 卡片圆角不超过 `8px`，除非后续设计系统另有规定。
- 避免整站只使用单一色系；主色之外需要保留中性色和必要状态色。
- 按钮、输入框、列表项需要有 hover、focus、disabled 状态。
- 移动端优先保证文字不溢出、不重叠、不遮挡交互元素。
- 不在页面中写大段介绍如何使用界面，交互应通过布局和控件本身表达清楚。

## 组件规范

通用组件放在 `src/components/`，只沉淀跨两个及以上页面复用的能力。

推荐组件：

- `AppLayout`：全站基础布局。
- `ProjectCard`：主页项目入口卡片。
- `IconButton`：只展示图标的按钮，需要提供 `aria-label`。
- `EmptyState`：空列表状态。
- `PageHeader`：页面标题区域。

组件要求：

- Props 使用 TypeScript interface 定义。
- 新增函数或方法前添加简洁注释，说明职责或使用场景。
- 不为一次性页面逻辑过早抽象组件。
- 可交互组件需要考虑键盘访问和无障碍标签。

## TypeScript 规范

- 开启严格类型检查，避免使用 `any`。
- 数据结构优先定义明确 interface 或 type。
- 组件 props、项目配置、路由元信息需要有类型约束。
- 工具函数放在 `src/utils/`，命名表达清楚用途。
- 复杂逻辑优先拆到纯函数，方便后续测试。

## 静态资源规范

- 会被组件 import 的图片、音频等资源放在 `src/assets/`。
- 不需要构建处理、直接通过 URL 访问的资源放在 `public/assets/`。
- 资源文件名使用小写短横线命名。
- 大型资源需要谨慎引入，避免影响静态站加载速度。

## 开发流程

新增一个小项目时，按以下步骤进行：

1. 在 `src/pages/projects/` 下创建项目目录。
2. 编写页面组件和局部样式。
3. 在项目清单中登记元信息。
4. 在路由配置中添加页面路径。
5. 在本地启动网站，验证主页入口和直接访问页面都正常。
6. 执行类型检查和构建。

## 命名规范

- 文件夹：小写短横线，例如 `memory-card`。
- React 组件文件：大驼峰，例如 `ProjectCard.tsx`。
- 普通工具文件：小写短横线或小驼峰，保持目录内一致。
- CSS Module：`*.module.css`。
- 类型名：大驼峰，例如 `ProjectItem`。
- 常量：语义清楚，必要时使用全大写，例如 `PROJECT_STATUS_LABELS`。
