import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { CaretDown, CaretUp } from "@phosphor-icons/react";

export interface NoteDef {
  id: string;
  label: string;
  color: string;
  content: ReactNode;
}

const SWITCH_LOCK = 520;
const SWIPE_THRESHOLD = 68;

const INTERACTIVE =
  "button, a, input, select, textarea, label, summary, [role='slider'], [data-no-drag]";

function isInteractive(target: EventTarget | null): boolean {
  return target instanceof Element && Boolean(target.closest(INTERACTIVE));
}

/** 目标元素往该方向滚动时，是否还有可滚动的内容 */
function canScrollContent(
  target: EventTarget | null,
  container: HTMLElement,
  deltaDown: number
): boolean {
  let node = target instanceof Element ? (target as HTMLElement) : null;
  while (node && node !== container) {
    const style = getComputedStyle(node);
    const scrollable =
      /(auto|scroll)/.test(style.overflowY) &&
      node.scrollHeight > node.clientHeight + 2;
    if (scrollable) {
      const atTop = node.scrollTop <= 0;
      const atBottom =
        node.scrollTop + node.clientHeight >= node.scrollHeight - 2;
      if (deltaDown > 0 && !atBottom) return true;
      if (deltaDown < 0 && !atTop) return true;
    }
    node = node.parentElement;
  }
  return false;
}

function noteStyle(delta: number, drag: number): CSSProperties {
  if (delta === 0) {
    return {
      transform: `translate3d(0, ${drag}px, 0)`,
      opacity: 1,
      zIndex: 30,
      pointerEvents: "auto",
    };
  }
  if (delta === 1) {
    const progress = Math.min(Math.max(-drag, 0) / 260, 1);
    return {
      transform: `translate3d(0, ${10 - 10 * progress}px, 0) rotate(${
        0.5 - 0.5 * progress
      }deg)`,
      opacity: 0.82 + 0.18 * progress,
      zIndex: 20,
      pointerEvents: "none",
    };
  }
  if (delta === 2) {
    return {
      transform: "translate3d(0, 19px, 0) rotate(-0.6deg)",
      opacity: 0.6,
      zIndex: 10,
      pointerEvents: "none",
    };
  }
  if (delta > 2) {
    return {
      transform: "translate3d(0, 26px, 0)",
      opacity: 0,
      zIndex: 1,
      pointerEvents: "none",
    };
  }
  return {
    transform: `translate3d(0, -118%, 0) rotate(${delta * -4}deg)`,
    opacity: 0,
    zIndex: 40,
    pointerEvents: "none",
  };
}

