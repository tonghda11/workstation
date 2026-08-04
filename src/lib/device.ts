export interface NetworkInfo {
  onLine: boolean;
  type: string;
  effective: string;
  downlink: string;
  rtt: string;
  saveData: boolean;
  supported: boolean;
}

export interface DeviceInfo {
  deviceType: string;
  os: string;
  browser: string;
  screen: string;
  language: string;
  timezone: string;
  cpu: string;
  memory: string;
  gpu: string;
}

const TYPE_MAP: Record<string, string> = {
  wifi: "Wi-Fi",
  ethernet: "以太网",
  cellular: "蜂窝网络",
  bluetooth: "蓝牙",
  unknown: "未知",
  none: "无连接",
};

const EFF_MAP: Record<string, string> = {
  "slow-2g": "慢速 2G",
  "2g": "2G",
  "3g": "3G",
  "4g": "4G",
};

export function readNetwork(): NetworkInfo {
  const conn = (navigator as unknown as { connection?: any }).connection;
  const supported = Boolean(conn);
  return {
    onLine: navigator.onLine,
    type: supported ? (TYPE_MAP[conn.type] ?? "未知") : "不可用",
    effective: supported
      ? (EFF_MAP[conn.effectiveType] ?? conn.effectiveType ?? "未知")
      : "不可用",
    downlink:
      supported && typeof conn.downlink === "number"
        ? `${conn.downlink.toFixed(1)} Mbps`
        : "不可用",
    rtt:
      supported && typeof conn.rtt === "number" ? `${conn.rtt} ms` : "不可用",
    saveData: supported ? Boolean(conn.saveData) : false,
    supported,
  };
}

function readGpu(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl =
      canvas.getContext("webgl") ||
      (canvas.getContext("experimental-webgl") as WebGLRenderingContext | null);
    if (!gl) return "未检测到";
    const dbg = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = dbg
      ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.RENDERER);
    return String(renderer ?? "").trim() || "未知";
  } catch {
    return "未知";
  }
}

let cachedGpu: string | null = null;

export function readDevice(): DeviceInfo {
  const nav = navigator as unknown as {
    userAgentData?: {
      brands?: { brand: string; version: string }[];
      mobile: boolean;
      platform: string;
    };
    deviceMemory?: number;
  };
  const ua = navigator.userAgent;
  const uad = nav.userAgentData;

  let browser = "未知";
  let version = "";
  if (uad?.brands) {
    const brand = uad.brands.find(
      (b) => !/(Not|Chromium)/.test(b.brand)
    );
    if (brand) {
      browser = brand.brand;
      version = brand.version;
    }
  }
  if (!version) {
    const m = ua.match(/(Edg|Chrome|Firefox|Safari|OPR)\/([\d.]+)/);
    if (m) {
      const map: Record<string, string> = {
        Edg: "Microsoft Edge",
        Chrome: "Chrome",
        Firefox: "Firefox",
        Safari: "Safari",
        OPR: "Opera",
      };
      browser = map[m[1]] ?? m[1];
      version = m[2];
    }
  }
  const browserLabel = browser === "未知" ? "未知" : `${browser} ${version}`;

  let os = "未知";
  const platform = uad?.platform;
  const platformMap: Record<string, string> = {
    Windows: "Windows",
    macOS: "macOS",
    Android: "Android",
    iOS: "iOS",
    Linux: "Linux",
    "Chrome OS": "ChromeOS",
  };
  if (platform && platformMap[platform]) {
    os = platformMap[platform];
  } else if (/Windows NT 10/.test(ua)) {
    os = "Windows 10/11";
  } else if (/Windows NT 6\.3/.test(ua)) {
    os = "Windows 8.1";
  } else if (/Windows/.test(ua)) {
    os = "Windows";
  } else if (/Mac OS X/.test(ua)) {
    os = "macOS";
  } else if (/Android (\d+)/.test(ua)) {
    os = `Android ${ua.match(/Android (\d+)/)![1]}`;
  } else if (/iPhone|iPad/.test(ua)) {
    os = /iPad/.test(ua) ? "iPadOS" : "iOS";
  } else if (/CrOS/.test(ua)) {
    os = "ChromeOS";
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  let deviceType = "桌面电脑";
  if (uad?.mobile) {
    deviceType = "手机";
  } else if (/iPad/.test(ua) || (/Android/.test(ua) && !/Mobile/.test(ua))) {
    deviceType = "平板";
  }

  const dpr = Math.round(window.devicePixelRatio * 10) / 10;
  const screenLabel = `${screen.width} × ${screen.height}${
    dpr > 1 ? ` · ${dpr}x` : ""
  }`;

  cachedGpu ??= readGpu();

  return {
    deviceType,
    os,
    browser: browserLabel,
    screen: screenLabel,
    language: navigator.language || "未知",
    timezone:
      Intl.DateTimeFormat().resolvedOptions().timeZone || "未知",
    cpu: navigator.hardwareConcurrency
      ? `${navigator.hardwareConcurrency} 核`
      : "未知",
    memory: nav.deviceMemory ? `${nav.deviceMemory} GB` : "未知",
    gpu: cachedGpu,
  };
}
