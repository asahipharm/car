"use client";

import { useState } from "react";
import { Trash2, Trophy, CheckCircle2, XCircle, Filter, AlertTriangle, Copy, Check, CopyPlus, Pencil } from "lucide-react";
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

const CATEGORIES = ["基本構成", "補償内容", "車両保険", "その他特約", "割引", "メモ"];

const CATEGORY_COLORS: Record<string, string> = {
  "基本構成":  "bg-blue-50 text-blue-700",
  "補償内容":  "bg-emerald-50 text-emerald-700",
  "車両保険":  "bg-violet-50 text-violet-700",
  "その他特約":"bg-amber-50 text-amber-700",
  "割引":      "bg-pink-50 text-pink-700",
  "メモ":      "bg-slate-50 text-slate-500",
};

function formatValue(plan: InsurancePlan, key: keyof InsurancePlan): string {
  const meta = FIELD_METAS.find((m) => m.key === key);
  const val = plan[key];
  if (meta?.format) return meta.format(val);
  if (typeof val === "boolean") return val ? "あり" : "なし";
  if (val === "" || val === null || val === undefined) return "—";
  return String(val);
}

function BoolCell({ value }: { value: boolean }) {
  return value ? (
    <span className="flex items-center justify-center gap-1 text-emerald-600 font-medium text-sm">
      <CheckCircle2 size={15} /> あり
    </span>
  ) : (
    <span className="flex items-center justify-center gap-1 text-slate-400 text-sm">
      <XCircle size={15} /> なし
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
  check("事故回数", "accidentCount");
  check("現在の等級", "currentGrade");
  check("年間予定走行距離", "annualMileage");

  const hasNoSnapshot = plans.some((p) => !p.sharedInfoSnapshot);
  if (hasNoSnapshot && snapped.length > 0) warnings.push("共通条件未設定のプラン");

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

export default function ComparisonTable({ plans, sharedInfo, onDelete, onDuplicate, onEdit, editingPlanId }: Props) {
  const [diffOnly, setDiffOnly] = useState(false);
  const [copied, setCopied] = useState(false);

  if (plans.length === 0) return null;

  const minPremium = Math.min(...plans.map((p) => p.premium));
  const snapshotWarnings = buildSnapshotWarnings(plans);

  const isDiffRow = (key: keyof InsurancePlan): boolean => {
    if (plans.length < 2) return false;
    const values = plans.map((p) => String(p[key]));
    return new Set(values).size > 1;
  };

  const visibleFields = FIELD_METAS.filter((m) =>
    diffOnly ? isDiffRow(m.key) : true
  );

  const fieldsByCategory = CATEGORIES.map((cat) => ({
    cat,
    fields: visibleFields.filter((f) => f.category === cat),
  })).filter((g) => g.fields.length > 0);

  const handleCopy = async () => {
    const tsv = buildTsv(plans, visibleFields);
    await navigator.clipboard.writeText(tsv);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Snapshot warning banner */}
      {snapshotWarnings.length > 0 && (
        <div className="flex items-start gap-2.5 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
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
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-slate-700 shrink-0">
          比較一覧
          <span className="text-slate-400 font-normal text-sm ml-2">({plans.length}件)</span>
        </h2>
        <div className="flex items-center gap-2 print:hidden">
          <button
            onClick={handleCopy}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
              copied
                ? "bg-emerald-500 text-white border-emerald-500"
                : "bg-white text-slate-600 border-slate-300 hover:border-slate-400 hover:text-slate-800"
            }`}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? "コピーしました" : "コピー"}
          </button>
          <button
            onClick={() => setDiffOnly((v) => !v)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${
              diffOnly
                ? "bg-orange-500 text-white border-orange-500"
                : "bg-white text-slate-600 border-slate-300 hover:border-orange-400 hover:text-orange-500"
            }`}
          >
            <Filter size={12} />
            {diffOnly ? "全項目を表示" : "差異のみ表示"}
          </button>
          <ExportMenu plans={plans} sharedInfo={sharedInfo} />
        </div>
      </div>

      {/* Scrollable table */}
      <div className="overflow-x-auto rounded-2xl border border-slate-200/80 shadow-md">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #1e1b4b 100%)" }} className="text-white">
              <th className="sticky left-0 z-10 text-left px-4 py-3 font-semibold text-xs w-36 min-w-36" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%)" }}>
                項目
              </th>
              {plans.map((plan) => {
                const isCheapest = plan.premium === minPremium;
                const isCurrentlyEditing = editingPlanId === plan.id;
                const companyMeta = INSURANCE_COMPANIES.find((c) => c.name === plan.company);
                return (
                  <th
                    key={plan.id}
                    className="px-4 py-3 text-center min-w-40 transition-colors"
                    style={ isCurrentlyEditing ? { background: "#b45309" } : {} }
                  >
                    <div className="flex flex-col items-center gap-1">
                      {isCurrentlyEditing ? (
                        <span className="flex items-center gap-1 bg-amber-300 text-amber-900 text-xs font-bold px-2 py-0.5 rounded-full">
                          <Pencil size={9} /> 編集中
                        </span>
                      ) : isCheapest ? (
                        <span className="flex items-center gap-1 bg-amber-400 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                          <Trophy size={10} /> 最安値
                        </span>
                      ) : null}
                      {/* ロゴプレースホルダー */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-xs font-bold shadow-sm"
                        style={{ backgroundColor: companyMeta?.color ?? "#64748b" }}
                      >
                        {companyMeta?.initial ?? plan.company.slice(0, 2)}
                      </div>
                      <span className="font-bold">{plan.company}</span>
                      <span className={`text-lg font-bold ${isCheapest && !isCurrentlyEditing ? "text-amber-300" : "text-white"}`}>
                        ¥{plan.premium.toLocaleString()}
                      </span>
                      {/* アクションボタン群 */}
                      <div className="flex items-center gap-2 mt-1 print:hidden">
                        <button
                          onClick={() => onDuplicate(plan.id)}
                          className="text-slate-400 hover:text-blue-300 transition"
                          title="複製して隣に追加"
                        >
                          <CopyPlus size={14} />
                        </button>
                        <button
                          onClick={() => onEdit(plan)}
                          className={`transition ${isCurrentlyEditing ? "text-amber-300" : "text-slate-400 hover:text-amber-300"}`}
                          title="編集"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => onDelete(plan.id)}
                          className="text-slate-400 hover:text-red-400 transition"
                          title="削除"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {fieldsByCategory.map(({ cat, fields }) => (
              <>
                {/* Category row */}
                <tr key={`cat-${cat}`}>
                  <td
                    colSpan={plans.length + 1}
                    className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wide ${CATEGORY_COLORS[cat]}`}
                  >
                    {cat}
                  </td>
                </tr>
                {/* Data rows */}
                {fields.map((meta, rowIdx) => {
                  const isDiff = isDiffRow(meta.key);
                  const isBoolField = typeof plans[0][meta.key] === "boolean";
                  return (
                    <tr
                      key={meta.key}
                      className={`border-t border-slate-100 ${
                        isDiff ? "bg-orange-50" : rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                      }`}
                    >
                      <td className={`sticky left-0 z-10 px-4 py-2.5 font-medium text-xs text-slate-600 border-r border-slate-200 ${
                        isDiff ? "bg-orange-50" : rowIdx % 2 === 0 ? "bg-white" : "bg-slate-50"
                      }`}>
                        <div className="flex items-center gap-1.5">
                          {isDiff && <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />}
                          {meta.label}
                        </div>
                      </td>
                      {plans.map((plan) => {
                        const raw = plan[meta.key];
                        return (
                          <td key={plan.id} className="px-4 py-2.5 text-center">
                            {isBoolField ? (
                              <BoolCell value={raw as boolean} />
                            ) : meta.key === "memo" ? (
                              <span className="text-xs text-slate-500 text-left block max-w-40 whitespace-pre-wrap">
                                {String(raw) || "—"}
                              </span>
                            ) : (
                              <span className={meta.key === "premium" && plan.premium === minPremium ? "text-amber-600 font-bold" : ""}>
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
            ))}
          </tbody>
        </table>
      </div>

      {diffOnly && visibleFields.length === 0 && (
        <p className="text-center text-slate-400 text-sm py-4">
          すべての項目が一致しています。
        </p>
      )}
    </div>
  );
}
