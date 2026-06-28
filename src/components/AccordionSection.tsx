"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface Props {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

export default function AccordionSection({ title, icon, defaultOpen = false, children }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-blue-50/60 transition-colors duration-150"
      >
        <span className="flex items-center gap-3">
          <span className="flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 text-blue-500 shrink-0">
            {icon}
          </span>
          <span className="text-sm font-semibold text-[var(--c-text-1)]">{title}</span>
        </span>
        <ChevronDown
          size={16}
          className={`text-[var(--c-text-3)] transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div
          className="px-6 py-5 space-y-4"
          style={{ borderTop: "1px solid var(--c-border)" }}
        >
          {children}
        </div>
      )}
    </div>
  );
}
