import { useMemo, useState, type FormEvent } from "react";
import { CaretLeft, CaretRight, Check, Plus, X } from "@phosphor-icons/react";
import { useCheckins } from "../hooks/useCheckins";
import { beijingDateKey, streakFor } from "../lib/dates";
import { SectionHeader } from "./SectionHeader";

const PALETTE = [
  "#b23a2b",
  "#2f6f4f",
  "#2b4f8f",
  "#8a5a1f",
  "#6b3fa0",
  "#a03a6b",
];

const WEEKDAYS = ["一", "二", "三", "四", "五", "六", "日"];

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

interface Cell {
  key: string;
  day: number;
  isToday: boolean;
  future: boolean;
  doneIds: string[];
}

export function Checkin() {
  const { items, addItem, toggleDate, removeItem } = useCheckins();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const sorted = useMemo(
    () => [...items].sort((a, b) => a.createdAt - b.createdAt),
    [items]
  );

  const todayKey = beijingDateKey(new Date());
  const [todayYear, todayMonth] = todayKey.split("-").map(Number);
  const [cursor, setCursor] = useState(() => ({
    year: todayYear,
    month: todayMonth - 1,
  }));

  const selected =
    sorted.find((item) => item.id === selectedId) ?? sorted[0] ?? null;

  function colorOf(id: string): string {
    const index = sorted.findIndex((item) => item.id === id);
    return PALETTE[Math.max(0, index) % PALETTE.length];
  }

  const cells = useMemo(() => {
    const firstWeekday =
      (new Date(cursor.year, cursor.month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const out: (Cell | null)[] = Array.from(
      { length: firstWeekday },
      () => null
    );
    for (let day = 1; day <= daysInMonth; day += 1) {
      const key = `${cursor.year}-${pad(cursor.month + 1)}-${pad(day)}`;
      out.push({
        key,
        day,
        isToday: key === todayKey,
        future: key > todayKey,
        doneIds: sorted
          .filter((item) => item.history[key])
          .map((item) => item.id),
      });
    }
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [cursor, sorted, todayKey]);

  const monthStats = useMemo(() => {
    const filled = cells.filter((cell): cell is Cell => Boolean(cell));
    return {
      done: filled.filter((cell) => cell.doneIds.length > 0).length,
      elapsed: filled.filter((cell) => !cell.future).length,
    };
  }, [cells]);

  const doneToday = sorted.filter((item) => item.history[todayKey]).length;

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!draft.trim()) return;
    addItem(draft);
    setDraft("");
    setAdding(false);
  }

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const next = new Date(current.year, current.month + delta, 1);
      return { year: next.getFullYear(), month: next.getMonth() };
    });
  }

  function toggleCell(cell: Cell) {
    if (!selected || cell.future) return;
    toggleDate(selected.id, cell.key);
  }

  return (
    <section aria-label="习惯打卡">
      <SectionHeader
        title="打卡日历"
        desc="点选一个项目，再点日期即可补记或取消；数据只保存在本机。"
        extra={
          <p className="text-xs text-mut" aria-live="polite">
            今日
            <span className="mx-1 font-mono font-semibold tabular-nums text-ink">
              {doneToday}/{sorted.length}
            </span>
            项
          </p>
        }
      />

      <div className="flex flex-wrap items-center gap-1.5">
        {sorted.map((item) => {
          const active = selected?.id === item.id;
          return (
            <span
              key={item.id}
              className={`inline-flex items-center gap-0.5 rounded-full border py-0.5 pl-2 pr-1 text-xs transition ${
                active
                  ? "border-ink/50 bg-white/60"
                  : "border-line bg-white/25 hover:bg-white/45"
              }`}
            >
              <button
                type="button"
                aria-pressed={active}
                onClick={() => setSelectedId(item.id)}
                className="inline-flex items-center gap-1.5 py-0.5"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: colorOf(item.id) }}
                />
                {item.name}
              </button>
              <button
                type="button"
                onClick={() => removeItem(item.id)}
                aria-label={`删除项目 ${item.name}`}
                className="grid h-5 w-5 place-items-center rounded-full text-faint transition hover:text-ink"
              >
                <X size={10} weight="bold" />
              </button>
            </span>
          );
        })}

        {adding ? (
          <form onSubmit={submit} className="inline-flex items-center gap-1">
            <input
              autoFocus
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="新项目"
              aria-label="新打卡项目名称"
              className="ink-input w-24 rounded-full border px-2.5 py-1 text-xs text-ink placeholder:text-faint"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="确认添加"
              className="grid h-6 w-6 place-items-center rounded-full bg-accent text-accent-ink transition disabled:opacity-40"
            >
              <Check size={11} weight="bold" />
            </button>
            <button
              type="button"
              onClick={() => {
                setAdding(false);
                setDraft("");
              }}
              aria-label="取消添加"
              className="grid h-6 w-6 place-items-center rounded-full border border-line text-mut"
            >
              <X size={10} />
            </button>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-line-strong px-2.5 py-1 text-xs text-mut transition hover:border-accent hover:text-accent"
          >
            <Plus size={11} weight="bold" />
            项目
          </button>
        )}
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line-strong px-3 py-7 text-center text-xs text-mut">
          先添加一个打卡项目，再在日历上标记。
        </p>
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => shiftMonth(-1)}
                aria-label="上个月"
                className="grid h-7 w-7 place-items-center rounded-full border border-line text-mut transition hover:border-line-strong hover:text-ink"
              >
                <CaretLeft size={12} weight="bold" />
              </button>
              <span className="font-hand px-1 text-base font-bold tabular-nums text-ink">
                {cursor.year}年{cursor.month + 1}月
              </span>
              <button
                type="button"
                onClick={() => shiftMonth(1)}
                aria-label="下个月"
                className="grid h-7 w-7 place-items-center rounded-full border border-line text-mut transition hover:border-line-strong hover:text-ink"
              >
                <CaretRight size={12} weight="bold" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-mut">
              <span>
                本月
                <b className="mx-1 font-mono text-ink">{monthStats.done}</b>/
                {monthStats.elapsed} 天
              </span>
              <button
                type="button"
                onClick={() =>
                  setCursor({ year: todayYear, month: todayMonth - 1 })
                }
                className="rounded-full border border-line px-2 py-0.5 transition hover:border-accent hover:text-accent"
              >
                今天
              </button>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1">
            {WEEKDAYS.map((weekday) => (
              <div
                key={weekday}
                className="pb-1 text-center text-[10px] text-faint"
              >
                {weekday}
              </div>
            ))}
            {cells.map((cell, index) =>
              cell ? (
                <button
                  key={cell.key}
                  type="button"
                  onClick={() => toggleCell(cell)}
                  disabled={cell.future}
                  aria-label={`${cursor.month + 1}月${cell.day}日，已完成 ${cell.doneIds.length} 项`}
                  className={`flex h-11 flex-col items-center rounded-md border pt-1 text-[11px] leading-none transition md:h-12 ${
                    cell.isToday
                      ? "border-accent bg-white/50"
                      : "border-line hover:bg-white/40"
                  } ${cell.future ? "opacity-35" : ""}`}
                >
                  <span
                    className={
                      cell.isToday ? "font-bold text-accent" : "text-ink"
                    }
                  >
                    {cell.day}
                  </span>
                  <span className="mt-1 flex items-center gap-0.5">
                    {cell.doneIds.slice(0, 3).map((id) => (
                      <span
                        key={id}
                        className="h-1.5 w-1.5 rounded-full"
                        style={{ backgroundColor: colorOf(id) }}
                      />
                    ))}
                    {cell.doneIds.length > 3 && (
                      <span className="text-[8px] text-mut">
                        +{cell.doneIds.length - 3}
                      </span>
                    )}
                  </span>
                </button>
              ) : (
                <div key={`blank-${index}`} />
              )
            )}
          </div>

          <p className="mt-2 text-[11px] text-faint">
            当前项目「{selected?.name}」：点日期打卡或取消，未来日期不可点。
          </p>
          </div>

          <aside className="rounded-xl border border-line bg-white/35 p-3">
            <div className="flex items-baseline justify-between">
              <h3 className="font-hand text-base font-bold">本月概览</h3>
              <span className="text-[11px] text-mut">
                {cursor.month + 1} 月
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {sorted.map((item) => {
                const monthCount = cells.reduce(
                  (total, cell) =>
                    cell && item.history[cell.key] ? total + 1 : total,
                  0
                );
                return (
                  <li key={item.id} className="flex items-center gap-2 text-xs">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: colorOf(item.id) }}
                    />
                    <span className="min-w-0 flex-1 truncate">{item.name}</span>
                    <span className="font-mono tabular-nums text-ink">
                      {monthCount}
                    </span>
                    <span className="text-[10px] text-mut">天</span>
                    <span className="rounded-full border border-line px-1.5 py-0.5 text-[10px] text-mut">
                      连续 {streakFor(item.history)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="mt-2 border-t border-line pt-2 text-[10px] leading-relaxed text-faint">
              点选项目后点日期即可补记或取消；连续天数从最近一次打卡往前数。
            </p>
          </aside>
        </div>
      )}
    </section>
  );
}
