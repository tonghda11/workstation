export const BEIJING_TZ = "Asia/Shanghai";

const partsFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: BEIJING_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  weekday: "short",
});

function part(parts: Intl.DateTimeFormatPart[], type: string): string {
  return parts.find((p) => p.type === type)?.value ?? "";
}

/** 北京时间日期键，如 "2026-08-04" */
export function beijingDateKey(date: Date): string {
  const parts = partsFmt.formatToParts(date);
  return `${part(parts, "year")}-${part(parts, "month")}-${part(parts, "day")}`;
}

function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d) + days * 86400000);
  return dt.toISOString().slice(0, 10);
}

/** 连续打卡天数：若今天已打卡则从今天起算，否则从昨天起算 */
export function streakFor(history: Record<string, number>): number {
  const today = beijingDateKey(new Date());
  let cursor = history[today] ? today : shiftKey(today, -1);
  let streak = 0;
  while (history[cursor]) {
    streak += 1;
    cursor = shiftKey(cursor, -1);
  }
  return streak;
}

const hmFmt = new Intl.DateTimeFormat("zh-CN", {
  timeZone: BEIJING_TZ,
  hourCycle: "h23",
  hour: "2-digit",
  minute: "2-digit",
});

export function beijingHM(ts: number): string {
  return hmFmt.format(new Date(ts));
}

export function createdLabel(ts: number): string {
  return beijingDateKey(new Date(ts)).slice(5).replace("-", ".");
}
