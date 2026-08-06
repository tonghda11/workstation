export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePct: number;
  time: string;
}

export interface FundQuote {
  code: string;
  name: string;
  unitNav: number;
  estimateNav: number;
  estimatePct: number;
  time: string;
}

function loadScript(src: string, charset?: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    if (charset) el.charset = charset;
    const timer = window.setTimeout(() => reject(new Error("timeout")), 12000);
    el.onload = () => {
      window.clearTimeout(timer);
      resolve();
    };
    el.onerror = () => {
      window.clearTimeout(timer);
      reject(new Error("load failed"));
    };
    document.head.appendChild(el);
  });
}

function fmtTime(raw: string): string {
  if (raw.length >= 14) {
    return `${raw.slice(8, 10)}:${raw.slice(10, 12)}:${raw.slice(12, 14)}`;
  }
  return raw;
}

/** 通过腾讯证券接口批量获取股票行情（script 标签方式，无 CORS 限制） */
export async function fetchStocks(codes: string[]): Promise<StockQuote[]> {
  if (codes.length === 0) return [];
  const url = `https://qt.gtimg.cn/q=${codes.join(",")}&r=${Date.now()}`;
  await loadScript(url, "GBK");
  const win = window as unknown as Record<string, unknown>;
  const out: StockQuote[] = [];
  for (const code of codes) {
    const raw = win[`v_${code}`];
    if (typeof raw !== "string") continue;
    const p = raw.split("~");
    const price = Number(p[3]);
    const prev = Number(p[4]);
    const parsedPct = Number(p[32]);
    const changePct = Number.isFinite(parsedPct)
      ? parsedPct
      : prev > 0
        ? ((price - prev) / prev) * 100
        : 0;
    out.push({
      code,
      name: p[1]?.trim() || code,
      price: Number.isFinite(price) ? price : 0,
      change: Number.isFinite(Number(p[31])) ? Number(p[31]) : 0,
      changePct: Number.isFinite(changePct) ? changePct : 0,
      time: fmtTime(p[30] ?? ""),
    });
  }
  return out;
}

/** 通过天天基金估值接口获取单只基金估算涨幅 */
export async function fetchFund(code: string): Promise<FundQuote | null> {
  const src = `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`;
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: FundQuote | null) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    (window as unknown as Record<string, unknown>).jsonpgz = (d: any) => {
      if (d && typeof d === "object" && d.fundcode === code) {
        finish({
          code,
          name: String(d.name || code),
          unitNav: Number(d.dwjz),
          estimateNav: Number(d.gsz),
          estimatePct: Number(d.gszzl),
          time: String(d.gztime || ""),
        });
      }
    };
    loadScript(src).catch(() => finish(null));
    window.setTimeout(() => finish(null), 15000);
  });
}
