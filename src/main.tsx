import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

if (!import.meta.env.DEV && "serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);

  // 新版本接管时自动刷新一次，避免还停留在旧页面上
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController) return;
    window.location.reload();
  });

  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("./sw.js", { updateViaCache: "none" })
      .then((registration) => registration.update())
      .catch(() => {
        /* 离线缓存不可用时忽略 */
      });
  });
}
