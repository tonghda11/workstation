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
];

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
      <div className="rounded-2xl border border-line bg-surface2 p-5">
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
        <p className="mt-4 border-t border-line pt-4 text-xs text-faint">
          备份包含：主题、习惯打卡、常用网站、股票自选、基金自选、搜索引擎显示设置。
          换设备或清理缓存前先导出，在新设备上导入即可恢复。
        </p>
      </div>
    </section>
  );
}
