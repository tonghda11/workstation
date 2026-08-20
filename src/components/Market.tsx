import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ArrowClockwise, Plus, Trash } from "@phosphor-icons/react";
import { fetchFund, fetchStocks, type FundQuote, type StockQuote } from "../lib/quotes";
import { useWatchlist, type FundItem, type Market, type StockItem } from "../hooks/useWatchlist";
import { SectionHeader } from "./SectionHeader";

const MARKET_LABELS: Record<Market, string> = {
  sh: "沪市",
  sz: "深市",
  bj: "北交所",
  hk: "港股",
  us: "美股",
};

type Status = "idle" | "loading" | "ok" | "error";

const hmFmt = new Intl.DateTimeFormat("zh-CN", {
  hour: "2-digit",
  minute: "2-digit",
});

function fmtHM(ts: number): string {
  return hmFmt.format(new Date(ts));
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

function StockRow({
  item,
  quote,
  onRemove,
}: {
  item: StockItem;
  quote?: StockQuote;
  onRemove: () => void;
}) {
  const price = quote && quote.price > 0 ? quote.price.toFixed(2) : "--";
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {quote?.name || `${MARKET_LABELS[item.market]} ${item.code}`}
        </div>
        <div className="font-mono text-xs text-faint">
          {item.code} {quote?.time || ""}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono text-sm tabular-nums">{price}</div>
        <Pct value={quote?.changePct} />
      </div>
      <button
        type="button"
        onClick={onRemove}
        aria-label={`删除 ${item.code}`}
        className="-m-1 rounded-lg p-1 text-faint transition hover:text-ink active:scale-90"
      >
        <Trash size={14} />
      </button>
    </div>
  );
}

function FundRow({
  item,
  quote,
  onRemove,
}: {
  item: FundItem;
  quote?: FundQuote;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line bg-surface px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-medium">
          {quote?.name || `基金 ${item.code}`}
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
      <button
        type="button"
        onClick={onRemove}
        aria-label={`删除 ${item.code}`}
        className="-m-1 rounded-lg p-1 text-faint transition hover:text-ink active:scale-90"
      >
        <Trash size={14} />
      </button>
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
  const { stocks, funds, addStock, removeStock, addFund, removeFund } =
    useWatchlist();
  const [tick, setTick] = useState(0);
  const refresh = () => setTick((t) => t + 1);

  const stockKey = useMemo(
    () =>
      stocks
        .map((s) => (s.market === "us" ? `us${s.code}` : `${s.market}${s.code}`))
        .join(","),
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

  function submitStock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const market = (form.elements.namedItem("market") as HTMLSelectElement)
      .value as Market;
    const code = (form.elements.namedItem("stockCode") as HTMLInputElement)
      .value.trim();
    const valid = market === "us" ? /^[A-Za-z.]{1,10}$/.test(code) : /^\d{1,6}$/.test(code);
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
        desc="左侧添加股票代码，右侧添加基金代码，自动拉取当日涨跌，每 5 分钟自动刷新。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface2 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">股票自选</h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-mut">
                {stocks.length} 只
              </span>
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
            {stocks.map((s) => (
              <StockRow
                key={s.id}
                item={s}
                quote={stockQuotes[`${s.market === "us" ? "us" : s.market}${s.code}`]}
                onRemove={() => removeStock(s.id)}
              />
            ))}
          </PanelBody>
          <p className="mt-3 text-xs text-faint">
            行情数据来自腾讯证券接口，盘中实时，收盘后为当日结果。
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface2 p-5">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">基金自选</h3>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs tabular-nums text-mut">
                {funds.length} 只
              </span>
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
            {funds.map((f) => (
              <FundRow
                key={f.id}
                item={f}
                quote={fundQuotes[f.code]}
                onRemove={() => removeFund(f.id)}
              />
            ))}
          </PanelBody>
          <p className="mt-3 text-xs text-faint">
            基金涨幅优先显示当日估值，失败时自动回退到最近净值日涨跌，数据来自天天基金。
          </p>
        </div>
      </div>
    </section>
  );
}
