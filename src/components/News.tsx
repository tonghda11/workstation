import { useEffect, useState, type FormEvent } from "react";
import { ArrowUpRight, MagnifyingGlass } from "@phosphor-icons/react";
import { NEWS_PLATFORMS } from "../lib/platforms";
import { SectionHeader } from "./SectionHeader";

const STORAGE_KEY = "ws.news.v1";

function loadHidden(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.filter((x): x is string => typeof x === "string");
    }
    if (
      parsed &&
      typeof parsed === "object" &&
      Array.isArray((parsed as { hidden?: unknown }).hidden)
    ) {
      return (parsed as { hidden: string[] }).hidden.filter(
        (x): x is string => typeof x === "string"
      );
    }
  } catch {
    /* 忽略 */
  }
  return [];
}

export function News() {
  const [queries, setQueries] = useState<Record<string, string>>({});
  const [hidden, setHidden] = useState<string[]>(loadHidden);
  const visible = NEWS_PLATFORMS.filter((p) => !hidden.includes(p.id));
  const gridClass =
    visible.length >= 3
      ? "md:grid-cols-3"
      : visible.length === 2
        ? "md:grid-cols-2"
        : "md:grid-cols-1";

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(hidden));
    } catch {
      /* 忽略存储失败 */
    }
  }, [hidden]);

  function toggle(id: string) {
    setHidden((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function submit(e: FormEvent<HTMLFormElement>, id: string, url: string) {
    e.preventDefault();
    const q = queries[id]?.trim();
    if (!q) return;
    window.open(url + encodeURIComponent(q), "_blank", "noopener");
    setQueries((prev) => ({ ...prev, [id]: "" }));
  }

  return (
    <section aria-label="新闻平台">
      <SectionHeader
        title="新闻平台"
        desc="按需显示搜索平台，输入关键词后回车，结果在新标签页打开。"
        extra={
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label="显示与隐藏搜索平台">
            {NEWS_PLATFORMS.map((p) => {
              const on = !hidden.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggle(p.id)}
                  className={`rounded-full border px-3 py-1 text-sm font-medium transition active:scale-95 ${
                    on
                      ? "border-accent text-accent"
                      : "border-line text-faint hover:text-mut"
                  }`}
                >
                  {p.name}
                </button>
              );
            })}
          </div>
        }
      />
      <div className={`grid gap-4 ${gridClass}`}>
        {visible.map((p) => (
          <div
            key={p.id}
            className="group flex flex-col gap-4 rounded-2xl border border-line bg-surface2 p-5 transition-colors hover:border-line-strong"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-[10px] border border-line bg-surface opacity-80 grayscale transition duration-200 group-hover:opacity-100 group-hover:grayscale-0">
                <img
                  src={`icons/${p.id}.svg`}
                  alt={`${p.name} 图标`}
                  className="h-5 w-5"
                  loading="lazy"
                />
              </span>
              <div>
                <h3 className="font-semibold leading-tight">{p.name}</h3>
                <p className="font-mono text-xs text-faint">{p.latin}</p>
              </div>
            </div>
            {p.id === "google" && (
              <p className="-mt-2 text-xs text-faint">
                需特定网络环境访问
              </p>
            )}
            <form
              className="flex gap-2"
              onSubmit={(e) => submit(e, p.id, p.searchUrl)}
            >
              <input
                type="search"
                value={queries[p.id] ?? ""}
                onChange={(e) =>
                  setQueries((prev) => ({ ...prev, [p.id]: e.target.value }))
                }
                placeholder={p.placeholder}
                aria-label={`${p.name}搜索关键词`}
                className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm text-ink placeholder:text-faint focus:border-accent"
              />
              <button
                type="submit"
                className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition active:scale-95"
              >
                <MagnifyingGlass size={15} weight="bold" />
                搜索
              </button>
            </form>
            <div className="flex flex-wrap gap-x-4 gap-y-2 border-t border-line pt-3">
              {p.quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-sm text-mut transition hover:text-accent"
                >
                  <ArrowUpRight size={13} weight="bold" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
