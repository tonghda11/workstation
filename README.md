# 我的工作站

一个纯静态的个人工作站首页，包含四个模块（自上而下）：

1. 北京时间时钟
2. 新闻平台（谷歌 / Bing / 百度，从左到右）
3. 习惯打卡（多项目，按创建时间从左到右，数据保存在本机浏览器）
4. 网络环境与浏览机型

## 本地运行

```bash
npm install
npm run dev
```

## 构建

```bash
npm run build
```

产物在 `dist/`，纯静态文件，可部署到任意静态托管。

## 部署

仓库内已包含 GitHub Pages 的 Actions 工作流
（`.github/workflows/deploy.yml`）。推送到 `main` 分支后，在仓库设置中开启
GitHub Pages（Source 选择 GitHub Actions）即可。
