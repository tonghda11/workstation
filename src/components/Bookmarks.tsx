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
      <span className="grid h-9 w-9 place-items-center rounded-[10px] bg-accent-soft text-sm font-semibold text-accent">
        {(name || host || "?").slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-line bg-surface">
      <img
        src={sources[idx]}
        alt=""
        loading="lazy"
        className="h-5 w-5"
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

  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const u = normalizeUrl(url);
    if (!name.trim() || !u) return;
    add(name, u);
    setName("");
    setUrl("");
    setAdding(false);
  }

  return (
    <section aria-label="常用网站">
      <SectionHeader
        title="常用网站"
        desc="自由添加常用网站，点击图标在新标签页打开，数据只保存在本机。"
        extra={<p className="text-sm text-mut">{items.length} 个</p>}
      />
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
        <AnimatePresence initial={false}>
          {items.map((bm) => (
            <motion.div
              key={bm.id}
              layout
              initial={reduce ? undefined : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? undefined : { opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="group relative flex flex-col items-center gap-2 rounded-2xl border border-line bg-surface2 p-4 transition hover:border-line-strong"
            >
              <a
                href={bm.url}
                target="_blank"
                rel="noopener noreferrer"
                title={bm.url}
                className="flex w-full flex-col items-center gap-2"
              >
                <Favicon url={bm.url} name={bm.name} />
                <span className="w-full truncate text-center text-sm font-medium">
                  {bm.name}
                </span>
              </a>
              <button
                type="button"
                onClick={() => remove(bm.id)}
                aria-label={`删除 ${bm.name}`}
                className="absolute -right-1.5 -top-1.5 grid h-6 w-6 place-items-center rounded-full border border-line bg-surface2 text-faint opacity-0 transition hover:text-ink active:scale-90 group-hover:opacity-100"
              >
                <Trash size={11} weight="bold" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>

        {adding ? (
          <form
            onSubmit={submit}
            className="col-span-3 flex flex-col gap-2 rounded-2xl border border-dashed border-line-strong bg-surface p-4 sm:col-span-2 md:col-span-3"
          >
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="网站名称，比如 GitHub"
              aria-label="网站名称"
              className="rounded-[10px] border border-line bg-surface2 px-3 py-2 text-sm focus:border-accent"
            />
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="网址，比如 github.com"
              aria-label="网站网址"
              className="rounded-[10px] border border-line bg-surface2 px-3 py-2 text-sm focus:border-accent"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={!name.trim() || !normalizeUrl(url)}
                className="inline-flex flex-1 items-center justify-center gap-1 rounded-full bg-accent py-2 text-sm font-medium text-accent-ink transition disabled:opacity-40 active:scale-95"
              >
                <Check size={15} weight="bold" />
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
            className="flex min-h-[104px] flex-col items-center justify-center gap-1.5 rounded-2xl border border-dashed border-line-strong bg-surface text-sm font-medium text-mut transition hover:border-accent hover:text-accent active:scale-[0.99]"
          >
            <Plus size={18} weight="bold" />
            {items.length === 0 ? "添加第一个网站" : "添加网站"}
          </button>
        )}
      </div>
    </section>
  );
}
