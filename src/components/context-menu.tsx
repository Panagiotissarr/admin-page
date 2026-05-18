"use client";

import { useEffect, useRef } from "react";

export type ContextMenuItem = {
  label: string;
  shortcut?: string;
  action: () => void;
  divider?: boolean;
};

export function ContextMenu({
  x,
  y,
  items,
  onClose,
}: {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      style={{ left: x, top: y }}
      className="fixed z-50 w-52 rounded-md border border-white/10 bg-zinc-900 py-1 shadow-xl"
    >
      {items.map((item, i) =>
        item.divider ? (
          <div key={i} className="my-1 border-t border-white/10" />
        ) : (
          <button
            key={i}
            onClick={() => {
              item.action();
              onClose();
            }}
            className="flex w-full items-center justify-between px-3 py-1.5 text-left text-xs text-white/80 hover:bg-white/5"
          >
            <span>{item.label}</span>
            {item.shortcut && (
              <span className="text-[10px] text-white/30">{item.shortcut}</span>
            )}
          </button>
        )
      )}
    </div>
  );
}
