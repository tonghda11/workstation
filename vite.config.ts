import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // 相对路径构建，方便部署到任意静态托管（包括 GitHub Pages 子路径）
  base: "./",
});
