import writeXlsxFile from "write-excel-file/browser";
import type { InsurancePlan, SharedInfo } from "@/types/insurance";
import { FIELD_METAS } from "@/types/insurance";

// ─── 型 ──────────────────────────────────────────
type XCell = {
  value?: string | number | null;
  type?: StringConstructor | NumberConstructor;
  backgroundColor?: string;
  fontWeight?: "bold";
  fontSize?: number;
  color?: string;
  align?: "left" | "center" | "right";
  height?: number;
} | null;

// ─── カテゴリ色 ──────────────────────────────────
const CAT_BG: Record<string, string> = {
  "基本構成":  "#eff6ff",
  "補償内容":  "#f0fdf4",
  "車両保険":  "#f5f3ff",
  "その他特約":"#fffbeb",
  "割引":      "#fdf2f8",
  "メモ":      "#f8fafc",
};
const CAT_FG: Record<string, string> = {
  "基本構成":  "#1d4ed8",
  "補償内容":  "#065f46",
  "車両保険":  "#5b21b6",
  "その他特約":"#92400e",
  "割引":      "#9d174d",
  "メモ":      "#475569",
};
const CATEGORIES = ["基本構成", "補償内容", "車両保険", "その他特約", "割引", "メモ"];

// ─── セルヘルパー ────────────────────────────────
const s = (value: string, extra: Partial<Exclude<XCell, null>> = {}): XCell =>
  ({ value, type: String, ...extra });
const num = (value: number, extra: Partial<Exclude<XCell, null>> = {}): XCell =>
  ({ value, type: Number, ...extra });
const empty = (): XCell => null;

// ─── 値フォーマット ──────────────────────────────
function fmtVal(plan: InsurancePlan, key: keyof InsurancePlan): string {
  const meta = FIELD_METAS.find((m) => m.key === key);
  const val  = plan[key];
  if (meta?.format) return String(meta.format(val));
  if (typeof val === "boolean") return val ? "あり" : "なし";
  if (val === "" || val == null) return "—";
  return String(val);
}

// ─── メイン ──────────────────────────────────────
export async function downloadComparisonExcel(
  plans: InsurancePlan[],
  sharedInfo: SharedInfo,
): Promise<void> {
  const today      = new Date().toLocaleDateString("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit" });
  const minPremium = Math.min(...plans.map((p) => p.premium));

  const TITLE_S  = { fontWeight: "bold" as const, fontSize: 13, backgroundColor: "#1e293b", color: "#ffffff", height: 28 };
  const SEC_S    = { fontWeight: "bold" as const, backgroundColor: "#dbeafe", color: "#1e40af", height: 20 };
  const HEAD_S   = { fontWeight: "bold" as const, backgroundColor: "#1e293b", color: "#ffffff", align: "center" as const, height: 22 };
  const LABEL_S  = { fontWeight: "bold" as const, color: "#374151" };
  const CENTER_S = { align: "center" as const };

  const rows: XCell[][] = [];

  // ── タイトル ──
  rows.push([s("自動車保険 比較結果", TITLE_S)]);
  rows.push([s(`出力日: ${today}`, { color: "#64748b" })]);
  rows.push([empty()]);

  // ── 共通見積もり条件 ──
  rows.push([s("■ 共通見積もり条件", SEC_S)]);
  const condRows: [string, string][] = [
    ["免許証の色",         sharedInfo.licenseColor],
    ["事故回数（直近3年）",`${sharedInfo.accidentCount}回`],
    ["現在の等級",         `${sharedInfo.currentGrade}等級`],
    ["車種 / 型式",        sharedInfo.carModel || "—"],
    ["現在の走行距離",     sharedInfo.currentMileage > 0 ? `${sharedInfo.currentMileage.toLocaleString()}km` : "—"],
    ["年間予定走行距離",   sharedInfo.annualMileage || "—"],
  ];
  for (const [label, value] of condRows) {
    rows.push([s(label, LABEL_S), s(value)]);
  }

  rows.push([empty()]);

  // ── 保険比較表 ──
  rows.push([s("■ 保険比較表", SEC_S)]);

  // ヘッダー行
  rows.push([s("項目", HEAD_S), ...plans.map((p) => s(p.company, HEAD_S))]);

  // カテゴリ + データ行
  for (const cat of CATEGORIES) {
    const fields = FIELD_METAS.filter((f) => f.category === cat);
    if (fields.length === 0) continue;

    // カテゴリ見出し行
    rows.push([
      s(cat, { fontWeight: "bold", backgroundColor: CAT_BG[cat] ?? "#f8fafc", color: CAT_FG[cat] ?? "#475569" }),
      ...plans.map(() => s("", { backgroundColor: CAT_BG[cat] ?? "#f8fafc" })),
    ]);

    // データ行
    for (const meta of fields) {
      rows.push([
        s(meta.label, { color: "#374151" }),
        ...plans.map((plan) => {
          const isCheapest = meta.key === "premium" && plan.premium === minPremium;
          if (meta.key === "premium") {
            return num(plan.premium, {
              ...CENTER_S,
              ...(isCheapest ? { backgroundColor: "#fef3c7", fontWeight: "bold", color: "#92400e" } : {}),
            });
          }
          return s(fmtVal(plan, meta.key), CENTER_S);
        }),
      ]);
    }
  }

  // ── ダウンロード ──
  // writeXlsxFile は { toBlob(), toFile() } を返す
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await (writeXlsxFile as any)(rows);
  await result.toFile(`自動車保険比較_${today.replace(/\//g, "")}.xlsx`);
}
