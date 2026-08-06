import { useCallback, useEffect, useState } from "react";

export type Market = "sh" | "sz" | "bj" | "hk" | "us";

export interface StockItem {
  id: string;
  market: Market;
  code: string;
}

export interface FundItem {
  id: string;
  code: string;
}

const STOCK_KEY = "ws.stocks.v1";
const FUND_KEY = "ws.funds.v1";

function newId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return `id-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  }
}

function load<T>(key: string, guard: (v: unknown) => boolean): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item) => guard(item)) as T[];
  } catch {
    return [];
  }
}

export function useWatchlist() {
  const [stocks, setStocks] = useState<StockItem[]>(() =>
    load<StockItem>(
      STOCK_KEY,
      (v) =>
        Boolean(
          v &&
            typeof v === "object" &&
            typeof (v as StockItem).id === "string" &&
            typeof (v as StockItem).code === "string" &&
            ["sh", "sz", "bj", "hk", "us"].includes(
              (v as StockItem).market
            )
        )
    )
  );
  const [funds, setFunds] = useState<FundItem[]>(() =>
    load<FundItem>(
      FUND_KEY,
      (v) =>
        Boolean(
          v &&
            typeof v === "object" &&
            typeof (v as FundItem).id === "string" &&
            typeof (v as FundItem).code === "string"
        )
    )
  );

  useEffect(() => {
    try {
      localStorage.setItem(STOCK_KEY, JSON.stringify(stocks));
    } catch {
      /* 忽略存储失败 */
    }
  }, [stocks]);

  useEffect(() => {
    try {
      localStorage.setItem(FUND_KEY, JSON.stringify(funds));
    } catch {
      /* 忽略存储失败 */
    }
  }, [funds]);

  const addStock = useCallback((market: Market, code: string) => {
    const c = code.trim();
    if (!c) return;
    setStocks((prev) => {
      if (prev.some((s) => s.market === market && s.code === c)) return prev;
      return [...prev, { id: newId(), market, code: c }];
    });
  }, []);

  const removeStock = useCallback((id: string) => {
    setStocks((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const addFund = useCallback((code: string) => {
    const c = code.trim();
    if (!c) return;
    setFunds((prev) => {
      if (prev.some((f) => f.code === c)) return prev;
      return [...prev, { id: newId(), code: c }];
    });
  }, []);

  const removeFund = useCallback((id: string) => {
    setFunds((prev) => prev.filter((f) => f.id !== id));
  }, []);

  return { stocks, funds, addStock, removeStock, addFund, removeFund };
}
