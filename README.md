# 我的工作站

一个纯静态的个人工作站首页，包含四个模块（自上而下）：

1. 北京时间时钟
2. 新闻平台（谷歌 / Bing / 百度，从左到右）
3. 常用网站（自定义添加常用网址，图标栏）
4. 自选行情（左侧股票自选、右侧基金自选，实时涨跌）
5. 视频下载（粘贴链接生成 yt-dlp 一键下载脚本）
6. 习惯打卡（多项目，按创建时间从左到右，数据保存在本机浏览器）
7. 网络环境与浏览机型

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

仓库内的工作流（`.github/workflows/deploy.yml`）会在每次推送时自动构建，
并把构建产物提交到 `docs/` 目录。GitHub Pages 设置为从 `main` 分支的
`/docs` 目录发布即可，推送到 `main` 后网站自动更新。

线上地址：https://tonghda11.is-a.dev

本地开发：`npm install` 后运行 `npm run dev`。
