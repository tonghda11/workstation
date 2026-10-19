import type { ReactNode } from "react";

export function SectionHeader({
  title,
  desc,
  extra,
}: {
  title: string;
  desc: string;
  extra?: ReactNode;
}) {
  return (
    <div className="mb-4">
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <h2 className="note-title text-[22px] leading-tight md:text-[26px]">
          {title}
        </h2>
        {extra}
      </div>
      <p className="mt-2 max-w-[62ch] text-xs leading-relaxed text-mut">
        {desc}
      </p>
    </div>
  );
}
