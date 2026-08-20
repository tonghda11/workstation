import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 相对路径构建，方便部署到任意静态托管（包括 GitHub Pages 子路径）
  base: "./",
  build: {
    rollupOptions: {
      output: {
        // 把 React 运行时拆成独立 chunk，业务更新时浏览器只重新下载业务代码
        manualChunks(id) {
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom") ||
            id.includes("node_modules/scheduler")
          ) {
            return "react";
          }
          return undefined;
        },
      },
    },
  },
});
