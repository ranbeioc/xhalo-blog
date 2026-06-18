# xhalo-blog 中文说明

`xhalo-blog` 是一个开源的 Cloudflare 原生博客框架脚手架，面向 Hexo/NexT 兼容站点、Cloudflare Pages、Workers API、D1、R2、GitHub 发布流程和浏览器管理后台。

## 仓库边界

- `ranbeioc/xhalo-blog`：开源框架仓库，只放框架源码、Admin、Worker API、模板、迁移工具、文档和测试，不提交真实私有文章、上传资源、生产 `CNAME`、部署密钥、统计 ID 或生产内容。
- `ranbeioc/hexo-blog`：历史 Hexo/NexT 博客的只读来源，用于迁移，不从本框架写入它的 `main`。
- `ranbeioc/xhalo-blog-test`：私有真实内容测试站，由初始化/导入流程生成，并绑定 Cloudflare Pages 部署。

## 快速开始

```bash
npm ci
npm run check:all
npm run build:admin
npm run build:landing
```

## 标准初始化和 Hexo/NexT 导入

没有历史博客内容时，使用 starter 模式生成默认 NexT 主题和欢迎文章：

```bash
npm run init:hexo-next -- --target ../my-blog-test
npm run init:hexo-next -- --target ../my-blog-test --mode starter --site-url https://blog.example.com
```

已有 Hexo/NexT 博客时，使用 import 模式从本地历史仓库生成私有测试站：

```bash
npm run init:hexo-next -- --target ../my-blog-test --source ../hexo-blog --site-url https://blog.example.com
npm run init:hexo-next -- --target ../my-blog-test --mode import --source ../hexo-blog --site-title "My Blog" --site-url https://blog.example.com
```

导入模式会保留安全的 Hexo/NexT 内容和配置，包括文章、上传资源、独立页面、`_data`、脚手架、脚本、主题文件、菜单配置、feed/search/sitemap/media 插件配置、`package.json` 与 lockfile。迁移过程会禁用旧 deploy 配置，保留 `/admin/`、`/landing/` 和 `_worker.js` 的 Pages 挂载边界，并生成 `.xhalo-import-manifest.json` 与 `.xhalo-import-report.md` 供审计。

## Cloudflare Pages 部署

开源产品落地页：

```text
Project: xhalo-blog-landing
GitHub source: ranbeioc/xhalo-blog
Build command: npm ci && npm run build:landing
Build output directory: apps/landing/dist
Production domain: blog.xhalo.co
```

私有完整博客测试站或生产站：

```text
Project: xhalo-blog-test 或自有 Pages 项目
GitHub source: 私有生成站点仓库
Build command: npm ci && npm run build
Build output directory: public
Production domain: 你的博客主域名
```

## 管理后台和发布边界

Admin 运行在博客同域 `/admin/` 路径，支持 GitHub OAuth、测试/预发环境首登管理员、分页文章加载、文章编辑、菜单管理、媒体流程、Hexo/NexT 配置查看、GitHub/Cloudflare 集成状态、审计摘要和 test-only direct publish。

生产写入默认仍是 PR-only。默认安全模式不允许生产 direct write、不允许生产 R2 live upload、不允许写入 `ranbeioc/hexo-blog@main`。

## 安全

不要提交真实 API token、account ID、zone ID、analytics ID、私钥、deploy hook、OAuth secret 或生产内容。

## 许可证

MIT。详见 [`LICENSE`](./LICENSE)。
