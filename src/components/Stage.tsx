import { useEffect, useRef, type ReactNode } from "react";

/**
 * 建模视口：指针移动时只有地面网格和背景柔光做轻微视差，
 * 抽屉本体保持不动，避免点击目标跟着位移。
 */
export function Stage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    if (reduce.matches || !fine.matches) return;

    let frame = 0;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const tick = () => {
      currentX += (targetX - currentX) * 0.1;
      currentY += (targetY - currentY) * 0.1;
      stage.style.setProperty("--parallax-x", `${currentX.toFixed(1)}px`);
      stage.style.setProperty("--parallax-y", `${currentY.toFixed(1)}px`);
      if (
        Math.abs(targetX - currentX) > 0.05 ||
        Math.abs(targetY - currentY) > 0.05
      ) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
      }
    };

    const kick = () => {
      if (!frame) frame = requestAnimationFrame(tick);
    };

    const onMove = (event: PointerEvent) => {
      const rect = stage.getBoundingClientRect();
      const nx = (event.clientX - rect.left) / rect.width - 0.5;
      const ny = (event.clientY - rect.top) / rect.height - 0.5;
      targetX = nx * 34;
      targetY = ny * 16;
      kick();
    };

    const reset = () => {
      targetX = 0;
      targetY = 0;
      kick();
    };

    stage.addEventListener("pointermove", onMove);
    stage.addEventListener("pointerleave", reset);
    return () => {
      stage.removeEventListener("pointermove", onMove);
      stage.removeEventListener("pointerleave", reset);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div className="stage" ref={stageRef}>
      <div className="drawer-shadow" aria-hidden="true" />
      {children}
    </div>
  );
}
