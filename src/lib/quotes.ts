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

export interface KlinePoint {
  date: string;
  close: number;
}

function loadScript(src: string, charset?: string, timeoutMs = 12000): Promise<void> {
  return new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    if (charset) el.charset = charset;
    const timer = window.setTimeout(() => reject(new Error("timeout")), timeoutMs);
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

/**
 * 腾讯行情的时间字段有三种写法：
 * - 沪深/北交所：`20261019161436`（紧凑 14 位）
 * - 美股：`2026-10-19 13:30:40`
 * - 港股：`2026/10/16 16:08:22`
 * 带日期的写法需要保留月日，否则跨周末/休市时容易误读成当天。
 */
function fmtTime(raw: string): string {
  if (!raw) return "";
  const dated = raw.match(/(\d{4})[-/](\d{2})[-/](\d{2})[ T](\d{2}):(\d{2})/);
  if (dated) {
    return `${dated[2]}-${dated[3]} ${dated[4]}:${dated[5]}`;
  }
  const digits = raw.replace(/\D/g, "");
  if (digits.length >= 14) {
    return `${digits.slice(8, 10)}:${digits.slice(10, 12)}:${digits.slice(12, 14)}`;
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

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

function jsonp(url: string, timeoutMs = 12000): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const win = window as unknown as Record<string, unknown>;
    const cb = `ws_cb_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    let el: HTMLScriptElement | null = null;
    let timer = 0;
    const cleanup = () => {
      window.clearTimeout(timer);
      delete win[cb];
      if (el) el.remove();
    };
    timer = window.setTimeout(() => {
      cleanup();
      reject(new Error("timeout"));
    }, timeoutMs);
    win[cb] = (data: unknown) => {
      cleanup();
      resolve(data);
    };
    el = document.createElement("script");
    el.src = url.replace("{cb}", cb);
    el.onerror = () => {
      cleanup();
      reject(new Error("load failed"));
    };
    document.head.appendChild(el);
  });
}

export type ChartPeriod = "minute" | "day" | "week" | "month";

type KlinePeriod = Exclude<ChartPeriod, "minute">;

/** 日 / 周 / 月 K 线回看的根数 */
const KLINE_LIMIT: Record<KlinePeriod, number> = {
  day: 90,
  week: 104,
  month: 60,
};

/** 腾讯 K 线（script 标签，支持 A 股 / 港股 / 美股；日 / 周 / 月） */
async function fetchStockKlineTencent(
  tencentCode: string,
  period: KlinePeriod,
  limit: number
): Promise<KlinePoint[] | null> {
  const varName = `ws_kline_${Date.now()}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const url =
    `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get` +
    `?param=${tencentCode},${period},,,${limit},qfq&_var=${varName}`;
  try {
    await loadScript(url);
    const win = window as unknown as Record<string, unknown>;
    const data = win[varName] as {
      data?: Record<string, Record<string, string[][] | undefined>>;
    };
    const node = data?.data?.[tencentCode];
    // A 股/美股返回 qfqday 等字段，港股只有 day/week/month。
    const rows = node?.[`qfq${period}`] ?? node?.[period] ?? [];
    return rows
      .map((r) => ({ date: r[0], close: Number(r[2]) }))
      .filter((p) => Number.isFinite(p.close) && p.close > 0);
  } catch {
    return null;
  }
}

/** 腾讯分时（A 股 / 港股）：返回当日逐分钟价格 */
async function fetchStockMinuteTencent(
  tencentCode: string
): Promise<KlinePoint[] | null> {
  const varName = `ws_min_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const url =
    `https://web.ifzq.gtimg.cn/appstock/app/minute/query` +
    `?code=${tencentCode}&_var=${varName}`;
  try {
    await loadScript(url);
    const win = window as unknown as Record<string, unknown>;
    const data = win[varName] as {
      data?: Record<string, { data?: { data?: string[] } }>;
    };
    const rows = data?.data?.[tencentCode]?.data?.data ?? [];
    const points: KlinePoint[] = [];
    for (const row of rows) {
      const [clock, price] = row.trim().split(/\s+/);
      if (!/^\d{4}$/.test(clock ?? "")) continue;
      const close = Number(price);
      if (!Number.isFinite(close) || close <= 0) continue;
      points.push({
        date: `${clock.slice(0, 2)}:${clock.slice(2, 4)}`,
        close,
      });
    }
    return points;
  } catch {
    return null;
  }
}

/** 东方财富分时（trends2） */
async function fetchMinuteTrends(secid: string): Promise<KlinePoint[]> {
  const url =
    `https://push2his.eastmoney.com/api/qt/stock/trends2/get?secid=${secid}` +
    `&fields1=f1,f2,f3,f4,f5,f6,f7,f8&fields2=f51,f53&iscr=0&ndays=1&cb={cb}`;
  const data = (await jsonp(url)) as { data?: { trends?: string[] } };
  return (data?.data?.trends ?? [])
    .map((line) => {
      const [stamp, price] = line.split(",");
      return { date: (stamp ?? "").slice(11, 16), close: Number(price) };
    })
    .filter(
      (p) =>
        /^\d{2}:\d{2}$/.test(p.date) &&
        Number.isFinite(p.close) &&
        p.close > 0
    );
}

/** 东方财富 1 分钟 K 线（trends2 不可用时的兜底） */
async function fetchMinuteKline(secid: string): Promise<KlinePoint[]> {
  const url =
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}` +
    `&klt=1&fqt=1&fields1=f1,f2,f3,f4,f5,f6` +
    `&fields2=f51,f52,f53,f54,f55,f56&beg=0&end=20500101&lmt=240&cb={cb}`;
  const data = (await jsonp(url)) as { data?: { klines?: string[] } };
  return (data?.data?.klines ?? [])
    .map((line) => {
      const [stamp, , close] = line.split(",");
      return { date: (stamp ?? "").slice(11, 16), close: Number(close) };
    })
    .filter(
      (p) =>
        /^\d{2}:\d{2}$/.test(p.date) &&
        Number.isFinite(p.close) &&
        p.close > 0
    )
    .slice(-240);
}

/** 东方财富分时（美股等腾讯分时不可用的市场），两条接口互为兜底 */
async function fetchStockMinuteEastmoney(
  secid: string
): Promise<KlinePoint[]> {
  try {
    const fromTrends = await fetchMinuteTrends(secid);
    if (fromTrends.length >= 3) return fromTrends;
  } catch {
    /* 落到 1 分钟 K 线 */
  }
  try {
    return await fetchMinuteKline(secid);
  } catch {
    return [];
  }
}

const EASTMONEY_KLT: Record<KlinePeriod, number> = {
  day: 101,
  week: 102,
  month: 103,
};

/** 东方财富 K 线（JSONP 回退源） */
async function fetchStockKlineEastmoney(
  secid: string,
  period: KlinePeriod,
  limit: number
): Promise<KlinePoint[]> {
  const url =
    `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}` +
    `&klt=${EASTMONEY_KLT[period]}&fqt=1` +
    `&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56` +
    `&beg=0&end=20500101&lmt=${limit}&cb={cb}`;
  const data = (await jsonp(url)) as { data?: { klines?: string[] } };
  const klines = data?.data?.klines ?? [];
  return klines
    .map((line) => {
      const [date, , close] = line.split(",");
      return { date, close: Number(close) };
    })
    .filter((p) => Number.isFinite(p.close) && p.close > 0)
    // 东方财富会忽略 lmt 返回全部历史，这里按需截取。
    .slice(-limit);
}

/**
 * 股票走势图：分时优先腾讯（美股用东方财富），日/周/月优先腾讯 K 线，
 * 数据不足 3 根时回退东方财富。
 */
export async function fetchStockKline(
  tencentCode: string,
  secid: string,
  period: ChartPeriod = "day",
  limit?: number
): Promise<KlinePoint[]> {
  if (period === "minute") {
    if (!tencentCode.startsWith("us")) {
      const fromTencent = await fetchStockMinuteTencent(tencentCode);
      if (fromTencent && fromTencent.length >= 3) return fromTencent;
    }
    return fetchStockMinuteEastmoney(secid);
  }

  const lim = limit ?? KLINE_LIMIT[period];
  // US stocks need an exchange suffix (.OQ = Nasdaq / .N = NYSE);
  // without a suffix Tencent only returns first & last day.
  const candidates = tencentCode.startsWith("us")
    ? [`${tencentCode}.OQ`, `${tencentCode}.N`]
    : [tencentCode];
  for (const cand of candidates) {
    const fromTencent = await fetchStockKlineTencent(cand, period, lim);
    if (fromTencent && fromTencent.length >= 3) return fromTencent;
  }
  return fetchStockKlineEastmoney(secid, period, lim);
}

function loadFundTrend(
  code: string
): Promise<{ x: number; y: number }[]> {
  return new Promise((resolve) => {
    let done = false;
    const finish = (v: { x: number; y: number }[]) => {
      if (!done) {
        done = true;
        resolve(v);
      }
    };
    loadScript(
      `https://fund.eastmoney.com/pingzhongdata/${code}.js?rt=${Date.now()}`,
      undefined,
      10000
    )
      .then(() => {
        const win = window as unknown as Record<string, unknown>;
        const trend = win.Data_netWorthTrend;
        finish(
          Array.isArray(trend) ? (trend as { x: number; y: number }[]) : []
        );
      })
      .catch(() => finish([]));
    window.setTimeout(() => finish([]), 12000);
  });
}

