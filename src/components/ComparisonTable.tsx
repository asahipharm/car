"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import {
  Trash2, Trophy, CheckCircle2, XCircle, Filter, AlertTriangle,
  Copy, Check, CopyPlus, Pencil, ArrowUpDown,
} from "lucide-react";
import type { InsurancePlan, SharedInfo } from "@/types/insurance";
import { FIELD_METAS, INSURANCE_COMPANIES } from "@/types/insurance";
import ExportMenu from "./ExportMenu";

interface Props {
  plans: InsurancePlan[];
  sharedInfo: SharedInfo;
  onDelete: (id: string) => void;
  onDuplicate: (id: string) => void;
  onEdit: (plan: InsurancePlan) => void;
  editingPlanId?: string | null;
}

type SortKey = "default" | "price-asc" | "price-desc" | "vehicle-first" | "vehicle-last";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "default",       label: "追加順" },
  { value: "price-asc",     label: "金額 安い順" },
  { value: "price-desc",    label: "金額 高い順" },
  { value: "vehicle-first", label: "車両保険あり優先" },
  { value: "vehicle-last",  label: "車両保険なし優先" },
];

function sortPlans(plans: InsurancePlan[], key: SortKey): InsurancePlan[] {
  if (key === "default") return plans;
  return [...plans].sort((a, b) => {
    switch (key) {
      case "price-asc":     return a.premium - b.premium;
      case "price-desc":    return b.premium - a.premium;
      case "vehicle-first": return (b.vehicleInsurance ? 1 : 0) - (a.vehicleInsurance ? 1 : 0);
      case "vehicle-last":  return (a.vehicleInsurance ? 1 : 0) - (b.vehicleInsurance ? 1 : 0);
    }
  });
}

const CATEGORIES = ["基本構成", "補償内容", "車両保険", "その他特約", "割引", "メモ"];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  "基本構成":  { bg: "#EFF6FF", text: "#1D4ED8", dot: "#3B82F6" },
  "補償内容":  { bg: "#F0FDF4", text: "#15803D", dot: "#22C55E" },
  "車両保険":  { bg: "#F5F3FF", text: "#6D28D9", dot: "#8B5CF6" },
  "その他特約":{ bg: "#FFFBEB", text: "#B45309", dot: "#F59E0B" },
  "割引":      { bg: "#FFF1F2", text: "#BE123C", dot: "#F43F5E" },
  "メモ":      { bg: "#F8FAFC", text: "#475569", dot: "#94A3B8" },
};

function formatValue(plan: InsurancePlan, key: keyof InsurancePlan): string {
  const meta = FIELD_METAS.find((m) => m.key === key);
  const val  = plan[key];
  if (meta?.format) return meta.format(val);
  if (typeof val === "boolean") return val ? "あり" : "なし";
  if (val === "" || val === null || val === undefined) return "—";
  return String(val);
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold text-sm">
      <CheckCircle2 size={14} /> あり
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 text-slate-300 text-sm">
      <XCircle size={14} /> なし
    </span>
  );
}

function buildSnapshotWarnings(plans: InsurancePlan[]): string[] {
  const snapped = plans.filter((p) => p.sharedInfoSnapshot) as (InsurancePlan & { sharedInfoSnapshot: SharedInfo })[];
  if (snapped.length < 2) return [];
  const warnings: string[] = [];
  const check = (label: string, key: keyof SharedInfo) => {
    const vals = snapped.map((p) => String(p.sharedInfoSnapshot[key]));
    if (new Set(vals).size > 1) warnings.push(label);
  };
  check("免許証の色", "licenseColor");
  check("事故回数",   "accidentCount");
  check("現在の等級", "currentGrade");
  check("年間予定走行距離", "annualMileage");
  if (plans.some((p) => !p.sharedInfoSnapshot) && snapped.length > 0)
    warnings.push("共通条件未設定のプラン");
  return warnings;
}

function buildTsv(plans: InsurancePlan[], fields: typeof FIELD_METAS): string {
  const header = ["項目", ...plans.map((p) => p.company)].join("\t");
  const rows = fields.map((meta) => {
    const label = meta.label;
    const vals = plans.map((p) => {
      const v = p[meta.key];
      if (meta.format) return meta.format(v);
      if (typeof v === "boolean") return v ? "あり" : "なし";
      if (v === "" || v === null || v === undefined) return "—";
      return String(v);
    });
    return [label, ...vals].join("\t");
  });
  return [header, ...rows].join("\n");
}

