# Web Gadgets

Web Gadgets 是一个用于收纳多个静态单页面小游戏和小工具的 React + TypeScript 网站。

主页负责展示项目列表，点击后进入对应的小项目。每个小项目都是静态网页页面，可独立开发、独立访问，并共享全站统一的主题风格。

## 项目目标

- 使用 React + TypeScript 构建静态网站。
- 使用 Vite 作为构建工具。
- 主页提供小游戏、小工具的统一入口列表。
- 每个小项目保持单页面、静态化、可部署的形态。
- 全站共享统一的颜色、字体、间距、组件和交互规范。
- 支持部署到 GitHub Pages。

## 本地开发

项目使用 Volta 管理 Node 和 npm 版本。进入项目目录后，Volta 会根据 `package.json` 中的配置自动切换版本。

安装依赖：

```bash
npm install
```

启动开发服务器：

```bash
npm run dev
```

生产构建：

```bash
npm run build
```

预览构建产物：

```bash
npm run preview
```

## 文档

- [开发约定与规范](docs/development.md)
- [GitHub Pages 部署说明](docs/github-pages.md)

## 当前状态

项目已完成基础初始化，包含 React + TypeScript + Vite 骨架、主页项目列表、统一主题样式和 GitHub Pages 部署工作流。
