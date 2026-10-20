import { BoxLid } from "./components/BoxLid";
import { Stage } from "./components/Stage";
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
      <div className="viewport-floor" aria-hidden="true" />
      <div className="viewport-horizon" aria-hidden="true" />

      <Stage>
        <div className="drawer3d" aria-hidden="true">
          <div className="drawer-top" />
          <div className="drawer-left" />
          <div className="drawer-right" />
        </div>

        <div className="drawer-face">
          <div className="drawer-opening">
            <BoxLid />
            <NoteStack notes={NOTES} />
          </div>
          <div className="drawer-lip">
            <span className="drawer-pull-plate" aria-hidden="true">
              <span className="drawer-pull" />
            </span>
          </div>
        </div>
      </Stage>

      <div className="viewport-hud" aria-hidden="true">
        <strong>DRAWER 01</strong>
        <span>980 × 720 × 62</span>
      </div>

      <svg
        className="axis-gizmo"
        viewBox="0 0 56 56"
        aria-hidden="true"
        fill="none"
      >
        <path d="M28 36 L45 43" stroke="#d9776a" strokeWidth="1.3" />
        <path d="M28 36 L28 12" stroke="#74c79b" strokeWidth="1.3" />
        <path d="M28 36 L11 43" stroke="#6fa6dd" strokeWidth="1.3" />
        <circle cx="28" cy="36" r="1.6" fill="#cdd8ea" opacity="0.7" />
        <g
          fontSize="7"
          fontFamily="ui-monospace, monospace"
          textAnchor="middle"
        >
          <text x="48" y="47" fill="#d9776a">
            X
          </text>
          <text x="28" y="8" fill="#74c79b">
            Y
          </text>
          <text x="8" y="47" fill="#6fa6dd">
            Z
          </text>
        </g>
      </svg>
    </div>
  );
}
