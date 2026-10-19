import { AnimatePresence, motion } from "motion/react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useNow } from "../hooks/useNow";
import { useTheme } from "../hooks/useTheme";
import { BEIJING_TZ } from "../lib/dates";

const timeFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: BEIJING_TZ,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

const dateFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: BEIJING_TZ,
  month: "long",
  day: "numeric",
  weekday: "short",
});

export function BoxLid() {
  const now = useNow(1000);
  const { theme, toggle } = useTheme();

  const parts = timeFmt.formatToParts(now);
  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value ?? "--";
  const hour = get("hour");
  const minute = get("minute");
  const second = get("second");

  return (
    <header className="box-lid">
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[7px] bg-[var(--brass)] text-sm font-bold text-[var(--brass-ink)] shadow-[inset_0_1px_0_rgb(255_250_230/0.7),0_2px_4px_rgb(0_0_0/0.35)]">
          工
        </span>
        <div className="min-w-0">
          <p className="font-hand truncate text-[17px] font-bold leading-none tracking-wide text-[#f7e7c9]">
            我的工作站
          </p>
          <p className="mt-1 hidden truncate text-[10px] uppercase tracking-[0.22em] text-[#d9bf93] sm:block">
            my workstation
          </p>
        </div>
      </div>

      <div className="flex items-baseline justify-center gap-2 font-mono leading-none text-[#f7e8ca]">
        <span className="text-[26px] tabular-nums tracking-tight md:text-[32px]">
          {hour}:{minute}
        </span>
        <span className="text-sm tabular-nums text-[var(--brass)] md:text-base">
          :{second}
        </span>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <span className="hidden text-xs text-[#e6d1ac] sm:block">
          {dateFmt.format(now)}
        </span>
        <button
          type="button"
          onClick={toggle}
          aria-label={theme === "dark" ? "切换到浅色主题" : "切换到深色主题"}
          className="grid h-8 w-8 place-items-center rounded-full border border-[rgb(240_219_184/0.4)] text-[#f0dcb6] transition hover:border-[var(--brass)] hover:text-[var(--brass)] active:scale-90"
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
                <Sun size={15} weight="bold" />
              ) : (
                <Moon size={15} weight="bold" />
              )}
            </motion.span>
          </AnimatePresence>
        </button>
      </div>
    </header>
  );
}
