"use client";

import { useState, useEffect, useRef } from "react";
import { Download, FileSpreadsheet, Printer, ChevronDown, Loader2 } from "lucide-react";
import type { InsurancePlan, SharedInfo } from "@/types/insurance";
import { downloadComparisonExcel } from "@/lib/exportExcel";

interface Props {
  plans: InsurancePlan[];
  sharedInfo: SharedInfo;
}

export default function ExportMenu({ plans, sharedInfo }: Props) {
  const [open,    setOpen]    = useState(false);
  const [loading, setLoading] = useState<"excel" | "pdf" | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleExcel = async () => {
    setLoading("excel");
    setOpen(false);
    try { await downloadComparisonExcel(plans, sharedInfo); }
    finally { setLoading(null); }
  };

  const handlePdf = () => {
    setLoading("pdf");
    setOpen(false);
    setTimeout(() => { window.print(); setLoading(null); }, 100);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!loading}
        className="btn btn-secondary disabled:opacity-50"
        style={{ padding: "8px 14px", fontSize: 13 }}
      >
        {loading ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
        {loading === "excel" ? "生成中..." : loading === "pdf" ? "準備中..." : "書き出す"}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-48 rounded-2xl overflow-hidden z-50"
          style={{
            background: "var(--c-surface)",
            border: "1px solid var(--c-border)",
            boxShadow: "var(--sh-lg)",
          }}
        >
          <button
            onClick={handleExcel}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-[var(--c-sky)] transition-colors"
          >
            <FileSpreadsheet size={16} className="text-emerald-500 shrink-0" />
            <span>
              <span className="font-semibold text-[var(--c-text-1)] block">Excelで保存</span>
              <span className="text-xs text-[var(--c-text-3)]">.xlsx 形式</span>
            </span>
          </button>
          <div style={{ borderTop: "1px solid var(--c-border)" }} />
          <button
            onClick={handlePdf}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-left hover:bg-[var(--c-sky)] transition-colors"
          >
            <Printer size={16} className="text-blue-500 shrink-0" />
            <span>
              <span className="font-semibold text-[var(--c-text-1)] block">PDFで保存</span>
              <span className="text-xs text-[var(--c-text-3)]">印刷 → PDF に保存</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
