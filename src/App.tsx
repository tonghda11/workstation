import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import { Header } from "./components/Header";
import { Clock } from "./components/Clock";
import { News } from "./components/News";
import { Bookmarks } from "./components/Bookmarks";
import { Market } from "./components/Market";
import { VideoDownload } from "./components/VideoDownload";
import { Checkin } from "./components/Checkin";
import { Device } from "./components/Device";

function Reveal({
  children,
  index,
  reduce,
}: {
  children: ReactNode;
  index: number;
  reduce: boolean | null;
}) {
  const enter = reduce ? undefined : { opacity: 0, y: 16 };
  return (
    <motion.div
      initial={enter}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.08 * index, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export default function App() {
  const reduce = useReducedMotion();

  return (
    <div className="min-h-[100dvh] bg-bg text-ink">
      <Header />
      <main className="mx-auto max-w-[1280px] px-4 pb-16 pt-4 sm:px-6">
        <Reveal index={0} reduce={reduce}>
          <Clock />
        </Reveal>
        <Reveal index={1} reduce={reduce}>
          <div className="mt-12 md:mt-16">
            <News />
          </div>
        </Reveal>
        <Reveal index={2} reduce={reduce}>
          <div className="mt-12 md:mt-16">
            <Bookmarks />
          </div>
        </Reveal>
        <Reveal index={3} reduce={reduce}>
          <div className="mt-12 md:mt-16">
            <Market />
          </div>
        </Reveal>
        <Reveal index={4} reduce={reduce}>
          <div className="mt-12 md:mt-16">
            <VideoDownload />
          </div>
        </Reveal>
        <Reveal index={5} reduce={reduce}>
          <div className="mt-12 md:mt-16">
            <Checkin />
          </div>
        </Reveal>
        <Reveal index={6} reduce={reduce}>
          <div className="mt-12 md:mt-16">
            <Device />
          </div>
        </Reveal>
      </main>
      <footer className="border-t border-line">
        <div className="mx-auto max-w-[1280px] px-4 py-6 text-sm text-mut sm:px-6">
          所有打卡数据仅保存在这台设备的浏览器中。
        </div>
      </footer>
    </div>
  );
}
