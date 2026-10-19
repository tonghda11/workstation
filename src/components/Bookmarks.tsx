import { useState, type FormEvent } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, Plus, Trash, X } from "@phosphor-icons/react";
import { useBookmarks } from "../hooks/useBookmarks";
import { SectionHeader } from "./SectionHeader";

function normalizeUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return "";
  const withProto = /^https?:\/\//i.test(t) ? t : `https://${t}`;
  try {
    new URL(withProto);
    return withProto;
  } catch {
    return "";
  }
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

function Favicon({ url, name }: { url: string; name: string }) {
  const host = hostOf(url);
  const sources = [
    `https://${host}/favicon.ico`,
    `https://www.google.com/s2/favicons?domain=${host}&sz=64`,
  ];
  const [idx, setIdx] = useState(0);

  if (!host || idx >= sources.length) {
    return (
      <span className="grid h-8 w-8 place-items-center rounded-lg bg-accent-soft text-xs font-semibold text-accent">
        {(name || host || "?").slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="grid h-8 w-8 place-items-center rounded-lg border border-line bg-white/70">
      <img
        src={sources[idx]}
        alt=""
        loading="lazy"
        className="h-4 w-4"
        onError={() => setIdx((i) => i + 1)}
      />
    </span>
  );
}

export function Bookmarks() {
  const { items, add, remove } = useBookmarks();
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const reduce = useReducedMotion();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalized = normalizeUrl(url);
    if (!name.trim() || !normalized) return;
    add(name, normalized);
    setName("");
    setUrl("");
    setAdding(false);
  }

  return (
    <section aria-label="常用网站">
      <SectionHeader
        title="常用网站"
        desc="点图标在新标签页打开；数据只保存在本机。"
        extra={<p className="text-xs text-mut">{items.length} 个</p>}
      />

      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
        <AnimatePresence initial={false}>
          {items.map((bookmark) => (
            <motion.div
              key={bookmark.id}
              layout
              initial={reduce ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="group relative flex flex-col items-center gap-1.5 rounded-xl border border-line bg-white/40 px-2 py-3 transition hover:bg-white/60"
            >
              <a
                href={bookmark.url}
                target="_blank"
                rel="noopener noreferrer"
                title={bookmark.url}
                className="flex w-full flex-col items-center gap-1.5"
              >
                <Favicon url={bookmark.url} name={bookmark.name} />
                <span className="w-full truncate text-center text-[11px] font-medium">
                  {bookmark.name}
                </span>
              </a>
              <button
                type="button"
                onClick={() => remove(bookmark.id)}
                aria-label={`删除 ${bookmark.name}`}
                className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full border border-line bg-[var(--note-color)] text-faint opacity-0 transition hover:text-ink active:scale-90 group-hover:opacity-100"
              >
                <Trash size={10} weight="bold" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {adding ? (
          <form
            onSubmit={submit}
            className="col-span-3 flex flex-col gap-1.5 rounded-xl border border-dashed border-line-strong bg-white/30 p-2.5 sm:col-span-2"
          >
            <input
              autoFocus
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="名称，如 GitHub"
              aria-label="网站名称"
              className="ink-input rounded-lg border px-2 py-1.5 text-xs text-ink placeholder:text-faint"
            />
            <input
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="网址，如 github.com"
              aria-label="网站网址"
              className="ink-input rounded-lg border px-2 py-1.5 text-xs text-ink placeholder:text-faint"
            />
            <div className="flex gap-1.5">
              <button
                type="submit"
                disabled={!name.trim() || !normalizeUrl(url)}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-accent py-1 text-[11px] font-medium text-accent-ink transition disabled:opacity-40 active:scale-95"
              >
                <Check size={12} weight="bold" />
                添加
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdding(false);
                  setName("");
                  setUrl("");
                }}
                aria-label="取消添加"
                className="grid h-6 w-6 shrink-0 place-items-center rounded-full border border-line text-mut"
              >
                <X size={11} weight="bold" />
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setAdding(true)}
            className="flex min-h-[92px] flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line-strong bg-white/25 text-[11px] font-medium text-mut transition hover:border-accent hover:text-accent active:scale-[0.99]"
          >
            <Plus size={16} weight="bold" />
            {items.length === 0 ? "添加第一个" : "添加"}
          </button>
        )}
      </div>
    </section>
  );
}
