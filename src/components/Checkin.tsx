import { useState, type FormEvent } from "react";
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
    </section>
  );
}