export function NoteStack({ notes }: { notes: NoteDef[] }) {
  const [active, setActive] = useState(0);
  const [drag, setDrag] = useState(0);
  const [dragging, setDragging] = useState(false);
  const stackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef(0);
  const activeRef = useRef(0);
  const lockRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  const setDragValue = (value: number) => {
    dragRef.current = value;
    setDrag(value);
  };

  const go = useCallback(
    (next: number) => {
      if (next < 0 || next >= notes.length) return;
      if (Date.now() < lockRef.current) return;
      lockRef.current = Date.now() + SWITCH_LOCK;
      setActive(next);
      dragRef.current = 0;
      setDrag(0);
    },
    [notes.length]
  );

  // 滚轮 / 触控板
  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    let acc = 0;
    let timer = 0;
    const onWheel = (event: WheelEvent) => {
      if (canScrollContent(event.target, el, event.deltaY)) return;
      event.preventDefault();
      acc += event.deltaY;
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        acc = 0;
      }, 220);
      if (acc > 58) {
        acc = 0;
        go(activeRef.current + 1);
      } else if (acc < -58) {
        acc = 0;
        go(activeRef.current - 1);
      }
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      window.clearTimeout(timer);
      el.removeEventListener("wheel", onWheel);
    };
  }, [go]);

  // 触摸上滑 / 下滑
  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    let startY = 0;
    let startX = 0;
    let mode: "idle" | "drag" | "scroll" = "idle";

    const onStart = (event: TouchEvent) => {
      if (event.touches.length !== 1) {
        mode = "idle";
        return;
      }
      startY = event.touches[0].clientY;
      startX = event.touches[0].clientX;
      mode = "idle";
    };
    const onMove = (event: TouchEvent) => {
      if (event.touches.length !== 1) return;
      const dy = event.touches[0].clientY - startY;
      const dx = event.touches[0].clientX - startX;
      if (mode === "idle") {
        if (Math.abs(dx) > Math.abs(dy)) {
          mode = "scroll";
          return;
        }
        if (Math.abs(dy) < 7) return;
        // 手指上滑 => 内容向下滚
        if (canScrollContent(event.target, el, -dy)) {
          mode = "scroll";
          return;
        }
        mode = "drag";
        setDragging(true);
      }
      if (mode === "drag") {
        event.preventDefault();
        setDragValue(dy);
      }
    };
    const onEnd = () => {
      if (mode === "drag") {
        const dy = dragRef.current;
        setDragging(false);
        if (dy < -SWIPE_THRESHOLD) go(activeRef.current + 1);
        else if (dy > SWIPE_THRESHOLD) go(activeRef.current - 1);
        else setDragValue(0);
      }
      mode = "idle";
    };

    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd);
    el.addEventListener("touchcancel", onEnd);
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onEnd);
    };
  }, [go]);

  // 鼠标拖动
  useEffect(() => {
    const el = stackRef.current;
    if (!el) return;
    let startY = 0;
    let pointerId = -1;
    let armed = false;

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "touch" || event.button !== 0) return;
      if (isInteractive(event.target)) return;
      pointerId = event.pointerId;
      startY = event.clientY;
      armed = true;
      try {
        el.setPointerCapture(pointerId);
      } catch {
        /* 捕获失败时仍可拖动 */
      }
    };
    const onMove = (event: PointerEvent) => {
      if (!armed || event.pointerId !== pointerId) return;
      const dy = event.clientY - startY;
      if (Math.abs(dy) < 5) return;
      setDragging(true);
      setDragValue(dy);
    };
    const onUp = (event: PointerEvent) => {
      if (!armed || event.pointerId !== pointerId) return;
      armed = false;
      const dy = dragRef.current;
      setDragging(false);
      if (dy < -60) go(activeRef.current + 1);
      else if (dy > 60) go(activeRef.current - 1);
      else setDragValue(0);
      try {
        el.releasePointerCapture(pointerId);
      } catch {
        /* 忽略 */
      }
      pointerId = -1;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, [go]);

  // 键盘切换
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.metaKey || event.ctrlKey || event.altKey)
        return;
      if (
        event.target instanceof Element &&
        event.target.closest("input, textarea, select, [contenteditable='true']")
      ) {
        return;
      }
      if (event.key === "ArrowDown" || event.key === "PageDown") {
        event.preventDefault();
        go(activeRef.current + 1);
      } else if (event.key === "ArrowUp" || event.key === "PageUp") {
        event.preventDefault();
        go(activeRef.current - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        go(0);
      } else if (event.key === "End") {
        event.preventDefault();
        go(notes.length - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, notes.length]);

  return (
    <div className="box-interior">
      <div
        ref={stackRef}
        className="stack-viewport"
        tabIndex={0}
        role="region"
        aria-label="便利贴堆叠，可上滑或使用方向键切换"
        style={{ userSelect: dragging ? "none" : undefined }}
      >
        {notes.map((note, index) => {
          const delta = index - active;
          const isActive = delta === 0;
          return (
            <article
              key={note.id}
              className="note"
              style={
                {
                  ...noteStyle(delta, drag),
                  transition: dragging
                    ? "none"
                    : "transform .52s cubic-bezier(.16,1,.3,1), opacity .42s ease",
                  "--note-color": note.color,
                } as CSSProperties
              }
              aria-hidden={!isActive}
              inert={!isActive}
              aria-label={note.label}
            >
              {isActive && <span className="note-tape" aria-hidden="true" />}
              <div className="note-body">{note.content}</div>
            </article>
          );
        })}
      </div>

      <div className="stack-rail">
        <div className="flex items-center gap-2 font-mono">
          <button
            type="button"
            className="stack-btn"
            onClick={() => go(active - 1)}
            disabled={active === 0}
            aria-label="上一张便利贴"
          >
            <CaretUp size={12} weight="bold" />
          </button>
          <span className="tabular-nums">
            {String(active + 1).padStart(2, "0")}
            <span className="mx-0.5 opacity-50">/</span>
            {String(notes.length).padStart(2, "0")}
          </span>
          <button
            type="button"
            className="stack-btn"
            onClick={() => go(active + 1)}
            disabled={active === notes.length - 1}
            aria-label="下一张便利贴"
          >
            <CaretDown size={12} weight="bold" />
          </button>
        </div>

        <p className="note-hint hidden text-xs sm:block">
          上滑切换 · 滚轮 / 拖动 / ↑↓
        </p>

        <div className="flex items-center gap-1" role="tablist" aria-label="便利贴">
          {notes.map((note, index) => (
            <button
              key={note.id}
              type="button"
              role="tab"
              aria-selected={index === active}
              aria-label={note.label}
              title={note.label}
              className="grid h-5 w-3 place-items-center"
              onClick={() => go(index)}
            >
              <span className="rail-dot" data-active={index === active} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
