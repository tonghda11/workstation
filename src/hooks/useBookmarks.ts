import { useCallback, useEffect, useState } from "react";

export interface BookmarkItem {
  id: string;
  name: string;
  url: string;
}

const STORAGE_KEY = "ws.bookmarks.v1";

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function load(): BookmarkItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is BookmarkItem =>
        Boolean(
          item &&
            typeof item === "object" &&
            typeof (item as BookmarkItem).id === "string" &&
            typeof (item as BookmarkItem).name === "string" &&
            typeof (item as BookmarkItem).url === "string"
        )
    );
  } catch {
    return [];
  }
}

export function useBookmarks() {
  const [items, setItems] = useState<BookmarkItem[]>(load);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* 忽略存储失败 */
    }
  }, [items]);

  const add = useCallback((name: string, url: string) => {
    if (!name.trim() || !url.trim()) return;
    setItems((prev) => [
      ...prev,
      { id: newId(), name: name.trim(), url: url.trim() },
    ]);
  }, []);

  const remove = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return { items, add, remove };
}
