import { useEffect, useState, type ReactNode } from "react";
import { readDevice, readNetwork, type DeviceInfo, type NetworkInfo } from "../lib/device";
import { SectionHeader } from "./SectionHeader";

function Tile({
  label,
  value,
  mono = false,
  live = false,
}: {
  label: string;
  value: ReactNode;
  mono?: boolean;
  live?: boolean;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-xs text-mut">
        {live && (
          <span
            className="h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: "var(--ws-accent)" }}
          />
        )}
        {label}
      </div>
      <div
        className={`mt-1 truncate text-[15px] font-semibold leading-snug ${
          mono ? "font-mono tabular-nums" : ""
        }`}
        title={typeof value === "string" ? value : undefined}
      >
        {value}
      </div>
    </div>
  );
}

export function Device() {
  const [network, setNetwork] = useState<NetworkInfo>(() => readNetwork());
  const [device, setDevice] = useState<DeviceInfo>(() => readDevice());

  useEffect(() => {
    const conn = (navigator as unknown as { connection?: any }).connection;
    const update = () => {
      setNetwork(readNetwork());
      setDevice(readDevice());
    };
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    conn?.addEventListener?.("change", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
      conn?.removeEventListener?.("change", update);
    };
  }, []);

  return (
    <section aria-label="网络环境与浏览机型">
      <SectionHeader
        title="环境与设备"
        desc="当前网络状态与这台设备的配置信息，网络数据实时更新。"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface2 p-5">
          <h3 className="font-semibold">网络环境</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Tile
              label="在线状态"
              value={network.onLine ? "在线" : "离线"}
              live
            />
            <Tile label="网络类型" value={network.type} />
            <Tile
              label="下行速率"
              value={network.downlink}
              mono
            />
            <Tile label="往返延迟" value={network.rtt} mono />
            <Tile
              label="有效连接"
              value={network.effective}
            />
            <Tile
              label="省流模式"
              value={network.saveData ? "开启" : "关闭"}
            />
          </div>
          <p className="mt-4 text-xs text-faint">
            网络数据来自浏览器的 Network Information API，属于浏览器估算的参考值，部分浏览器不提供。
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface2 p-5">
          <h3 className="font-semibold">浏览机型</h3>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <Tile label="设备类型" value={device.deviceType} />
            <Tile label="操作系统" value={device.os} />
            <Tile label="浏览器" value={device.browser} mono />
            <Tile label="屏幕" value={device.screen} mono />
            <Tile label="语言" value={device.language} mono />
            <Tile label="时区" value={device.timezone} mono />
            <Tile label="CPU" value={device.cpu} mono />
            <Tile label="内存" value={device.memory} mono />
            <div className="col-span-2 rounded-xl border border-line bg-surface px-4 py-3">
              <div className="text-xs text-mut">图形处理器</div>
              <div
                className="mt-1 truncate text-[15px] font-semibold leading-snug font-mono tabular-nums"
                title={device.gpu}
              >
                {device.gpu}
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs text-faint">
            机型信息由浏览器在本机读取，不会上传到任何服务器。
          </p>
        </div>
      </div>
    </section>
  );
}
