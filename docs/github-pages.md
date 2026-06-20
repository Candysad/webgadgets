# GitHub Pages 部署说明

本文档记录 Web Gadgets 部署到 GitHub Pages 的配置和检查项。

## 部署方式

项目推荐使用 GitHub Actions 自动部署到 GitHub Pages。

基本流程：

1. 安装依赖。
2. 执行类型检查和生产构建。
3. 将 `dist/` 发布到 GitHub Pages。

当前部署工作流位于 `.github/workflows/deploy.yml`。

## Vite Base 配置

当前仓库地址为：

```text
https://github.com/Candysad/webgadgets.git
```

仓库页部署路径通常是：

```text
https://candysad.github.io/webgadgets/
```

因此 `vite.config.ts` 中需要配置：

```ts
export default defineConfig({
  base: '/webgadgets/',
});
```

如果未来改为用户或组织主页仓库，例如 `Candysad.github.io`，根路径部署时再改为：

```ts
export default defineConfig({
  base: '/',
});
```

## 构建命令

本地验证生产构建：

```bash
npm run build
```

本地预览构建产物：

```bash
npm run preview
```

## GitHub 仓库设置

首次启用 GitHub Pages 时，需要在仓库中检查：

1. 打开 GitHub 仓库的 Settings。
2. 进入 Pages。
3. Source 选择 GitHub Actions。
4. 确认 Actions 有 Pages 写入权限。

当前工作流已经包含 Pages 部署所需权限：

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## 部署前检查

发布前建议确认：

- `vite.config.ts` 中的 `base` 与仓库部署路径一致。
- `npm run build` 可以成功执行。
- 页面刷新时路由可正常工作。
- 静态资源路径没有写死为本地绝对路径。
- 主页项目入口都能跳转到正确页面。

## 路由注意事项

项目当前使用 Hash Router，页面地址会带有 `#`，例如：

```text
https://candysad.github.io/webgadgets/#/projects/example
```

Hash Router 对 GitHub Pages 更友好，刷新页面时不需要额外配置 404 fallback。
