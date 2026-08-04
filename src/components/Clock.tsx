import { motion, useReducedMotion } from "motion/react";
import { useNow } from "../hooks/useNow";
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
  year: "numeric",
  month: "long",
  day: "numeric",
  weekday: "long",
});

function timeParts(now: Date) {
  const parts = timeFmt.formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "--";
  return { hour: get("hour"), minute: get("minute"), second: get("second") };
}

export function Clock() {
  const now = useNow(1000);
  const reduce = useReducedMotion();
  const { hour, minute, second } = timeParts(now);
  const secNum = Number(second);

  const dateParts = dateFmt.formatToParts(now);
  const get = (t: string) => dateParts.find((p) => p.type === t)?.value ?? "";
  const dateLabel = `${get("year")}年${get("month")}月${get("day")}日 ${get(
    "weekday"
  )}`;

  return (
    <section aria-label="北京时间" className="pt-6 md:pt-10">
      <div className="grid items-end gap-8 lg:grid-cols-[1.6fr_1fr]">
        <div>
          <p className="text-sm text-mut">北京时间</p>
          <div className="mt-2 flex items-baseline">
            <span className="font-mono text-[64px] font-medium leading-none tracking-tight tabular-nums text-ink md:text-[96px]">
              {hour}:{minute}
              <motion.span
                key={second}
                initial={reduce ? false : { opacity: 0.25 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.35 }}
                className="text-accent"
              >
                :{second}
              </motion.span>
            </span>
          </div>
          <div
            className="mt-7 h-[3px] w-full max-w-[420px] overflow-hidden rounded-full bg-line"
            role="progressbar"
            aria-label="当前秒在一分钟内的进度"
            aria-valuemin={0}
            aria-valuemax={60}
            aria-valuenow={secNum}
          >
            <motion.div
              className="h-full rounded-full bg-accent"
              animate={{ width: `${((secNum + 1) / 60) * 100}%` }}
              transition={
                reduce ? { duration: 0 } : { duration: 1, ease: "linear" }
              }
            />
          </div>
        </div>
        <div className="pb-1 text-left lg:text-right">
          <div className="text-xl font-medium md:text-2xl">{dateLabel}</div>
          <div className="mt-2 flex items-center gap-2 text-sm text-mut lg:justify-end">
            <span className="rounded-full border border-line-strong px-2 py-0.5 font-mono text-xs tabular-nums">
              UTC+8
            </span>
            中国标准时间
          </div>
        </div>
      </div>
    </section>
  );
}
