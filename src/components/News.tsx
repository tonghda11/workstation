import { useState, type FormEvent } from "react";
import { ArrowUpRight, MagnifyingGlass } from "@phosphor-icons/react";
import { NEWS_PLATFORMS } from "../lib/platforms";
import { SectionHeader } from "./SectionHeader";

export function News() {
  const [queries, setQueries] = useState<Record<string, string>>({});

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
        desc="三个搜索平台从左到右排列，输入关键词后回车，结果在新标签页打开。"
      />
      <div className="grid gap-4 md:grid-cols-3">
        {NEWS_PLATFORMS.map((p) => (
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
