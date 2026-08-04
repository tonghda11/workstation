import { useCallback, useState } from "react";

const STORAGE_KEY = "ws.theme";

function currentTheme(): "light" | "dark" {
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">(currentTheme);

  const toggle = useCallback(() => {
    const next = currentTheme() === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", next === "dark");
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* 忽略存储失败 */
    }
    setTheme(next);
  }, []);

  return { theme, toggle };
}
