import { useEffect, useMemo, useState, type FormEvent } from "react";
import {
  ArrowClockwise,
  ChartLine,
  Plus,
  PushPin,
  Trash,
} from "@phosphor-icons/react";
import {
  fetchFund,
  fetchFundTrend,
  fetchStockKline,
  fetchStocks,
  type FundQuote,
  type KlinePoint,
  type StockQuote,
} from "../lib/quotes";
import {
  useWatchlist,
  type FundItem,
  type Market,
  type StockItem,
} from "../hooks/useWatchlist";
import { SectionHeader } from "./SectionHeader";

const MARKET_LABELS: Record<Market, string> = {
  sh: "沪市",
  sz: "深市",
  bj: "北交所",
  hk: "港股",
  us: "美股",
};

const SECID_PREFIX: Record<Market, string> = {
  sh: "1",
  sz: "0",
  bj: "0",
  hk: "116",
  us: "105",
};

type Status = "idle" | "loading" | "ok" | "error";
type SortMode = "default" | "pct" | "code";

const hmFmt = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
});

function fmtHM(ts: number): string {
  return hmFmt.format(new Date(ts));
}

function stockApiCode(item: StockItem): string {
  return `${item.market === "us" ? "us" : item.market}${item.code}`;
}

function Pct({ value }: { value?: number }) {
  if (value === undefined || !Number.isFinite(value)) {
    return <span className="font-mono text-sm text-faint">--</span>;
  }
  const cls = value > 0 ? "text-up" : value < 0 ? "text-down" : "text-mut";
  const sign = value > 0 ? "+" : "";
  return (
    <span className={`font-mono text-sm font-semibold tabular-nums ${cls}`}>
      {sign}
      {value.toFixed(2)}%
    </span>
  );
}

function TrendChart({ points }: { points: KlinePoint[] }) {
  if (points.length < 2) {
    return (
      <p className="py-6 text-center text-xs text-mut">走势数据不足</p>
    );
  }
  const values = points.map((p) => p.close);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 100;
  const h = 36;
  const step = w / (points.length - 1);
  const coords = values.map(
    (v, i) =>
      `${(i * step).toFixed(2)},${(h - ((v - min) / range) * h).toFixed(2)}`
  );
  const first = values[0];
  const last = values[values.length - 1];
  const pct = first > 0 ? ((last - first) / first) * 100 : 0;
  const up = pct >= 0;
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs text-mut">
        <span className="font-mono tabular-nums">
          {points[0].date} ~ {points[points.length - 1].date}
        </span>
        <span
          className={`font-mono font-semibold tabular-nums ${
            up ? "text-up" : "text-down"
          }`}
        >
          {up ? "+" : ""}
          {pct.toFixed(2)}%
        </span>
      </div>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        className="mt-2 h-24 w-full"
        aria-hidden="true"
      >
        <line
          x1="0"
          y1={h / 2}
          x2={w}
          y2={h / 2}
          stroke="var(--ws-line)"
          strokeWidth="0.3"
          strokeDasharray="2 2"
        />
        <polyline
          points={coords.join(" ")}
          fill="none"
          stroke="var(--ws-accent)"
          strokeWidth="0.9"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      </svg>
      <div className="mt-1 flex justify-between font-mono text-[11px] tabular-nums text-faint">
        <span>{min.toFixed(2)}</span>
        <span>{last.toFixed(2)}</span>
        <span>{max.toFixed(2)}</span>
      </div>
    </div>
  );
}

function StockChart({ item }: { item: StockItem }) {
  const [points, setPoints] = useState<KlinePoint[] | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchStockKline(
      `${item.market}${item.code}`,
      `${SECID_PREFIX[item.market]}.${item.code}`
    )
      .then((pts) => {
        if (cancelled) return;
        if (pts.length >= 2) {
          setPoints(pts);
          setState("ok");
        } else {
          setState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [item.market, item.code, tick]);

  if (state === "loading") {
    return (
      <p className="py-6 text-center text-xs text-mut">正在获取走势…</p>
    );
  }
  if (state === "error" || !points) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-mut">
        <span>走势图获取失败</span>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 font-medium transition hover:border-accent hover:text-accent active:scale-95"
        >
          <ArrowClockwise size={12} weight="bold" />
          重试
        </button>
      </div>
    );
  }
  return <TrendChart points={points} />;
}

