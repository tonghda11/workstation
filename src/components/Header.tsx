import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "../hooks/useTheme";

export function Header() {
  const { theme, toggle } = useTheme();

  return (
    <header className="border-b border-line bg-bg/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-[1280px] items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="grid h-8 w-8 place-items-center rounded-[10px] bg-accent text-sm font-bold text-accent-ink">
            工
          </span>
          <span className="text-[17px] font-semibold tracking-tight">
            我的工作站
          </span>
        </div>
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
          className="grid h-9 w-9 place-items-center rounded-full border border-line text-mut transition hover:border-line-strong hover:text-ink active:scale-90"
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.span
              key={theme}
              initial={{ opacity: 0, rotate: -30 }}
              animate={{ opacity: 1, rotate: 0 }}
              exit={{ opacity: 0, rotate: 30 }}
              transition={{ duration: 0.18 }}
              className="grid place-items-center"
            >
              {theme === "dark" ? (
                <Sun size={16} weight="bold" />
              ) : (
                <Moon size={16} weight="bold" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