export default function ComparisonTable({
  plans, sharedInfo, onDelete, onDuplicate, onEdit, editingPlanId,
}: Props) {
  const [diffOnly, setDiffOnly] = useState(false);
  const [copied,   setCopied]   = useState(false);
  const [sortKey,  setSortKey]  = useState<SortKey>("default");

  const topBarRef    = useRef<HTMLDivElement>(null);
  const topInnerRef  = useRef<HTMLDivElement>(null);
  const tableWrapRef = useRef<HTMLDivElement>(null);

  // テーブルの横幅を上部スクロールバーに同期（plans/sortKey/diffOnly が変わるたびに更新）
  useEffect(() => {
    const sync = () => {
      if (tableWrapRef.current && topInnerRef.current)
        topInnerRef.current.style.width = `${tableWrapRef.current.scrollWidth}px`;
    };
    sync();
    const ro = new ResizeObserver(sync);
    if (tableWrapRef.current) ro.observe(tableWrapRef.current);
    return () => ro.disconnect();
  }, [plans, sortKey, diffOnly]);

  const onTopScroll   = () => { if (tableWrapRef.current && topBarRef.current)   tableWrapRef.current.scrollLeft = topBarRef.current.scrollLeft; };
  const onTableScroll = () => { if (topBarRef.current    && tableWrapRef.current) topBarRef.current.scrollLeft    = tableWrapRef.current.scrollLeft; };

  const sortedPlans = useMemo(() => sortPlans(plans, sortKey), [plans, sortKey]);

  if (plans.length === 0) return null;

  const minPremium  = Math.min(...plans.map((p) => p.premium));
  const snapshotWarnings = buildSnapshotWarnings(plans);

  const isDiffRow = (key: keyof InsurancePlan): boolean => {
    if (sortedPlans.length < 2) return false;
    return new Set(sortedPlans.map((p) => String(p[key]))).size > 1;
  };

  const visibleFields = FIELD_METAS.filter((m) => diffOnly ? isDiffRow(m.key) : true);

  const fieldsByCategory = CATEGORIES.map((cat) => ({
    cat,
    fields: visibleFields.filter((f) => f.category === cat),
  })).filter((g) => g.fields.length > 0);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(buildTsv(sortedPlans, visibleFields));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-5" data-print-table>

      {/* Snapshot warning */}
      {snapshotWarnings.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl px-5 py-4 border border-amber-200"
          style={{ background: "#FFFBEB" }}>
          <AlertTriangle size={16} className="text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-800">見積もり条件が統一されていない可能性があります</p>
            <ul className="mt-1 space-y-0.5">
              {snapshotWarnings.map((w) => (
                <li key={w} className="text-xs text-amber-700">• {w}が異なるプランが含まれています</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-[var(--c-text-1)]">
          比較一覧
          <span className="text-[var(--c-text-3)] font-normal text-sm ml-2">({plans.length}件)</span>
        </h2>
        <div className="flex items-center gap-2 print:hidden flex-wrap justify-end">
          {/* 並び替え */}
          <div
            className="flex items-center gap-1.5 rounded-xl px-3 text-sm"
            style={{
              height: 36,
              border: "1.5px solid var(--c-border)",
              background: "var(--c-surface)",
              color: sortKey !== "default" ? "var(--c-blue)" : "var(--c-text-2)",
              borderColor: sortKey !== "default" ? "var(--c-blue)" : "var(--c-border)",
            }}
          >
            <ArrowUpDown size={12} className="shrink-0 pointer-events-none" />
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as SortKey)}
              style={{
                fontSize: 13,
                background: "transparent",
                border: "none",
                outline: "none",
                cursor: "pointer",
                color: "inherit",
              }}
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleCopy}
            className={`btn ${copied ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 14px", fontSize: 13 }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "コピーしました" : "コピー"}
          </button>
          <button
            onClick={() => setDiffOnly((v) => !v)}
            className={`btn ${diffOnly ? "btn-primary" : "btn-secondary"}`}
            style={{ padding: "8px 14px", fontSize: 13 }}
          >
            <Filter size={12} />
            {diffOnly ? "全項目を表示" : "差異のみ表示"}
          </button>
          <ExportMenu plans={plans} sharedInfo={sharedInfo} />
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {/* 上部スクロールバー */}
        <div
          ref={topBarRef}
          onScroll={onTopScroll}
          className="overflow-x-auto overflow-y-hidden print:hidden"
          style={{ height: 14 }}
        >
          <div ref={topInnerRef} style={{ height: 1 }} />
        </div>
        <div ref={tableWrapRef} onScroll={onTableScroll} className="overflow-x-auto">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr
              style={{
                background: "linear-gradient(135deg, #061228 0%, #0C2240 40%, #1E3A8A 80%, #1E40AF 100%)",
              }}
            >
              <th
                className="sticky left-0 z-10 text-left px-5 py-4 font-semibold text-xs text-blue-200 w-36 min-w-36"
                style={{ background: "linear-gradient(135deg, #061228, #0C2240)" }}
              >
                項目
              </th>
              {sortedPlans.map((plan) => {
                const isCheapest = plan.premium === minPremium;
                const isEditing  = editingPlanId === plan.id;
                const companyMeta = INSURANCE_COMPANIES.find((c) => c.name === plan.company);
                return (
                  <th
                    key={plan.id}
                    className="px-5 py-4 text-center min-w-44 transition-colors"
                    style={isEditing ? { background: "#92400E" } : {}}
                  >
                    <div className="flex flex-col items-center gap-1.5">
                      {isEditing ? (
                        <span className="flex items-center gap-1 bg-amber-300 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Pencil size={9} /> 編集中
                        </span>
                      ) : isCheapest ? (
                        <span className="flex items-center gap-1 bg-amber-400 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          <Trophy size={10} /> 最安値
                        </span>
                      ) : null}
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-white text-xs font-bold shadow"
                        style={{ backgroundColor: companyMeta?.color ?? "#64748B" }}
                      >
                        {companyMeta?.initial ?? plan.company.slice(0, 2)}
                      </div>
                      <span className="font-bold text-white text-sm">{plan.company}</span>
                      <span className={`text-xl font-bold ${isCheapest && !isEditing ? "text-amber-300" : "text-white"}`}>
                        ¥{plan.premium.toLocaleString()}
                      </span>
                      <div className="flex items-center gap-2 mt-1 print:hidden">
                        <button
                          onClick={() => onDuplicate(plan.id)}
                          title="複製"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-200 hover:bg-white/10 hover:text-white transition"
                        >
                          <CopyPlus size={13} />
                        </button>
                        <button
                          onClick={() => onEdit(plan)}
                          title="編集"
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition ${
                            isEditing ? "text-amber-300" : "text-blue-200 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => onDelete(plan.id)}
                          title="削除"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-blue-200 hover:bg-red-500/20 hover:text-red-300 transition"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {fieldsByCategory.map(({ cat, fields }) => {
              const style = CATEGORY_STYLES[cat] ?? CATEGORY_STYLES["メモ"];
              return (
                <>
                  <tr key={`cat-${cat}`}>
                    <td
                      colSpan={plans.length + 1}
                      className="px-5 py-2 text-xs font-bold tracking-wide uppercase"
                      style={{ background: style.bg, color: style.text }}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: style.dot }} />
                        {cat}
                      </span>
                    </td>
                  </tr>
                  {fields.map((meta, rowIdx) => {
                    const isDiff = isDiffRow(meta.key);
                    const isBool = typeof plans[0][meta.key] === "boolean";
                    const rowBg  = isDiff
                      ? "#FFF7ED"
                      : rowIdx % 2 === 0
                      ? "var(--c-surface)"
                      : "#F8FAFC";
                    return (
                      <tr key={meta.key} style={{ background: rowBg }} className="border-t border-[var(--c-border)]">
                        <td
                          className="sticky left-0 z-10 px-5 py-3 font-medium text-xs text-[var(--c-text-2)] border-r"
                          style={{ background: rowBg, borderColor: "var(--c-border)" }}
                        >
                          <div className="flex items-center gap-1.5">
                            {isDiff && (
                              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                            )}
                            {meta.label}
                          </div>
                        </td>
                        {sortedPlans.map((plan) => {
                          const raw = plan[meta.key];
                          return (
                            <td key={plan.id} className="px-5 py-3 text-center">
                              {isBool ? (
                                <BoolCell value={raw as boolean} />
                              ) : meta.key === "memo" ? (
                                <span className="text-xs text-[var(--c-text-2)] text-left block max-w-44 whitespace-pre-wrap">
                                  {String(raw) || "—"}
                                </span>
                              ) : (
                                <span
                                  className={
                                    meta.key === "premium" && plan.premium === minPremium
                                      ? "text-amber-600 font-bold"
                                      : "text-[var(--c-text-1)]"
                                  }
                                >
                                  {formatValue(plan, meta.key)}
                                </span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </>
              );
            })}
          </tbody>
        </table>
        </div>{/* tableWrapRef */}
      </div>{/* card */}

      {diffOnly && visibleFields.length === 0 && (
        <p className="text-center text-[var(--c-text-3)] text-sm py-6">
          すべての項目が一致しています。
        </p>
      )}
    </div>
  );
}
