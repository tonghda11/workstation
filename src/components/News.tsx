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

  function submit(event: FormEvent<HTMLFormElement>, id: string, url: string) {
    event.preventDefault();
    const query = queries[id]?.trim();
    if (!query) return;
    window.open(url + encodeURIComponent(query), "_blank", "noopener");
    setQueries((prev) => ({ ...prev, [id]: "" }));
  }

  return (
    <section aria-label="新闻平台">
      <SectionHeader
        title="搜索"
        desc="输入关键词，回车在新标签页打开搜索结果。谷歌需要特定网络环境。"
        extra={
          <p className="text-xs text-mut">
            <span className="font-mono font-semibold text-ink">
              {visible.length}
            </span>{" "}
            个平台
          </p>
        }
      />

      <div className="grid gap-2.5 md:grid-cols-3">
        {visible.map((platform) => (
          <div
            key={platform.id}
            className="flex flex-col gap-2 rounded-xl border border-line bg-white/40 p-3"
          >
            <div className="flex items-center gap-2">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-[9px] border border-line bg-white/65">
                <img
                  src={`icons/${platform.id}.svg`}
                  alt={`${platform.name} 图标`}
                  className="h-4 w-4"
                  loading="lazy"
                />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium leading-none">
                  {platform.name}
                </p>
                <p className="mt-1 font-mono text-[10px] leading-none text-faint">
                  {platform.latin}
                </p>
              </div>
            </div>

            <form
              className="flex gap-1.5"
              onSubmit={(event) =>
                submit(event, platform.id, platform.searchUrl)
              }
            >
              <input
                type="search"
                value={queries[platform.id] ?? ""}
                onChange={(event) =>
                  setQueries((prev) => ({
                    ...prev,
                    [platform.id]: event.target.value,
                  }))
                }
                placeholder={platform.placeholder}
                aria-label={`${platform.name}搜索关键词`}
                className="ink-input min-w-0 flex-1 rounded-lg border px-2.5 py-1.5 text-xs text-ink placeholder:text-faint"
              />
              <button
                type="submit"
                aria-label={`用${platform.name}搜索`}
                className="grid h-[30px] w-8 shrink-0 place-items-center rounded-lg bg-accent text-accent-ink transition active:scale-95"
              >
                <MagnifyingGlass size={14} weight="bold" />
              </button>
            </form>

            <div className="flex flex-wrap gap-x-3 gap-y-1">
              {platform.quickLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 text-[11px] text-mut transition hover:text-accent"
                >
                  <ArrowUpRight size={10} weight="bold" />
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] text-faint">显示</span>
        {NEWS_PLATFORMS.map((platform) => {
          const on = !hidden.includes(platform.id);
          return (
            <button
              key={platform.id}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(platform.id)}
              className={`rounded-full border px-2.5 py-0.5 text-[11px] transition active:scale-95 ${
                on
                  ? "border-accent/60 text-accent"
                  : "border-line text-faint hover:text-mut"
              }`}
            >
              {platform.name}
            </button>
          );
        })}
      </div>
    </section>
  );
}
