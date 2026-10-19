import { useRef, useState, type ChangeEvent } from "react";
import { ArrowDown, ArrowUp, Check, Warning } from "@phosphor-icons/react";
import { SectionHeader } from "./SectionHeader";

const BACKUP_KEYS = [
  "ws.theme",
  "ws.checkins.v1",
  "ws.bookmarks.v1",
  "ws.stocks.v1",
  "ws.funds.v1",
  "ws.news.v1",
  "ws.chartPeriod.v1",
];

function readCount(key: string): number {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return 0;
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.length : 0;
  } catch {
    return 0;
  }
}

function readBytes(): number {
  let total = 0;
  for (const key of BACKUP_KEYS) {
    try {
      total += localStorage.getItem(key)?.length ?? 0;
    } catch {
      /* 忽略读取失败 */
    }
  }
  return total;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function readLocal(): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const key of BACKUP_KEYS) {
    try {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          out[key] = JSON.parse(raw);
        } catch {
          out[key] = raw;
        }
      }
    } catch {
      /* 忽略读取失败 */
    }
  }
  return out;
}

function writeLocal(data: Record<string, unknown>): boolean {
  if (!data || typeof data !== "object") return false;
  let ok = true;
  for (const key of BACKUP_KEYS) {
    if (key in data) {
      try {
        const v = (data as Record<string, unknown>)[key];
        localStorage.setItem(key, typeof v === "string" ? v : JSON.stringify(v));
      } catch {
        ok = false;
      }
    }
  }
  return ok;
}

export function DataManager() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [msg, setMsg] = useState<{ kind: "ok" | "warn"; text: string } | null>(
    null
  );
  const [stats] = useState(() => ({
    checkins: readCount("ws.checkins.v1"),
    bookmarks: readCount("ws.bookmarks.v1"),
    stocks: readCount("ws.stocks.v1"),
    funds: readCount("ws.funds.v1"),
    bytes: readBytes(),
  }));

  function exportData() {
    const payload = {
      app: "personal-workstation",
      version: 1,
      exportedAt: new Date().toISOString(),
      data: readLocal(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const d = new Date();
    const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(
      2,
      "0"
    )}${String(d.getDate()).padStart(2, "0")}`;
    a.download = `工作站数据备份-${stamp}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
    setMsg({ kind: "ok", text: "备份文件已下载，请妥善保存。" });
  }

  function onFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        const data = parsed?.data;
        if (!data || typeof data !== "object") throw new Error("bad format");
        const confirmed = window.confirm(
          "导入将覆盖当前浏览器里的打卡、常用网站、自选行情等数据，确定继续吗？"
        );
        if (!confirmed) return;
        const ok = writeLocal(data as Record<string, unknown>);
        if (ok) {
          setMsg({ kind: "ok", text: "导入成功，正在刷新页面…" });
          window.setTimeout(() => window.location.reload(), 600);
        } else {
          setMsg({ kind: "warn", text: "部分数据写入失败，请重试。" });
        }
      } catch {
        setMsg({ kind: "warn", text: "文件格式不正确，无法导入。" });
      }
    };
    reader.readAsText(file);
  }

  return (
    <section aria-label="数据备份">
      <SectionHeader
        title="数据备份"
        desc="打卡、常用网站、自选行情等数据只存在本机浏览器，建议定期导出备份。"
      />
      <div className="rounded-xl border border-line bg-white/40 p-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportData}
            className="inline-flex items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-ink transition active:scale-95"
          >
            <ArrowDown size={15} weight="bold" />
            导出数据
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 rounded-full border border-line-strong px-4 py-2 text-sm font-medium text-mut transition hover:border-accent hover:text-accent active:scale-95"
          >
            <ArrowUp size={15} weight="bold" />
            导入数据
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={onFile}
            aria-label="选择备份文件"
          />
        </div>
        {msg && (
          <p
            className={`mt-3 flex items-center gap-1.5 text-sm ${
              msg.kind === "ok" ? "text-mut" : "text-up"
            }`}
          >
            {msg.kind === "ok" ? (
              <Check size={15} weight="bold" />
            ) : (
              <Warning size={15} weight="bold" />
            )}
            {msg.text}
          </p>
        )}
        <dl className="mt-4 grid grid-cols-2 gap-2 border-t border-line pt-4 sm:grid-cols-4">
          {[
            ["打卡项目", stats.checkins],
            ["常用网站", stats.bookmarks],
            ["股票自选", stats.stocks],
            ["基金自选", stats.funds],
          ].map(([label, value]) => (
            <div
              key={String(label)}
              className="rounded-lg border border-line bg-white/40 px-2.5 py-2"
            >
              <dt className="text-[10px] text-mut">{label}</dt>
              <dd className="mt-0.5 font-mono text-lg leading-none tabular-nums text-ink">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-2 text-[10px] text-faint">
          本机数据约 {formatBytes(stats.bytes)}
        </p>

        <p className="mt-4 border-t border-line pt-4 text-xs text-faint">
          备份包含：主题、习惯打卡、常用网站、股票自选、基金自选、搜索引擎显示设置。
          换设备或清理缓存前先导出，在新设备上导入即可恢复。
        </p>

        <ul className="mt-3 space-y-1 text-[11px] leading-relaxed text-mut">
          <li>· 建议每月导出一次，文件名带日期，方便回滚。</li>
          <li>· 换设备或清理浏览器数据前，先导出再导入。</li>
          <li>· 备份文件包含个人数据，请不要公开发送。</li>
        </ul>
      </div>
    </section>
  );
}
