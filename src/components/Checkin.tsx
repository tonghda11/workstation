import { useMemo, useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Plus, Trash, X } from "@phosphor-icons/react";
import { useCheckins } from "../hooks/useCheckins";
import { beijingDateKey, beijingHM, createdLabel, streakFor } from "../lib/dates";
import { SectionHeader } from "./SectionHeader";

export function Checkin() {
  const { items, addItem, toggleToday, removeItem } = useCheckins();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const reduce = useReducedMotion();

  const today = beijingDateKey(new Date());
  const doneToday = items.filter((item) => item.history[today]).length;
  const sorted = [...items].sort((a, b) => a.createdAt - b.createdAt);

  const activeSet = useMemo(() => {
    const set = new Set<string>();
    for (const item of items) {
      for (const key of Object.keys(item.history)) set.add(key);
    }
    return set;
  }, [items]);

  const calendar = useMemo(() => {
    const [y, m, d] = today.split("-").map(Number);
    const end = new Date(Date.UTC(y, m - 1, d));
    const days: { key: string; active: boolean; isToday: boolean }[] = [];
    for (let i = 90; i >= 0; i -= 1) {
      const dt = new Date(end.getTime() - i * 86400000);
      const key = dt.toISOString().slice(0, 10);
      days.push({
        key,
        active: activeSet.has(key),
        isToday: i === 0,
      });
    }
    const weeks: (typeof days)[] = [];
    for (let i = 0; i < days.length; i += 7) {
      weeks.push(days.slice(i, i + 7));
    }
    return weeks;
  }, [activeSet, today]);

  const stats = useMemo(() => {
    const keys = calendar.flat().map((c) => c.key);
    const active = (n: number) =>
      keys.slice(-n).filter((k) => activeSet.has(k)).length;
    return { week: active(7), month: active(30) };
  }, [calendar, activeSet]);

  const weekdays = ["一", "二", "三", "四", "五", "六", "日"];

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim()) return;
    addItem(draft);
    setDraft("");
    setAdding(false);
  }

  return (
    <section aria-label="习惯打卡">
      <SectionHeader
        title="习惯打卡"
        desc="多个打卡项目按创建时间从左到右排列，新项目出现在最右侧。数据只保存在本机。"
        extra={
          <p className="text-sm text-mut" aria-live="polite">
            今日
            <span className="mx-1 font-mono font-semibold tabular-nums text-ink">
              {doneToday}/{items.length}
            </span>
            项完成
          </p>
        }
      />
      <div className="scrollbar-none -mx-1 flex gap-3 overflow-x-auto px-1 pb-3 pt-1 snap-x">
        <AnimatePresence initial={false}>
          {sorted.map((item) => {
            const done = Boolean(item.history[today]);
            const stamp = item.history[today];
            const streak = streakFor(item.history);
            const lastTs = Math.max(0, ...Object.values(item.history));
            return (
              <motion.article
                key={item.id}
                layout
                initial={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? undefined : { opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="flex w-60 shrink-0 snap-start flex-col gap-3 rounded-2xl border border-line bg-surface2 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="break-all font-medium leading-snug">
                    {item.name}
                  </h4>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`删除项目 ${item.name}`}
                    className="-m-1 rounded-lg p-1 text-faint transition hover:text-ink active:scale-90"
                  >
                    <Trash size={15} />
                  </button>
                </div>
                <motion.button
                  type="button"
                  onClick={() => toggleToday(item.id)}
                  whileTap={reduce ? undefined : { scale: 0.97 }}
                  className={
                    done
                      ? "inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent py-2.5 text-sm font-medium text-accent-ink transition"
                      : "inline-flex items-center justify-center gap-1.5 rounded-xl border border-line-strong py-2.5 text-sm font-medium text-mut transition hover:border-accent hover:text-accent"
                  }
                >
                  {done ? (
                    <>
                      <Check size={16} weight="bold" />
                      {stamp ? `已打卡 ${beijingHM(stamp)}` : "已打卡"}
                    </>
                  ) : (
                    "今天打卡"
                  )}
                </motion.button>
                <dl className="space-y-1.5 border-t border-line pt-3 text-xs text-mut">
                  <div className="flex items-center justify-between">
                    <dt>连续</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {streak} 天
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>最近打卡</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {lastTs ? beijingHM(lastTs) : "未打卡"}
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt>始于</dt>
                    <dd className="font-mono tabular-nums text-ink">
                      {createdLabel(item.createdAt)}
                    </dd>
                  </div>
                </dl>
              </motion.article>
            );
          })}
        </AnimatePresence>

        {adding ? (
          <form
            onSubmit={submit}
            className="flex w-60 shrink-0 snap-start flex-col justify-center gap-3 rounded-2xl border border-dashed border-line-strong bg-surface p-4"
          >
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="项目名称，比如晨跑"
              aria-label="新打卡项目名称"
              className="w-full rounded-[10px] border border-line bg-surface2 px-3 py-2 text-sm focus:border-accent"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!draft.trim()}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-accent py-2 text-sm font-medium text-accent-ink transition disabled:opacity-40 active:scale-95"
              >
                <Check size={15} weight="bold" />
                添加
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setDraft("");
                }}
                aria-label="取消添加"
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line text-mut transition hover:text-ink active:scale-90"
              >
                <X size={15} weight="bold" />
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex w-60 shrink-0 snap-start items-center justify-center gap-2 self-stretch rounded-2xl border border-dashed border-line-strong bg-surface text-sm font-medium text-mut transition hover:border-accent hover:text-accent active:scale-[0.99]"
          >
            <Plus size={16} weight="bold" />
            {items.length === 0 ? "添加第一个打卡项目" : "添加项目"}
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-6 rounded-2xl border border-line bg-surface2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">打卡日历</h3>
            <div className="flex gap-4 text-sm text-mut">
              <span>
                近 7 天
                <span className="ml-1 font-mono font-semibold tabular-nums text-ink">
                  {stats.week}/7
                </span>
                天
              </span>
              <span>
                近 30 天
                <span className="ml-1 font-mono font-semibold tabular-nums text-ink">
                  {stats.month}/30
                </span>
                天
              </span>
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <div className="inline-flex flex-col gap-1">
              <div className="flex gap-1 pl-8">
                {calendar.map((week, wi) => {
                  const month = Number(week[0]?.key.slice(5, 7)) || 0;
                  const prev = Number(calendar[wi - 1]?.[0]?.key.slice(5, 7)) || 0;
                  return (
                    <div
                      key={week[0]?.key}
                      className="w-3.5 text-center text-[10px] leading-3 text-faint md:w-4"
                    >
                      {month !== prev ? `${month}月` : ""}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-1">
                <div className="mr-2 flex w-6 flex-col gap-1 text-[10px] leading-3 text-faint">
                  {weekdays.map((w) => (
                    <span key={w}>{w}</span>
                  ))}
                </div>
                {calendar.map((week) => (
                  <div key={week[0]?.key} className="flex flex-col gap-1">
                    {week.map((cell) => (
                      <div
                        key={cell.key}
                        title={`${cell.key} ${cell.active ? "已打卡" : "未打卡"}`}
                        className="h-3.5 w-3.5 rounded-[4px] md:h-4 md:w-4"
                        style={{
                          backgroundColor: cell.active
                            ? "var(--ws-accent)"
                            : "var(--ws-line)",
                          opacity: cell.active ? 0.92 : 0.55,
                          outline: cell.isToday
                            ? "2px solid var(--ws-accent)"
                            : undefined,
                          outlineOffset: 1,
                        }}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-3 text-xs text-faint">
            任意项目当天打过卡即算完成，绿色为今天。
          </p>
        </div>
      )}
    </section>
  );
}
