import type { ReactNode } from "react";

interface DropdownProps {
  open: boolean;
  id: string;
  children: ReactNode;
}

/** Premium dropdown panel — rounded, shadowed, animated open/close via opacity + a small translate, never unmounted (so the transition can play both ways). */
export function Dropdown({ open, id, children }: DropdownProps) {
  return (
    <div
      id={id}
      role="menu"
      className={`absolute left-0 top-full z-30 mt-2 min-w-[260px] origin-top rounded-xl border border-gray-100 bg-white p-2 shadow-xl transition-all duration-200 ease-out ${
        open ? "visible translate-y-0 opacity-100" : "invisible -translate-y-1 opacity-0"
      }`}
    >
      {children}
    </div>
  );
}
