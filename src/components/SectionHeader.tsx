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
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-xl font-semibold tracking-tight md:text-2xl">
          {title}
        </h2>
        <p className="mt-1 max-w-[65ch] text-sm text-mut">{desc}</p>
      </div>
      {extra}
    </div>
  );
}
