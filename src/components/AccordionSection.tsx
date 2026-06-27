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
    <div className="border border-slate-200/70 rounded-xl overflow-hidden shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gradient-to-r from-slate-50 to-slate-100/50 hover:from-slate-100 hover:to-slate-50 transition-all duration-150"
      >
        <span className="flex items-center gap-2 text-sm font-semibold text-slate-700">
          {icon}
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="px-4 py-4 space-y-4 bg-white/80">{children}</div>}
    </div>
  );
}