function FundChart({ code }: { code: string }) {
  const [points, setPoints] = useState<KlinePoint[] | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "error">("loading");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetchFundTrend(code)
      .then((pts) => {
        if (cancelled) return;
        if (pts.length >= 2) {
          setPoints(pts);
          setState("ok");
        } else {
          setState("error");
        }
      })
      .catch(() => {
        if (!cancelled) setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [code, tick]);

  if (state === "loading") {
    return (
      <p className="py-6 text-center text-xs text-mut">正在获取走势…</p>
    );
  }
  if (state === "error" || !points) {
    return (
      <div className="flex items-center justify-between gap-2 text-xs text-mut">
        <span>走势图获取失败</span>
        <button
          type="button"
          onClick={() => setTick((t) => t + 1)}
          className="inline-flex items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 font-medium transition hover:border-accent hover:text-accent active:scale-95"
        >
          <ArrowClockwise size={12} weight="bold" />
          重试
        </button>
      </div>
    );
  }
  return <TrendChart points={points} />;
}

function ActionButton({
  label,
  active,
  onClick,
  children,
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active}
      onClick={onClick}
      className={`-m-1 rounded-lg p-1.5 transition active:scale-90 ${
        active ? "text-accent" : "text-faint hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function StockRow({
  item,
  quote,
  chartOpen,
  onRemove,
  onPin,
  onChart,
}: {
  item: StockItem;
  quote?: StockQuote;
  chartOpen: boolean;
  onRemove: () => void;
  onPin: () => void;
  onChart: () => void;
}) {
  const price = quote && quote.price > 0 ? quote.price.toFixed(2) : "--";
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {quote?.name || `${MARKET_LABELS[item.market]} ${item.code}`}
            {item.pinned && (
              <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                置顶
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-faint">
            {item.code} {quote?.time || ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm tabular-nums">{price}</div>
          <Pct value={quote?.changePct} />
        </div>
        <ActionButton
          label={item.pinned ? `取消置顶 ${item.code}` : `置顶 ${item.code}`}
          active={item.pinned}
          onClick={onPin}
        >
          <PushPin size={14} weight={item.pinned ? "fill" : "regular"} />
        </ActionButton>
        <ActionButton
          label={`查看 ${item.code} 走势图`}
          active={chartOpen}
          onClick={onChart}
        >
          <ChartLine size={14} weight={chartOpen ? "fill" : "regular"} />
        </ActionButton>
        <ActionButton label={`删除 ${item.code}`} onClick={onRemove}>
          <Trash size={14} />
        </ActionButton>
      </div>
      {chartOpen && (
        <div className="border-t border-line pt-3">
          <StockChart item={item} />
        </div>
      )}
    </div>
  );
}

function FundRow({
  item,
  quote,
  chartOpen,
  onRemove,
  onPin,
  onChart,
}: {
  item: FundItem;
  quote?: FundQuote;
  chartOpen: boolean;
  onRemove: () => void;
  onPin: () => void;
  onChart: () => void;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="flex items-center gap-2">
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium">
            {quote?.name || `基金 ${item.code}`}
            {item.pinned && (
              <span className="ml-1.5 rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-medium text-accent">
                置顶
              </span>
            )}
          </div>
          <div className="font-mono text-xs text-faint">
            {item.code} {quote?.time || ""}
          </div>
        </div>
        <div className="text-right">
          <div className="font-mono text-sm tabular-nums">
            {quote && quote.estimateNav > 0
              ? quote.estimateNav.toFixed(4)
              : "--"}
          </div>
          <Pct value={quote?.estimatePct} />
        </div>
        <ActionButton
          label={item.pinned ? `取消置顶 ${item.code}` : `置顶 ${item.code}`}
          active={item.pinned}
          onClick={onPin}
        >
          <PushPin size={14} weight={item.pinned ? "fill" : "regular"} />
        </ActionButton>
        <ActionButton
          label={`查看 ${item.code} 走势图`}
          active={chartOpen}
          onClick={onChart}
        >
          <ChartLine size={14} weight={chartOpen ? "fill" : "regular"} />
        </ActionButton>
        <ActionButton label={`删除 ${item.code}`} onClick={onRemove}>
          <Trash size={14} />
        </ActionButton>
      </div>
      {chartOpen && (
        <div className="border-t border-line pt-3">
          <FundChart code={item.code} />
        </div>
      )}
    </div>
  );
}

function PanelBody({
  count,
  status,
  updatedAt,
  emptyLabel,
  onRefresh,
  children,
}: {
  count: number;
  status: Status;
  updatedAt?: number | null;
  emptyLabel: string;
  onRefresh: () => void;
  children: React.ReactNode;
}) {
  if (count === 0) {
    return (
      <div className="mt-4 grid place-items-center rounded-2xl border border-dashed border-line-strong bg-surface px-4 py-8 text-sm text-mut">
        {emptyLabel}
      </div>
    );
  }
  return (
    <div className="mt-4">
      {status === "loading" && (
        <p className="mb-2 text-xs text-mut">正在获取行情…</p>
      )}
      {status === "error" && (
        <div className="mb-2 flex items-center justify-between gap-2 rounded-xl border border-line bg-surface px-3 py-2 text-xs text-mut">
          <span>
            数据更新失败
            {updatedAt ? `，上次更新时间 ${fmtHM(updatedAt)}` : ""}
            ，请检查网络后重试
          </span>
          <button
            type="button"
            onClick={onRefresh}
            className="inline-flex shrink-0 items-center gap-1 rounded-full border border-line-strong px-2.5 py-1 font-medium transition hover:border-accent hover:text-accent active:scale-95"
          >
            <ArrowClockwise size={12} weight="bold" />
            重试
          </button>
        </div>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function Market() {
  const {
    stocks,
    funds,
    addStock,
    removeStock,
    pinStock,
    addFund,
    removeFund,
    pinFund,
  } = useWatchlist();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const [stockSort, setStockSort] = useState<SortMode>("default");
  const [fundSort, setFundSort] = useState<SortMode>("default");
  const [stockChartId, setStockChartId] = useState<string | null>(null);
  const [fundChartId, setFundChartId] = useState<string | null>(null);

  const stockKey = useMemo(
    () => stocks.map(stockApiCode).join(","),
    [stocks]
  );
  const fundKey = useMemo(() => funds.map((f) => f.code).join(","), [funds]);

  const [stockQuotes, setStockQuotes] = useState<Record<string, StockQuote>>({});
  const [stockStatus, setStockStatus] = useState<Status>("idle");
  const [stockUpdatedAt, setStockUpdatedAt] = useState<number | null>(null);
  const [fundQuotes, setFundQuotes] = useState<Record<string, FundQuote>>({});
  const [fundStatus, setFundStatus] = useState<Status>("idle");
  const [fundUpdatedAt, setFundUpdatedAt] = useState<number | null>(null);

  useEffect(() => {
    if (stocks.length === 0) {
      setStockQuotes({});
      setStockStatus("idle");
      return;
    }
    let cancelled = false;
    setStockStatus("loading");
    fetchStocks(stockKey.split(","))
      .then((qs) => {
        if (cancelled) return;
        const map: Record<string, StockQuote> = {};
        for (const q of qs) map[q.code] = q;
        setStockQuotes(map);
        setStockStatus(qs.length > 0 ? "ok" : "error");
        if (qs.length > 0) setStockUpdatedAt(Date.now());
      })
      .catch(() => {
        if (!cancelled) setStockStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, [stockKey, tick, stocks.length]);

  useEffect(() => {
    if (funds.length === 0) {
      setFundQuotes({});
      setFundStatus("idle");
      return;
    }
    let cancelled = false;
    setFundStatus("loading");
    (async () => {
      const map: Record<string, FundQuote> = {};
      for (const code of fundKey.split(",")) {
        const q = await fetchFund(code);
        if (cancelled) return;
        if (q) map[q.code] = q;
      }
      if (cancelled) return;
      setFundQuotes(map);
      setFundStatus(Object.keys(map).length > 0 ? "ok" : "error");
      if (Object.keys(map).length > 0) setFundUpdatedAt(Date.now());
    })();
    return () => {
      cancelled = true;
    };
  }, [fundKey, tick, funds.length]);

  useEffect(() => {
    if (stocks.length === 0 && funds.length === 0) return;
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    }, 5 * 60 * 1000);
    const onVisible = () => {
      if (document.visibilityState === "visible") setTick((t) => t + 1);
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [stocks.length, funds.length]);

  const sortedStocks = useMemo(() => {
    const arr = [...stocks];
    const quote = (s: StockItem) => stockQuotes[stockApiCode(s)]?.changePct;
    arr.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      if (stockSort === "code") return a.code.localeCompare(b.code);
      if (stockSort === "pct") {
        const pa = quote(a) ?? -Infinity;
        const pb = quote(b) ?? -Infinity;
        return pb - pa;
      }
      return 0;
    });
    return arr;
  }, [stocks, stockSort, stockQuotes]);

  const sortedFunds = useMemo(() => {
    const arr = [...funds];
    const quote = (f: FundItem) => fundQuotes[f.code]?.estimatePct;
    arr.sort((a, b) => {
      if (Boolean(a.pinned) !== Boolean(b.pinned)) {
        return a.pinned ? -1 : 1;
      }
      if (fundSort === "code") return a.code.localeCompare(b.code);
      if (fundSort === "pct") {
        const pa = quote(a) ?? -Infinity;
        const pb = quote(b) ?? -Infinity;
        return pb - pa;
      }
      return 0;
    });
    return arr;
  }, [funds, fundSort, fundQuotes]);

  function submitStock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const market = (form.elements.namedItem("market") as HTMLSelectElement)
      .value as Market;
    const code = (form.elements.namedItem("stockCode") as HTMLInputElement)
      .value.trim();
    const valid =
      market === "us" ? /^[A-Za-z.]{1,10}$/.test(code) : /^\d{1,6}$/.test(code);
    if (!valid) return;
    addStock(market, code.toUpperCase());
    form.reset();
  }

  function submitFund(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const code = (form.elements.namedItem("fundCode") as HTMLInputElement)
      .value.trim();
    if (!/^\d{6}$/.test(code)) return;
    addFund(code);
    form.reset();
  }

  return (
    <section aria-label="自选行情">
      <SectionHeader
        title="自选行情"
        desc="添加股票与基金代码，支持置顶、按涨幅排序，点击图表按钮查看近期走势。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="min-w-0 rounded-2xl border border-line bg-surface2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">股票自选</h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-mut">
                {stocks.length} 只
              </span>
              <select
                value={stockSort}
                onChange={(e) => setStockSort(e.target.value as SortMode)}
                aria-label="股票排序方式"
                className="rounded-[10px] border border-line bg-surface px-2 py-1.5 text-xs"
              >
                <option value="default">置顶优先</option>
                <option value="pct">按涨幅</option>
                <option value="code">按代码</option>
              </select>
              <button
                type="button"
                onClick={refresh}
                aria-label="刷新股票行情"
                className="grid h-8 w-8 place-items-center rounded-full border border-line text-mut transition hover:border-line-strong hover:text-ink active:scale-90"
              >
                <ArrowClockwise size={14} weight="bold" />
              </button>
            </div>
          </div>
          <form onSubmit={submitStock} className="mt-4 flex gap-2">
            <select
              name="market"
              aria-label="股票市场"
              className="shrink-0 rounded-[10px] border border-line bg-surface px-2 py-2 text-sm"
              defaultValue="sh"
            >
              {Object.entries(MARKET_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>
            <input
              name="stockCode"
              aria-label="股票代码"
              placeholder="如 600000 或 AAPL"
              className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm focus:border-accent"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition active:scale-95"
            >
              <Plus size={14} weight="bold" />
              添加
            </button>
          </form>
          <PanelBody
            count={stocks.length}
            status={stockStatus}
            updatedAt={stockUpdatedAt}
            emptyLabel="还没有股票，上方添加代码开始自选"
            onRefresh={refresh}
          >
            {sortedStocks.map((s) => (
              <StockRow
                key={s.id}
                item={s}
                quote={stockQuotes[stockApiCode(s)]}
                chartOpen={stockChartId === s.id}
                onRemove={() => removeStock(s.id)}
                onPin={() => pinStock(s.id)}
                onChart={() =>
                  setStockChartId((cur) => (cur === s.id ? null : s.id))
                }
              />
            ))}
          </PanelBody>
          <p className="mt-3 text-xs text-faint">
            行情来自腾讯证券接口，走势图为近 90 个交易日日线，腾讯优先、失败回退东方财富。
          </p>
        </div>

        <div className="min-w-0 rounded-2xl border border-line bg-surface2 p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-semibold">基金自选</h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-mut">
                {funds.length} 只
              </span>
              <select
                value={fundSort}
                onChange={(e) => setFundSort(e.target.value as SortMode)}
                aria-label="基金排序方式"
                className="rounded-[10px] border border-line bg-surface px-2 py-1.5 text-xs"
              >
                <option value="default">置顶优先</option>
                <option value="pct">按涨幅</option>
                <option value="code">按代码</option>
              </select>
              <button
                type="button"
                onClick={refresh}
                aria-label="刷新基金行情"
                className="grid h-8 w-8 place-items-center rounded-full border border-line text-mut transition hover:border-line-strong hover:text-ink active:scale-90"
              >
                <ArrowClockwise size={14} weight="bold" />
              </button>
            </div>
          </div>
          <form onSubmit={submitFund} className="mt-4 flex gap-2">
            <input
              name="fundCode"
              aria-label="基金代码"
              placeholder="如 001186"
              className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm focus:border-accent"
            />
            <button
              type="submit"
              className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition active:scale-95"
            >
              <Plus size={14} weight="bold" />
              添加
            </button>
          </form>
          <PanelBody
            count={funds.length}
            status={fundStatus}
            updatedAt={fundUpdatedAt}
            emptyLabel="还没有基金，上方添加代码开始自选"
            onRefresh={refresh}
          >
            {sortedFunds.map((f) => (
              <FundRow
                key={f.id}
                item={f}
                quote={fundQuotes[f.code]}
                chartOpen={fundChartId === f.id}
                onRemove={() => removeFund(f.id)}
                onPin={() => pinFund(f.id)}
                onChart={() =>
                  setFundChartId((cur) => (cur === f.id ? null : f.id))
                }
              />
            ))}
          </PanelBody>
          <p className="mt-3 text-xs text-faint">
            基金涨幅优先显示当日估值，失败时回退到最近净值日涨跌；走势图为净值走势，来自天天基金。
          </p>
        </div>
      </div>
    </section>
  );
}