/** 每周一作为周线分组的键 */
function weekKey(date: string): string {
  const day = new Date(`${date}T00:00:00Z`);
  if (Number.isNaN(day.getTime())) return date;
  const offset = (day.getUTCDay() + 6) % 7;
  return new Date(day.getTime() - offset * 86400000).toISOString().slice(0, 10);
}

/** 把日线聚合成周线 / 月线，取每个周期最后一个净值 */
function aggregatePoints(
  points: KlinePoint[],
  period: KlinePeriod
): KlinePoint[] {
  const buckets = new Map<string, KlinePoint>();
  for (const point of points) {
    const key =
      period === "month" ? point.date.slice(0, 7) : weekKey(point.date);
    buckets.set(key, point);
  }
  return [...buckets.values()];
}

/**
 * 基金净值走势（来自天天基金 pingzhongdata）。
 * 天天基金只提供每日净值，周线 / 月线由日线聚合而来，分时不可用。
 */
export async function fetchFundTrend(
  code: string,
  period: ChartPeriod = "day"
): Promise<KlinePoint[]> {
  if (period === "minute") return [];
  const trend = await loadFundTrend(code);
  const points = trend
    .map((p) => ({ date: fmtDate(p.x), close: Number(p.y) }))
    .filter((p) => Number.isFinite(p.close) && p.close > 0);
  if (period === "day") return points.slice(-KLINE_LIMIT.day);
  return aggregatePoints(points, period).slice(-KLINE_LIMIT[period]);
}

