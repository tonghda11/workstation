export interface CheckinItem {
  id: string;
  name: string;
  createdAt: number;
  /** "YYYY-MM-DD"（北京时间）-> 打卡时间戳 */
  history: Record<string, number>;
}
