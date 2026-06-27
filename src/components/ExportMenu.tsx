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

  // クリック外で閉じる
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
    try {
      await downloadComparisonExcel(plans, sharedInfo);
    } finally {
      setLoading(null);
    }
  };

  const handlePdf = () => {
    setLoading("pdf");
    setOpen(false);
    // 少し待ってから印刷ダイアログを開く（UI更新のため）
    setTimeout(() => {
      window.print();
      setLoading(null);
    }, 100);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition bg-white text-slate-600 border-slate-300 hover:border-blue-400 hover:text-blue-600 disabled:opacity-50"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Download size={12} />
        )}
        {loading === "excel" ? "生成中..." : loading === "pdf" ? "準備中..." : "書き出す"}
        <ChevronDown size={11} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden">
          <button
            onClick={handleExcel}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition text-left"
          >
            <FileSpreadsheet size={15} className="text-emerald-600 shrink-0" />
            <span>
              <span className="font-medium">Excelで保存</span>
              <span className="block text-xs text-slate-400">.xlsx 形式</span>
            </span>
          </button>
          <div className="border-t border-slate-100" />
          <button
            onClick={handlePdf}
            className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition text-left"
          >
            <Printer size={15} className="text-blue-600 shrink-0" />
            <span>
              <span className="font-medium">PDFで保存</span>
              <span className="block text-xs text-slate-400">印刷 → PDF に保存</span>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