/** 优先取当日估值，失败则回退到最近净值日涨跌 */
export async function fetchFund(code: string): Promise<FundQuote | null> {
  const estimate = await fetchFundEstimate(code);
  if (estimate) return estimate;
  return fetchFundDaily(code);
}

function fetchFundEstimate(code: string): Promise<FundQuote | null> {
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
    loadScript(
      `https://fundgz.1234567.com.cn/js/${code}.js?rt=${Date.now()}`,
      undefined,
      6000
    ).catch(() => finish(null));
    window.setTimeout(() => finish(null), 7000);
  });
}

async function fetchFundDaily(code: string): Promise<FundQuote | null> {
  const trend = await loadFundTrend(code);
  if (trend.length < 2) return null;
  const last = trend[trend.length - 1];
  const prev = trend[trend.length - 2];
  const win = window as unknown as Record<string, unknown>;
  const name = String(win.fS_name || code);
  const y1 = Number(last.y);
  const y0 = Number(prev.y);
  const rawPct = Number((last as Record<string, unknown>).equityReturn);
  const pct =
    Number.isFinite(rawPct)
      ? rawPct
      : y0 > 0
        ? ((y1 - y0) / y0) * 100
        : 0;
  return {
    code,
    name,
    unitNav: y1,
    estimateNav: y1,
    estimatePct: Number.isFinite(pct) ? pct : 0,
    time: fmtDate(last.x),
  };
}
