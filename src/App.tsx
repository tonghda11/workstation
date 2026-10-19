import { BoxLid } from "./components/BoxLid";
import { NoteStack, type NoteDef } from "./components/NoteStack";
import { News } from "./components/News";
import { Bookmarks } from "./components/Bookmarks";
import { Market } from "./components/Market";
import { Checkin } from "./components/Checkin";
import { Device } from "./components/Device";
import { VideoDownload } from "./components/VideoDownload";
import { DataManager } from "./components/DataManager";

const NOTES: NoteDef[] = [
  {
    id: "search",
    label: "搜索",
    color: "var(--note-yellow)",
    content: <News />,
  },
  {
    id: "sites",
    label: "常用网站",
    color: "var(--note-blue)",
    content: <Bookmarks />,
  },
  {
    id: "market",
    label: "自选行情",
    color: "var(--note-green)",
    content: <Market />,
  },
  {
    id: "checkin",
    label: "打卡日历",
    color: "var(--note-pink)",
    content: <Checkin />,
  },
  {
    id: "device",
    label: "环境与设备",
    color: "var(--note-orange)",
    content: <Device />,
  },
  {
    id: "video",
    label: "视频下载",
    color: "var(--note-purple)",
    content: <VideoDownload />,
  },
  {
    id: "data",
    label: "数据备份",
    color: "var(--note-mint)",
    content: <DataManager />,
  },
];

export default function App() {
  return (
    <div className="app-shell">
      <div className="wood-box">
        <BoxLid />
        <NoteStack notes={NOTES} />
      </div>
    </div>
  );
}
