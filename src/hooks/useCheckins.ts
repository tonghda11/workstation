import { useCallback, useEffect, useState } from "react";
import type { CheckinItem } from "../lib/types";
import { beijingDateKey } from "../lib/dates";

const STORAGE_KEY = "ws.checkins.v1";

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function load(): CheckinItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is CheckinItem =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as CheckinItem).id === "string" &&
            typeof (item as CheckinItem).name === "string" &&
            typeof (item as CheckinItem).createdAt === "number" &&
            typeof (item as CheckinItem).history === "object"
        )
    );
  } catch {
    return [];
  }
}

/** 仅当 URL 带 ?demo 且本地没有数据时，填充示例打卡，方便预览和截图 */
function demoItems(): CheckinItem[] {
  const now = Date.now();
  const day = 86400000;
  const key = (offsetDays: number) =>
    beijingDateKey(new Date(now + offsetDays * day));
  return [
    {
      id: "demo-1",
      name: "晨间阅读",
      createdAt: now - 20 * day,
      history: {
        [key(0)]: now - 2 * 3600e3,
        [key(-1)]: now - 26 * 3600e3,
        [key(-2)]: now - 50 * 3600e3,
        [key(-3)]: now - 74 * 3600e3,
      },
    },
    {
      id: "demo-2",
      name: "睡前拉伸",
      createdAt: now - 12 * day,
      history: { [key(0)]: now - 3600e3, [key(-1)]: now - 27 * 3600e3 },
    },
    {
      id: "demo-3",
      name: "喝水八杯",
      createdAt: now - 3 * day,
      history: { [key(-1)]: now - 31 * 3600e3 },
    },
  ];
}

export function useCheckins() {
  const [items, setItems] = useState<CheckinItem[]>(() => {
    const existing = load();
    if (existing.length > 0) return existing;
    if (typeof window !== "undefined" && window.location.search.includes("demo")) {
      return demoItems();
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* 忽略存储失败 */
    }
  }, [items]);

  const addItem = useCallback((name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setItems((prev) => [
      ...prev,
      { id: newId(), name: trimmed, createdAt: Date.now(), history: {} },
    ]);
  }, []);

  const toggleToday = useCallback((id: string) => {
    const today = beijingDateKey(new Date());
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const history = { ...item.history };
        if (history[today]) {
          delete history[today];
        } else {
          history[today] = Date.now();
        }
        return { ...item, history };
      })
    );
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, addItem, toggleToday, removeItem };
}
