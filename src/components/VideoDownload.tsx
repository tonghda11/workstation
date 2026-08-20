import { useState, type FormEvent } from "react";
import { ArrowDown, Check, LinkSimple } from "@phosphor-icons/react";
import { SectionHeader } from "./SectionHeader";

function utf8ToBase64(s: string): string {
  const bytes = new TextEncoder().encode(s);
  let bin = "";
  for (let i = 0; i < bytes.length; i += 1) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

function isValidUrl(raw: string): boolean {
  try {
    const u = new URL(raw.trim());
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function hostOf(raw: string): string {
  try {
    return new URL(raw.trim()).hostname.replace(/^www\./, "");
  } catch {
    return "video";
  }
}

const BAT_TEMPLATE = `@echo off
chcp 65001 >NUL
setlocal EnableExtensions EnableDelayedExpansion
cd /d "%~dp0"

set "BIN=%~dp0bin"
set "OUT=%~dp0videos"
if not exist "%BIN%" mkdir "%BIN%"
if not exist "%OUT%" mkdir "%OUT%"

rem -------- Decode video URL (embedded as base64) --------
set "B64=<<B64>>"
if defined B64 (
    echo %B64%| certutil -decode -f - "%TEMP%\\ws_video_url.txt" >NUL 2>&1
    set /p "URL=" < "%TEMP%\\ws_video_url.txt"
    del /q "%TEMP%\\ws_video_url.txt" >NUL 2>&1
)
if not defined URL (
    echo [Error] 视频链接解析失败，请重新生成脚本。
    pause
    exit /b 1
)

rem -------- Detect local proxy (Clash / V2Ray / etc.) --------
set "PROXY="
for %%P in (7890 7897 10809 1080) do (
    curl --ssl-no-revoke -x http://127.0.0.1:%%P -s -o NUL --connect-timeout 2 -I https://www.gstatic.com >NUL 2>&1
    if not errorlevel 1 (
        set "PROXY=http://127.0.0.1:%%P"
        goto proxy_found
    )
)
:proxy_found
if defined PROXY echo [Proxy] detected: %PROXY%
echo.

rem -------- Make sure yt-dlp is present and valid --------
call :ensure_ytdlp
if not exist "%BIN%\\yt-dlp.exe" (
    echo.
    echo [Error] Could not download yt-dlp automatically.
    echo Manual fix: save https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe
    echo   into: %BIN%
    echo.
    pause
    exit /b 1
)

rem -------- ffmpeg (optional, only needed for merging) --------
if exist "%BIN%\\ffmpeg_skip.txt" (
    set "RETRY="
    set /p "RETRY=ffmpeg was skipped before. Retry download now? (Y/N): "
    if /i "!RETRY!"=="Y" del /q "%BIN%\\ffmpeg_skip.txt" >nul 2>&1
)
if not exist "%BIN%\\ffmpeg.exe" (
    if not exist "%BIN%\\ffmpeg_skip.txt" call :try_ffmpeg
)

set "FFOPT="
if exist "%BIN%\\ffmpeg.exe" set "FFOPT=--ffmpeg-location "%BIN%\\ffmpeg.exe""
set "PROXYOPT="
if defined PROXY set "PROXYOPT=--proxy %PROXY%"

echo.
echo Downloading: %URL%
echo Files will be saved to: %OUT%
echo.
"%BIN%\\yt-dlp.exe" %PROXYOPT% %FFOPT% --concurrent-fragments 8 -o "%OUT%\\%%(title)s.%%(ext)s" "%URL%"

if errorlevel 1 (
    echo.
    echo [Warning] Download failed. Check the URL or try again.
    pause
) else (
    echo.
    echo [Done] Saved to %OUT%
    start "" explorer "%OUT%"
)
exit /b 0

rem ================= subroutines =================

:ensure_ytdlp
set "TRIES=0"
:yt_retry
if exist "%BIN%\\yt-dlp.exe" (
    for %%F in ("%BIN%\\yt-dlp.exe") do if %%~zF GEQ 1000000 exit /b 0
    del /q "%BIN%\\yt-dlp.exe" >nul 2>&1
)
set /a TRIES+=1
if %TRIES% GTR 4 exit /b 1
if %TRIES%==1 call :dl_ytdlp "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
if %TRIES%==2 call :dl_ytdlp "https://gh-proxy.com/https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
if %TRIES%==3 call :dl_ytdlp "https://ghproxy.net/https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
if %TRIES%==4 call :dl_ytdlp "https://mirror.ghproxy.com/https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe"
goto yt_retry

:dl_ytdlp
set "URL=%~1"
if defined PROXY (
    curl --ssl-no-revoke --proxy %PROXY% -L --connect-timeout 20 -o "%BIN%\\yt-dlp.exe" "%URL%"
) else (
    curl --ssl-no-revoke -L --connect-timeout 20 -o "%BIN%\\yt-dlp.exe" "%URL%"
)
for %%F in ("%BIN%\\yt-dlp.exe") do if %%~zF GEQ 1000000 exit /b 0
del /q "%BIN%\\yt-dlp.exe" >nul 2>&1
exit /b 1

:try_ffmpeg
echo [Setup] Downloading ffmpeg ^(~90 MB, first run only, max 10 min^)...
call :dl_ffmpeg "https://github.com/GyanD/codexffmpeg/releases/latest/download/ffmpeg-release-essentials.zip"
if not exist "%TEMP%\\ffmpeg.zip" (
    echo [Setup] GitHub failed, trying the direct server...
    call :dl_ffmpeg "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip"
)
set "ZS="
if exist "%TEMP%\\ffmpeg.zip" for %%F in ("%TEMP%\\ffmpeg.zip") do set "ZS=%%~zF"
if defined ZS if %ZS% LSS 10000000 (
    echo [Setup] ffmpeg download invalid, skipping for now...
    del /q "%TEMP%\\ffmpeg.zip" >nul 2>&1
    set "ZS="
)
if defined ZS (
    powershell -NoProfile -ExecutionPolicy Bypass -Command "$ErrorActionPreference='Stop'; $z='%TEMP%\\ffmpeg.zip'; $d=Join-Path $env:TEMP 'ffmpeg_extract'; if(Test-Path $d){Remove-Item -Recurse -Force $d}; Expand-Archive -LiteralPath $z -DestinationPath $d -Force; $b=Get-ChildItem -Path $d -Recurse -Filter ffmpeg.exe | Select-Object -First 1; Copy-Item $b.FullName '%BIN%\\ffmpeg.exe' -Force; $p=Get-ChildItem -Path $d -Recurse -Filter ffprobe.exe | Select-Object -First 1; if($p){Copy-Item $p.FullName '%BIN%\\ffprobe.exe' -Force}; Remove-Item -Recurse -Force $d; Remove-Item -LiteralPath $z -Force"
)
if not exist "%BIN%\\ffmpeg.exe" (
    echo.
    echo [Warning] ffmpeg download failed or too slow. Skipping it for now.
    echo Most videos still work without it; only YouTube HD may fail to merge.
    echo You can retry later by answering Y next time.
    copy NUL "%BIN%\\ffmpeg_skip.txt" >nul 2>&1
)
exit /b 0

:dl_ffmpeg
set "FURL=%~1"
if exist "%TEMP%\\ffmpeg.zip" del /q "%TEMP%\\ffmpeg.zip" >nul 2>&1
if defined PROXY (
    curl --ssl-no-revoke --proxy %PROXY% -L --connect-timeout 20 --max-time 600 -o "%TEMP%\\ffmpeg.zip" "%FURL%"
) else (
    curl --ssl-no-revoke -L --connect-timeout 20 --max-time 600 -o "%TEMP%\\ffmpeg.zip" "%FURL%"
)
exit /b 0
`;

function buildScript(url: string): string {
  const b64 = utf8ToBase64(url);
  return BAT_TEMPLATE.replace("<<B64>>", b64).replace(/\r?\n/g, "\r\n");
}

export function VideoDownload() {
  const [url, setUrl] = useState("");
  const [done, setDone] = useState(false);
  const [copied, setCopied] = useState(false);
  const valid = isValidUrl(url);

  function generate(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!valid) return;
    const content = buildScript(url);
    const blob = new Blob([content], { type: "application/octet-stream" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `下载视频-${hostOf(url)}.bat`;
    a.click();
    URL.revokeObjectURL(a.href);
    setDone(true);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(url.trim());
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      /* 剪贴板不可用时忽略 */
    }
  }

  return (
    <section aria-label="视频下载">
      <SectionHeader
        title="视频下载"
        desc="粘贴视频链接，生成一键下载脚本，在电脑上双击即可把视频保存到本地。"
      />
      <div className="rounded-2xl border border-line bg-surface2 p-5">
        <form onSubmit={generate} className="flex gap-2">
          <input
            type="url"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              setDone(false);
            }}
            placeholder="粘贴视频页面链接，如 https://www.bilibili.com/video/..."
            aria-label="视频链接"
            className="min-w-0 flex-1 rounded-[10px] border border-line bg-surface px-3 py-2 text-sm focus:border-accent"
          />
          <button
            type="submit"
            disabled={!valid}
            className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-4 text-sm font-medium text-accent-ink transition disabled:opacity-40 active:scale-95"
          >
            <ArrowDown size={15} weight="bold" />
            生成下载脚本
          </button>
          <button
            type="button"
            onClick={copy}
            disabled={!valid}
            aria-label="复制视频链接"
            className="grid h-9 w-10 shrink-0 place-items-center rounded-full border border-line text-mut transition hover:border-line-strong hover:text-ink active:scale-90 disabled:opacity-40"
          >
            {copied ? (
              <Check size={15} weight="bold" />
            ) : (
              <LinkSimple size={15} weight="bold" />
            )}
          </button>
        </form>

        {done && (
          <p className="mt-3 flex items-center gap-1.5 text-sm text-mut">
            <Check size={15} weight="bold" className="text-up" />
            脚本已生成：把它保存到电脑任意文件夹，双击运行即可开始下载。
          </p>
        )}

        <ul className="mt-4 space-y-1.5 border-t border-line pt-4 text-sm text-mut">
          <li>网页受浏览器安全限制无法直接下载视频，生成的是在 Windows 电脑上运行的一键脚本。</li>
          <li>支持 YouTube、B 站、抖音、微博、Twitter/X 等 1000+ 网站。</li>
          <li>首次运行会自动下载 yt-dlp（约 20MB），必要时自动下载 ffmpeg；检测到本地代理（Clash / V2Ray）会自动使用。</li>
          <li>下载器优先从 GitHub 官方渠道获取，镜像仅为备用；请只下载你有权保存的内容，并留意第三方镜像的潜在风险。</li>
          <li>视频默认保存到脚本所在文件夹的 videos 目录。</li>
        </ul>
      </div>
    </section>
  );
}
